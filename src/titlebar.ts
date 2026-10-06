/**
 * 커스텀 제목 표시줄 — 창 테두리(decorations)를 끄고(lib.rs) 각 열의 머리 띠(.col-header)를 제목 표시줄로 쓴다.
 * 본문 열 머리 띠 가운데에는 열린 문서 탭(tabs.ts)이 있다.
 * 띠의 빈 곳을 누르면 창 이동, 두 번 누르면 최대화 전환. 캡션 버튼 글리프는 Windows 아이콘 글꼴(Segoe Fluent/MDL2).
 */

import { getCurrentWindow } from "@tauri-apps/api/window";

const GLYPH_MAXIMIZE = "";
const GLYPH_RESTORE = "";

export function initTitlebar(): void {
  const win = getCurrentWindow();
  const maxButton = document.querySelector<HTMLButtonElement>("#win-max")!;

  document.querySelector("#win-min")!.addEventListener("click", () => void win.minimize());
  maxButton.addEventListener("click", () => void win.toggleMaximize());
  document.querySelector("#win-close")!.addEventListener("click", () => void win.close());

  // Tauri drag.js와 같은 규칙: 첫 누름은 네이티브 이동 루프(Aero Snap 포함), 두 번째 누름(detail 2)은 최대화 전환.
  // 버튼·링크·손잡이 위에서는 드래그하지 않는다
  document.addEventListener("mousedown", (event) => {
    const target = event.target as Element;
    if (event.button !== 0 || !target.closest(".drag-region")) return;
    // 탭(tabs.ts)은 누르기·끌어서 순서 바꾸기를 직접 처리한다
    if (target.closest("button, a, input, [role='separator'], [role='tab']")) return;
    event.preventDefault();
    void (event.detail === 2 ? win.toggleMaximize() : win.startDragging());
  });

  const syncMaximized = async (): Promise<void> => {
    const maximized = await win.isMaximized();
    maxButton.textContent = maximized ? GLYPH_RESTORE : GLYPH_MAXIMIZE;
    maxButton.title = maximized ? "이전 크기로 복원" : "최대화";
    maxButton.setAttribute("aria-label", maxButton.title);
  };
  void syncMaximized();
  void win.onResized(() => void syncMaximized());
}
