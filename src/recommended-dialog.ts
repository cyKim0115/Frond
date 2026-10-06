/**
 * '추천 테마' 팝업 — 설정 '테마' 탭 목록 머리의 '추천 테마…' 버튼이 연다 (src/theme-panel.ts가 만든다).
 * 추천 테마는 앱에 들어 있어(theme/catalog.ts) 설정 선택지에 늘 있다. 이 팝업은 팔레트·설명을 보며 고르는 곳이고,
 * '적용'은 설정 '테마'로 고른다 — 팝업은 열어 둔 채 여러 테마를 차례로 입혀 볼 수 있다.
 * 2026-10-06 전에는 '추가'하면 테마 폴더에 복사했다(store-launch A-2에서 바꿈 — 그 사본은 catalog.ts가 한 번만 보이게 한다).
 * 맨 아래 '구매자 전용' 묶음(theme/supporter.ts)은 누구나 미리보기만 하고, 적용은 구매자만 한다(store-launch A-3).
 * 잠금은 카탈로그 출처로 정한다 — 테마 폴더에 같은 id의 고친 사본이 있으면 그 사본(사용자 테마)이 적용되므로 사용자 테마 권리를 본다.
 */

import { themeOrigin, type ThemeOrigin } from "./theme/catalog";
import { RECOMMENDED_GROUPS, RECOMMENDED_THEMES } from "./theme/recommended";
import { SUPPORTER_THEMES } from "./theme/supporter";
import type { ThemeDef } from "./theme/themes";

export interface RecommendedDialogHooks {
  /** 설정 '테마'로 고른다 */
  apply(id: string): void;
  /** 지금 화면에 적용된 테마 id */
  currentThemeId(): string;
  /** 테마 미리보기 칩 — 테마 목록과 같은 모양 */
  chips(theme: ThemeDef): HTMLElement;
  /** 지금 권리로 이 출처의 테마를 적용할 수 있는지 (license.ts `canUseTheme`) */
  canUse(origin: ThemeOrigin): boolean;
  /** 막힌 테마의 '적용'을 눌렀을 때 */
  showPurchaseInfo(): void;
}

/** 팝업 한 줄 — 추천 테마(recommended.ts)와 구매자 전용 테마(supporter.ts)를 같은 모양으로 */
interface Entry {
  theme: ThemeDef;
  origin: ThemeOrigin;
  description: string;
  palette?: readonly string[];
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initRecommendedDialog(hooks: RecommendedDialogHooks): { open(): void; refresh(): void } {
  const dialog = document.querySelector<HTMLDialogElement>("#recommended-dialog")!;
  const body = dialog.querySelector<HTMLElement>("#recommended-body")!;

  function item(entry: Entry): HTMLElement {
    const { theme } = entry;
    const usable = hooks.canUse(entry.origin);
    const current = usable && theme.id === hooks.currentThemeId();
    const li = el("li", "theme-item");
    if (current) li.setAttribute("aria-current", "true");

    const info = el("span", "theme-info");
    info.append(el("span", "theme-name", theme.name));
    const meta = el("span", "theme-meta");
    if (entry.palette) {
      const strip = el("span", "rec-palette");
      strip.title = `원본 팔레트 ${entry.palette.join(" ")}`;
      for (const color of entry.palette) {
        const swatch = el("span");
        swatch.style.background = color;
        strip.append(swatch);
      }
      meta.append(strip);
    }
    meta.append(`${theme.base === "dark" ? "다크" : "라이트"} · ${entry.description}`);
    if (entry.origin === "user") meta.append(" · 테마 폴더의 고친 사본이 적용됩니다");
    info.append(meta);

    const actions = el("span", "theme-item-actions");
    const apply = el("button", "theme-btn", current ? "사용 중" : "적용");
    apply.type = "button";
    apply.disabled = current;
    apply.title = usable ? "이 테마로 바꿉니다 (설정 '테마')" : "구매자 기능입니다 — 눌러서 안내를 봅니다";
    apply.addEventListener("click", () => (usable ? hooks.apply(theme.id) : hooks.showPurchaseInfo()));
    actions.append(apply);

    li.append(hooks.chips(theme), info, actions);
    return li;
  }

  function group(label: string, source: string | undefined, entries: readonly Entry[], locked = false): HTMLElement {
    const section = el("section", "rec-group");
    const head = el("div", "rec-group-head");
    const title = el("h3", undefined, label);
    if (locked) title.append(" ", el("span", "lock-badge", "구매자 기능"));
    head.append(title);
    if (source) head.append(el("span", "rec-source", source));
    const list = el("ul", "theme-list");
    list.append(...entries.map(item));
    section.append(head, list);
    return section;
  }

  function render(): void {
    const keep = body.scrollTop;
    const supporterLocked = !hooks.canUse("supporter");
    body.replaceChildren(
      ...RECOMMENDED_GROUPS.map((g) =>
        group(
          g.label,
          g.source,
          RECOMMENDED_THEMES.filter((e) => e.group === g.id).map((e) => ({ ...e, origin: themeOrigin(e.theme.id) ?? "recommended" })),
        ),
      ),
      group(
        "구매자 전용",
        supporterLocked ? "미리보기는 누구나 — 적용은 구매하면 열립니다" : "구매해 주셔서 고맙습니다",
        SUPPORTER_THEMES.map((e) => ({ ...e, origin: themeOrigin(e.theme.id) ?? "supporter" })),
        supporterLocked,
      ),
    );
    body.scrollTop = keep;
  }

  // 바깥(backdrop)을 누르면 닫는다
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    open() {
      render();
      body.scrollTop = 0;
      if (!dialog.open) dialog.showModal();
    },
    refresh() {
      if (dialog.open) render();
    },
  };
}
