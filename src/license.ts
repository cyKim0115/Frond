/**
 * 권리(무료 / 구매자) — 판정은 백엔드 license.rs, 여기는 상태와 "무엇을 쓸 수 있나" 순수 함수 (store-launch A-3).
 *
 * - 무료로 남는 것: 모든 문서 기능, 내장·추천 테마. 구매자 기능: 사용자 테마 만들기(가져오기·복제)·적용, 구매자 전용 테마
 * - 막힌 테마는 목록·설정값에서 빼지 않는다. 적용 단계(main.ts `effectiveTheme`)에서 같은 쪽 내장 테마로 보이게만 하고
 *   설정값은 그대로 둔다 — 권리가 돌아오면 원래 테마가 다시 보인다(settings.ts `load()`가 목록에 없는 값을 지우기 때문)
 * - 시작할 때는 백엔드 답이 오기 전이므로 마지막 판정(localStorage)을 쓴다. 처음이면 '모두 열림'으로 둔다 —
 *   Store 밖 설치본은 실제로 그렇고, Store판 첫 실행에는 아직 사용자 테마가 없다
 */

import { readPref, writePref } from "./prefs";
import type { ThemeOrigin } from "./theme/catalog";

export type Tier = "free" | "supporter";
/** license.rs `Source` */
export type Source = "store" | "keyFile" | "dev" | "open" | "none";
export interface Entitlement {
  tier: Tier;
  source: Source;
}
/** install.rs `InstallKind` */
export type InstallKind = "packaged" | "scoop" | "installed" | "dev";

export const OPEN: Entitlement = { tier: "supporter", source: "open" };

const KEY = "entitlement";
const TIERS: readonly string[] = ["free", "supporter"];
const SOURCES: readonly string[] = ["store", "keyFile", "dev", "open", "none"];

export function isEntitlement(value: unknown): value is Entitlement {
  if (typeof value !== "object" || value === null) return false;
  const { tier, source } = value as Record<string, unknown>;
  return typeof tier === "string" && TIERS.includes(tier) && typeof source === "string" && SOURCES.includes(source);
}

let current: Entitlement = readPref(KEY, OPEN, isEntitlement);
const listeners = new Set<(next: Entitlement) => void>();

export function entitlement(): Entitlement {
  return current;
}

/** 백엔드 판정을 받는다. 바뀌었을 때만 저장하고 알린다 */
export function setEntitlement(next: Entitlement): void {
  if (!isEntitlement(next) || (next.tier === current.tier && next.source === current.source)) return;
  current = { tier: next.tier, source: next.source };
  writePref(KEY, current);
  for (const listener of listeners) listener(current);
}

export function onEntitlementChange(listener: (next: Entitlement) => void): void {
  listeners.add(listener);
}

export function isSupporter(e: Entitlement = current): boolean {
  return e.tier === "supporter";
}

/** 이 출처의 테마를 적용할 수 있는지. 목록에 없는 테마(undefined)는 쓸 수 없다 */
export function canUseTheme(origin: ThemeOrigin | undefined, e: Entitlement = current): boolean {
  if (origin === "builtin" || origin === "recommended") return true;
  if (origin === "user" || origin === "supporter") return isSupporter(e);
  return false;
}

/** 테마 가져오기·복제(사용자 테마 만들기) */
export function canImport(e: Entitlement = current): boolean {
  return isSupporter(e);
}

/** 정보 탭에 보일 상태 한 줄 */
export function entitlementLabel(e: Entitlement = current): string {
  switch (e.source) {
    case "store":
      return "구매자 — Microsoft Store";
    case "keyFile":
      return "구매자 — 라이선스 키";
    case "open":
      return "모든 기능 열림 — Store 밖 설치본";
    case "dev":
      return e.tier === "supporter" ? "개발용 — 구매자 흉내" : "개발용 — 무료 흉내";
    case "none":
      return "무료";
  }
}

export function installKindLabel(kind: InstallKind): string {
  return { packaged: "Microsoft Store (MSIX)", scoop: "Scoop", installed: "설치기", dev: "개발 빌드" }[kind];
}

/** 테스트용 — 저장소를 바꾼 뒤 다시 읽는다 */
export function reloadEntitlement(): void {
  current = readPref(KEY, OPEN, isEntitlement);
}

// ---- 구매 권유 스케줄 (store-launch A-4) ------------------------------------------------
//
// 결정 `20261006-store-monetization`: 첫 실행 뒤 7일·실행 5회 유예, 14일 간격, '나중에'마다 14 → 30 → 60일.
// 비구매자에게만, Store판(Packaged)에서만(개발용 무료 흉내 포함). 권유 끄기 설정은 두지 않고 주기는 이 상수로만 바꾼다.
// 상태는 localStorage(잃어도 되는 값) — 지워지면 유예부터 다시 센다.

const DAY = 24 * 60 * 60 * 1000;

export const NAG = {
  graceMs: 7 * DAY,
  graceLaunches: 5,
  intervalMs: 14 * DAY,
  /** '나중에'를 누른 횟수별 다음 간격 — 마지막 값을 계속 쓴다 */
  snoozeMs: [14 * DAY, 30 * DAY, 60 * DAY],
  /** 마지막 입력 뒤 이만큼은 띄우지 않는다 */
  idleMs: 10_000,
  /** 시작 흐름이 끝난 뒤 첫 시도까지 (3–10분 사이 무작위) */
  firstTryMs: [3 * 60_000, 10 * 60_000],
  /** 가드에 막히면 다시 볼 간격 */
  retryMs: 60_000,
} as const;

export interface NagState {
  firstRunAt: number;
  launches: number;
  /** 저장 성공 횟수 — 지금은 세기만 한다 */
  saves: number;
  lastShownAt: number | null;
  /** '나중에'를 누른 횟수 */
  snoozes: number;
  /** 이 시각 전에는 띄우지 않는다 */
  nextAt: number | null;
}

/** 띄우면 안 되는 순간 — 하나라도 걸리면 이번에는 건너뛴다 */
export interface NagGuards {
  /** 한글 IME 조합 중 (editor.view.composing) */
  composing: boolean;
  /** 마지막 키·마우스 입력 뒤 지난 시간 */
  idleMs: number;
  /** 저장·인쇄·내보내기 중 */
  busy: boolean;
  /** 열린 `<dialog>`가 있음 — 앱 팝업(showChoice)은 열린 팝업을 닫아 저장 충돌 질문을 취소시킨다(dialog.ts) */
  dialogOpen: boolean;
  /** 창에 포커스가 있음 */
  focused: boolean;
  /** 관리자 권한 실행 — Store 구매 창이 뜨지 않는다 */
  elevated: boolean;
}

const NAG_KEY = "nag";

function isNagState(v: unknown): v is NagState {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  const numOrNull = (x: unknown) => x === null || num(x);
  return num(s.firstRunAt) && num(s.launches) && num(s.saves) && numOrNull(s.lastShownAt) && num(s.snoozes) && numOrNull(s.nextAt);
}

export function readNagState(): NagState | null {
  return readPref<NagState | null>(NAG_KEY, null, (v): v is NagState | null => v === null || isNagState(v));
}

export function writeNagState(state: NagState): void {
  writePref(NAG_KEY, state);
}

/** 실행 한 번 — 처음이면 첫 실행 시각을 남긴다 */
export function recordLaunch(state: NagState | null, now: number): NagState {
  const base = state ?? { firstRunAt: now, launches: 0, saves: 0, lastShownAt: null, snoozes: 0, nextAt: null };
  return { ...base, launches: base.launches + 1 };
}

export function recordSave(state: NagState): NagState {
  return { ...state, saves: state.saves + 1 };
}

/** 띄웠다 — 아무것도 누르지 않고 끝나도 다음은 14일 뒤 */
export function afterShown(state: NagState, now: number): NagState {
  return { ...state, lastShownAt: now, nextAt: now + NAG.intervalMs };
}

/** '나중에'·닫기 — 누를 때마다 간격이 늘어난다 (14 → 30 → 60일) */
export function afterSnooze(state: NagState, now: number): NagState {
  const wait = NAG.snoozeMs[Math.min(state.snoozes, NAG.snoozeMs.length - 1)];
  return { ...state, snoozes: state.snoozes + 1, nextAt: now + wait };
}

/** 권유 대상인지 — 구매자·Store 밖 설치본은 아니다. 개발용 무료 흉내는 대상(시험용) */
export function nagApplies(e: Entitlement, kind: InstallKind | null): boolean {
  if (isSupporter(e)) return false;
  return kind === "packaged" || e.source === "dev";
}

/** 시간 조건 — 유예(7일·5회)가 지났고 다음 시각이 됐는지 */
export function nagDue(state: NagState, now: number): boolean {
  if (now - state.firstRunAt < NAG.graceMs || state.launches < NAG.graceLaunches) return false;
  return state.nextAt === null || now >= state.nextAt;
}

export function nagBlocked(g: NagGuards): boolean {
  return g.composing || g.idleMs < NAG.idleMs || g.busy || g.dialogOpen || !g.focused || g.elevated;
}

/** 지금 띄울지 — 대상 · 시간 · 가드를 모두 본다 */
export function shouldNag(state: NagState, now: number, guards: NagGuards, e: Entitlement, kind: InstallKind | null): boolean {
  return nagApplies(e, kind) && nagDue(state, now) && !nagBlocked(guards);
}
