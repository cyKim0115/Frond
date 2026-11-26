/**
 * 창 틀 — 둥근 모서리 카드(style.css '창 틀')의 동작. 창은 투명·OS 그림자 없음(lib.rs)이고, 페이지가 여백 안에
 * 둥근 불투명 카드(#app)를 그린다. 최대화하면 여백·둥근 모서리·그림자를 없앤다(setFlat, titlebar.ts가 부른다).
 *
 * 카드 바깥 투명 여백은 클릭이 뒤 창으로 통과하지 않으니 크기 조절 테두리로 쓴다. 테두리 없는 창에서 Tauri가 주는
 * 크기 조절 테두리는 바깥 몇 px(SM_CXFRAME)뿐이라, 나머지 여백은 페이지가 누를 때 그 변의 네이티브 크기 조절
 * 루프(startResizeDragging)를 시작하고 커서도 바꾼다. Win10 보통 창의 보이지 않는 크기 조절 테두리(약 8px)와 폭이 같다.
 */

import { getCurrentWindow } from "@tauri-apps/api/window";

export type ResizeEdge = "North" | "South" | "East" | "West" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest";

/** 모서리에서 이만큼(px) 안은 두 방향으로 크기를 바꾼다 */
const CORNER_PX = 16;

const CURSORS: Record<ResizeEdge, string> = {
  North: "ns-resize",
  South: "ns-resize",
  East: "ew-resize",
  West: "ew-resize",
  NorthEast: "nesw-resize",
  SouthWest: "nesw-resize",
  NorthWest: "nwse-resize",
  SouthEast: "nwse-resize",
};

/**
 * `w`×`h` 창의 점(`x`, `y`)이 바깥 `margin` px 안이면 그 변, 카드 안이면 null. 모서리 근처(CORNER_PX)는 그 모서리.
 */
export function edgeAt(x: number, y: number, w: number, h: number, margin: number): ResizeEdge | null {
  if (margin <= 0) return null;
  const top = y < margin;
  const bottom = y >= h - margin;
  const left = x < margin;
  const right = x >= w - margin;
  if (!top && !bottom && !left && !right) return null;
  const side = left || right;
  const cap = top || bottom;
  const ns = top || (side && y < CORNER_PX) ? "North" : bottom || (side && y >= h - CORNER_PX) ? "South" : "";
  const ew = left || (cap && x < CORNER_PX) ? "West" : right || (cap && x >= w - CORNER_PX) ? "East" : "";
  return (ns + ew) as ResizeEdge;
}

/** 최대화: 여백·둥근 모서리·그림자 없음 */
export function setFlat(flat: boolean): void {
  if (flat) document.documentElement.dataset.frame = "flat";
  else delete document.documentElement.dataset.frame;
}

function marginPx(): number {
  return parseFloat(getComputedStyle(document.body).paddingTop) || 0;
}

export function initFrame(): void {
  const win = getCurrentWindow();
  // 여백 자체(body·html)에서만 — 카드(#app)와 팝업은 제 대상이 따로 있다
  const inMargin = (event: MouseEvent): ResizeEdge | null => {
    if (event.target !== document.body && event.target !== document.documentElement) return null;
    return edgeAt(event.clientX, event.clientY, innerWidth, innerHeight, marginPx());
  };
  document.addEventListener("mousemove", (event) => {
    const edge = inMargin(event);
    document.body.style.cursor = edge ? CURSORS[edge] : "";
  });
  document.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    const edge = inMargin(event);
    if (!edge) return;
    event.preventDefault();
    void win.startResizeDragging(edge);
  });
}
