/**
 * 테마 카탈로그 — 설정 선택지·테마 목록·적용 테마가 보는 한 목록 (store-launch A-2).
 *
 * 순서: 내장(라이트·다크) → 추천(recommended.ts, 앱에 박힌 무료 테마) → 사용자(테마 폴더).
 * 추천 테마는 2026-10-06까지 '추가'하면 테마 폴더에 복사됐다. 그 사본은 지우지 않고 이렇게 다룬다:
 * - 추천 테마와 이름·색이 같은 사본 → 목록에 한 번만(추천으로) 보인다
 * - 사용자가 고친 사본(같은 id, 다른 색) → 사용자 테마로 보이고 같은 id의 추천 테마를 가린다
 *
 * themes.ts와 recommended.ts가 서로를 부르지 않게 합치는 일은 여기서 한다.
 */

import { RECOMMENDED_THEMES } from "./recommended";
import { BUILTIN_THEMES, listUserThemes, resolveTheme, type ThemeDef } from "./themes";

export type ThemeOrigin = "builtin" | "recommended" | "user";

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
  const recommended = RECOMMENDED_THEMES.map((e) => e.theme);
  const recommendedById = new Map(recommended.map((t) => [t.id, t]));
  const usersById = new Map(users.map((t) => [t.id, t]));
  const entries: CatalogEntry[] = BUILTIN_THEMES.map((theme) => ({ theme, origin: "builtin" }));
  for (const theme of recommended) {
    const copy = usersById.get(theme.id);
    if (copy && !sameTheme(copy, theme)) continue;
    entries.push({ theme, origin: "recommended" });
  }
  for (const theme of users) {
    const original = recommendedById.get(theme.id);
    if (original && sameTheme(theme, original)) continue;
    entries.push({ theme, origin: "user" });
  }
  cache = { users, entries };
  return entries;
}

/** 내장 → 추천 → 사용자 */
export function listThemes(): readonly ThemeDef[] {
  return catalogEntries().map((e) => e.theme);
}

export function findTheme(id: string): ThemeDef | undefined {
  return catalogEntries().find((e) => e.theme.id === id)?.theme;
}

export function themeOrigin(id: string): ThemeOrigin | undefined {
  return catalogEntries().find((e) => e.theme.id === id)?.origin;
}
