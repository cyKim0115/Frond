/**
 * 목차(#sidebar) 자리와 접기·펴기. 설정 '목차 위치'(tocSide)가 오른쪽이면 본문 오른쪽(제목 표시줄 아래 #main-body)에,
 * 왼쪽이면 탐색 영역 옆(#app 격자의 sidebar 칸)에 둔다. 자리를 옮기면 손잡이(#sidebar-resizer)도 같이 옮긴다.
 * 접고 펴기는 제목 표시줄 목차 버튼(#toc-toggle, 오른쪽일 때만 보인다)·Ctrl+\·손잡이를 끝까지 끌기(resize.ts)로 한다.
 * 접은 상태는 탭·문서를 바꿔도 남고(localStorage `tocOpen`), 목차 줄이 없는 문서(제목 없음·HTML)에서는 늘 숨긴다.
 */

import { isBoolean, readPref, writePref } from "./prefs";

export type TocSide = "left" | "right";

/** 설정값을 자리로 — 모르는 값은 기본(오른쪽) */
export const tocSideOf = (value: string): TocSide => (value === "left" ? "left" : "right");

/** 목차를 보일지 — 목차 줄이 있는 문서이고 접지 않았을 때 */
export const tocShown = (hasEntries: boolean, open: boolean): boolean => hasEntries && open;

export interface TocPanel {
  /** 활성 탭에 목차 줄이 있는지 — 탭 전환·다시 그리기 때 */
  setAvailable(has: boolean): void;
  setOpen(open: boolean): void;
  /** 접기·펴기. 목차 줄이 없는 문서면 아무것도 하지 않는다 */
  toggle(): void;
  setSide(side: TocSide): void;
}

export function initTocPanel(): TocPanel {
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
  const app = $("#app");
  const main = $("#main");
  const mainBody = $("#main-body");
  const sidebar = $("#sidebar");
  const resizer = $("#sidebar-resizer");
  const button = $<HTMLButtonElement>("#toc-toggle");

  let available = false;
  let open = readPref("tocOpen", true, isBoolean);

  function render(): void {
    sidebar.hidden = !tocShown(available, open);
    button.disabled = !available;
    button.setAttribute("aria-expanded", String(!sidebar.hidden));
    button.title = `목차 ${open ? "접기" : "펴기"} (Ctrl+\\)`;
  }

  function setOpen(next: boolean): void {
    if (next === open) return;
    open = next;
    writePref("tocOpen", open);
    render();
  }

  function toggle(): void {
    if (available) setOpen(!open);
  }
  button.addEventListener("click", toggle);

  render();
  return {
    setAvailable(has) {
      available = has;
      render();
    },
    setOpen,
    toggle,
    setSide(side) {
      app.dataset.tocSide = side;
      // 오른쪽: [본문][손잡이][목차] — 문서 순서를 보이는 순서와 맞춰 Tab 이동도 같은 순서. 왼쪽: [탐색][목차][손잡이][본문]
      if (side === "right") mainBody.append(resizer, sidebar);
      else main.before(sidebar, resizer);
    },
  };
}
