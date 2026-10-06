/**
 * 탐색 영역 '새 문서' 탭 (로드맵 3-6) — AI 훅이 만든 문서 받은 목록. 목록 모델은 inbox.ts.
 * 안 읽은 수는 탭 아이콘 배지와 상태바 '새 문서 n'에 보인다. 누르면 열고(탭) 읽음으로 바꾼다.
 * 오른쪽 클릭: 파일 위치 열기·목록에서 빼기. 머리의 버튼으로 모두 지우기.
 */

import { showContextMenu } from "./context-menu";
import { showDialog } from "./dialog";
import { ICON_CLOSE, icon } from "./icons";
import { addInbox, type InboxEntry, loadInbox, markInboxRead, removeInbox, retitleInbox, saveInbox, sourceLabel, unreadCount } from "./inbox";
import { splitPath } from "./recent";

export interface InboxHooks {
  open(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  reveal(path: string): Promise<void>;
  /** 문서 제목을 읽는다 (없으면 undefined) */
  title(path: string): Promise<string | undefined>;
  /** 상태바 '새 문서' — 탐색 영역을 열고 이 탭을 고른다 */
  show(): void;
}

export interface InboxPanel {
  /** 훅이 넘긴 문서를 받는다. `read`면 이미 열어 본 것으로 둔다 */
  add(path: string, source: string, read: boolean): void;
  markRead(path: string): void;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

function span(className: string, text: string): HTMLSpanElement {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = text;
  return el;
}

/** 오늘이면 시:분, 아니면 월/일 시:분 */
function when(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  return d.toDateString() === new Date().toDateString() ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function initInboxPanel(hooks: InboxHooks): InboxPanel {
  const list = $<HTMLUListElement>("#inbox-list");
  const empty = $("#inbox-empty");
  const clearButton = $<HTMLButtonElement>("#inbox-clear");
  const badge = $("#inbox-badge");
  const status = $<HTMLButtonElement>("#status-inbox");

  let entries = loadInbox();

  function set(next: InboxEntry[]): void {
    entries = next;
    saveInbox(entries);
    render();
  }

  function render(): void {
    list.replaceChildren(
      ...entries.map((entry) => {
        const { name, dir } = splitPath(entry.path);
        const li = document.createElement("li");
        li.dataset.path = entry.path;
        li.classList.toggle("unread", !entry.read);

        const open = document.createElement("button");
        open.type = "button";
        open.className = "recent-open";
        open.title = `${entry.title ? `${entry.title}\n` : ""}${entry.path}\n${sourceLabel(entry.source)} · ${new Date(entry.at).toLocaleString("ko-KR")}${entry.read ? "" : "\n아직 열어 보지 않음"}`;
        const meta = span("meta", "");
        meta.append(span("name", entry.title ? name : `${sourceLabel(entry.source)} · ${when(entry.at)}`), span("dir", entry.title ? `${sourceLabel(entry.source)} · ${when(entry.at)}` : dir));
        open.append(span("title", entry.title ?? name), meta);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "recent-remove icon-btn small";
        remove.title = "목록에서 빼기";
        remove.setAttribute("aria-label", `${entry.title ?? name} 목록에서 빼기`);
        remove.append(icon(ICON_CLOSE));

        li.append(open, remove);
        return li;
      }),
    );
    empty.hidden = entries.length > 0;
    clearButton.disabled = entries.length === 0;
    const unread = unreadCount(entries);
    badge.hidden = unread === 0;
    badge.textContent = unread > 99 ? "99+" : String(unread);
    status.hidden = unread === 0;
    status.textContent = `새 문서 ${unread}`;
    status.title = `AI 훅이 만든 문서 중 아직 열어 보지 않은 것 ${unread}개 — 눌러서 목록 보기`;
  }

  async function ensureExists(path: string): Promise<boolean> {
    if (await hooks.exists(path)) return true;
    await showDialog({ title: "파일을 찾을 수 없습니다", message: "삭제되거나 이동된 파일입니다. 새 문서 목록에서 뺍니다.", detail: path });
    set(removeInbox(entries, path));
    return false;
  }

  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest("button");
    const path = button?.closest("li")?.dataset.path;
    if (!button || path === undefined) return;
    if (button.classList.contains("recent-remove")) {
      set(removeInbox(entries, path));
      return;
    }
    void ensureExists(path).then((ok) => {
      if (ok) void hooks.open(path);
    });
  });

  list.addEventListener("contextmenu", (event) => {
    const path = (event.target as Element).closest("li")?.dataset.path;
    if (path === undefined) return;
    showContextMenu(event, [
      {
        label: "파일 위치 열기",
        action: () =>
          void ensureExists(path).then((ok) => {
            if (ok) void hooks.reveal(path);
          }),
      },
      { label: "목록에서 빼기", action: () => set(removeInbox(entries, path)) },
    ]);
  });

  clearButton.addEventListener("click", async () => {
    const ok = await showDialog({
      title: "새 문서 목록 지우기",
      message: `목록의 ${entries.length}개 항목을 모두 지울까요? 파일 자체는 지워지지 않습니다.`,
      confirmLabel: "지우기",
      cancelLabel: "취소",
      danger: true,
    });
    if (ok) set([]);
  });

  status.addEventListener("click", () => hooks.show());

  render();

  return {
    add(path, source, read) {
      set(addInbox(entries, { path, source, at: Date.now(), read }));
      void hooks.title(path).then((title) => {
        if (title) set(retitleInbox(entries, path, title));
      });
    },
    markRead(path) {
      const next = markInboxRead(entries, path);
      if (unreadCount(next) !== unreadCount(entries)) set(next);
    },
  };
}
