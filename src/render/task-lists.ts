/**
 * GFM 태스크 리스트 (`- [ ]` / `- [x]`) — 뷰어라 체크박스는 항상 `disabled`.
 *
 * `@hedgedoc/markdown-it-task-lists` 2.0.1은 `markdown-it/lib/token.js`를 import하는데 markdown-it 15는
 * `lib/`를 더 이상 export하지 않아 로드 자체가 실패한다. 같은 마크업(GitHub과 동일한 클래스명)을 내는 룰을 직접 둔다.
 *   <ul class="contains-task-list"><li class="task-list-item"><input class="task-list-item-checkbox" type="checkbox" disabled checked> …
 */

import type { MarkdownIt, StateCore, Token } from "markdown-it";

/** 항목 첫 텍스트가 `[ ]`·`[x]` + 공백으로 시작 (inline content는 이미 trim돼 있다) */
const MARKER_RE = /^\[([ xX])\][ \t]+/;

export function taskListsPlugin(md: MarkdownIt): void {
  md.core.ruler.after("inline", "task_lists", taskListsRule);
  md.renderer.rules.task_checkbox = (tokens, idx) =>
    tokens[idx].attrGet("checked") === null
      ? '<input class="task-list-item-checkbox" type="checkbox" disabled> '
      : '<input class="task-list-item-checkbox" type="checkbox" disabled checked> ';
}

function taskListsRule(state: StateCore): void {
  const tokens = state.tokens;
  for (let i = 2; i < tokens.length; i++) {
    const inline = tokens[i];
    if (inline.type !== "inline" || tokens[i - 1].type !== "paragraph_open" || tokens[i - 2].type !== "list_item_open") continue;
    const children = inline.children;
    const first = children?.[0];
    if (!children || !first || first.type !== "text") continue;
    const marker = MARKER_RE.exec(first.content);
    if (!marker) continue;

    first.content = first.content.slice(marker[0].length);
    const checkbox = new state.Token("task_checkbox", "input", 0);
    if (marker[1] !== " ") checkbox.attrSet("checked", "");
    children.unshift(checkbox);

    tokens[i - 2].attrJoin("class", "task-list-item");
    const list = findParentList(tokens, i - 2);
    if (list && !hasClass(list, "contains-task-list")) list.attrJoin("class", "contains-task-list");
  }
}

function findParentList(tokens: Token[], itemIndex: number): Token | undefined {
  const level = tokens[itemIndex].level - 1;
  for (let j = itemIndex - 1; j >= 0; j--) {
    if (tokens[j].level === level && tokens[j].nesting === 1) return tokens[j];
  }
  return undefined;
}

function hasClass(token: Token, className: string): boolean {
  return String(token.attrGet("class") ?? "").split(/\s+/).includes(className);
}
