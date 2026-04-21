"""
2026 Planner — SaaS backend.

FastAPI app:
  * validates Supabase JWTs on every /api/* call (except /api/health)
  * persists planner data in Supabase Postgres
  * proxies /api/chat to the LLM provider with per-user rate limits

Run locally:
    cp .env.example .env  &&  edit .env
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Any, Literal

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from jwt import PyJWKClient
from pydantic import BaseModel
from supabase import Client, create_client

load_dotenv()

# ─── Config ──────────────────────────────────────────────────────────
SUPABASE_URL         = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

LLM_PROVIDER   = os.environ.get("LLM_PROVIDER", "openai")
LLM_BASE_URL   = os.environ["LLM_BASE_URL"]
LLM_MODEL      = os.environ["LLM_MODEL"]
LLM_API_KEY    = os.environ["LLM_API_KEY"]
LLM_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "1024"))

FREE_TIER_DAILY_AI_CALLS = int(os.environ.get("FREE_TIER_DAILY_AI_CALLS", "50"))

CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

# Service-role client bypasses RLS. Use for all writes + admin reads.
sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# JWKS client — fetches Supabase public signing keys and caches them.
# User access tokens are signed ES256 with ECC P-256 keys (new system).
_jwks_client = PyJWKClient(
    f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)


# ─── Lifespan (shared HTTP client for LLM calls) ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(timeout=60)
    try:
        yield
    finally:
        await app.state.http.aclose()


app = FastAPI(title="Planner API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth middleware ─────────────────────────────────────────────────
async def current_user_id(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization.split(None, 1)[1]
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256", "RS256", "EdDSA"],  # Supabase may use any of these
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/auth/v1",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(401, f"invalid token: {e}")
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(401, "token missing sub")
    return uid


# ─── Health ──────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"ok": True, "provider": LLM_PROVIDER, "model": LLM_MODEL}


# ─── Planner data: one blob per (user, date) ─────────────────────────
class DayDataUpsert(BaseModel):
    date: date
    data: dict[str, Any]


@app.get("/api/day/{d}")
async def get_day(d: date, uid: str = Depends(current_user_id)):
    r = sb.table("planner_day_data").select("data").eq("user_id", uid).eq("date", d.isoformat()).execute()
    return {"date": d.isoformat(), "data": (r.data[0]["data"] if r.data else {})}


@app.put("/api/day")
async def put_day(body: DayDataUpsert, uid: str = Depends(current_user_id)):
    sb.table("planner_day_data").upsert({
        "user_id": uid,
        "date": body.date.isoformat(),
        "data": body.data,
    }, on_conflict="user_id,date").execute()
    return {"ok": True}


class MonthDataUpsert(BaseModel):
    year: int
    month: int  # 0-indexed
    data: dict[str, Any]


@app.get("/api/month/{year}/{month}")
async def get_month(year: int, month: int, uid: str = Depends(current_user_id)):
    r = (sb.table("planner_month_data")
           .select("data").eq("user_id", uid).eq("year", year).eq("month", month).execute())
    return {"year": year, "month": month, "data": (r.data[0]["data"] if r.data else {})}


@app.put("/api/month")
async def put_month(body: MonthDataUpsert, uid: str = Depends(current_user_id)):
    sb.table("planner_month_data").upsert({
        "user_id": uid,
        "year": body.year,
        "month": body.month,
        "data": body.data,
    }, on_conflict="user_id,year,month").execute()
    return {"ok": True}


class SettingsUpsert(BaseModel):
    theme: str | None = None
    view: str | None = None
    tweaks: dict[str, Any] | None = None


@app.get("/api/settings")
async def get_settings(uid: str = Depends(current_user_id)):
    r = sb.table("user_settings").select("*").eq("user_id", uid).execute()
    return r.data[0] if r.data else {"user_id": uid, "theme": "amber", "view": "month", "tweaks": {}}


@app.put("/api/settings")
async def put_settings(body: SettingsUpsert, uid: str = Depends(current_user_id)):
    patch = {"user_id": uid} | {k: v for k, v in body.model_dump().items() if v is not None}
    sb.table("user_settings").upsert(patch, on_conflict="user_id").execute()
    return {"ok": True}


# ─── AI chat ─────────────────────────────────────────────────────────
class ChatIn(BaseModel):
    system: str = ""
    messages: list[dict[str, str]]


async def _quota_ok(uid: str) -> tuple[bool, int]:
    r = sb.rpc("ai_usage_last_24h", {"uid": uid}).execute()
    used = r.data if isinstance(r.data, int) else 0
    return used < FREE_TIER_DAILY_AI_CALLS, used


async def _call_llm(http: httpx.AsyncClient, system: str, messages: list[dict]) -> tuple[str, dict]:
    if LLM_PROVIDER == "anthropic":
        r = await http.post(
            LLM_BASE_URL.rstrip("/") + "/messages",
            headers={
                "x-api-key": LLM_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={"model": LLM_MODEL, "max_tokens": LLM_MAX_TOKENS, "system": system, "messages": messages},
        )
        r.raise_for_status()
        d = r.json()
        text = "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")
        usage = d.get("usage", {})
        return text.strip(), {
            "input_tokens": usage.get("input_tokens"),
            "output_tokens": usage.get("output_tokens"),
        }

    # OpenAI-compatible
    msgs = ([{"role": "system", "content": system}] if system else []) + messages
    r = await http.post(
        LLM_BASE_URL.rstrip("/") + "/chat/completions",
        headers={"Authorization": f"Bearer {LLM_API_KEY}", "content-type": "application/json"},
        json={"model": LLM_MODEL, "max_tokens": LLM_MAX_TOKENS, "messages": msgs},
    )
    r.raise_for_status()
    d = r.json()
    text = (d.get("choices") or [{}])[0].get("message", {}).get("content", "")
    u = d.get("usage", {})
    return text.strip(), {"input_tokens": u.get("prompt_tokens"), "output_tokens": u.get("completion_tokens")}


@app.post("/api/chat")
async def chat(body: ChatIn, request: Request, uid: str = Depends(current_user_id)):
    ok, used = await _quota_ok(uid)
    if not ok:
        raise HTTPException(429, {
            "error": "daily quota exceeded",
            "used": used,
            "limit": FREE_TIER_DAILY_AI_CALLS,
        })

    http: httpx.AsyncClient = request.app.state.http
    try:
        text, usage = await _call_llm(http, body.system, body.messages)
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"upstream: {e.response.text}")

    # Log (write via service role — RLS bypassed)
    sb.table("ai_usage").insert({
        "user_id": uid,
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "model": LLM_MODEL,
        "provider": LLM_PROVIDER,
    }).execute()

    return {"text": text, "used": used + 1, "limit": FREE_TIER_DAILY_AI_CALLS}
