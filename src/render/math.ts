/**
 * 수식 찾기 (로드맵 4-3) — GitHub 규칙으로 수식 자리만 표시하고, 그리기는 DOM에 넣은 뒤 math-render.ts(KaTeX 지연 로드)가 한다.
 *
 * - 인라인 `$…$`: 여는 `$` 뒤와 닫는 `$` 앞이 공백이 아니고, 닫는 `$` 뒤가 숫자가 아닐 때만 — `$5와 $10`은 글자 그대로.
 *   `` $`…`$ `` (GitHub의 백틱 표기)도 받는다. `\$`는 이스케이프 룰이 먼저 먹어 수식이 되지 않는다
 * - 블록 `$$`: 줄 첫머리 `$$`부터 `$$`로 끝나는 줄까지(한 줄 `$$ x $$`도). ```` ```math ```` 펜스도 같은 블록
 * - 출력: `<span class="math-inline" data-tex="…">원문</span>`, `<div class="math-display" data-tex="…" data-line>원문</div>` —
 *   KaTeX가 오기 전·실패해도 원문이 보인다. DOMPurify는 `data-*`·`class`를 통과시킨다
 */

import type { MarkdownIt, RendererRule, StateBlock, StateInline } from "markdown-it";

const DOLLAR = 0x24;
const BACKTICK = 0x60;
const isSpace = (c: number): boolean => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
const isDigit = (c: number): boolean => c >= 0x30 && c <= 0x39;

function mathInline(state: StateInline, silent: boolean): boolean {
  const { src, pos, posMax } = state;
  if (src.charCodeAt(pos) !== DOLLAR) return false;

  // $`…`$
  if (src.charCodeAt(pos + 1) === BACKTICK) {
    const close = src.indexOf("`$", pos + 2);
    if (close < 0 || close + 2 > posMax) return false;
    const content = src.slice(pos + 2, close);
    if (content.trim() === "") return false;
    if (!silent) state.push("math_inline", "", 0).content = content;
    state.pos = close + 2;
    return true;
  }

  const first = src.charCodeAt(pos + 1);
  if (pos + 1 >= posMax || isSpace(first) || first === DOLLAR) return false;
  // 닫는 `$` — 앞이 공백·역슬래시가 아니고 뒤가 숫자가 아닌 첫 `$`
  let end = pos + 1;
  for (;;) {
    end = src.indexOf("$", end);
    if (end < 0 || end >= posMax) return false;
    const before = src.charCodeAt(end - 1);
    if (before === 0x5c) {
      end++;
      continue;
    }
    if (isSpace(before)) return false;
    if (end + 1 < posMax && isDigit(src.charCodeAt(end + 1))) return false;
    break;
  }
  const content = src.slice(pos + 1, end);
  if (!silent) state.push("math_inline", "", 0).content = content;
  state.pos = end + 1;
  return true;
}

function mathBlock(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (pos + 2 > max || state.src.charCodeAt(pos) !== DOLLAR || state.src.charCodeAt(pos + 1) !== DOLLAR) return false;
  pos += 2;
  let firstLine = state.src.slice(pos, max);
  // 한 줄 `$$ x $$`
  if (firstLine.trim().endsWith("$$") && firstLine.trim().length > 2) {
    if (silent) return true;
    const content = firstLine.trim().slice(0, -2);
    push(state, content, startLine, startLine + 1);
    state.line = startLine + 1;
    return true;
  }
  let next = startLine;
  let lastLine = "";
  let found = false;
  for (;;) {
    next++;
    if (next >= endLine) break;
    pos = state.bMarks[next] + state.tShift[next];
    max = state.eMarks[next];
    // 들여쓰기가 본문보다 얕으면(목록 밖) 블록 끝
    if (pos < max && state.sCount[next] < state.blkIndent) break;
    const line = state.src.slice(pos, max).trim();
    if (line.endsWith("$$")) {
      lastLine = line.slice(0, -2);
      found = true;
      break;
    }
  }
  if (!found) return false;
  if (silent) return true;
  firstLine = firstLine.trim();
  const middle = state.getLines(startLine + 1, next, state.tShift[startLine], true);
  const content = (firstLine ? `${firstLine}\n` : "") + middle + (lastLine.trim() ? `${lastLine}\n` : "");
  push(state, content, startLine, next + 1);
  state.line = next + 1;
  return true;
}

function push(state: StateBlock, content: string, start: number, end: number): void {
  const token = state.push("math_block", "div", 0);
  token.block = true;
  token.content = content;
  token.map = [start, end];
  token.markup = "$$";
}

export function mathPlugin(md: MarkdownIt): void {
  md.inline.ruler.after("escape", "math_inline", mathInline);
  md.block.ruler.before("fence", "math_block", mathBlock, { alt: ["paragraph", "reference", "blockquote", "list"] });
  const esc = md.utils.escapeHtml;
  const inline: RendererRule = (tokens, idx) => `<span class="math-inline" data-tex="${esc(tokens[idx].content)}">${esc(tokens[idx].content)}</span>`;
  const block: RendererRule = (tokens, idx, _options, _env, self) => {
    const token = tokens[idx];
    return `<div class="math-display"${self.renderAttrs(token)} data-tex="${esc(token.content)}">${esc(token.content)}</div>\n`;
  };
  md.renderer.rules.math_inline = inline;
  md.renderer.rules.math_block = block;
}

/** ```math 펜스의 출력 — index.ts의 펜스 렌더러가 부른다 */
export function mathFenceHtml(content: string, attrs: string, escape: (s: string) => string): string {
  return `<div class="math-display"${attrs} data-tex="${escape(content)}">${escape(content)}</div>\n`;
}
