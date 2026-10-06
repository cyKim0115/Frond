import { describe, expect, it } from "vitest";
import { addInbox, INBOX_LIMIT, type InboxEntry, loadInbox, markInboxRead, removeInbox, retitleInbox, saveInbox, unreadCount } from "./inbox";

const entry = (path: string, at = 1, read = false): InboxEntry => ({ path, source: "claude", at, read });

describe("AI 훅 받은 목록 (로드맵 3-6)", () => {
  it("새것을 앞에 넣고, 같은 경로(대소문자 무시)가 다시 오면 맨 앞으로 옮겨 안 읽음이 된다", () => {
    let list = addInbox([], entry("C:\\a.md", 1));
    list = addInbox(list, entry("C:\\b.md", 2));
    list = markInboxRead(list, "C:\\A.md");
    expect(unreadCount(list)).toBe(1);
    list = addInbox(list, entry("c:\\a.md", 3));
    expect(list.map((e) => [e.path, e.read])).toEqual([
      ["c:\\a.md", false],
      ["C:\\b.md", false],
    ]);
  });

  it("상한을 넘으면 오래된 것부터 버린다", () => {
    let list: InboxEntry[] = [];
    for (let i = 0; i < INBOX_LIMIT + 5; i++) list = addInbox(list, entry(`C:\\${i}.md`, i));
    expect(list).toHaveLength(INBOX_LIMIT);
    expect(list[0].path).toBe(`C:\\${INBOX_LIMIT + 4}.md`);
  });

  it("읽음·제목·빼기", () => {
    let list = [entry("C:\\a.md"), entry("C:\\b.md")];
    list = retitleInbox(list, "C:\\a.md", "제목");
    list = markInboxRead(list, "C:\\a.md");
    expect(list[0]).toEqual({ path: "C:\\a.md", source: "claude", at: 1, read: true, title: "제목" });
    expect(removeInbox(list, "C:\\B.md").map((e) => e.path)).toEqual(["C:\\a.md"]);
    expect(retitleInbox(list, "C:\\a.md", undefined)[0].title).toBeUndefined();
  });

  it("저장본의 깨진 항목은 버리고 출처가 없으면 ai", () => {
    saveInbox([entry("C:\\a.md")]);
    localStorage.setItem("mdeditor.inbox", JSON.stringify([{ path: "C:\\a.md", at: 5 }, { path: 3 }, "x", { path: "C:\\b.md", at: 1, read: true, source: "codex" }]));
    expect(loadInbox()).toEqual([
      { path: "C:\\a.md", source: "ai", at: 5, read: false },
      { path: "C:\\b.md", source: "codex", at: 1, read: true },
    ]);
  });
});
