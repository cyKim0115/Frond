/**
 * 미리보기 부분 갱신 (로드맵 3-3) — 편집할 때마다 `innerHTML`을 통째로 바꾸면 이미지가 다시 로드돼 깜빡이고,
 * 하이라이트·Mermaid 그림을 매번 다시 만들어 느리다. 새 렌더의 최상위 블록을 원래 HTML(`data-line` 뺀 것)로
 * 기존 블록과 짝지어, 같은 블록은 DOM을 그대로 두고 줄 번호만 고친다. 바뀐 블록만 새로 넣는다.
 *
 * 짝짓기 키는 그 블록을 처음 넣을 때의 HTML이다 — 하이라이트·그림이 DOM을 바꾼 뒤에도 키는 남는다(`keys`).
 * Mermaid가 `<pre>`를 그림으로 바꿀 때는 `transferKey`로 키를 넘겨 다음 갱신에서 그림을 다시 그리지 않게 한다.
 */

const keys = new WeakMap<Element, string>();
const LINE_ATTR_RE = / data-line="\d+"/g;

const keyOf = (html: string): string => html.replace(LINE_ATTR_RE, "");

/** 블록을 다른 요소로 바꿔 끼울 때(그림) 짝짓기 키를 옮긴다 */
export function transferKey(from: Element, to: Element): void {
  const key = keys.get(from);
  if (key !== undefined) keys.set(to, key);
}

/** 최상위 블록들. 블록 사이에 공백 아닌 글자 노드가 있으면(원문 HTML의 드문 모양) null — 그때는 통째로 바꾼다 */
function parse(html: string): Element[] | null {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  for (const node of tpl.content.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== "") return null;
  }
  return Array.from(tpl.content.children);
}

/** `data-line` 붙은 자손까지 줄 번호를 새 블록 것으로 맞춘다. 개수가 다르면 false (그 블록은 새로 넣는다) */
function copyLines(from: Element, to: Element): boolean {
  const src = [from, ...from.querySelectorAll("[data-line]")].filter((e) => e.hasAttribute("data-line"));
  const dst = [to, ...to.querySelectorAll("[data-line]")].filter((e) => e.hasAttribute("data-line"));
  if (src.length !== dst.length) return false;
  for (let i = 0; i < src.length; i++) {
    const line = src[i].getAttribute("data-line")!;
    if (dst[i].getAttribute("data-line") !== line) dst[i].setAttribute("data-line", line);
  }
  return true;
}

export interface MorphResult {
  /** 새로 넣은 블록 수 (그대로 둔 것 제외) */
  inserted: number;
  removed: number;
}

/**
 * `target`의 자식을 `html`의 최상위 블록으로 맞춘다. `patch`가 아니면(처음·다른 문서) 통째로 바꾸고 키만 매긴다.
 * `html`은 이미 정화된(DOMPurify) 렌더 결과다
 */
export function setBlocks(target: HTMLElement, html: string, patch: boolean): MorphResult {
  const next = parse(html);
  if (!next) {
    const removed = target.childElementCount;
    target.innerHTML = html;
    return { inserted: target.childElementCount, removed };
  }
  if (!patch || target.childElementCount === 0) {
    for (const el of next) keys.set(el, keyOf(el.outerHTML));
    const removed = target.childElementCount;
    target.replaceChildren(...next);
    return { inserted: next.length, removed };
  }
  // 기존 블록을 키별 대기열로 — 같은 블록이 여러 번(빈 문단·같은 코드) 있어도 문서 순서대로 짝짓는다
  const pool = new Map<string, Element[]>();
  for (const el of Array.from(target.children)) {
    const key = keys.get(el);
    if (key === undefined) continue;
    const queue = pool.get(key);
    if (queue) queue.push(el);
    else pool.set(key, [el]);
  }
  const wanted: Element[] = [];
  let inserted = 0;
  for (const el of next) {
    const key = keyOf(el.outerHTML);
    const old = pool.get(key)?.shift();
    if (old && copyLines(el, old)) {
      wanted.push(old);
    } else {
      keys.set(el, key);
      wanted.push(el);
      inserted++;
    }
  }
  // 순서대로 놓는다 — 이미 제자리인 블록은 건드리지 않아 스크롤·선택·재생 중인 것이 흔들리지 않는다
  const keep = new Set(wanted);
  let removed = 0;
  for (const el of Array.from(target.children)) {
    if (!keep.has(el)) {
      el.remove();
      removed++;
    }
  }
  let cursor: Element | null = target.firstElementChild;
  for (const el of wanted) {
    if (el === cursor) {
      cursor = cursor.nextElementSibling;
      continue;
    }
    target.insertBefore(el, cursor);
  }
  return { inserted, removed };
}
