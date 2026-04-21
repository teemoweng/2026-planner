#!/usr/bin/env python3
"""
Static + LLM proxy for the 2026 Planner.

- Serves ./ as static files.
- POST /api/chat  ->  forwards {system, messages} to either:
    * Anthropic Messages API         (LLM_PROVIDER=anthropic, default if ANTHROPIC_API_KEY set)
    * OpenAI-compatible chat API     (LLM_PROVIDER=openai)   — works for OpenAI, DeepSeek,
                                                              Moonshot/Kimi, Volcano Ark, Qwen,
                                                              OpenRouter, Ollama, etc.
  Always returns {text: "<model output>"}.

Env vars:
    LLM_PROVIDER      anthropic | openai                 (default: auto-detect)
    LLM_API_KEY       api key for the chosen provider    (or ANTHROPIC_API_KEY for anthropic)
    LLM_BASE_URL      openai-compatible base, e.g.
                      https://ark.cn-beijing.volces.com/api/v3
                      https://api.deepseek.com/v1
                      https://api.moonshot.cn/v1
    LLM_MODEL         model / endpoint id                (default: per provider)
    LLM_MAX_TOKENS    int                                 (default: 1024)

Run:
    python3 server.py            # port 8000
    python3 server.py 8080
"""

import http.server
import json
import os
import socketserver
import sys
import urllib.request
import urllib.error


def env(name, default=None):
    v = os.environ.get(name)
    return v if v not in (None, "") else default


MAX_TOKENS = int(env("LLM_MAX_TOKENS", "1024"))

# ── Provider resolution ────────────────────────────────────────────────
PROVIDER = env("LLM_PROVIDER")
if not PROVIDER:
    PROVIDER = "anthropic" if env("ANTHROPIC_API_KEY") else "openai"

if PROVIDER == "anthropic":
    API_KEY  = env("LLM_API_KEY") or env("ANTHROPIC_API_KEY")
    BASE_URL = env("LLM_BASE_URL", "https://api.anthropic.com/v1")
    MODEL    = env("LLM_MODEL", "claude-haiku-4-5-20251001")
elif PROVIDER == "openai":
    API_KEY  = env("LLM_API_KEY") or env("OPENAI_API_KEY")
    BASE_URL = env("LLM_BASE_URL", "https://api.openai.com/v1")
    MODEL    = env("LLM_MODEL", "gpt-4o-mini")
else:
    print(f"Unknown LLM_PROVIDER={PROVIDER!r}; must be 'anthropic' or 'openai'", file=sys.stderr)
    sys.exit(1)


# ── Provider adapters ──────────────────────────────────────────────────
def call_anthropic(system, messages):
    body = json.dumps({
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "system": system,
        "messages": messages,
    }).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL.rstrip("/") + "/messages",
        data=body,
        method="POST",
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    chunks = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
    return "".join(chunks).strip(), data.get("stop_reason")


def call_openai_compat(system, messages):
    # Convert anthropic-style (separate system + messages) to openai-style
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.extend(messages)
    body = json.dumps({
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "messages": msgs,
    }).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL.rstrip("/") + "/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    choice = (data.get("choices") or [{}])[0]
    text = (choice.get("message") or {}).get("content") or ""
    return text.strip(), choice.get("finish_reason")


CALL = call_anthropic if PROVIDER == "anthropic" else call_openai_compat


# ── HTTP handler ───────────────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_error(404, "not found")
            return

        if not API_KEY:
            self._json(500, {"error": f"API key not set (provider={PROVIDER})"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception as e:
            self._json(400, {"error": f"bad JSON: {e}"})
            return

        system = payload.get("system") or ""
        messages = payload.get("messages") or []
        if not isinstance(messages, list) or not messages:
            self._json(400, {"error": "messages must be a non-empty list"})
            return

        try:
            text, stop_reason = CALL(system, messages)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            self._json(e.code, {"error": f"upstream {e.code}: {detail}"})
            return
        except Exception as e:
            self._json(502, {"error": f"upstream error: {e}"})
            return

        self._json(200, {"text": text, "stop_reason": stop_reason})

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    key_set = "yes" if API_KEY else "NO"
    print(f"Planner server on http://localhost:{port}")
    print(f"  provider: {PROVIDER}")
    print(f"  base:     {BASE_URL}")
    print(f"  model:    {MODEL}")
    print(f"  apikey:   {key_set}")
    with socketserver.TCPServer(("", port), Handler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
