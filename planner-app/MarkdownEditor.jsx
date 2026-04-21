
// Live Markdown Editor — textarea + overlay, with smart list continuation
const { useRef, useEffect, useCallback } = React;

// ── Renderer: keeps same character positions as textarea ──────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  const lines = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .split('\n');

  return lines.map(line => {
    // Heading
    const hm = line.match(/^(#{1,3})( .*)$/);
    if (hm) {
      const sz = { 1: '15px', 2: '13px', 3: '12px' }[hm[1].length];
      return `<span style="opacity:0.3;color:var(--accent);">${hm[1]}</span><span style="color:var(--accent);font-weight:700;font-size:${sz};">${applyInline(hm[2])}</span>`;
    }
    // HR
    if (/^---+$/.test(line))
      return `<span style="color:rgba(var(--accent-rgb),0.3);">${line}</span>`;
    // Checkbox done
    const cxd = line.match(/^(- \[x\] )(.*)$/i);
    if (cxd)
      return `<span style="color:var(--accent);font-weight:700;">${cxd[1]}</span><span style="color:rgba(var(--accent-rgb),0.6);text-decoration:line-through;">${applyInline(cxd[2])}</span>`;
    // Checkbox todo
    const cxt = line.match(/^(- \[ \] )(.*)$/);
    if (cxt)
      return `<span style="color:var(--accent);opacity:0.5;">${cxt[1]}</span>${applyInline(cxt[2])}`;
    // Bullet (• or - or *) — support indentation
    const bm = line.match(/^( *?)([•\-\*] )(.*)$/);
    if (bm) {
      const opacity = Math.max(0.5, 1 - (bm[1].length / 2) * 0.15);
      return `${bm[1]}<span style="color:var(--accent);font-weight:700;opacity:${opacity};">${bm[2]}</span>${applyInline(bm[3])}`;
    }
    // Ordered list — support indentation
    const om = line.match(/^( *?)(\d+\. )(.*)$/);
    if (om) {
      return `${om[1]}<span style="color:var(--accent);font-weight:700;">${om[2]}</span>${applyInline(om[3])}`;
    }
    return applyInline(line);
  }).join('\n');
}

function applyInline(t) {
  if (!t) return t;
  return t
    .replace(/(\*\*\*)(.+?)(\*\*\*)/g, '<span style="opacity:0.3">$1</span><strong><em>$2</em></strong><span style="opacity:0.3">$3</span>')
    .replace(/(\*\*)(.+?)(\*\*)/g, '<span style="opacity:0.3">$1</span><strong style="color:var(--text);">$2</strong><span style="opacity:0.3">$3</span>')
    .replace(/(\*)(.+?)(\*)/g, '<span style="opacity:0.3">$1</span><em>$2</em><span style="opacity:0.3">$3</span>')
    .replace(/(_)(.+?)(_)/g, '<span style="opacity:0.3">$1</span><em>$2</em><span style="opacity:0.3">$3</span>')
    .replace(/(~~)(.+?)(~~)/g, '<span style="opacity:0.3">$1</span><s style="opacity:0.5">$2</s><span style="opacity:0.3">$3</span>')
    .replace(/(`)(.*?)(`)/g, '<span style="opacity:0.3">$1</span><span style="background:rgba(var(--accent-rgb),0.15);color:var(--accent);border-radius:3px;padding:0 2px;">$2</span><span style="opacity:0.3">$3</span>');
}

// ── Smart keyboard helpers ────────────────────────────────────────────────────
function getLineInfo(val, pos) {
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  const lineEnd = val.indexOf('\n', pos);
  const line = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd);
  return { lineStart, line };
}

// ── Component ─────────────────────────────────────────────────────────────────
function MarkdownEditor({ value, onChange, placeholder, style, previewStyle, minHeight }) {
  const taRef = useRef();
  const ovRef = useRef();

  const syncHeight = useCallback(() => {
    const ta = taRef.current, ov = ovRef.current;
    if (!ta || !ov) return;
    ta.style.height = 'auto';
    const h = Math.max(ta.scrollHeight, minHeight || 40);
    ta.style.height = h + 'px';
    ov.style.height = h + 'px';
  }, [minHeight]);

  useEffect(() => { syncHeight(); }, [value, syncHeight]);

  const update = useCallback((newVal, newPos) => {
    onChange(newVal);
    if (newPos !== undefined) {
      setTimeout(() => {
        if (taRef.current) {
          taRef.current.selectionStart = taRef.current.selectionEnd = newPos;
          syncHeight();
        }
      }, 0);
    }
  }, [onChange, syncHeight]);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
    syncHeight();
  }, [onChange, syncHeight]);

  const handleKeyDown = useCallback((e) => {
    const ta = e.target;
    const pos = ta.selectionStart;
    const val = ta.value;

    // Tab → indent list item or insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const { lineStart, line } = getLineInfo(val, pos);

      // If on a list line, indent/unindent the whole line
      const isListLine = /^(\s*)[•\-\*] /.test(line) || /^(\s*)\d+\. /.test(line);
      if (isListLine) {
        if (e.shiftKey) {
          // Unindent: remove up to 2 leading spaces
          const dedented = line.replace(/^  /, '');
          if (dedented !== line) {
            const newVal = val.substring(0, lineStart) + dedented + val.substring(lineStart + line.length);
            const newPos = Math.max(lineStart, pos - (line.length - dedented.length));
            update(newVal, newPos);
          }
        } else {
          // Indent: add 2 spaces at line start
          const newVal = val.substring(0, lineStart) + '  ' + val.substring(lineStart);
          update(newVal, pos + 2);
        }
      } else {
        // Normal: insert 2 spaces at cursor
        update(val.substring(0, pos) + '  ' + val.substring(pos), pos + 2);
      }
      return;
    }

    // Space: auto-convert leading "- " to "• " (allowing indentation)
    if (e.key === ' ') {
      const { lineStart, line } = getLineInfo(val, pos);
      const relPos = pos - lineStart;
      // Match: optional spaces, then "-", cursor right after
      const indentMatch = line.match(/^( *)-$/);
      if (indentMatch && relPos === indentMatch[0].length && !line.startsWith('- [')) {
        e.preventDefault();
        const indent = indentMatch[1];
        const newVal = val.substring(0, lineStart) + indent + '• ' + val.substring(pos);
        update(newVal, lineStart + indent.length + 2);
        return;
      }
    }

    // Enter: smart list continuation
    if (e.key === 'Enter') {
      const { lineStart, line } = getLineInfo(val, pos);

      // Ordered list: "N. content" → insert "(N+1). " on next line
      const olm = line.match(/^( *?)(\d+)\. (.*)/);
      if (olm) {
        e.preventDefault();
        if (!olm[3].trim()) {
          update(val.substring(0, lineStart) + '\n' + val.substring(pos), lineStart + 1);
        } else {
          const next = '\n' + olm[1] + (parseInt(olm[2]) + 1) + '. ';
          update(val.substring(0, pos) + next + val.substring(pos), pos + next.length);
        }
        return;
      }

      // Bullet list: "• content" or "- content" → continue bullet with same indent
      const blm = line.match(/^( *?)([•\-\*] )(.*)/);
      if (blm) {
        e.preventDefault();
        if (!blm[3].trim()) {
          // Empty bullet → exit list
          update(val.substring(0, lineStart) + '\n' + val.substring(pos), lineStart + 1);
        } else {
          const next = '\n' + blm[1] + blm[2];
          update(val.substring(0, pos) + next + val.substring(pos), pos + next.length);
        }
        return;
      }
    }
  }, [update]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const ta = e.target;
    const s = ta.selectionStart, end = ta.selectionEnd;
    update(ta.value.substring(0, s) + text + ta.value.substring(end), s + text.length);
  }, [update]);

  const html = renderMarkdown(value || '');
  const isEmpty = !value || !value.trim();

  const base = {
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    fontSize: style?.fontSize || 12,
    lineHeight: style?.lineHeight || 1.7,
    padding: 0, margin: 0, border: 'none', outline: 'none',
    background: 'transparent', width: '100%',
    minHeight: minHeight || 40, boxSizing: 'border-box',
    wordBreak: 'break-word', overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap', letterSpacing: 'normal',
    // Any extra style props (e.g. fontSize override) applied uniformly
    ...style,
    padding: 0, // always 0 — padding is on the wrapper
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: minHeight || 40, ...previewStyle }}>
      <div ref={ovRef} style={{
        ...base, position: 'absolute', top: 0, left: 0,
        color: isEmpty ? 'rgba(var(--text-rgb),0.2)' : 'var(--text)',
        pointerEvents: 'none', userSelect: 'none', zIndex: 1,
        fontStyle: isEmpty ? 'italic' : 'normal', overflow: 'hidden',
      }}
        dangerouslySetInnerHTML={{ __html: isEmpty ? (placeholder || '') : html }}
      />
      <textarea ref={taRef} style={{
        ...base, position: 'relative', zIndex: 2,
        color: 'transparent', caretColor: 'var(--accent)',
        resize: 'none', overflow: 'hidden',
      }}
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        spellCheck={false}
      />
    </div>
  );
}

if (!document.getElementById('md-styles')) {
  const s = document.createElement('style');
  s.id = 'md-styles';
  s.textContent = 'strong{font-weight:700} em{font-style:italic} s{text-decoration:line-through}';
  document.head.appendChild(s);
}

Object.assign(window, { MarkdownEditor, renderMarkdown });
