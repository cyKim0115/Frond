/**
 * 목차(#sidebar) 폭 조절 — 오른쪽 경계 손잡이를 끌거나 포커스 후 ←/→로 바꾸고, 두 번 누르면 기본 폭.
 * 최소 폭의 절반보다 좁게 끌면 접힌다(VS Code 사이드바와 같음, Ctrl+\ 로 다시 연다).
 * 폭은 #app의 `--sidebar-w`로 흐르고 localStorage에 남는다. CSS의 min/max-width는 마지막 안전망이다.
 */

import { isNumber, readPref, writePref } from "./prefs";

export const SIDEBAR_DEFAULT_W = 260;
export const SIDEBAR_MIN_W = 160;
/** 목차가 차지할 수 있는 최대 비율 — 나머지는 본문 몫 */
const SIDEBAR_MAX_RATIO = 0.5;
const KEY_STEP = 16;

/**
 * 끌어서 나온 폭(raw, px)을 목차에 적용할 폭으로 바꾼다. `null`이면 목차를 접는다(Ctrl+\ 와 같은 상태).
 * room은 목차와 본문이 나눠 쓰는 폭(창 폭 − 탐색 영역 폭).
 */
export function resolveSidebarWidth(raw: number, room: number): number | null {
  if (raw < SIDEBAR_MIN_W / 2) return null;
  // 창이 아주 좁으면 상한보다 최소 폭이 이긴다 (720 px 이하에서는 CSS가 목차를 숨긴다)
  const max = Math.max(SIDEBAR_MIN_W, Math.floor(room * SIDEBAR_MAX_RATIO));
  return Math.min(max, Math.max(SIDEBAR_MIN_W, raw));
}

export function initSidebarResize(): void {
  const app = document.querySelector<HTMLElement>("#app")!;
  const sidebar = document.querySelector<HTMLElement>("#sidebar")!;
  const nav = document.querySelector<HTMLElement>("#nav")!;
  const handle = document.querySelector<HTMLElement>("#sidebar-resizer")!;

  const setWidth = (px: number): void => {
    // 음수는 CSS에서 무효값이 돼 auto 폭으로 튄다 — 0으로 막고 나머지는 CSS min-width가 받는다
    app.style.setProperty("--sidebar-w", `${Math.max(0, Math.round(px))}px`);
    handle.setAttribute("aria-valuenow", String(Math.round(px)));
  };
  /** 적용하면 true, 접었으면 false */
  const apply = (raw: number): boolean => {
    const next = resolveSidebarWidth(raw, app.clientWidth - nav.getBoundingClientRect().width);
    if (next === null) {
      sidebar.hidden = true;
      return false;
    }
    setWidth(next);
    return true;
  };
  const save = (): void => writePref("sidebarWidth", sidebar.getBoundingClientRect().width);

  setWidth(readPref("sidebarWidth", SIDEBAR_DEFAULT_W, isNumber));

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = sidebar.getBoundingClientRect().width;
    app.classList.add("resizing");

    const move = (e: PointerEvent): void => {
      if (!apply(startWidth + e.clientX - startX)) handle.releasePointerCapture(e.pointerId);
    };
    const end = (): void => {
      app.classList.remove("resizing");
      handle.removeEventListener("pointermove", move);
      if (!sidebar.hidden) save();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("lostpointercapture", end, { once: true });
  });

  handle.addEventListener("dblclick", () => {
    setWidth(SIDEBAR_DEFAULT_W);
    save();
  });

  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP;
    if (apply(sidebar.getBoundingClientRect().width + delta)) save();
  });
}
