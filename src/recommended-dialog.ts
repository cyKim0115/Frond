/**
 * '추천 테마' 팝업 — 설정 '테마' 탭 목록 머리의 '추천 테마…' 버튼이 연다 (src/theme-panel.ts가 만든다).
 * 추천 테마는 앱에 들어 있어(theme/catalog.ts) 설정 선택지에 늘 있다. 이 팝업은 팔레트·설명을 보며 고르는 곳이고,
 * '적용'은 설정 '테마'로 고른다 — 팝업은 열어 둔 채 여러 테마를 차례로 입혀 볼 수 있다.
 * 2026-10-06 전에는 '추가'하면 테마 폴더에 복사했다(store-launch A-2에서 바꿈 — 그 사본은 catalog.ts가 한 번만 보이게 한다).
 */

import { RECOMMENDED_GROUPS, RECOMMENDED_THEMES, type RecommendedTheme } from "./theme/recommended";
import type { ThemeDef } from "./theme/themes";

export interface RecommendedDialogHooks {
  /** 설정 '테마'로 고른다 */
  apply(id: string): void;
  /** 지금 화면에 적용된 테마 id */
  currentThemeId(): string;
  /** 테마 미리보기 칩 — 테마 목록과 같은 모양 */
  chips(theme: ThemeDef): HTMLElement;
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

  function item(entry: RecommendedTheme): HTMLElement {
    const { theme } = entry;
    const current = theme.id === hooks.currentThemeId();
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
    info.append(meta);

    const actions = el("span", "theme-item-actions");
    const apply = el("button", "theme-btn", current ? "사용 중" : "적용");
    apply.type = "button";
    apply.disabled = current;
    apply.title = "이 테마로 바꿉니다 (설정 '테마')";
    apply.addEventListener("click", () => hooks.apply(theme.id));
    actions.append(apply);

    li.append(hooks.chips(theme), info, actions);
    return li;
  }

  function render(): void {
    const keep = body.scrollTop;
    body.replaceChildren(
      ...RECOMMENDED_GROUPS.map((group) => {
        const section = el("section", "rec-group");
        const head = el("div", "rec-group-head");
        head.append(el("h3", undefined, group.label));
        if (group.source) head.append(el("span", "rec-source", group.source));
        const list = el("ul", "theme-list");
        list.append(...RECOMMENDED_THEMES.filter((e) => e.group === group.id).map(item));
        section.append(head, list);
        return section;
      }),
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
