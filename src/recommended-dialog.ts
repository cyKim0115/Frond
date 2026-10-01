/**
 * '추천 테마' 팝업 — 설정 '테마' 탭 목록 머리의 '추천 테마…' 버튼이 연다 (src/theme-panel.ts가 만든다).
 * 항목을 '추가'하면 사용자 테마로 테마 폴더에 저장되고(가져오기와 같은 길) 테마 목록·선택지에 나타난다.
 * '적용'은 아직 없으면 추가한 뒤 바로 고른다 — 팝업은 열어 둔 채 여러 테마를 차례로 입혀 볼 수 있다.
 */

import { RECOMMENDED_GROUPS, RECOMMENDED_THEMES, type RecommendedTheme } from "./theme/recommended";
import type { ThemeDef } from "./theme/themes";

export interface RecommendedDialogHooks {
  /** 이미 테마 목록에 있는 id인지 */
  has(id: string): boolean;
  /** 테마 목록에 더한다. 하나라도 실패하면 false (이유는 hooks 쪽이 알린다) */
  add(themes: readonly ThemeDef[]): Promise<boolean>;
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
  const addAll = dialog.querySelector<HTMLButtonElement>("#recommended-add-all")!;
  /** 저장 중에는 버튼을 막는다 (테마 폴더 쓰기가 끝나기 전에 또 누르지 않게) */
  let busy = false;

  async function run(task: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true;
    render();
    try {
      await task();
    } finally {
      busy = false;
      render();
    }
  }

  function item(entry: RecommendedTheme): HTMLElement {
    const { theme } = entry;
    const added = hooks.has(theme.id);
    const li = el("li", "theme-item");
    if (added && theme.id === hooks.currentThemeId()) li.setAttribute("aria-current", "true");

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
    const add = el("button", "theme-btn", added ? "추가됨" : "추가");
    add.type = "button";
    add.disabled = added || busy;
    add.title = added ? "이미 테마 목록에 있습니다" : "테마 목록에 더합니다 (테마 폴더에 저장)";
    add.addEventListener("click", () => void run(async () => void (await hooks.add([theme]))));
    const apply = el("button", "theme-btn", "적용");
    apply.type = "button";
    apply.disabled = busy;
    apply.title = added ? "이 테마로 바꿉니다" : "테마 목록에 더하고 바로 적용합니다";
    apply.addEventListener("click", () =>
      void run(async () => {
        if (hooks.has(theme.id) || (await hooks.add([theme]))) hooks.apply(theme.id);
      }),
    );
    actions.append(add, apply);

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
    const missing = RECOMMENDED_THEMES.filter((e) => !hooks.has(e.theme.id)).length;
    addAll.textContent = missing ? `모두 추가 (${missing})` : "모두 추가됨";
    addAll.disabled = missing === 0 || busy;
  }

  addAll.addEventListener("click", () =>
    void run(async () => void (await hooks.add(RECOMMENDED_THEMES.map((e) => e.theme).filter((t) => !hooks.has(t.id))))),
  );
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
