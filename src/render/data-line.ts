/**
 * 블록 토큰마다 `data-line="시작줄"` (0 기준, brief R1) — 스크롤 동기·복원·외부 변경 리로드용.
 *
 * 토큰 타입별 룰을 두지 않고, 파싱 끝에 한 번 도는 코어 룰이 `token.map`이 있는 모든 블록 여는 토큰의 attrs에
 * 붙인다. 이후 기본 `renderToken`·`renderAttrs`를 쓰는 모든 룰(문단·제목·목록·인용·표·hr·펜스…)이 그대로 출력한다.
 * 타이트 리스트의 숨은 문단(`hidden`)은 어차피 렌더되지 않으므로 건너뛴다 — 줄 번호는 `<li>`가 가진다.
 * 각주 섹션(`footnote_block_open`, markdown-it-footnote가 문서 끝에 붙인다)은 map이 없다 — 안의 정의 중 첫 줄을 주되,
 * 최상위 블록의 줄 번호가 문서 순서대로 커지게 앞 블록보다 작으면 앞 블록 + 1로 올린다(정의가 문서 중간에 흩어진 경우).
 * 렌더러가 고정 문자열을 내므로 `<section class="footnotes">`에 직접 넣는다. footnote 플러그인 뒤에 use한다.
 */

import type { MarkdownIt, RendererRule, StateCore } from "markdown-it";

export const DATA_LINE_ATTR = "data-line";

const FOOTNOTE_SECTION = '<section class="footnotes">';

export function dataLinePlugin(md: MarkdownIt): void {
  md.core.ruler.push("data_line", dataLineRule);
  const renderFootnotes = md.renderer.rules.footnote_block_open;
  if (renderFootnotes) {
    const withLine: RendererRule = (tokens, idx, options, env, self) => {
      const html = renderFootnotes(tokens, idx, options, env, self);
      const line = tokens[idx].attrGet(DATA_LINE_ATTR);
      return line === null ? html : html.replace(FOOTNOTE_SECTION, `<section class="footnotes" ${DATA_LINE_ATTR}="${line}">`);
    };
    md.renderer.rules.footnote_block_open = withLine;
  }
}

function dataLineRule(state: StateCore): void {
  let depth = 0;
  let lastTop = -1;
  let footnotes: (typeof state.tokens)[number] | null = null;
  let firstDef = Infinity;
  for (const token of state.tokens) {
    if (token.type === "footnote_block_open") footnotes = token;
    if (token.block && token.map && !token.hidden && token.nesting !== -1 && token.type !== "inline") {
      token.attrSet(DATA_LINE_ATTR, String(token.map[0]));
      if (footnotes) firstDef = Math.min(firstDef, token.map[0]);
      else if (depth === 0) lastTop = token.map[0];
    }
    depth += token.nesting;
  }
  if (footnotes && firstDef !== Infinity) footnotes.attrSet(DATA_LINE_ATTR, String(Math.max(firstDef, lastTop + 1)));
}
