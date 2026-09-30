/**
 * 왼쪽 탐색 영역 — 제목 표시줄 왼쪽 끝의 토글 버튼(Ctrl+Shift+E)으로 열고 닫는다. 폭 애니메이션은 CSS(style.css).
 * 머리 띠의 정사각형 탭으로 패널을 고른다. 지금은 '최근 파일' 탭 하나.
 */

import { showDialog } from "./dialog";
import { ICON_CLOSE, icon } from "./icons";
import { isBoolean, isString, readPref, writePref } from "./prefs";
import { loadRecent, pushRecent, type RecentEntry, removeRecent, retitleRecent, samePath, saveRecent, splitPath } from "./recent";
import { getSetting, onSettingChange } from "./settings";

export interface NavHooks {
  /** 목록에서 고른 파일을 연다 */
  open(path: string): Promise<void>;
  /** 열기 전에 파일이 아직 있는지 확인한다 */
  exists(path: string): Promise<boolean>;
}

export interface Nav {
  /** 문서를 새로 열었을 때 — 최근 목록 맨 앞에 넣고 현재 파일로 표시 */
  remember(path: string, title?: string): void;
  /** 같은 문서를 다시 읽었을 때(F5·외부 변경) — 순서는 두고 제목만 갱신 */
  retitle(path: string, title?: string): void;
  toggle(): void;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export function initNav(hooks: NavHooks): Nav {
  const app = $("#app");
  const nav = $("#nav");
  const toggleButton = $<HTMLButtonElement>("#nav-toggle");
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>("#nav-tabs [role='tab']"));
  const list = $<HTMLUListElement>("#recent-list");
  const empty = $("#recent-empty");
  const clearButton = $<HTMLButtonElement>("#recent-clear");

  let recent = loadRecent();
  let currentPath: string | null = null;

  // ---- 열기·닫기 ----------------------------------------------------------

  function setOpen(open: boolean): void {
    app.dataset.nav = open ? "open" : "closed";
    nav.inert = !open;
    toggleButton.setAttribute("aria-expanded", String(open));
    toggleButton.title = `탐색 영역 ${open ? "닫기" : "열기"} (Ctrl+Shift+E)`;
    writePref("navOpen", open);
  }
  const toggle = (): void => setOpen(app.dataset.nav !== "open");
  toggleButton.addEventListener("click", toggle);

  // ---- 탭 ---------------------------------------------------------------------

  function selectTab(name: string): void {
    const tab = tabs.find((t) => t.dataset.tab === name) ?? tabs[0];
    for (const t of tabs) {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")!)!.hidden = !selected;
    }
    writePref("navTab", tab.dataset.tab);
  }
  for (const t of tabs) t.addEventListener("click", () => selectTab(t.dataset.tab!));

  // ---- 최근 파일 ---------------------------------------------------------------

  function setRecent(next: RecentEntry[]): void {
    recent = next;
    saveRecent(recent);
    renderRecent();
  }

  /** 설정 개수만 보인다. 줄였다 늘려도 잃지 않도록 저장본은 다음 열기 때 자른다 */
  const visible = (): RecentEntry[] => recent.slice(0, getSetting("recentMax"));

  function span(className: string, text: string): HTMLSpanElement {
    const el = document.createElement("span");
    el.className = className;
    el.textContent = text;
    return el;
  }

  function renderRecent(): void {
    const shown = visible();
    list.replaceChildren(
      ...shown.map(({ path, title }) => {
        const { name, dir } = splitPath(path);
        const li = document.createElement("li");
        li.dataset.path = path;

        const open = document.createElement("button");
        open.type = "button";
        open.className = "recent-open";
        open.title = title ? `${title}\n${path}` : path;
        if (currentPath && samePath(path, currentPath)) open.setAttribute("aria-current", "true");
        // 두 줄 — 제목이 있으면 [제목] / [파일 이름 폴더], 없으면 [파일 이름] / [폴더]. 첫 줄이 현재 파일 강조를 받는다
        if (title) {
          const meta = span("meta", "");
          meta.append(span("name", name), span("dir", dir));
          open.append(span("title", title), meta);
        } else {
          open.append(span("name", name), span("dir", dir));
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "recent-remove icon-btn small";
        remove.title = "목록에서 제거";
        remove.setAttribute("aria-label", `${title ?? name} 목록에서 제거`);
        remove.append(icon(ICON_CLOSE));

        li.append(open, remove);
        return li;
      }),
    );
    empty.hidden = shown.length > 0;
    clearButton.disabled = shown.length === 0;
  }

  async function openRecent(path: string): Promise<void> {
    if (await hooks.exists(path)) {
      await hooks.open(path);
      return;
    }
    await showDialog({
      title: "파일을 찾을 수 없습니다",
      message: "삭제되거나 이동된 파일입니다. 최근 파일 목록에서 제거합니다.",
      detail: path,
    });
    setRecent(removeRecent(recent, path));
  }

  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest("button");
    const path = button?.closest("li")?.dataset.path;
    if (!button || path === undefined) return;
    if (button.classList.contains("recent-remove")) setRecent(removeRecent(recent, path));
    else void openRecent(path);
  });

  clearButton.addEventListener("click", async () => {
    const ok = await showDialog({
      title: "최근 파일 전체 지우기",
      message: `목록의 ${visible().length}개 항목을 모두 지울까요? 파일 자체는 지워지지 않습니다.`,
      confirmLabel: "지우기",
      cancelLabel: "취소",
      danger: true,
    });
    if (ok) setRecent([]);
  });

  // ---- 시작 상태 ---------------------------------------------------------------

  selectTab(readPref("navTab", "recent", isString));
  setOpen(readPref("navOpen", false, isBoolean));
  renderRecent();
  onSettingChange((key) => {
    if (key === "recentMax") renderRecent();
  });

  return {
    remember(path, title) {
      currentPath = path;
      setRecent(pushRecent(recent, title ? { path, title } : { path }, getSetting("recentMax")));
    },
    retitle(path, title) {
      setRecent(retitleRecent(recent, path, title));
    },
    toggle,
  };
}
