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
