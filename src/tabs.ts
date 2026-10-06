/**
 * 탭 띠 (로드맵 3-1) — 제목 표시줄 가운데에 열린 문서를 탭으로 보인다. 문서 상태는 main.ts가 갖고, 여기는 그리기와 입력만 한다.
 *
 * - 누르면 활성, 가운데 버튼·닫기(×)·Ctrl+W로 닫기, 끌어서 순서 바꾸기, 오른쪽 클릭 메뉴는 main.ts가 채운다
 * - 탭이 넘치면 가로로 스크롤한다(휠도 가로로). 활성 탭은 보이는 자리로 옮긴다
 * - 탭은 `role="tab"`이라 제목 표시줄 드래그(titlebar.ts)에서 빠진다. 탭 사이 빈 곳은 그대로 창 이동 영역
 */

import { ICON_CLOSE, icon } from "./icons";

export interface TabItem {
  id: number;
  /** 탭에 보일 이름 (파일 이름) */
  name: string;
  /** 툴팁 — 전체 경로 */
  title: string;
  dirty: boolean;
}

export interface TabStripHooks {
  activate(id: number): void;
  close(id: number): void;
  menu(id: number, event: MouseEvent): void;
  /** `id` 탭을 `index` 자리로 옮겼다 (끌어서 놓기) */
  move(id: number, index: number): void;
}

export interface TabStrip {
  render(tabs: readonly TabItem[], activeId: number | null): void;
}

/** 이만큼 움직여야 끌기로 본다 — 그 전에는 누르기 */
const DRAG_THRESHOLD = 5;

export function initTabStrip(host: HTMLElement, hooks: TabStripHooks): TabStrip {
  let items: readonly TabItem[] = [];
  let active: number | null = null;

  function tabElement(item: TabItem): HTMLElement {
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.setAttribute("role", "tab");
    tab.dataset.id = String(item.id);
    tab.title = item.dirty ? `${item.title}\n저장하지 않은 변경이 있습니다` : item.title;
    const selected = item.id === active;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;

    const name = document.createElement("span");
    name.className = "tab-name";
    name.textContent = item.name;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "tab-close icon-btn small";
    close.tabIndex = -1;
    close.title = "닫기 (Ctrl+W)";
    close.setAttribute("aria-label", `${item.name} 닫기`);
    close.append(icon(ICON_CLOSE));
    // 저장하지 않은 탭은 닫기 자리에 점을 보이고, 올리면 ×로 바뀐다 (VS Code와 같은 자리)
    tab.classList.toggle("dirty", item.dirty);

    tab.append(name, close);
    return tab;
  }

  function render(next: readonly TabItem[], activeId: number | null): void {
    items = next;
    active = activeId;
    host.replaceChildren(...items.map(tabElement));
    host.classList.toggle("empty", items.length === 0);
    const current = host.querySelector<HTMLElement>(".tab[aria-selected='true']");
    current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  const idOf = (target: EventTarget | null): number | null => {
    const tab = (target as Element | null)?.closest<HTMLElement>(".tab");
    return tab ? Number(tab.dataset.id) : null;
  };

  // ---- 누르기·끌기 -----------------------------------------------------------------

  let drag: { id: number; startX: number; el: HTMLElement; moved: boolean; pointer: number } | null = null;

  host.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const id = idOf(event.target);
    if (id === null) return;
    if ((event.target as Element).closest(".tab-close")) return;
    const el = (event.target as Element).closest<HTMLElement>(".tab")!;
    hooks.activate(id);
    drag = { id, startX: event.clientX, el: host.querySelector(`.tab[data-id="${id}"]`) ?? el, moved: false, pointer: event.pointerId };
  });

  host.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved) {
      if (Math.abs(event.clientX - drag.startX) < DRAG_THRESHOLD) return;
      drag.moved = true;
      drag.el = host.querySelector(`.tab[data-id="${drag.id}"]`) ?? drag.el;
      drag.el.classList.add("dragging");
      try {
        host.setPointerCapture(event.pointerId);
      } catch {
        // 이미 끝난 포인터 — 캡처 없이 이어 간다
      }
    }
    // 포인터가 이웃 탭의 가운데를 넘으면 그 자리로 옮긴다
    const tabs = Array.from(host.querySelectorAll<HTMLElement>(".tab"));
    const from = tabs.indexOf(drag.el);
    let to = from;
    for (let i = 0; i < tabs.length; i++) {
      const r = tabs[i].getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (i < from && event.clientX < mid) {
        to = i;
        break;
      }
      if (i > from && event.clientX > mid) to = i;
    }
    if (to !== from) {
      if (to < from) tabs[to].before(drag.el);
      else tabs[to].after(drag.el);
    }
  });

  const endDrag = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { id, el, moved } = drag;
    drag = null;
    el.classList.remove("dragging");
    if (!moved) return;
    const index = Array.from(host.querySelectorAll(".tab")).indexOf(el);
    hooks.move(id, index);
  };
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);

  host.addEventListener("click", (event) => {
    const close = (event.target as Element).closest(".tab-close");
    const id = idOf(event.target);
    if (close && id !== null) hooks.close(id);
  });

  // 가운데 버튼으로 닫기 — mousedown에서 막아야 자동 스크롤 커서가 안 뜬다
  host.addEventListener("mousedown", (event) => {
    if (event.button === 1) event.preventDefault();
  });
  host.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;
    const id = idOf(event.target);
    if (id !== null) {
      event.preventDefault();
      hooks.close(id);
    }
  });

  host.addEventListener("contextmenu", (event) => {
    const id = idOf(event.target);
    if (id !== null) hooks.menu(id, event);
  });

  // 세로 휠을 가로 스크롤로
  host.addEventListener(
    "wheel",
    (event) => {
      if (event.deltaY === 0 || host.scrollWidth <= host.clientWidth) return;
      event.preventDefault();
      host.scrollLeft += event.deltaY;
    },
    { passive: false },
  );

  // 키보드: 탭에 포커스가 있으면 ←→로 옮기고 Delete로 닫는다
  host.addEventListener("keydown", (event) => {
    const id = idOf(event.target);
    if (id === null) return;
    const i = items.findIndex((t) => t.id === id);
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step !== 0 && items.length > 1) {
      event.preventDefault();
      const next = items[(i + step + items.length) % items.length];
      hooks.activate(next.id);
      host.querySelector<HTMLElement>(`.tab[data-id="${next.id}"]`)?.focus();
    } else if (event.key === "Delete") {
      event.preventDefault();
      hooks.close(id);
    }
  });

  return { render };
}
