/**
 * GitHub Alerts (로드맵 4-2) — 최상위 인용의 첫 줄이 `[!NOTE]`·`[!TIP]`·`[!IMPORTANT]`·`[!WARNING]`·`[!CAUTION]`뿐이면
 * GitHub과 같은 `<div class="markdown-alert markdown-alert-note"><p class="markdown-alert-title">Note</p>…</div>`로 바꾼다.
 *
 * GitHub 규칙을 따른다: 표시는 대소문자를 가리지 않고, 그 줄에 다른 글자가 있으면 보통 인용이다. 다른 요소 안(목록·인용 속 인용)은 alert가 아니다.
 * 블록 파싱 직후·인라인 파싱 전에 토큰을 고친다 — 표시 줄을 인라인 원문에서 지우면 나머지 줄만 인라인으로 파싱된다.
 * 아이콘은 CSS(theme/base.css `.markdown-alert-title::before`)가 그린다 — DOMPurify가 원문 `svg`를 막기 때문이다.
 */

import type { MarkdownIt, RendererRule, StateCore, Token } from "markdown-it";

export const ALERT_TYPES = ["note", "tip", "important", "warning", "caution"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

const MARKER_RE = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\n|$)/i;
const TITLE: Record<AlertType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

export function alertsPlugin(md: MarkdownIt): void {
  md.core.ruler.after("block", "github_alerts", alertRule);
  const renderTitle: RendererRule = (tokens, idx) => {
    const type = tokens[idx].info as AlertType;
    return `<p class="markdown-alert-title">${TITLE[type]}</p>\n`;
  };
  md.renderer.rules.alert_title = renderTitle;
}

function alertRule(state: StateCore): void {
  const tokens = state.tokens;
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const open = tokens[i];
    if (depth === 0 && open.type === "blockquote_open") {
      const type = alertTypeAt(tokens, i);
      if (type) convert(state, i, type);
    }
    depth += tokens[i].nesting;
  }
}

/** `tokens[i]`(인용 열기) 바로 안 첫 문단의 첫 줄이 표시 줄이면 그 종류. 표시 말고 내용이 없으면 GitHub처럼 보통 인용 */
function alertTypeAt(tokens: Token[], i: number): AlertType | null {
  const para = tokens[i + 1];
  const inline = tokens[i + 2];
  if (para?.type !== "paragraph_open" || inline?.type !== "inline") return null;
  const m = MARKER_RE.exec(inline.content);
  if (!m) return null;
  const onlyMarker = inline.content.slice(m[0].length).trim() === "" && tokens[i + 4]?.type === "blockquote_close";
  return onlyMarker ? null : (m[1].toLowerCase() as AlertType);
}

function convert(state: StateCore, i: number, type: AlertType): void {
  const tokens = state.tokens;
  const open = tokens[i];
  const close = tokens[matchingClose(tokens, i)];
  for (const t of [open, close]) {
    t.tag = "div";
    t.markup = "";
  }
  open.attrJoin("class", `markdown-alert markdown-alert-${type}`);

  const title = new state.Token("alert_title", "", 0);
  title.block = true;
  title.info = type;

  const inline = tokens[i + 2];
  const rest = inline.content.replace(MARKER_RE, "");
  if (rest.trim() === "") {
    // 표시 줄뿐인 첫 문단 → 제목으로 바꾼다
    tokens.splice(i + 1, 3, title);
    return;
  }
  inline.content = rest;
  const para = tokens[i + 1];
  if (para.map) para.map = [para.map[0] + 1, para.map[1]];
  if (inline.map) inline.map = [inline.map[0] + 1, inline.map[1]];
  tokens.splice(i + 1, 0, title);
}

function matchingClose(tokens: Token[], i: number): number {
  let depth = 0;
  for (let j = i; j < tokens.length; j++) {
    depth += tokens[j].nesting;
    if (depth === 0) return j;
  }
  return tokens.length - 1;
}
