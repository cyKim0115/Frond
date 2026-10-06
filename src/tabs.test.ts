import { describe, expect, it, vi } from "vitest";
import { initTabStrip, type TabItem } from "./tabs";

// jsdom에는 없다
Element.prototype.scrollIntoView ??= () => {};

const items = (...ids: number[]): TabItem[] => ids.map((id) => ({ id, name: `${id}.md`, title: `C:\\docs\\${id}.md`, dirty: false }));

function setup() {
  const host = document.createElement("div");
  document.body.append(host);
  let list = items(1, 2, 3);
  let active = 1;
  const hooks = {
    activate: vi.fn((id: number) => {
      active = id;
      strip.render(list, active);
    }),
    close: vi.fn(),
    menu: vi.fn(),
    move: vi.fn((id: number, index: number) => {
      const tab = list.find((t) => t.id === id)!;
      list = list.filter((t) => t !== tab);
      list.splice(index, 0, tab);
      strip.render(list, active);
    }),
  };
  const strip = initTabStrip(host, hooks);
  strip.render(list, active);
  const tab = (id: number) => host.querySelector<HTMLElement>(`.tab[data-id="${id}"]`)!;
  const pointer = (type: string, target: Element, clientX: number, buttons: number) =>
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons, clientX }));
  return { host, hooks, tab, pointer, strip, setList: (next: TabItem[]) => (list = next) };
}

describe("탭 띠", () => {
  it("다시 그려도 탭 요소를 id로 재사용하고, 순서가 같으면 옮기지 않는다", () => {
    const { host, tab, strip } = setup();
    const two = tab(2);
    const observer = new MutationObserver(() => {});
    observer.observe(host, { childList: true });
    strip.render(items(1, 2, 3), 2);
    expect(observer.takeRecords()).toHaveLength(0);
    expect(tab(2)).toBe(two);
    expect(two.getAttribute("aria-selected")).toBe("true");
    expect(tab(1).getAttribute("aria-selected")).toBe("false");
    strip.render(items(3, 1, 2), 2);
    expect(Array.from(host.children).map((el) => (el as HTMLElement).dataset.id)).toEqual(["3", "1", "2"]);
    expect(tab(2)).toBe(two);
    strip.render(items(3, 2), 2);
    expect(host.querySelectorAll(".tab")).toHaveLength(2);
  });

  it("누른 탭은 활성이 돼도 문서에 붙어 있다 — 떨어지면 mousedown이 띠로 가서 제목 표시줄이 창 이동을 시작했다", () => {
    const { hooks, tab, pointer } = setup();
    const two = tab(2);
    const name = two.querySelector(".tab-name")!;
    pointer("pointerdown", name, 100, 1);
    expect(hooks.activate).toHaveBeenCalledWith(2);
    expect(name.isConnected).toBe(true);
    expect(name.closest("[role='tab']")).toBe(two);
    pointer("pointerup", name, 100, 0);
  });

  it("맨 앞·맨 뒤로도 옮긴다 — 띠 끝에 닿으면 끝 탭을 넘은 것으로 본다", () => {
    const { host, hooks, tab, pointer } = setup();
    // jsdom에는 레이아웃이 없다 — 폭 100, 간격 0으로 놓인 것처럼
    const layout = () =>
      host.querySelectorAll<HTMLElement>(".tab").forEach((el, i) => {
        Object.defineProperty(el, "offsetLeft", { configurable: true, value: i * 100 });
        Object.defineProperty(el, "offsetWidth", { configurable: true, value: 100 });
      });
    const order = () => Array.from(host.querySelectorAll<HTMLElement>(".tab")).map((el) => el.dataset.id);
    layout();
    pointer("pointerdown", tab(2), 150, 1);
    pointer("pointermove", tab(2), 120, 1);
    pointer("pointermove", tab(2), -500, 1);
    pointer("pointerup", tab(2), -500, 0);
    expect(hooks.move).toHaveBeenLastCalledWith(2, 0);
    expect(order()).toEqual(["2", "1", "3"]);
    layout();
    pointer("pointerdown", tab(2), 50, 1);
    pointer("pointermove", tab(2), 80, 1);
    pointer("pointermove", tab(2), 900, 1);
    pointer("pointerup", tab(2), 900, 0);
    expect(hooks.move).toHaveBeenLastCalledWith(2, 2);
    expect(order()).toEqual(["1", "3", "2"]);
  });

  it("버튼이 떨어진 채 움직이면(pointerup을 놓침) 끌기를 끝내고 다시 따라붙지 않는다", () => {
    const { host, tab, pointer } = setup();
    const two = tab(2);
    pointer("pointerdown", two, 100, 1);
    pointer("pointermove", two, 130, 1);
    expect(host.classList.contains("reordering")).toBe(true);
    expect(two.classList.contains("dragging")).toBe(true);
    pointer("pointermove", two, 160, 0);
    expect(host.classList.contains("reordering")).toBe(false);
    expect(two.classList.contains("dragging")).toBe(false);
    pointer("pointermove", two, 200, 0);
    expect(two.classList.contains("dragging")).toBe(false);
    expect(two.style.transform).toBe("");
  });
});
