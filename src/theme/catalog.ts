/**
 * 테마 카탈로그 — 설정 선택지·테마 목록·적용 테마가 보는 한 목록 (store-launch A-2).
 *
 * 순서: 내장(라이트·다크) → 추천(recommended.ts, 앱에 박힌 무료 테마) → 구매자 전용(supporter.ts) → 사용자(테마 폴더).
 * 쓸 수 있는지(권리)는 여기서 거르지 않는다 — 목록에서 빼면 설정값이 지워진다. 적용 단계에서 license.ts `canUseTheme`로 가린다.
 * 추천 테마는 2026-10-06까지 '추가'하면 테마 폴더에 복사됐다. 그 사본은 지우지 않고 이렇게 다룬다(구매자 전용도 같다):
 * - 앱 테마와 이름·색이 같은 사본 → 목록에 한 번만(앱 테마로) 보인다
 * - 사용자가 고친 사본(같은 id, 다른 색) → 사용자 테마로 보이고 같은 id의 앱 테마를 가린다
 *
 * themes.ts와 recommended.ts가 서로를 부르지 않게 합치는 일은 여기서 한다.
 */

import { RECOMMENDED_THEMES } from "./recommended";
import { SUPPORTER_THEMES } from "./supporter";
import { BUILTIN_THEMES, listUserThemes, resolveTheme, type ThemeBase, type ThemeDef } from "./themes";

export type ThemeOrigin = "builtin" | "recommended" | "supporter" | "user";

export interface CatalogEntry {
  theme: ThemeDef;
  origin: ThemeOrigin;
}

/** 이름·base·채운 색 토큰이 모두 같은지 — 추천 테마를 그대로 복사한 파일인지 가린다 */
export function sameTheme(a: ThemeDef, b: ThemeDef): boolean {
  if (a.name !== b.name || a.base !== b.base) return false;
  const ra = resolveTheme(a);
  const rb = resolveTheme(b);
  return JSON.stringify([ra.shell, ra.doc]) === JSON.stringify([rb.shell, rb.doc]);
}

let cache: { users: readonly ThemeDef[]; entries: readonly CatalogEntry[] } | null = null;

/** 사용자 목록 배열이 바뀔 때만 다시 만든다 (설정 선택지가 그릴 때마다 부른다) */
export function catalogEntries(): readonly CatalogEntry[] {
  const users = listUserThemes();
  if (cache?.users === users) return cache.entries;
  const bundled: CatalogEntry[] = [
    ...RECOMMENDED_THEMES.map((e): CatalogEntry => ({ theme: e.theme, origin: "recommended" })),
    ...SUPPORTER_THEMES.map((e): CatalogEntry => ({ theme: e.theme, origin: "supporter" })),
  ];
  const bundledById = new Map(bundled.map((e) => [e.theme.id, e.theme]));
  const usersById = new Map(users.map((t) => [t.id, t]));
  const entries: CatalogEntry[] = BUILTIN_THEMES.map((theme) => ({ theme, origin: "builtin" }));
  for (const entry of bundled) {
    const copy = usersById.get(entry.theme.id);
    if (copy && !sameTheme(copy, entry.theme)) continue;
    entries.push(entry);
  }
  for (const theme of users) {
    const original = bundledById.get(theme.id);
    if (original && sameTheme(theme, original)) continue;
    entries.push({ theme, origin: "user" });
  }
  cache = { users, entries };
  return entries;
}

/** 내장 → 추천 → 구매자 전용 → 사용자 */
export function listThemes(): readonly ThemeDef[] {
  return catalogEntries().map((e) => e.theme);
}

export function findTheme(id: string): ThemeDef | undefined {
  return catalogEntries().find((e) => e.theme.id === id)?.theme;
}

export function themeOrigin(id: string): ThemeOrigin | undefined {
  return catalogEntries().find((e) => e.theme.id === id)?.origin;
}

/**
 * 설정이 가리키는 테마를 실제로 보일 테마로 바꾼다 (main.ts `effectiveTheme`). 설정값은 건드리지 않는다.
 * - 못 찾으면(지워진 사용자 테마) `fallbackBase` 쪽 내장 테마
 * - 찾았지만 지금 권리로 쓸 수 없으면(store-launch A-3) 그 테마 쪽(라이트/다크) 내장 테마
 */
export function visibleTheme(wanted: string, fallbackBase: ThemeBase, usable: (origin: ThemeOrigin) => boolean): ThemeDef {
  const entry = catalogEntries().find((e) => e.theme.id === wanted);
  if (entry && usable(entry.origin)) return entry.theme;
  return findTheme(entry?.theme.base ?? fallbackBase)!;
}
