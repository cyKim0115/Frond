/**
 * 앱 안 업데이트 (결정 `20261127-app-update`) — 상태 기계, 순수 판정 함수, 확인 스케줄러.
 *
 * - 지원 판정은 백엔드 update.rs `get_update_support` 한 곳이다. `enabled`(설치기판 + 공개 키)가 아니면 updater 플러그인이
 *   등록되지 않아 확인 자체를 하지 않는다
 * - 시작 10초 뒤 + 6시간마다 조용히 확인하고, 새 버전이면 받아 둔 뒤에만 알린다(제목 표시줄 알약, update-ui.ts).
 *   자동 확인은 1시간에 한 번까지 — 지난 결과가 `available`이면 받은 바이트가 재시작으로 사라졌으므로 바로 다시 본다
 * - 건너뛴 버전은 자동 확인에서 받지 않는다. 수동 '지금 확인'은 건너뛴 버전도 보여 준다
 * - 확인 기록(마지막 확인·건너뛴 버전·처음 본 시각·지난 실행 버전)은 설정이 아니라 prefs(`frond.update`)에 둔다 — 잃어도 되는 값
 */

import { check as pluginCheck } from "@tauri-apps/plugin-updater";
import { readPref, writePref } from "./prefs";
import { normalizeSession, type Session } from "./session";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const UPDATE = {
  /** 시작 흐름이 끝난 뒤 첫 자동 확인까지 */
  firstDelayMs: 10_000,
  /** 창이 떠 있는 동안 자동 확인 간격 */
  intervalMs: 6 * HOUR,
  /** 앱을 자주 켜도 자동 확인은 이 간격에 한 번까지 */
  minGapMs: HOUR,
  /** 같은 버전을 이만큼 넘게 미루면 알약을 강조 */
  strongMs: 7 * DAY,
  /** latest.json 요청 제한 시간 */
  timeoutMs: 30_000,
  /** 확인 팝업에 보일 노트 줄 수 */
  notesLines: 5,
  /** 인계 파일을 믿는 시간 — 이보다 오래된 파일은 지난 업데이트의 찌꺼기 */
  handoffFreshMs: DAY,
  /** 재시작 뒤 '업데이트됨' 알약을 보이는 시간 */
  updatedNoticeMs: 20_000,
} as const;

export const RELEASES_URL = "https://github.com/cyKim0115/Frond/releases";

/** update.rs `Support` */
export type UpdateSupport = "enabled" | "store" | "scoop" | "dev" | "nokey";
const SUPPORTS: readonly string[] = ["enabled", "store", "scoop", "dev", "nokey"];
export function isUpdateSupport(value: unknown): value is UpdateSupport {
  return typeof value === "string" && SUPPORTS.includes(value);
}

/** 시작 때 백엔드 판정을 받아 둔다 — 설정 팝업이 '업데이트 자동 확인' 행을 보일지 묻는다(settings.ts `available`). 모르면 null */
let knownSupport: UpdateSupport | null = null;
export function updateSupport(): UpdateSupport | null {
  return knownSupport;
}
export function setUpdateSupport(support: UpdateSupport | null): void {
  knownSupport = support;
}

export type UpdateState =
  | { kind: "unsupported"; reason: Exclude<UpdateSupport, "enabled"> }
  | { kind: "idle" }
  | { kind: "checking"; manual: boolean }
  | { kind: "downloading"; version: string; got: number; total: number | null }
  | { kind: "ready"; version: string; notes: string; seenAt: number }
  /** 새 버전이 있지만 '이 버전 건너뛰기'로 받지 않았다 */
  | { kind: "skipped"; version: string }
  | { kind: "latest"; checkedAt: number }
  | { kind: "error"; manual: boolean; message: string; detail: string }
  | { kind: "installing" }
  | { kind: "updated"; from: string | null; to: string; notes: string | null };

// ---- 확인 기록 (prefs) ------------------------------------------------------------------

export type CheckResult = "latest" | "available" | "skipped" | "error";
const RESULTS: readonly string[] = ["latest", "available", "skipped", "error"];

export interface UpdatePrefs {
  lastCheckAt: number | null;
  lastResult: CheckResult | null;
  /** '이 버전 건너뛰기'로 고른 버전 하나 */
  skipped: string | null;
  /** 받아 둔 버전을 처음 알린 시각 — 7일 강조 기준. 같은 버전이면 재시작해도 이어진다 */
  seen: { version: string; at: number } | null;
  /** 지난 실행의 앱 버전 — 설치기로 직접 올린 경우의 '업데이트됨' 판정 */
  lastRunVersion: string | null;
}

export const EMPTY_PREFS: UpdatePrefs = { lastCheckAt: null, lastResult: null, skipped: null, seen: null, lastRunVersion: null };

const KEY = "update";

export function isUpdatePrefs(value: unknown): value is UpdatePrefs {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  const strOrNull = (x: unknown) => x === null || typeof x === "string";
  const seenOk = (x: unknown) => {
    if (x === null) return true;
    if (typeof x !== "object") return false;
    const s = x as Record<string, unknown>;
    return typeof s.version === "string" && num(s.at);
  };
  return (
    (p.lastCheckAt === null || num(p.lastCheckAt)) &&
    (p.lastResult === null || (typeof p.lastResult === "string" && RESULTS.includes(p.lastResult))) &&
    strOrNull(p.skipped) &&
    seenOk(p.seen) &&
    strOrNull(p.lastRunVersion)
  );
}

export function readUpdatePrefs(): UpdatePrefs {
  return readPref(KEY, EMPTY_PREFS, isUpdatePrefs);
}

export function writeUpdatePrefs(prefs: UpdatePrefs): void {
  writePref(KEY, prefs);
}

function patchPrefs(patch: Partial<UpdatePrefs>): UpdatePrefs {
  const next = { ...readUpdatePrefs(), ...patch };
  writeUpdatePrefs(next);
  return next;
}

// ---- 순수 함수 ----------------------------------------------------------------------------

/** 지금 확인할 때인가 — 수동은 늘, 자동은 처음·지난 결과가 `available`·지난 확인 1시간 뒤 */
export function checkDue(prefs: UpdatePrefs, now: number, manual: boolean): boolean {
  if (manual || prefs.lastCheckAt === null || prefs.lastResult === "available") return true;
  return now - prefs.lastCheckAt >= UPDATE.minGapMs;
}

interface SemVer {
  core: [number, number, number];
  pre: string[];
}

function parseSemver(raw: string): SemVer | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(raw.trim());
  if (!m) return null;
  return { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split(".") : [] };
}

/** semver 비교 — a > b. 형식이 틀리면 false. 프리릴리스는 같은 번호의 정식보다 낮다 */
export function isNewer(a: string, b: string): boolean {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) {
    if (x.core[i] !== y.core[i]) return x.core[i] > y.core[i];
  }
  if (x.pre.length === 0 || y.pre.length === 0) return x.pre.length === 0 && y.pre.length > 0;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === undefined) return false;
    if (q === undefined) return true;
    if (p === q) continue;
    const pn = /^\d+$/.test(p);
    const qn = /^\d+$/.test(q);
    if (pn && qn) return Number(p) > Number(q);
    if (pn !== qn) return !pn; // 숫자 식별자가 글자보다 낮다
    return p > q;
  }
  return false;
}

/** 받을지 — 수동은 늘, 자동은 건너뛴 버전(과 그보다 낮은 버전)이면 받지 않는다 */
export function shouldDownload(version: string, skipped: string | null, manual: boolean): boolean {
  if (manual || skipped === null) return true;
  return isNewer(version, skipped);
}

export type PillLevel = "normal" | "strong" | "dim";

/** 알약 모양 — 이번 실행에서 '나중에'면 흐리게, 같은 버전을 7일 넘게 미뤘으면 강조 */
export function pillLevel(seenAt: number, now: number, later: boolean): PillLevel {
  if (later) return "dim";
  return now - seenAt >= UPDATE.strongMs ? "strong" : "normal";
}

/** 노트 앞 몇 줄과 남은 줄 수 — 빈 줄은 세지 않는다 */
export function notesPreview(notes: string | null | undefined, max: number = UPDATE.notesLines): { lines: string[]; more: number } {
  const all = (notes ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
  return { lines: all.slice(0, max), more: Math.max(0, all.length - max) };
}

/** 받아 둔 버전을 처음 본 시각 — 같은 버전이면 이전 시각을 잇는다 */
export function recordSeen(seen: UpdatePrefs["seen"], version: string, now: number): { version: string; at: number } {
  return seen && seen.version === version ? seen : { version, at: now };
}

export type Josa = "으로/로" | "은/는" | "이/가";

/**
 * 버전 뒤에 조사를 붙인다 — 끝 숫자를 한국어로 읽은 받침에 맞춘다(0.1.0 → 「0.1.0으로」, 0.2.1 → 「0.2.1로」).
 * 끝이 0(영·십·백…)·3(삼)·6(육)이면 받침, 1(일)·7(칠)·8(팔)이면 ㄹ 받침(「로」), 2·4·5·9면 받침 없음.
 * 끝이 숫자가 아니면(프리릴리스 글자) 읽는 법을 모르니 「(으)로」처럼 둘 다 적는다
 */
export function withJosa(version: string, josa: Josa): string {
  const last = version.trim().slice(-1);
  const [withBatchim, without] = josa.split("/") as [string, string];
  if (!/\d/.test(last)) return version + (josa === "으로/로" ? "(으)로" : josa === "은/는" ? "은(는)" : "이(가)");
  const final = "036".includes(last) ? "batchim" : "178".includes(last) ? "rieul" : "none";
  if (josa === "으로/로") return version + (final === "batchim" ? withBatchim : without);
  return version + (final === "none" ? without : withBatchim);
}

/** 사용자에게 보일 실패 문구 — 서명 오류는 따로 */
export function failureMessage(detail: string, stage: "check" | "download" | "install"): string {
  if (/signature|minisign|서명/i.test(detail)) return "받은 업데이트 파일의 서명이 맞지 않아 설치하지 않았습니다.";
  if (stage === "install") return "업데이트를 설치하지 못했습니다. 문서와 탭은 그대로입니다.";
  return "업데이트를 확인하지 못했습니다. 인터넷 연결을 확인해 주세요.";
}

export function errorText(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : String(e);
}

// ---- 재시작 인계 (U-3) -------------------------------------------------------------------
//
// Windows `install()`은 설치기를 띄우고 곧바로 프로세스를 끝낸다. 그 전에 세션·노트를 인계 파일(update.rs)에 남기고,
// 새 앱은 시작 첫머리에 읽고 지운다. 신선한 인계 파일이 있으면 옛 argv(설치기 `/ARGS`가 처음 인수를 다시 넘김)를 무시하고
// 설정 '시작할 때'와 무관하게 그 세션을 한 번 다시 연다.

export interface Handoff {
  v: 1;
  /** 업데이트 전 버전 */
  from: string;
  /** 받아 둔 새 버전 */
  to: string;
  notes: string;
  /** 쓴 시각(유닉스 밀리초) */
  at: number;
  session: Session | null;
  /** 초안으로 남기고 업데이트한 문서 경로 */
  drafts: string[];
}

export function isHandoff(value: unknown): value is Handoff {
  if (typeof value !== "object" || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    h.v === 1 &&
    typeof h.from === "string" &&
    typeof h.to === "string" &&
    typeof h.notes === "string" &&
    typeof h.at === "number" &&
    Number.isFinite(h.at) &&
    (h.session === null || normalizeSession(h.session) !== null) &&
    Array.isArray(h.drafts) &&
    h.drafts.every((d) => typeof d === "string")
  );
}

/** 인계 파일 내용(JSON) → 검증된 값. 깨졌으면 null */
export function parseHandoff(raw: string | null): Handoff | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isHandoff(value)) return null;
    return { ...value, session: value.session === null ? null : normalizeSession(value.session) };
  } catch {
    return null;
  }
}

/** 24시간 안에 쓴 인계 파일만 믿는다 — 오래된 것은 지난 업데이트가 남긴 찌꺼기. 시계가 조금 뒤로 간 것(5분)은 봐준다 */
export function handoffFresh(h: Handoff, now: number): boolean {
  return h.at <= now + 5 * 60_000 && now - h.at < UPDATE.handoffFreshMs;
}

export interface StartupInput {
  handoff: Handoff | null;
  /** 설정 '시작할 때' */
  restoreSetting: string;
  /** 이번 실행 인수로 받은 파일 */
  pending: string[];
  /** 지금 앱 버전 */
  current: string;
  lastRunVersion: string | null;
  now: number;
}

export interface StartupPlan {
  /** 다시 열 세션 — 인계 파일 / 저장된 세션 / 없음 */
  restoreFrom: "handoff" | "saved" | "none";
  /** 먼저 열 인수 파일 — 업데이트 재시작이면 옛 argv라 버린다 */
  open: string[];
  /** '업데이트됨' 알림. 노트는 인계 파일에 있을 때만 */
  notice: { from: string | null; to: string; notes: string | null } | null;
}

export function startupPlan(input: StartupInput): StartupPlan {
  const { handoff, current, lastRunVersion } = input;
  if (handoff && handoffFresh(handoff, input.now)) {
    // 설치가 안 됐는데 다시 켜진 경우(current ≤ from)는 알림 없이 세션만
    const updated = isNewer(current, handoff.from);
    return {
      restoreFrom: "handoff",
      open: [],
      notice: updated ? { from: handoff.from, to: current, notes: handoff.to === current ? handoff.notes : null } : null,
    };
  }
  // 설치기로 직접 올린 경우 — 노트 없는 '업데이트됨'. 처음 실행(기록 없음)은 알리지 않는다
  const updated = lastRunVersion !== null && isNewer(current, lastRunVersion);
  return {
    restoreFrom: input.restoreSetting === "restore" ? "saved" : "none",
    open: input.pending,
    notice: updated ? { from: lastRunVersion, to: current, notes: null } : null,
  };
}

/** 지금 실행 버전을 남긴다 — 다음 실행의 '업데이트됨' 판정 */
export function recordRunVersion(current: string): void {
  patchPrefs({ lastRunVersion: current });
}

// ---- 플러그인 감싸기 ----------------------------------------------------------------------

/** 받은 새 버전 — 플러그인 `Update`를 감싼다(시험에서 가짜로 바꾼다) */
export interface FoundUpdate {
  version: string;
  notes: string;
  download(onProgress: (got: number, total: number | null) => void): Promise<void>;
  install(): Promise<void>;
  close(): Promise<void>;
}

export interface UpdaterApi {
  check(timeoutMs: number): Promise<FoundUpdate | null>;
}

/** 실제 플러그인 — HTTP는 Rust가 한다(CSP 무관). 플러그인이 등록되지 않은 빌드에서는 부르기만 해도 실패한다 */
export const pluginApi: UpdaterApi = {
  async check(timeoutMs) {
    const update = await pluginCheck({ timeout: timeoutMs });
    if (!update) return null;
    return {
      version: update.version,
      notes: update.body ?? "",
      async download(onProgress) {
        let got = 0;
        let total: number | null = null;
        await update.download((event) => {
          if (event.event === "Started") total = event.data.contentLength ?? null;
          else if (event.event === "Progress") got += event.data.chunkLength;
          onProgress(got, total);
        });
      },
      install: () => update.install(),
      close: () => update.close(),
    };
  },
};

// ---- 상태 기계·스케줄러 -----------------------------------------------------------------

export interface UpdaterOptions {
  support: UpdateSupport;
  api: UpdaterApi;
  /** 설정 '업데이트 자동 확인'이 켜졌는지 */
  autoEnabled: () => boolean;
  now?: () => number;
  online?: () => boolean;
}

export class Updater {
  private state: UpdateState;
  /** 받아 둔 업데이트 — 재시작하면 사라진다 */
  private pending: FoundUpdate | null = null;
  /** 이번 실행에서 '나중에'를 눌렀다 */
  private laterThisRun = false;
  private running: Promise<void> | null = null;
  private firstTimer: ReturnType<typeof setTimeout> | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<(state: UpdateState) => void>();
  private readonly now: () => number;
  private readonly online: () => boolean;

  constructor(private readonly o: UpdaterOptions) {
    this.now = o.now ?? Date.now;
    this.online = o.online ?? (() => navigator.onLine);
    this.state = o.support === "enabled" ? { kind: "idle" } : { kind: "unsupported", reason: o.support };
  }

  get support(): UpdateSupport {
    return this.o.support;
  }

  get current(): UpdateState {
    return this.state;
  }

  get later(): boolean {
    return this.laterThisRun;
  }

  onChange(listener: (state: UpdateState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 상태를 바꾸지 않고 다시 그리게 한다(나중에·시간 경과) */
  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }

  private set(next: UpdateState): void {
    this.state = next;
    this.emit();
  }

  /** 자동 확인 예약 — 첫 확인은 `firstDelayMs` 뒤. 설정을 다시 켤 때도 부른다 */
  start(firstDelayMs: number = UPDATE.firstDelayMs): void {
    if (this.o.support !== "enabled") return;
    this.stop();
    this.firstTimer = setTimeout(() => void this.auto(), firstDelayMs);
    this.interval = setInterval(() => void this.auto(), UPDATE.intervalMs);
  }

  /** 새 확인을 멈춘다. 진행 중인 받기는 그대로 끝난다 */
  stop(): void {
    if (this.firstTimer !== null) clearTimeout(this.firstTimer);
    if (this.interval !== null) clearInterval(this.interval);
    this.firstTimer = null;
    this.interval = null;
  }

  /** 자동 확인 한 번 — 설정·온라인·주기를 본다. 실패는 조용히 */
  async auto(): Promise<void> {
    if (this.o.support !== "enabled" || !this.o.autoEnabled() || !this.online() || this.running) return;
    if (this.state.kind === "installing") return;
    if (!checkDue(readUpdatePrefs(), this.now(), false)) return;
    await this.run(false);
  }

  /** 수동 '지금 확인' — 설정이 꺼져 있어도 된다. 이미 도는 중이면 그 결과를 기다린다 */
  async checkNow(): Promise<void> {
    if (this.o.support !== "enabled" || this.state.kind === "installing") return;
    if (this.running) return this.running;
    await this.run(true);
  }

  private run(manual: boolean): Promise<void> {
    const task = this.doRun(manual).finally(() => (this.running = null));
    this.running = task;
    return task;
  }

  private async doRun(manual: boolean): Promise<void> {
    const before = this.state;
    this.set({ kind: "checking", manual });
    let found: FoundUpdate | null;
    try {
      found = await this.o.api.check(UPDATE.timeoutMs);
    } catch (e) {
      this.fail(manual, e, "check", before);
      return;
    }
    const now = this.now();
    if (!found) {
      patchPrefs({ lastCheckAt: now, lastResult: "latest" });
      // 받아 둔 것이 있으면 그대로 둔다 — 서버가 되돌려도 받은 설치기는 서명이 맞다
      this.set(this.pending && before.kind === "ready" ? before : { kind: "latest", checkedAt: now });
      return;
    }
    if (this.pending && this.pending.version === found.version && before.kind === "ready") {
      void found.close().catch(() => undefined);
      patchPrefs({ lastCheckAt: now, lastResult: "available" });
      this.set(before);
      return;
    }
    const prefs = readUpdatePrefs();
    if (!shouldDownload(found.version, prefs.skipped, manual)) {
      void found.close().catch(() => undefined);
      patchPrefs({ lastCheckAt: now, lastResult: "skipped" });
      this.set(this.pending && before.kind === "ready" ? before : { kind: "skipped", version: found.version });
      return;
    }
    this.set({ kind: "downloading", version: found.version, got: 0, total: null });
    try {
      await found.download((got, total) => this.set({ kind: "downloading", version: found.version, got, total }));
    } catch (e) {
      void found.close().catch(() => undefined);
      this.fail(manual, e, "download", before);
      return;
    }
    if (this.pending) void this.pending.close().catch(() => undefined);
    this.pending = found;
    const at = this.now();
    const seen = recordSeen(prefs.seen, found.version, at);
    patchPrefs({ lastCheckAt: at, lastResult: "available", seen });
    this.set({ kind: "ready", version: found.version, notes: found.notes, seenAt: seen.at });
  }

  private fail(manual: boolean, e: unknown, stage: "check" | "download", before: UpdateState): void {
    const detail = errorText(e);
    console.warn(`[update] ${stage} 실패:`, detail);
    patchPrefs({ lastCheckAt: this.now(), lastResult: "error" });
    if (manual) {
      this.set({ kind: "error", manual, message: failureMessage(detail, stage), detail });
      return;
    }
    // 자동은 조용히 — 받아 둔 것이 있으면 그대로, 아니면 확인 전 상태로
    this.set(before.kind === "checking" || before.kind === "downloading" ? { kind: "idle" } : before);
  }

  /** '나중에' — 이번 실행 동안 알약을 흐리게 */
  postpone(): void {
    this.laterThisRun = true;
    this.emit();
  }

  /** '이 버전 건너뛰기' — 받아 둔 것을 버리고 알약을 내린다 */
  skip(): void {
    if (this.state.kind !== "ready") return;
    const version = this.state.version;
    patchPrefs({ skipped: version });
    if (this.pending) void this.pending.close().catch(() => undefined);
    this.pending = null;
    this.set({ kind: "skipped", version });
  }

  /** '다시 알리기' — 건너뛰기를 풀고 바로 확인한다 */
  async unskip(): Promise<void> {
    patchPrefs({ skipped: null });
    await this.checkNow();
  }

  /**
   * 받아 둔 업데이트를 설치한다. Windows에서는 설치기를 띄우고 프로세스가 끝나 돌아오지 않는다 — 부르기 전에 모든 쓰기를 끝낸다.
   * 돌아오거나 던지면 설치가 안 된 것이다: `ready`로 되돌리고 던진다(부른 쪽이 인계 파일을 지우고 앱을 그대로 둔다)
   */
  async install(): Promise<void> {
    const ready = this.state;
    if (ready.kind !== "ready" || !this.pending) throw new Error("받아 둔 업데이트가 없습니다");
    this.stop();
    this.set({ kind: "installing" });
    try {
      await this.pending.install();
    } catch (e) {
      this.set(ready);
      throw e;
    }
    this.set(ready);
    throw new Error("설치기가 앱을 끝내지 않았습니다");
  }

  /** 재시작 뒤 '업데이트됨' 표시 — 시간이 지나면 `idle`로 */
  showUpdated(from: string | null, to: string, notes: string | null): void {
    this.set({ kind: "updated", from, to, notes });
  }

  clearUpdated(): void {
    if (this.state.kind === "updated") this.set(this.o.support === "enabled" ? { kind: "idle" } : { kind: "unsupported", reason: this.o.support });
  }
}
