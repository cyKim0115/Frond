/**
 * 보기 모드 찾기 (로드맵 2-5) — Ctrl+F. 본문 텍스트 노드를 이어 붙인 문자열에서 찾고(태그 경계에 걸친 일치도 잡는다),
 * 일치 범위를 CSS Custom Highlight API(`::highlight(find-match)`)로 칠한다. DOM을 바꾸지 않으므로 목차·스크롤·
 * 외부 변경 리로드와 부딪히지 않는다. 대소문자는 가리지 않는다. 바꾸기는 소스 모드(CM6 검색 패널, Ctrl+H)에서 한다.
 * 본문은 앱 문서의 탭 `<article>`일 수도, HTML 안전 보기 frame 문서의 `<body>`(html-view.ts)일 수도 있다 — Range·하이라이트는
 * 본문이 속한 문서·창의 것으로 만든다(하이라이트 목록은 문서마다 따로다).
 */

/** 이보다 많으면 앞에서부터만 칠한다 — 10 MB 문서에서 한 글자 검색이 멈추지 않게 */
export const MAX_MATCHES = 5000;

/** `haystack`에서 `query`의 [시작, 끝) 목록 (대소문자 무시, 겹치지 않게). 빈 검색어는 빈 목록 */
export function matchOffsets(haystack: string, query: string, max = MAX_MATCHES): [number, number][] {
  if (query === "") return [];
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
  const out: [number, number][] = [];
  for (let m = re.exec(haystack); m && out.length < max; m = re.exec(haystack)) {
    out.push([m.index, m.index + m[0].length]);
  }
  return out;
}

export interface FindBar {
  open(): void;
  close(): void;
  isOpen(): boolean;
  /** 문서가 다시 그려졌을 때 — 열려 있으면 같은 검색어로 다시 찾는다 */
  refresh(): void;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

/** 본문 문서의 하이라이트 목록과 그 창의 `Highlight` — 지원하지 않으면 null (칠하지 않고 이동·개수만) */
interface Painter {
  highlights: HighlightRegistry;
  Highlight: typeof Highlight;
}
function painterOf(doc: Document): Painter | null {
  const win = doc.defaultView as (Window & typeof globalThis) | null;
  if (!win || typeof win.CSS === "undefined" || !("highlights" in win.CSS)) return null;
  return { highlights: win.CSS.highlights, Highlight: win.Highlight };
}

/** `getRoot`은 지금 찾을 본문 — 탭(로드맵 3-1)마다 본문이 따로라 부를 때마다 묻는다 */
export function initFindBar(getRoot: () => HTMLElement | null, onClose: () => void): FindBar {
  const bar = $("#find-bar");
  const input = $<HTMLInputElement>("#find-input");
  const count = $("#find-count");

  let ranges: Range[] = [];
  let index = -1;
  let timer = 0;
  /** 지금 칠해 둔 문서 — 다음 검색·닫기 때 거기서 지운다 */
  let painter: Painter | null = null;

  function clearHighlights(): void {
    painter?.highlights.delete("find-match");
    painter?.highlights.delete("find-current");
    painter = null;
  }

  function search(): void {
    clearHighlights();
    ranges = [];
    index = -1;
    const query = input.value;
    const root = getRoot();
    if (query === "" || !root || root.hidden) {
      count.textContent = "";
      return;
    }
    // 텍스트 노드를 이어 붙이고, 노드별 시작 위치로 일치 위치를 노드·오프셋으로 되돌린다
    const doc = root.ownerDocument;
    const nodes: Text[] = [];
    const starts: number[] = [];
    let flat = "";
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      starts.push(flat.length);
      nodes.push(n);
      flat += n.data;
    }
    const locate = (offset: number, end: boolean): [Text, number] => {
      // 끝 위치가 노드 경계면 앞 노드의 끝으로 잡는다 (다음 노드 앞 0이 아니라)
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] < offset || (!end && starts[mid] === offset)) lo = mid;
        else hi = mid - 1;
      }
      return [nodes[lo], offset - starts[lo]];
    };
    const found = matchOffsets(flat, query);
    ranges = found.map(([s, e]) => {
      const range = doc.createRange();
      const [sn, so] = locate(s, false);
      const [en, eo] = locate(e, true);
      range.setStart(sn, so);
      range.setEnd(en, eo);
      return range;
    });
    painter = painterOf(doc);
    if (painter && ranges.length > 0) painter.highlights.set("find-match", new painter.Highlight(...ranges));
    if (ranges.length > 0) go(0);
    else count.textContent = "없음";
  }

  function go(next: number): void {
    if (ranges.length === 0) return;
    index = (next + ranges.length) % ranges.length;
    const range = ranges[index];
    painter?.highlights.set("find-current", new painter.Highlight(range));
    const more = ranges.length >= MAX_MATCHES ? "+" : "";
    count.textContent = `${index + 1}/${ranges.length}${more}`;
    range.startContainer.parentElement?.scrollIntoView({ block: "center" });
  }

  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(search, 180);
  });
  input.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      window.clearTimeout(timer);
      if (ranges.length === 0 || index < 0) search();
      else go(index + (event.shiftKey ? -1 : 1));
    } else if (event.key === "Escape") {
      event.preventDefault();
      api.close();
    }
  });
  $("#find-next").addEventListener("click", () => go(index + 1));
  $("#find-prev").addEventListener("click", () => go(index - 1));
  $("#find-close").addEventListener("click", () => api.close());

  const api: FindBar = {
    open() {
      bar.hidden = false;
      input.focus();
      input.select();
      if (input.value !== "") search();
    },
    close() {
      if (bar.hidden) return;
      bar.hidden = true;
      clearHighlights();
      ranges = [];
      onClose();
    },
    isOpen: () => !bar.hidden,
    refresh() {
      if (!bar.hidden) search();
    },
  };
  return api;
}
