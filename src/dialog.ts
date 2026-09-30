/**
 * 앱 안 알림·확인·선택 팝업 — 네이티브 MessageBox 대신 `<dialog>`를 써서 테마·다크 모드를 따른다.
 * Esc·바깥 닫기는 취소로 끝난다. 버튼은 부를 때마다 새로 만든다(선택지 개수가 다르다).
 */

export interface Choice {
  value: string;
  label: string;
  /** primary: 권하는 동작(파랑), danger: 되돌릴 수 없는 동작(빨강), 없으면 보통 */
  kind?: "primary" | "danger";
}

export interface ChoiceOptions {
  title: string;
  message: string;
  /** 경로처럼 길고 끊겨도 되는 부가 정보 — 작은 상자에 따로 보인다 */
  detail?: string;
  choices: Choice[];
  /** 있으면 취소 버튼 (눌러도 Esc와 같이 null). 가로 배치에서는 CSS가 맨 왼쪽에 둔다 */
  cancelLabel?: string;
  /** 처음 포커스를 둘 선택지 value. 없으면 primary, 그다음 마지막 선택지 */
  focus?: string;
  /** 선택지가 많을 때 버튼을 세로로 쌓는다 */
  vertical?: boolean;
}

const dialog = document.querySelector<HTMLDialogElement>("#app-dialog")!;
const titleEl = dialog.querySelector<HTMLElement>("#dialog-title")!;
const messageEl = dialog.querySelector<HTMLElement>("#dialog-message")!;
const detailEl = dialog.querySelector<HTMLElement>("#dialog-detail")!;
const actions = dialog.querySelector<HTMLElement>(".dialog-actions")!;

function button(value: string, label: string, kind?: Choice["kind"]): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "submit";
  b.value = value;
  b.textContent = label;
  if (kind) b.className = kind;
  return b;
}

/** 고른 선택지의 value, 취소·Esc·바깥 클릭이면 null */
export function showChoice(options: ChoiceOptions): Promise<string | null> {
  if (dialog.open) dialog.close();
  titleEl.textContent = options.title;
  messageEl.textContent = options.message;
  detailEl.textContent = options.detail ?? "";
  detailEl.hidden = !options.detail;

  const buttons = options.choices.map((c) => button(c.value, c.label, c.kind));
  const cancel = options.cancelLabel ? button("", options.cancelLabel) : null;
  actions.replaceChildren(...buttons, ...(cancel ? [cancel] : []));
  actions.classList.toggle("vertical", options.vertical === true);

  dialog.returnValue = "";
  dialog.showModal();
  const focusTarget =
    buttons.find((b) => b.value === options.focus) ??
    buttons.find((b) => b.classList.contains("primary")) ??
    cancel ??
    buttons[buttons.length - 1];
  focusTarget?.focus();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "" ? null : dialog.returnValue), { once: true });
  });
}

export interface DialogOptions {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  /** 있으면 취소 버튼을 보인다 (확인 대화) */
  cancelLabel?: string;
  /** 되돌릴 수 없는 동작 — 확인 버튼을 붉게, 처음 포커스는 취소에 둔다 */
  danger?: boolean;
}

/** 확인을 누르면 true. 알림(취소 버튼 없음)은 닫히면 끝나므로 반환값을 무시해도 된다 */
export async function showDialog(options: DialogOptions): Promise<boolean> {
  const picked = await showChoice({
    title: options.title,
    message: options.message,
    detail: options.detail,
    choices: [{ value: "ok", label: options.confirmLabel ?? "확인", kind: options.danger ? "danger" : "primary" }],
    cancelLabel: options.cancelLabel,
    focus: options.danger && options.cancelLabel ? "__cancel__" : "ok",
  });
  return picked === "ok";
}

// 바깥(backdrop)을 누르면 취소로 닫는다. 대화 상자 안의 클릭은 target이 내부 요소라 걸리지 않는다
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
