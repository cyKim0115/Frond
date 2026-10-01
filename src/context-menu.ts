/**
 * 오른쪽 클릭 메뉴 — 네이티브 메뉴 대신 popover로 그려 테마·다크 모드를 따른다 (dialog.ts와 같은 이유).
 * popover="auto"라 바깥 클릭·Esc는 브라우저가 닫는다. 항목은 부를 때마다 새로 만든다.
 */

export interface MenuItem {
  label: string;
  action: () => void;
}

const menu = document.querySelector<HTMLElement>("#context-menu")!;
/** 열기 전 포커스 — 메뉴 안에서 닫히면(Esc·항목 선택) 돌려준다 */
let returnFocus: HTMLElement | null = null;

const items = (): HTMLButtonElement[] => Array.from(menu.querySelectorAll("button"));

function hide(): void {
  menu.hidePopover();
}

export function showContextMenu(event: MouseEvent, entries: MenuItem[]): void {
  event.preventDefault();
  hide();
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  menu.replaceChildren(
    ...entries.map(({ label, action }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.textContent = label;
      b.addEventListener("click", () => {
        hide();
        action();
      });
      return b;
    }),
  );
  menu.showPopover();
  // 창 밖으로 넘치면 커서 반대쪽으로 편다
  const { width, height } = menu.getBoundingClientRect();
  const x = event.clientX + width > innerWidth ? event.clientX - width : event.clientX;
  const y = event.clientY + height > innerHeight ? event.clientY - height : event.clientY;
  menu.style.left = `${Math.max(0, x)}px`;
  menu.style.top = `${Math.max(0, y)}px`;
  items()[0]?.focus();
}

menu.addEventListener("beforetoggle", (event) => {
  if ((event as ToggleEvent).newState === "closed" && menu.contains(document.activeElement)) returnFocus?.focus();
});

menu.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    hide();
    return;
  }
  const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
  if (step === 0) return;
  event.preventDefault();
  const list = items();
  const i = list.indexOf(document.activeElement as HTMLButtonElement);
  list[(i + step + list.length) % list.length]?.focus();
});

// 네이티브 메뉴처럼 창이 포커스를 잃거나 크기·스크롤이 바뀌면 닫는다 (탐색기가 뜰 때 등)
window.addEventListener("blur", hide);
window.addEventListener("resize", hide);
document.addEventListener("scroll", hide, true);
