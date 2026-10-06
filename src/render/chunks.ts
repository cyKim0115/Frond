/**
 * 큰 문서 블록 묶음 — 최상위 블록을 `size`개씩 `<div class="md-chunk">`로 감싼다 (로드맵 백로그 "큰 문서 블록 묶음").
 *
 * 큰 문서 모드는 화면 밖 블록의 레이아웃·페인트를 `content-visibility: auto`로 건너뛰지만, 10 MB 샘플은 최상위 블록이
 * 14만 개라 건너뛰는 상자 자체를 매 프레임 훑는 비용이 스크롤 한 번에 1 s를 넘었다. 묶음에 걸면 훑을 상자가 1/size로 준다.
 *
 * 묶음은 `content-visibility`(레이아웃 격리)라 경계에서 위아래 블록의 여백이 겹치지 않고(margin collapse) 더해진다.
 * 그래서 위쪽 여백이 있는 블록(제목·구분선·각주 섹션)에서는 새 묶음을 시작하지 않는다 — 위쪽 여백이 0인 블록에서 나누면
 * "윗블록 아래 여백 + 0"이 겹칠 때의 "둘 중 큰 값"과 같다. 보이지 않는 블록(주석만 있는 원문 HTML·front matter)은 세지도,
 * 거기서 시작하지도 않는다 — 거기서 시작하면 바로 뒤 제목이 묶음 맨 위가 된다. 원문 HTML 블록이 여러 토큰에 걸쳐 열려 있는 동안
 * (`<details>` … 마크다운 … `</details>`)에도 나누지 않는다 — 나누면 브라우저가 태그를 엉뚱하게 닫는다.
 */

import type { MarkdownIt, StateCore, Token } from "markdown-it";

export const CHUNK_CLASS = "md-chunk";

/** 여기서 시작하면 묶음 경계에 위쪽 여백이 더해지는 블록 (theme/base.css·github-markdown.css의 margin-top) */
const NO_CHUNK_START: ReadonlySet<string> = new Set(["heading_open", "hr", "footnote_block_open"]);

const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

/** 원문 HTML 블록이 열고 닫는 태그 수 — 빈 요소·`/>`는 세지 않는다 */
const HTML_OPEN_RE = /<([A-Za-z][A-Za-z0-9-]*)(?:\s[^<>]*)?(?<!\/)>/g;
const HTML_CLOSE_RE = /<\/[A-Za-z][A-Za-z0-9-]*\s*>/g;
const VOID_TAGS: ReadonlySet<string> = new Set(["br", "hr", "img", "input", "wbr"]);

/** 렌더하면 아무것도 보이지 않는 최상위 블록 — html.ts가 주석을 숨긴다 */
function isInvisible(token: Token): boolean {
  if (token.type === "front_matter") return true;
  return token.type === "html_block" && token.content.replace(HTML_COMMENT_RE, "").trim() === "";
}

function canStartChunk(token: Token): boolean {
  if (NO_CHUNK_START.has(token.type)) return false;
  return token.type !== "html_block" || !/^<hr\b/i.test(token.content.replace(HTML_COMMENT_RE, "").trimStart());
}

function htmlDepthDelta(content: string): number {
  let delta = 0;
  for (const m of content.matchAll(HTML_OPEN_RE)) if (!VOID_TAGS.has(m[1].toLowerCase())) delta++;
  for (const _ of content.matchAll(HTML_CLOSE_RE)) delta--;
  return delta;
}

/** `env.chunkBlocks`가 있을 때만 동작한다. 다른 코어 룰(목차·data-line·링크) 뒤에 둔다 */
export function chunkPlugin(md: MarkdownIt): void {
  md.core.ruler.push("frond_chunks", chunkRule);
}

function chunkRule(state: StateCore): void {
  const size = (state.env as { chunkBlocks?: number }).chunkBlocks;
  if (!size || size <= 0) return;
  const marker = (nesting: 1 | -1): Token => {
    const token = new state.Token(nesting === 1 ? "frond_chunk_open" : "frond_chunk_close", "div", nesting);
    token.block = true;
    if (nesting === 1) token.attrSet("class", CHUNK_CLASS);
    return token;
  };
  const out: Token[] = [];
  let depth = 0;
  let htmlDepth = 0;
  let blocks = 0;
  for (const token of state.tokens) {
    // 최상위 블록의 시작 (여는 토큰이나 펜스·hr·html_block 같은 홑 토큰)
    if (depth === 0 && token.nesting !== -1) {
      const invisible = isInvisible(token);
      if (out.length === 0) {
        out.push(marker(1));
      } else if (blocks >= size && htmlDepth === 0 && !invisible && canStartChunk(token)) {
        out.push(marker(-1), marker(1));
        blocks = 0;
      }
      if (!invisible) blocks++;
    }
    if (token.type === "html_block") {
      htmlDepth = Math.max(0, htmlDepth + htmlDepthDelta(token.content.replace(HTML_COMMENT_RE, "")));
    }
    depth += token.nesting;
    out.push(token);
  }
  if (out.length > 0) out.push(marker(-1));
  state.tokens = out;
}
