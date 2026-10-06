/**
 * 설정 '테마' 탭의 테마 목록·가져오기 (로드맵 S-4) — settings-dialog의 커스텀 패널(`addPanel("theme", …)`).
 *
 * 목록 = 내장 + 테마 폴더(`%APPDATA%\Frond\themes\*.json`). 폴더가 원본이고 localStorage 캐시는 시작용이다(themes.ts).
 * 가져오기는 파일을 검증(`parseThemeFile`: 토큰 이름·색 값, url()·@import 거부)한 뒤에만 폴더에 복사한다.
 * 파일 읽기·쓰기는 백엔드 커맨드(themes.rs) — fs 플러그인 금지.
 */

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { showChoice, showDialog } from "./dialog";
import { initRecommendedDialog } from "./recommended-dialog";
import { getSetting, onSettingChange, setSetting, SETTINGS } from "./settings";
import {
  isBuiltinTheme,
  listThemes,
  parseThemeFile,
  resolveTheme,
  setUserThemes,
  type ThemeDef,
  themeToJson,
} from "./theme/themes";

interface ThemeFileText {
  stem: string;
  text: string;
}

export interface ThemePanelHooks {
  isTauri: boolean;
  /** 지금 화면에 적용된 테마 id (시스템 설정 따르기면 그 쌍 중 하나) */
  currentThemeId(): string;
  /** 목록이 바뀌었을 때 — 설정 선택지를 다시 채우고 적용 테마를 다시 고른다 */
  onListChanged(): void;
}

const CHIP_TOKENS: [group: "shell" | "doc", key: string, label: string][] = [
  ["shell", "bg", "배경"],
  ["shell", "sidebar-bg", "사이드바"],
  ["shell", "fg", "글자"],
  ["shell", "accent", "강조"],
  ["doc", "color-prettylights-syntax-keyword", "코드 키워드"],
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(label: string, onClick: () => void, title?: string): HTMLButtonElement {
  const b = el("button", "theme-btn", label);
  b.type = "button";
  if (title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}

/** 테마 배경 위에 주요 토큰 색을 점으로 늘어놓은 미리보기 — 테마 목록·추천 테마 팝업이 같이 쓴다 */
function themeChips(theme: ThemeDef): HTMLElement {
  const resolved = resolveTheme(theme);
  const chips = el("span", "theme-chips");
  chips.style.background = resolved.shell.bg;
  for (const [group, key, label] of CHIP_TOKENS) {
    const chip = el("span", "theme-chip");
    chip.style.background = group === "shell" ? resolved.shell[key as keyof typeof resolved.shell] : resolved.doc[key as keyof typeof resolved.doc];
    chip.title = label;
    chips.append(chip);
  }
  return chips;
}

export function createThemePanel(hooks: ThemePanelHooks): { element: HTMLElement; reload(): Promise<void> } {
  const root = el("div", "theme-panel");
  const head = el("div", "theme-panel-head");
  head.append(el("h3", undefined, "테마 목록"));
  const headActions = el("div", "theme-panel-actions");
  const recommendedButton = button("추천 테마…", () => recommended.open(), "미리 골라 둔 테마(세피아·웨딩 팔레트 20종)를 목록에 더합니다");
  const importButton = button("가져오기…", () => void importTheme(), "테마 파일(.json)을 골라 테마 폴더에 복사합니다");
  const folderButton = button("폴더 열기", () => void invoke("open_themes_folder").catch((e) => alertError(e)), "테마 폴더를 탐색기로 엽니다 — 직접 넣은 파일은 '다시 읽기'로 목록에 올립니다");
  const reloadButton = button("다시 읽기", () => void reload(), "테마 폴더를 다시 읽습니다");
  headActions.append(recommendedButton, importButton, folderButton, reloadButton);
  head.append(headActions);
  const list = el("ul", "theme-list");
  const problems = el("p", "theme-problems");
  problems.hidden = true;
  const hint = el(
    "p",
    "theme-hint",
    "테마 파일은 색 토큰만 담는 JSON입니다 (id·name·base·shell·doc). '복제'로 만든 파일을 폴더에서 고쳐 쓰면 편합니다. 형식은 README '테마 파일' 절 참고.",
  );
  root.append(head, list, problems, hint);
  if (!hooks.isTauri) {
    for (const b of [importButton, folderButton, reloadButton]) b.disabled = true;
    hint.textContent = "브라우저 미리보기에서는 테마 폴더가 없어 추천 테마를 이 브라우저에만 임시로 더합니다.";
  }

  async function alertError(error: unknown): Promise<void> {
    await showDialog({ title: "테마 작업을 하지 못했습니다", message: String(error) });
  }

  function render(): void {
    const current = hooks.currentThemeId();
    const selected = getSetting("theme");
    list.replaceChildren(
      ...listThemes().map((theme) => {
        const li = el("li", "theme-item");
        if (theme.id === current) li.setAttribute("aria-current", "true");

        const chips = themeChips(theme);

        const info = el("span", "theme-info");
        info.title = isBuiltinTheme(theme.id) ? "내장 테마" : `테마 폴더의 ${theme.id}.json`;
        info.append(el("span", "theme-name", theme.name));
        const kind = isBuiltinTheme(theme.id) ? "내장" : "파일";
        // 사용 중인 테마는 항목 테두리(aria-current)로 보인다
        info.append(el("span", "theme-meta", `${theme.base === "dark" ? "다크" : "라이트"} · ${kind}`));

        const actions = el("span", "theme-item-actions");
        const apply = button("적용", () => setSetting("theme", theme.id), "이 테마로 고정합니다 (설정 '테마')");
        apply.disabled = selected === theme.id;
        actions.append(apply);
        if (hooks.isTauri) {
          actions.append(button("복제", () => void duplicate(theme), "모든 토큰을 채운 사본 파일을 테마 폴더에 만듭니다"));
          actions.append(button("내보내기", () => void exportTheme(theme), "JSON 파일로 저장합니다"));
          if (!isBuiltinTheme(theme.id)) actions.append(button("삭제", () => void remove(theme), "테마 폴더에서 지웁니다"));
        }
        li.append(chips, info, actions);
        return li;
      }),
    );
    recommended.refresh();
  }

  async function reload(): Promise<void> {
    if (!hooks.isTauri) {
      render();
      return;
    }
    let files: ThemeFileText[];
    try {
      files = await invoke<ThemeFileText[]>("list_user_themes");
    } catch (e) {
      await alertError(e);
      return;
    }
    const themes: ThemeDef[] = [];
    const bad: string[] = [];
    for (const file of files) {
      const parsed = parseThemeFile(file.text, file.stem);
      if (parsed.ok && !themes.some((t) => t.id === parsed.theme.id)) themes.push(parsed.theme);
      else if (!parsed.ok) bad.push(`${file.stem}.json — ${parsed.errors[0]}`);
    }
    setUserThemes(themes);
    problems.hidden = bad.length === 0;
    problems.textContent = bad.length ? `읽지 못한 테마 파일 ${bad.length}개: ${bad.join(" / ")}` : "";
    hooks.onListChanged();
    render();
  }

  /** 추천 테마를 목록에 더한다 — 테마 폴더에 저장하고 다시 읽는다. 브라우저 미리보기는 캐시에만 더한다 */
  async function addThemes(themes: readonly ThemeDef[]): Promise<boolean> {
    if (themes.length === 0) return true;
    if (!hooks.isTauri) {
      setUserThemes([...listThemes().filter((t) => !isBuiltinTheme(t.id)), ...themes]);
      hooks.onListChanged();
      render();
      return true;
    }
    let ok = true;
    try {
      for (const theme of themes) await invoke("save_user_theme", { id: theme.id, json: themeToJson(theme) });
    } catch (e) {
      ok = false;
      await alertError(e);
    }
    await reload();
    return ok;
  }

  const recommended = initRecommendedDialog({
    has: (id) => listThemes().some((t) => t.id === id),
    add: addThemes,
    apply: (id) => setSetting("theme", id),
    currentThemeId: hooks.currentThemeId,
    chips: themeChips,
  });

  async function importTheme(): Promise<void> {
    const picked = await openDialog({ multiple: false, directory: false, filters: [{ name: "테마 JSON", extensions: ["json"] }] });
    if (typeof picked !== "string") return;
    let file: ThemeFileText;
    try {
      file = await invoke<ThemeFileText>("read_theme_file", { path: picked });
    } catch (e) {
      await alertError(e);
      return;
    }
    const parsed = parseThemeFile(file.text, file.stem);
    if (!parsed.ok) {
      // 잘못된 파일이면 아무것도 저장하지 않고 이유(어느 키·값)를 보인다
      await showDialog({ title: "가져올 수 없는 테마 파일", message: parsed.errors.join("\n"), detail: picked });
      return;
    }
    const { theme, warnings } = parsed;
    if (listThemes().some((t) => t.id === theme.id)) {
      const ok = await showDialog({
        title: "같은 id의 테마가 있습니다",
        message: `'${theme.id}' 테마를 새 파일 내용으로 바꿀까요?`,
        confirmLabel: "바꾸기",
        cancelLabel: "취소",
      });
      if (!ok) return;
    }
    try {
      await invoke("save_user_theme", { id: theme.id, json: themeToJson(theme) });
    } catch (e) {
      await alertError(e);
      return;
    }
    await reload();
    const choice = await showChoice({
      title: "테마를 가져왔습니다",
      message: `'${theme.name}'을(를) 목록에 추가했습니다.${warnings.length ? `\n무시한 항목: ${warnings.join(", ")}` : ""}`,
      choices: [{ value: "apply", label: "지금 적용", kind: "primary" }],
      cancelLabel: "닫기",
    });
    if (choice === "apply") setSetting("theme", theme.id);
  }

  async function duplicate(theme: ThemeDef): Promise<void> {
    const ids = new Set(listThemes().map((t) => t.id));
    let id = `${theme.id}-copy`;
    for (let n = 2; ids.has(id); n++) id = `${theme.id}-copy-${n}`;
    const copy: ThemeDef = { ...resolveTheme(theme), id, name: `${theme.name} 사본` };
    try {
      await invoke("save_user_theme", { id, json: themeToJson(copy, true) });
    } catch (e) {
      await alertError(e);
      return;
    }
    await reload();
    await showDialog({
      title: "테마를 복제했습니다",
      message: `'${copy.name}'(${id}.json)을 테마 폴더에 만들었습니다. '폴더 열기'로 파일의 색 값을 고친 뒤 '다시 읽기'를 누르면 바뀐 색이 보입니다.`,
    });
  }

  async function exportTheme(theme: ThemeDef): Promise<void> {
    const target = await saveDialog({ defaultPath: `${theme.id}.json`, filters: [{ name: "테마 JSON", extensions: ["json"] }] });
    if (!target) return;
    try {
      await invoke("export_theme", { path: target, json: themeToJson(theme, isBuiltinTheme(theme.id)) });
    } catch (e) {
      await alertError(e);
    }
  }

  async function remove(theme: ThemeDef): Promise<void> {
    const ok = await showDialog({
      title: "테마 삭제",
      message: `'${theme.name}'(${theme.id}.json)을 테마 폴더에서 지울까요? 쓰고 있었다면 ${theme.base === "dark" ? "다크" : "라이트"} 내장 테마로 바뀝니다.`,
      confirmLabel: "삭제",
      cancelLabel: "취소",
      danger: true,
    });
    if (!ok) return;
    try {
      await invoke("delete_user_theme", { id: theme.id });
    } catch (e) {
      await alertError(e);
      return;
    }
    // 지운 테마를 가리키던 설정은 base 쪽 내장 테마로 (스펙 S-4)
    if (getSetting("theme") === theme.id) setSetting("theme", theme.base);
    if (getSetting("themeLight") === theme.id) setSetting("themeLight", SETTINGS.themeLight.default);
    if (getSetting("themeDark") === theme.id) setSetting("themeDark", SETTINGS.themeDark.default);
    await reload();
  }

  onSettingChange((key) => {
    if (key === "theme" || key === "themeLight" || key === "themeDark") render();
  });
  render();
  return { element: root, reload };
}
