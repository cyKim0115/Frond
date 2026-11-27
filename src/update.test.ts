import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkDue,
  EMPTY_PREFS,
  failureMessage,
  type FoundUpdate,
  type Handoff,
  handoffFresh,
  isHandoff,
  isNewer,
  isUpdatePrefs,
  notesPreview,
  parseHandoff,
  pillLevel,
  readUpdatePrefs,
  recordSeen,
  shouldDownload,
  type StartupInput,
  startupPlan,
  UPDATE,
  Updater,
  type UpdaterApi,
  type UpdatePrefs,
  writeUpdatePrefs,
} from "./update";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const T0 = 1_800_000_000_000;

describe("checkDue", () => {
  it("처음·수동은 늘", () => {
    expect(checkDue(EMPTY_PREFS, T0, false)).toBe(true);
    const recent: UpdatePrefs = { ...EMPTY_PREFS, lastCheckAt: T0 - 1000, lastResult: "latest" };
    expect(checkDue(recent, T0, true)).toBe(true);
  });

  it("자동은 지난 확인 1시간 안이면 건너뛴다", () => {
    const p: UpdatePrefs = { ...EMPTY_PREFS, lastCheckAt: T0, lastResult: "latest" };
    expect(checkDue(p, T0 + HOUR - 1, false)).toBe(false);
    expect(checkDue(p, T0 + HOUR, false)).toBe(true);
    expect(checkDue({ ...p, lastResult: "error" }, T0 + 10, false)).toBe(false);
    expect(checkDue({ ...p, lastResult: "skipped" }, T0 + 10, false)).toBe(false);
  });

  it("지난 결과가 available이면 바로 — 받은 바이트는 재시작으로 사라졌다", () => {
    expect(checkDue({ ...EMPTY_PREFS, lastCheckAt: T0, lastResult: "available" }, T0 + 1, false)).toBe(true);
  });
});

describe("isNewer", () => {
  it("숫자 비교", () => {
    expect(isNewer("0.2.1", "0.2.0")).toBe(true);
    expect(isNewer("0.10.0", "0.2.1")).toBe(true);
    expect(isNewer("0.2.0", "0.2.1")).toBe(false);
    expect(isNewer("0.2.0", "0.2.0")).toBe(false);
    expect(isNewer("1.0.0", "0.99.99")).toBe(true);
  });

  it("v 접두사·빌드 메타", () => {
    expect(isNewer("v0.2.1", "0.2.0")).toBe(true);
    expect(isNewer("0.2.1", "v0.2.1")).toBe(false);
    expect(isNewer("0.2.1+build.5", "0.2.0")).toBe(true);
  });

  it("프리릴리스는 정식보다 낮다", () => {
    expect(isNewer("0.2.0", "0.2.0-beta.1")).toBe(true);
    expect(isNewer("0.2.0-beta.1", "0.2.0")).toBe(false);
    expect(isNewer("0.2.0-beta.2", "0.2.0-beta.1")).toBe(true);
    expect(isNewer("0.2.0-beta.10", "0.2.0-beta.2")).toBe(true);
    expect(isNewer("0.2.0-beta", "0.2.0-alpha")).toBe(true);
    expect(isNewer("0.2.0-beta.1", "0.2.0-beta")).toBe(true);
    expect(isNewer("0.2.0-alpha", "0.2.0-1")).toBe(true);
  });

  it("형식이 틀리면 false", () => {
    expect(isNewer("abc", "0.1.0")).toBe(false);
    expect(isNewer("0.2", "0.1.0")).toBe(false);
    expect(isNewer("0.2.0", "")).toBe(false);
  });
});

describe("shouldDownload", () => {
  it("건너뛴 버전은 자동으로 받지 않는다, 더 새 버전은 받는다", () => {
    expect(shouldDownload("0.2.1", null, false)).toBe(true);
    expect(shouldDownload("0.2.1", "0.2.1", false)).toBe(false);
    expect(shouldDownload("0.2.0", "0.2.1", false)).toBe(false);
    expect(shouldDownload("0.2.2", "0.2.1", false)).toBe(true);
  });

  it("수동은 건너뛴 버전도", () => {
    expect(shouldDownload("0.2.1", "0.2.1", true)).toBe(true);
  });
});

describe("pillLevel", () => {
  it("7일 경계·나중에", () => {
    expect(pillLevel(T0, T0, false)).toBe("normal");
    expect(pillLevel(T0, T0 + 7 * DAY - 1, false)).toBe("normal");
    expect(pillLevel(T0, T0 + 7 * DAY, false)).toBe("strong");
    expect(pillLevel(T0, T0 + 30 * DAY, true)).toBe("dim");
    expect(pillLevel(T0, T0, true)).toBe("dim");
  });
});

describe("notesPreview", () => {
  it("앞 5줄과 남은 수, 빈 줄은 세지 않는다", () => {
    const notes = "- 하나\n\n- 둘\r\n- 셋\n- 넷\n- 다섯\n- 여섯\n- 일곱\n";
    expect(notesPreview(notes)).toEqual({ lines: ["- 하나", "- 둘", "- 셋", "- 넷", "- 다섯"], more: 2 });
    expect(notesPreview("- 하나\n- 둘", 5)).toEqual({ lines: ["- 하나", "- 둘"], more: 0 });
  });

  it("빈 노트", () => {
    expect(notesPreview("")).toEqual({ lines: [], more: 0 });
    expect(notesPreview(null)).toEqual({ lines: [], more: 0 });
    expect(notesPreview(undefined)).toEqual({ lines: [], more: 0 });
  });
});

describe("recordSeen", () => {
  it("같은 버전이면 처음 시각을 잇는다", () => {
    expect(recordSeen(null, "0.2.1", T0)).toEqual({ version: "0.2.1", at: T0 });
    expect(recordSeen({ version: "0.2.1", at: T0 }, "0.2.1", T0 + DAY)).toEqual({ version: "0.2.1", at: T0 });
    expect(recordSeen({ version: "0.2.1", at: T0 }, "0.2.2", T0 + DAY)).toEqual({ version: "0.2.2", at: T0 + DAY });
  });
});

describe("failureMessage", () => {
  it("서명 오류는 따로", () => {
    expect(failureMessage("minisign: Signature verification failed", "download")).toContain("서명이 맞지 않아");
    expect(failureMessage("error sending request", "check")).toContain("인터넷 연결");
    expect(failureMessage("io error", "install")).toContain("설치하지 못했습니다");
  });
});

describe("prefs", () => {
  beforeEach(() => localStorage.clear());

  it("저장값 검증 — 깨진 값은 빈 기록", () => {
    expect(isUpdatePrefs(EMPTY_PREFS)).toBe(true);
    expect(isUpdatePrefs({ ...EMPTY_PREFS, lastResult: "weird" })).toBe(false);
    expect(isUpdatePrefs({ ...EMPTY_PREFS, seen: { version: 1, at: 0 } })).toBe(false);
    localStorage.setItem("frond.update", "{broken");
    expect(readUpdatePrefs()).toEqual(EMPTY_PREFS);
    const p: UpdatePrefs = { lastCheckAt: T0, lastResult: "available", skipped: "0.2.1", seen: { version: "0.2.2", at: T0 }, lastRunVersion: "0.2.0" };
    writeUpdatePrefs(p);
    expect(readUpdatePrefs()).toEqual(p);
  });
});

// ---- 상태 기계 --------------------------------------------------------------------------

function fakeUpdate(version: string, opts: { failDownload?: string } = {}): FoundUpdate & { closed: number; downloads: number } {
  const u = {
    version,
    notes: "- 새 기능",
    closed: 0,
    downloads: 0,
    async download(onProgress: (got: number, total: number | null) => void) {
      u.downloads++;
      if (opts.failDownload) throw new Error(opts.failDownload);
      onProgress(50, 100);
      onProgress(100, 100);
    },
    async install() {},
    async close() {
      u.closed++;
    },
  };
  return u;
}

function makeUpdater(responses: Array<FoundUpdate | null | Error>, opts: { auto?: boolean; online?: boolean; now?: () => number } = {}) {
  const calls: number[] = [];
  const api: UpdaterApi = {
    async check(timeout) {
      calls.push(timeout);
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next ?? null;
    },
  };
  const updater = new Updater({
    support: "enabled",
    api,
    autoEnabled: () => opts.auto ?? true,
    online: () => opts.online ?? true,
    now: opts.now ?? (() => T0),
  });
  return { updater, calls };
}

describe("Updater", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("지원하지 않는 설치본은 확인하지 않는다", async () => {
    const calls: number[] = [];
    const u = new Updater({ support: "dev", api: { check: async (t) => (calls.push(t), null) }, autoEnabled: () => true });
    await u.auto();
    await u.checkNow();
    expect(calls).toEqual([]);
    expect(u.current).toEqual({ kind: "unsupported", reason: "dev" });
  });

  it("새 버전 → 받기 → ready, 기록", async () => {
    const found = fakeUpdate("0.2.1");
    const { updater, calls } = makeUpdater([found]);
    const kinds: string[] = [];
    updater.onChange((s) => kinds.push(s.kind));
    await updater.auto();
    expect(calls).toEqual([UPDATE.timeoutMs]);
    expect(updater.current).toEqual({ kind: "ready", version: "0.2.1", notes: "- 새 기능", seenAt: T0 });
    expect(kinds).toEqual(["checking", "downloading", "downloading", "downloading", "ready"]);
    expect(readUpdatePrefs()).toMatchObject({ lastCheckAt: T0, lastResult: "available", seen: { version: "0.2.1", at: T0 } });
  });

  it("자동 확인은 1시간에 한 번 — 설정 끔·오프라인이면 요청 0", async () => {
    writeUpdatePrefs({ ...EMPTY_PREFS, lastCheckAt: T0 - 10, lastResult: "latest" });
    const a = makeUpdater([null]);
    await a.updater.auto();
    expect(a.calls).toEqual([]);
    localStorage.clear();
    const off = makeUpdater([null], { auto: false });
    await off.updater.auto();
    expect(off.calls).toEqual([]);
    const offline = makeUpdater([null], { online: false });
    await offline.updater.auto();
    expect(offline.calls).toEqual([]);
    // 설정이 꺼져 있어도 수동은 된다
    await off.updater.checkNow();
    expect(off.calls.length).toBe(1);
    expect(off.updater.current).toEqual({ kind: "latest", checkedAt: T0 });
  });

  it("자동 실패는 조용히, 수동 실패는 문구", async () => {
    const { updater } = makeUpdater([new Error("error sending request"), new Error("error sending request")]);
    await updater.auto();
    expect(updater.current).toEqual({ kind: "idle" });
    expect(readUpdatePrefs().lastResult).toBe("error");
    await updater.checkNow();
    expect(updater.current).toMatchObject({ kind: "error", manual: true, message: expect.stringContaining("인터넷 연결") });
  });

  it("서명이 틀린 설치기는 받기에서 거절 — 알약 없음, 수동은 서명 문구", async () => {
    const bad = fakeUpdate("0.2.1", { failDownload: "minisign verification failed" });
    const { updater } = makeUpdater([bad, fakeUpdate("0.2.1", { failDownload: "signature mismatch" })]);
    await updater.auto();
    expect(updater.current.kind).toBe("idle");
    expect(bad.closed).toBe(1);
    await updater.checkNow();
    expect(updater.current).toMatchObject({ kind: "error", message: expect.stringContaining("서명") });
  });

  it("건너뛴 버전은 자동으로 받지 않고, 수동은 받는다", async () => {
    writeUpdatePrefs({ ...EMPTY_PREFS, skipped: "0.2.1" });
    const auto = fakeUpdate("0.2.1");
    const manual = fakeUpdate("0.2.1");
    const { updater } = makeUpdater([auto, manual]);
    await updater.auto();
    expect(auto.downloads).toBe(0);
    expect(updater.current).toEqual({ kind: "skipped", version: "0.2.1" });
    await updater.checkNow();
    expect(manual.downloads).toBe(1);
    expect(updater.current.kind).toBe("ready");
  });

  it("건너뛰기·다시 알리기", async () => {
    const first = fakeUpdate("0.2.1");
    const again = fakeUpdate("0.2.1");
    const { updater } = makeUpdater([first, again]);
    await updater.auto();
    updater.skip();
    expect(readUpdatePrefs().skipped).toBe("0.2.1");
    expect(first.closed).toBe(1);
    expect(updater.current).toEqual({ kind: "skipped", version: "0.2.1" });
    await updater.unskip();
    expect(readUpdatePrefs().skipped).toBe(null);
    expect(updater.current.kind).toBe("ready");
  });

  it("나중에는 이번 실행만 흐리게", async () => {
    const { updater } = makeUpdater([fakeUpdate("0.2.1")]);
    await updater.auto();
    let emitted = 0;
    updater.onChange(() => emitted++);
    updater.postpone();
    expect(updater.later).toBe(true);
    expect(emitted).toBe(1);
    expect(updater.current.kind).toBe("ready");
  });

  it("같은 버전을 다시 찾으면 다시 받지 않는다, 7일 기록은 잇는다", async () => {
    let now = T0;
    const first = fakeUpdate("0.2.1");
    const same = fakeUpdate("0.2.1");
    const { updater } = makeUpdater([first, same], { now: () => now });
    await updater.auto();
    now = T0 + 8 * DAY;
    await updater.auto();
    expect(same.downloads).toBe(0);
    expect(same.closed).toBe(1);
    expect(updater.current).toMatchObject({ kind: "ready", seenAt: T0 });
  });

  it("재시작 뒤 같은 버전을 다시 받으면 처음 본 시각을 잇는다", async () => {
    writeUpdatePrefs({ ...EMPTY_PREFS, lastCheckAt: T0 - 10 * DAY, lastResult: "available", seen: { version: "0.2.1", at: T0 - 10 * DAY } });
    const { updater } = makeUpdater([fakeUpdate("0.2.1")]);
    await updater.auto();
    expect(updater.current).toMatchObject({ kind: "ready", seenAt: T0 - 10 * DAY });
  });

  it("스케줄 — 10초 뒤 첫 확인, 6시간마다, stop 뒤에는 없음", async () => {
    vi.useFakeTimers();
    try {
      let now = T0;
      const { updater, calls } = makeUpdater([null, null, null], { now: () => now });
      updater.start();
      await vi.advanceTimersByTimeAsync(UPDATE.firstDelayMs - 1);
      expect(calls.length).toBe(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(calls.length).toBe(1);
      now += UPDATE.intervalMs;
      await vi.advanceTimersByTimeAsync(UPDATE.intervalMs);
      expect(calls.length).toBe(2);
      updater.stop();
      now += UPDATE.intervalMs;
      await vi.advanceTimersByTimeAsync(UPDATE.intervalMs);
      expect(calls.length).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---- 재시작 인계 (U-3) ------------------------------------------------------------------

const SESSION = { tabs: [{ path: "C:/docs/a.md", mode: "split" as const, line: 12 }, { path: "C:/docs/b.md", mode: "view" as const, line: 0 }], active: 1 };
const HANDOFF: Handoff = { v: 1, from: "0.2.0", to: "0.2.1", notes: "- 새 기능", at: T0, session: SESSION, drafts: ["C:/docs/a.md"] };

describe("인계 파일", () => {
  it("isHandoff — 모양 검증", () => {
    expect(isHandoff(HANDOFF)).toBe(true);
    expect(isHandoff({ ...HANDOFF, session: null, drafts: [] })).toBe(true);
    expect(isHandoff({ ...HANDOFF, v: 2 })).toBe(false);
    expect(isHandoff({ ...HANDOFF, at: "어제" })).toBe(false);
    expect(isHandoff({ ...HANDOFF, drafts: [1] })).toBe(false);
    expect(isHandoff({ ...HANDOFF, session: { tabs: [] } })).toBe(false);
    expect(isHandoff(null)).toBe(false);
  });

  it("parseHandoff — 깨진 JSON·빈 값은 null, 세션은 바로잡는다", () => {
    expect(parseHandoff(null)).toBe(null);
    expect(parseHandoff("")).toBe(null);
    expect(parseHandoff("{broken")).toBe(null);
    expect(parseHandoff(JSON.stringify(HANDOFF))).toEqual(HANDOFF);
    const wild = { ...HANDOFF, session: { tabs: [...SESSION.tabs, { path: "", mode: "x", line: -1 }], active: 9 } };
    expect(parseHandoff(JSON.stringify(wild))?.session).toEqual({ tabs: SESSION.tabs, active: 1 });
  });

  it("handoffFresh — 24시간", () => {
    expect(handoffFresh(HANDOFF, T0)).toBe(true);
    expect(handoffFresh(HANDOFF, T0 + DAY - 1)).toBe(true);
    expect(handoffFresh(HANDOFF, T0 + DAY)).toBe(false);
    expect(handoffFresh(HANDOFF, T0 - 60_000)).toBe(true); // 시계가 조금 뒤로
    expect(handoffFresh(HANDOFF, T0 - HOUR)).toBe(false); // 미래에 쓴 파일
  });
});

describe("startupPlan", () => {
  const base: StartupInput = { handoff: null, restoreSetting: "restore", pending: [], current: "0.2.1", lastRunVersion: "0.2.1", now: T0 + 30_000 };

  it("인계 파일 없음 — 설정대로, 인수 파일은 연다, 같은 버전이면 알림 없음", () => {
    expect(startupPlan(base)).toEqual({ restoreFrom: "saved", open: [], notice: null });
    expect(startupPlan({ ...base, restoreSetting: "none", pending: ["C:/x.md"] })).toEqual({ restoreFrom: "none", open: ["C:/x.md"], notice: null });
  });

  it("업데이트 재시작 — 설정과 무관하게 인계 세션, 옛 argv는 버림, 노트 있는 알림", () => {
    for (const restoreSetting of ["restore", "none"]) {
      for (const pending of [[], ["C:/docs/a.md"]]) {
        expect(startupPlan({ ...base, handoff: HANDOFF, restoreSetting, pending, lastRunVersion: "0.2.0" })).toEqual({
          restoreFrom: "handoff",
          open: [],
          notice: { from: "0.2.0", to: "0.2.1", notes: "- 새 기능" },
        });
      }
    }
  });

  it("인계 파일이 있는데 버전이 그대로 — 설치가 안 됐다: 세션만, 알림 없음", () => {
    expect(startupPlan({ ...base, handoff: HANDOFF, current: "0.2.0", lastRunVersion: "0.2.0" })).toEqual({ restoreFrom: "handoff", open: [], notice: null });
  });

  it("받은 것과 다른 버전으로 올라갔으면 노트 없이 알림", () => {
    expect(startupPlan({ ...base, handoff: HANDOFF, current: "0.2.2" }).notice).toEqual({ from: "0.2.0", to: "0.2.2", notes: null });
  });

  it("오래된 인계 파일은 무시 — 평소 시작", () => {
    const stale = { ...HANDOFF, at: T0 - 2 * DAY };
    expect(startupPlan({ ...base, handoff: stale, restoreSetting: "none", pending: ["C:/x.md"] })).toEqual({ restoreFrom: "none", open: ["C:/x.md"], notice: null });
  });

  it("lastRunVersion — 없음(처음 실행)은 알림 없음, 작으면 노트 없는 알림, 같거나 크면 없음", () => {
    expect(startupPlan({ ...base, lastRunVersion: null }).notice).toBe(null);
    expect(startupPlan({ ...base, lastRunVersion: "0.2.0" }).notice).toEqual({ from: "0.2.0", to: "0.2.1", notes: null });
    expect(startupPlan({ ...base, lastRunVersion: "0.2.1" }).notice).toBe(null);
    expect(startupPlan({ ...base, lastRunVersion: "0.3.0" }).notice).toBe(null);
  });
});

describe("Updater.install", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("받아 둔 것이 없으면 던진다", async () => {
    const { updater } = makeUpdater([]);
    await expect(updater.install()).rejects.toThrow();
  });

  it("설치가 실패하면 ready로 되돌리고 던진다", async () => {
    const found = fakeUpdate("0.2.1");
    found.install = async () => {
      throw new Error("io error");
    };
    const { updater } = makeUpdater([found]);
    await updater.auto();
    const kinds: string[] = [];
    updater.onChange((s) => kinds.push(s.kind));
    await expect(updater.install()).rejects.toThrow("io error");
    expect(kinds).toEqual(["installing", "ready"]);
    expect(updater.current.kind).toBe("ready");
  });

  it("설치가 돌아오면(프로세스가 안 끝남) 실패로 본다", async () => {
    const { updater } = makeUpdater([fakeUpdate("0.2.1")]);
    await updater.auto();
    await expect(updater.install()).rejects.toThrow();
    expect(updater.current.kind).toBe("ready");
  });

  it("installing 중에는 확인하지 않는다", async () => {
    const found = fakeUpdate("0.2.1");
    let release: () => void = () => undefined;
    found.install = () => new Promise<void>((r) => (release = r));
    const { updater, calls } = makeUpdater([found, null]);
    await updater.auto();
    const installing = updater.install().catch(() => undefined);
    expect(updater.current.kind).toBe("installing");
    await updater.checkNow();
    expect(calls.length).toBe(1);
    release();
    await installing;
  });
});
