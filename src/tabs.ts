/**
 * 탭 띠 (로드맵 3-1) — 제목 표시줄 가운데에 열린 문서를 탭으로 보인다. 문서 상태는 main.ts가 갖고, 여기는 그리기와 입력만 한다.
 *
 * - 누르면 활성, 가운데 버튼·닫기(×)·Ctrl+W로 닫기, 오른쪽 클릭 메뉴는 main.ts가 채운다
 * - 끌어서 순서 바꾸기: 끄는 탭은 커서를 따라오고 이웃 탭이 비켜 미끄러진다. 놓으면 새 자리로 미끄러져 들어간다
 * - 다시 그릴 때 탭 요소를 id로 재사용한다 — 누르는 중인 탭을 문서에서 떼면 브라우저가 mousedown을 띠(#tabs)로 보내
 *   제목 표시줄(titlebar.ts)이 빈 곳 누르기로 보고 창 이동을 시작하고, 그 사이 pointerup을 놓쳐 끌기가 풀리지 않았다
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

    const name = document.createElement("span");
    name.className = "tab-name";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "tab-close icon-btn small";
    close.tabIndex = -1;
    close.title = "닫기 (Ctrl+W)";
    close.append(icon(ICON_CLOSE));

    tab.append(name, close);
    return tab;
  }

  function updateTab(tab: HTMLElement, item: TabItem): void {
    tab.title = item.dirty ? `${item.title}\n저장하지 않은 변경이 있습니다` : item.title;
    const selected = item.id === active;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.querySelector(".tab-name")!.textContent = item.name;
    tab.querySelector(".tab-close")!.setAttribute("aria-label", `${item.name} 닫기`);
    // 저장하지 않은 탭은 닫기 자리에 점을 보이고, 올리면 ×로 바뀐다 (VS Code와 같은 자리)
    tab.classList.toggle("dirty", item.dirty);
  }

  function render(next: readonly TabItem[], activeId: number | null): void {
    items = next;
    active = activeId;
    const old = new Map<number, HTMLElement>();
    for (const el of host.querySelectorAll<HTMLElement>(".tab")) old.set(Number(el.dataset.id), el);
    const els = items.map((item) => {
      const el = old.get(item.id) ?? tabElement(item);
      old.delete(item.id);
      updateTab(el, item);
      return el;
    });
    for (const el of old.values()) el.remove();
    // 자리가 다른 것만 옮긴다 — 순서가 그대로면 DOM을 건드리지 않는다
    els.forEach((el, i) => {
      if (host.children[i] !== el) host.insertBefore(el, host.children[i] ?? null);
    });
    host.classList.toggle("empty", items.length === 0);
    const current = host.querySelector<HTMLElement>(".tab[aria-selected='true']");
    current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  const idOf = (target: EventTarget | null): number | null => {
    const tab = (target as Element | null)?.closest<HTMLElement>(".tab");
    return tab ? Number(tab.dataset.id) : null;
  };

  // ---- 누르기·끌기 -----------------------------------------------------------------
  //
  // 끄는 동안 DOM 순서는 그대로 두고 transform으로만 움직인다(끄는 탭 = 커서, 이웃 = 한 칸 비킴, CSS transition).
  // 놓으면 순서를 확정(hooks.move → render)하고, 보이던 자리에서 새 자리로 미끄러지게 한다(FLIP)

  interface Drag {
    id: number;
    el: HTMLElement;
    pointer: number;
    startX: number;
    startScroll: number;
    moved: boolean;
    /** 끌기 시작 때의 탭들과 그 자리(띠 안 레이아웃 좌표 — transform·스크롤과 무관) */
    tabs: HTMLElement[];
    slots: { left: number; width: number }[];
    from: number;
    to: number;
    /** 이웃이 비킬 거리 = 끄는 탭 폭 + 탭 사이 간격 */
    shift: number;
  }
  let drag: Drag | null = null;

  host.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const id = idOf(event.target);
    if (id === null) return;
    if ((event.target as Element).closest(".tab-close")) return;
    if (drag) finish(true);
    hooks.activate(id);
    const el = host.querySelector<HTMLElement>(`.tab[data-id="${id}"]`);
    if (!el) return;
    drag = {
      id,
      el,
      pointer: event.pointerId,
      startX: event.clientX,
      startScroll: host.scrollLeft,
      moved: false,
      tabs: [],
      slots: [],
      from: 0,
      to: 0,
      shift: 0,
    };
  });

  function startMoving(d: Drag): void {
    d.moved = true;
    d.tabs = Array.from(host.querySelectorAll<HTMLElement>(".tab"));
    d.from = d.to = d.tabs.indexOf(d.el);
    d.slots = d.tabs.map((t) => ({ left: t.offsetLeft, width: t.offsetWidth }));
    const gap = d.slots.length > 1 ? d.slots[1].left - (d.slots[0].left + d.slots[0].width) : 0;
    d.shift = d.from < 0 ? 0 : d.slots[d.from].width + gap;
    host.classList.add("reordering");
    d.el.classList.add("dragging");
  }

  host.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    // 버튼이 이미 떨어졌는데 pointerup을 못 받았으면(창 밖에서 놓기 등) 여기서 끝낸다 — 끌기가 커서에 붙어 남지 않게
    if ((event.buttons & 1) === 0) {
      finish(true);
      return;
    }
    const d = drag;
    if (!d.moved) {
      if (Math.abs(event.clientX - d.startX) < DRAG_THRESHOLD) return;
      startMoving(d);
      if (d.from < 0) {
        finish(false);
        return;
      }
      try {
        host.setPointerCapture(event.pointerId);
      } catch {
        // 이미 끝난 포인터 — 캡처 없이 이어 간다
      }
    }
    const s = d.slots;
    const me = s[d.from];
    const last = s[s.length - 1];
    // 띠 양 끝 밖으로는 안 나간다
    const dx = Math.min(
      Math.max(event.clientX - d.startX + host.scrollLeft - d.startScroll, s[0].left - me.left),
      last.left + last.width - (me.left + me.width),
    );
    d.el.style.transform = `translateX(${dx}px)`;
    // 끄는 탭 가운데가 이웃 가운데를 넘으면 그 이웃이 한 칸 비킨다
    const center = me.left + me.width / 2 + dx;
    let to = d.from;
    d.tabs.forEach((t, i) => {
      if (i === d.from) return;
      const mid = s[i].left + s[i].width / 2;
      let offset = 0;
      if (i < d.from && center < mid) {
        offset = d.shift;
        to--;
      } else if (i > d.from && center > mid) {
        offset = -d.shift;
        to++;
      }
      t.style.transform = offset ? `translateX(${offset}px)` : "";
    });
    d.to = to;
  });

  /** 끌기를 끝낸다. `commit`이면 새 순서를 확정하고, 보이던 자리에서 제자리로 미끄러지게 한다 */
  function finish(commit: boolean): void {
    const d = drag;
    drag = null;
    if (!d || !d.moved) return;
    const before = new Map(d.tabs.map((t) => [t, t.getBoundingClientRect().left]));
    host.classList.remove("reordering");
    d.el.classList.remove("dragging");
    for (const t of d.tabs) t.style.transform = "";
    if (commit && d.from >= 0 && d.to !== d.from) hooks.move(d.id, d.to);
    // FLIP: 새 레이아웃 자리에서 보이던 자리만큼 되돌려 놓고, 다음 그림에서 transition으로 0까지
    const moving: HTMLElement[] = [];
    for (const t of d.tabs) {
      if (!t.isConnected) continue;
      const delta = before.get(t)! - t.getBoundingClientRect().left;
      if (Math.abs(delta) < 0.5) continue;
      t.style.transition = "none";
      t.style.transform = `translateX(${delta}px)`;
      moving.push(t);
    }
    if (moving.length === 0) return;
    d.el.classList.add("settling");
    void host.offsetWidth;
    for (const t of moving) {
      t.style.transition = "";
      t.style.transform = "";
    }
    const done = (): void => d.el.classList.remove("settling");
    d.el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 400);
  }

  const endDrag = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointer) return;
    finish(event.type === "pointerup");
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
