/**
 * 앱 안 알림·확인 팝업 — 네이티브 MessageBox 대신 `<dialog>`를 써서 테마·다크 모드를 따른다.
 * Esc·바깥 닫기는 취소(false)로 끝난다.
 */

export interface DialogOptions {
  title: string;
  message: string;
  /** 경로처럼 길고 끊겨도 되는 부가 정보 — 작은 상자에 따로 보인다 */
  detail?: string;
  confirmLabel?: string;
  /** 있으면 취소 버튼을 보인다 (확인 대화) */
  cancelLabel?: string;
  /** 되돌릴 수 없는 동작 — 확인 버튼을 붉게, 처음 포커스는 취소에 둔다 */
  danger?: boolean;
}

const dialog = document.querySelector<HTMLDialogElement>("#app-dialog")!;
const titleEl = dialog.querySelector<HTMLElement>("#dialog-title")!;
const messageEl = dialog.querySelector<HTMLElement>("#dialog-message")!;
const detailEl = dialog.querySelector<HTMLElement>("#dialog-detail")!;
const okButton = dialog.querySelector<HTMLButtonElement>("#dialog-ok")!;
const cancelButton = dialog.querySelector<HTMLButtonElement>("#dialog-cancel")!;

/** 확인을 누르면 true. 알림(취소 버튼 없음)은 닫히면 끝나므로 반환값을 무시해도 된다 */
export function showDialog(options: DialogOptions): Promise<boolean> {
  if (dialog.open) dialog.close();
  titleEl.textContent = options.title;
  messageEl.textContent = options.message;
  detailEl.textContent = options.detail ?? "";
  detailEl.hidden = !options.detail;
  okButton.textContent = options.confirmLabel ?? "확인";
  okButton.className = options.danger ? "danger" : "primary";
  cancelButton.textContent = options.cancelLabel ?? "취소";
  cancelButton.hidden = !options.cancelLabel;

  dialog.returnValue = "";
  dialog.showModal();
  (options.danger && options.cancelLabel ? cancelButton : okButton).focus();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}

// 바깥(backdrop)을 누르면 취소로 닫는다. 대화 상자 안의 클릭은 target이 내부 요소라 걸리지 않는다
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
