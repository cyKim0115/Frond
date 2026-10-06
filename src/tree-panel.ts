/**
 * 탐색 영역 '폴더' 탭 (로드맵 3-2) — 폴더 트리. 목차(#sidebar)와 함께 보인다(Typora 최다 요구 T16·T23).
 *
 * - 루트: '폴더 열기…'로 고른 폴더, 고르지 않았으면 지금 문서의 폴더를 따라간다 — 다만 지금 루트 안의 문서로 옮겨 가면
 *   루트를 그대로 둔다(트리에서 하위 폴더 문서를 눌렀는데 트리가 그 폴더로 좁아지지 않게)
 * - 펼친 폴더만 백엔드(tree.rs `list_dir`)에서 읽는다(지연). 하위 폴더·마크다운 문서만 보인다(점 이름·숨김 속성 제외)
 * - 루트를 재귀로 감시해(`watch_tree`) 파일이 생기거나 사라지면 그 폴더만 다시 읽는다(`tree-changed`)
 * - 문서를 누르면 탭으로 연다. 지금 문서는 강조하고, 루트 안이면 위 폴더들을 펼쳐 보이게 한다
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { showContextMenu } from "./context-menu";
import { isString, readPref, writePref } from "./prefs";
import { samePath, splitPath } from "./recent";

interface TreeEntry {
  name: string;
  path: string;
  dir: boolean;
}

export interface TreeHooks {
  isTauri: boolean;
  open(path: string): Promise<void>;
  reveal(path: string): Promise<void>;
  copy(text: string): void;
}

export interface TreePanel {
  /** 활성 문서가 바뀌었다 (없으면 null) */
  setCurrent(path: string | null): void;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const SVG_NS = "http://www.w3.org/2000/svg";
const EXPANDED_LIMIT = 300;

const lower = (p: string): string => p.toLowerCase();
/** `path`가 `dir` 안(하위 포함)인지 — Windows 경로라 대소문자를 가리지 않는다 */
function inside(dir: string, path: string): boolean {
  const base = lower(dir).replace(/[\\/]+$/, "");
  const p = lower(path);
  return p.startsWith(`${base}\\`) || p.startsWith(`${base}/`);
}

function svg(d: string): SVGSVGElement {
  const el = document.createElementNS(SVG_NS, "svg");
  el.setAttribute("viewBox", "0 0 16 16");
  el.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  el.append(path);
  return el;
}
const ICON_CHEVRON = "M6 4l4 4-4 4";
const ICON_FOLDER = "M1.75 4.25a1 1 0 0 1 1-1h3.1l1.4 1.5h6a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z";
const ICON_DOC = "M4.25 1.75h5l2.5 2.5v9a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-10.5a1 1 0 0 1 1-1zM9.25 1.75v2.5h2.5M5.5 8h5M5.5 10.5h5";

export function initTreePanel(hooks: TreeHooks): TreePanel {
  const list = $<HTMLUListElement>("#tree-list");
  const empty = $("#tree-empty");
  const title = $("#tree-root-name");
  const pickButton = $<HTMLButtonElement>("#tree-pick");
  const followButton = $<HTMLButtonElement>("#tree-follow");

  /** 고른 루트 — null이면 지금 문서 폴더를 따라간다 */
  let pinned: string | null = readPref<string | null>("treeRoot", null, (v): v is string | null => v === null || isString(v));
  let current: string | null = null;
  let root: string | null = null;
  let watched: string | null = null;
  const expanded = new Set<string>(readPref<string[]>("treeExpanded", [], (v): v is string[] => Array.isArray(v) && v.every(isString)).map(lower));
  const children = new Map<string, TreeEntry[]>();
  const loading = new Map<string, Promise<TreeEntry[]>>();

  function saveExpanded(): void {
    writePref("treeExpanded", Array.from(expanded).slice(-EXPANDED_LIMIT));
  }

  async function load(dir: string, fresh = false): Promise<TreeEntry[]> {
    const key = lower(dir);
    if (!fresh) {
      const cached = children.get(key);
      if (cached) return cached;
      const pending = loading.get(key);
      if (pending) return pending;
    }
    const job = (hooks.isTauri ? invoke<TreeEntry[]>("list_dir", { path: dir }) : Promise.resolve<TreeEntry[]>([]))
      .catch(() => [] as TreeEntry[])
      .then((entries) => {
        children.set(key, entries);
        loading.delete(key);
        return entries;
      });
    loading.set(key, job);
    return job;
  }

  function row(entry: TreeEntry, depth: number): HTMLLIElement {
    const li = document.createElement("li");
    li.dataset.path = entry.path;
    li.dataset.dir = String(entry.dir);
    li.dataset.depth = String(depth);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tree-row";
    button.style.paddingLeft = `${6 + depth * 14}px`;
    button.title = entry.path;
    const open = entry.dir && expanded.has(lower(entry.path));
    if (entry.dir) {
      button.setAttribute("aria-expanded", String(open));
      const chevron = svg(ICON_CHEVRON);
      chevron.classList.add("tree-chevron");
      button.append(chevron);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "tree-chevron";
      button.append(spacer);
    }
    const icon = svg(entry.dir ? ICON_FOLDER : ICON_DOC);
    icon.classList.add("tree-icon");
    const name = document.createElement("span");
    name.className = "tree-name";
    name.textContent = entry.name;
    button.append(icon, name);
    if (!entry.dir && current && samePath(entry.path, current)) button.setAttribute("aria-current", "true");
    li.append(button);
    if (open) {
      const ul = document.createElement("ul");
      li.append(ul);
      void fill(ul, entry.path, depth + 1);
    }
    return li;
  }

  async function fill(ul: HTMLUListElement, dir: string, depth: number): Promise<void> {
    const entries = await load(dir);
    if (!ul.isConnected) return;
    ul.replaceChildren(...entries.map((e) => row(e, depth)));
  }

  async function render(): Promise<void> {
    if (!root) {
      title.textContent = "폴더";
      title.title = "";
      list.replaceChildren();
      empty.hidden = false;
      empty.textContent = "문서를 열거나 '폴더 열기…'로 볼 폴더를 고르세요.";
      followButton.hidden = true;
      return;
    }
    const { name } = splitPath(root);
    title.textContent = name || root;
    title.title = pinned ? `${root}\n고른 폴더` : `${root}\n지금 문서의 폴더`;
    followButton.hidden = pinned === null;
    const entries = await load(root);
    list.replaceChildren(...entries.map((e) => row(e, 0)));
    empty.hidden = entries.length > 0;
    empty.textContent = "이 폴더에는 마크다운 문서가 없습니다.";
  }

  async function setRoot(next: string | null): Promise<void> {
    if (next && root && samePath(next, root)) return;
    root = next;
    if (hooks.isTauri && root !== watched) {
      watched = root;
      if (root) void invoke("watch_tree", { root }).catch(() => undefined);
      else void invoke("unwatch_tree").catch(() => undefined);
    }
    await revealCurrent();
    await render();
  }

  /** 지금 문서가 루트 안이면 위 폴더들을 펼친다 */
  async function revealCurrent(): Promise<void> {
    if (!root || !current || !inside(root, current)) return;
    let dir = splitPath(current).dir;
    const chain: string[] = [];
    while (dir && inside(root, dir)) {
      chain.unshift(dir);
      dir = splitPath(dir).dir;
    }
    let changed = false;
    for (const d of chain) {
      if (!expanded.has(lower(d))) {
        expanded.add(lower(d));
        changed = true;
      }
    }
    if (changed) saveExpanded();
  }

  function markCurrent(): void {
    for (const b of list.querySelectorAll<HTMLElement>(".tree-row[aria-current]")) b.removeAttribute("aria-current");
    if (!current) return;
    for (const li of list.querySelectorAll<HTMLElement>("li[data-dir='false']")) {
      if (samePath(li.dataset.path!, current)) {
        const b = li.querySelector<HTMLElement>(".tree-row")!;
        b.setAttribute("aria-current", "true");
        b.scrollIntoView({ block: "nearest" });
      }
    }
  }

  function toggle(li: HTMLElement): void {
    const path = li.dataset.path!;
    const key = lower(path);
    const button = li.querySelector<HTMLElement>(":scope > .tree-row")!;
    if (expanded.has(key)) {
      expanded.delete(key);
      li.querySelector(":scope > ul")?.remove();
      button.setAttribute("aria-expanded", "false");
    } else {
      expanded.add(key);
      button.setAttribute("aria-expanded", "true");
      const ul = document.createElement("ul");
      li.append(ul);
      void fill(ul, path, Number(li.dataset.depth) + 1);
    }
    saveExpanded();
  }

  list.addEventListener("click", (event) => {
    const li = (event.target as Element).closest<HTMLElement>("li[data-path]");
    if (!li) return;
    if (li.dataset.dir === "true") toggle(li);
    else void hooks.open(li.dataset.path!);
  });

  list.addEventListener("contextmenu", (event) => {
    const li = (event.target as Element).closest<HTMLElement>("li[data-path]");
    if (!li) return;
    const path = li.dataset.path!;
    const dir = li.dataset.dir === "true";
    showContextMenu(event, [
      ...(dir
        ? [{ label: "이 폴더를 트리 맨 위로", action: () => void pin(path) }]
        : [{ label: "열기", action: () => void hooks.open(path) }]),
      { label: dir ? "탐색기에서 보기" : "파일 위치 열기", action: () => void hooks.reveal(path) },
      { label: "경로 복사", action: () => hooks.copy(path) },
    ]);
  });

  async function pin(path: string | null): Promise<void> {
    pinned = path;
    writePref("treeRoot", pinned);
    await setRoot(pinned ?? (current ? splitPath(current).dir : null));
  }

  pickButton.addEventListener("click", async () => {
    if (!hooks.isTauri) return;
    const picked = await openDialog({ directory: true, multiple: false, defaultPath: root ?? undefined });
    if (typeof picked === "string") await pin(picked);
  });
  followButton.addEventListener("click", () => void pin(null));

  if (hooks.isTauri) {
    // 목록이 바뀐 폴더만 다시 읽는다 — 펼쳐 둔(그려진) 폴더면 그 자리만 다시 그린다
    void listen<string[]>("tree-changed", (event) => {
      void (async () => {
        for (const dir of event.payload) {
          const key = lower(dir);
          if (!children.has(key)) continue;
          await load(dir, true);
          if (root && samePath(dir, root)) {
            await render();
            continue;
          }
          const li = Array.from(list.querySelectorAll<HTMLElement>("li[data-dir='true']")).find((el) => samePath(el.dataset.path!, dir));
          const ul = li?.querySelector<HTMLUListElement>(":scope > ul");
          if (li && ul) await fill(ul, dir, Number(li.dataset.depth) + 1);
        }
        markCurrent();
      })();
    });
  }

  void setRoot(pinned);

  return {
    setCurrent(path) {
      current = path;
      if (pinned === null && !(root && path && inside(root, path))) {
        void setRoot(path ? splitPath(path).dir : null).then(markCurrent);
        return;
      }
      void revealCurrent()
        .then(() => render())
        .then(markCurrent);
    },
  };
}
