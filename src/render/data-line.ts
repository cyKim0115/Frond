/**
 * 블록 토큰마다 `data-line="시작줄"` (0 기준, brief R1) — 스크롤 동기·복원·외부 변경 리로드용.
 *
 * 토큰 타입별 룰을 두지 않고, 파싱 끝에 한 번 도는 코어 룰이 `token.map`이 있는 모든 블록 여는 토큰의 attrs에
 * 붙인다. 이후 기본 `renderToken`·`renderAttrs`를 쓰는 모든 룰(문단·제목·목록·인용·표·hr·펜스…)이 그대로 출력한다.
 * 타이트 리스트의 숨은 문단(`hidden`)은 어차피 렌더되지 않으므로 건너뛴다 — 줄 번호는 `<li>`가 가진다.
 * 각주 섹션(`footnote_*`)은 map이 없어 붙지 않는다.
 */

import type { MarkdownIt, StateCore } from "markdown-it";

export const DATA_LINE_ATTR = "data-line";

export function dataLinePlugin(md: MarkdownIt): void {
  md.core.ruler.push("data_line", dataLineRule);
}

function dataLineRule(state: StateCore): void {
  for (const token of state.tokens) {
    if (!token.block || !token.map || token.hidden || token.nesting === -1 || token.type === "inline") continue;
    token.attrSet(DATA_LINE_ATTR, String(token.map[0]));
  }
}
