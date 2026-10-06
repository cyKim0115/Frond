/**
 * 구매 화면 (store-launch A-3) — 설정 '정보' 탭(`createAboutPanel`)과 구매자 기능을 눌렀을 때의 안내(`showPurchaseInfo`).
 *
 * 실제 구매·구매 복원은 Store 공급자(license.rs, R-3)가 생긴 뒤에 연다 — 지금 버튼은 비활성이다.
 * 결정 `20261006-store-monetization`: 문서 기능은 막지 않고, 사용자 테마 만들기와 구매자 전용 테마만 판다.
 */

import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { showChoice } from "./dialog";
import { entitlement, entitlementLabel, type InstallKind, installKindLabel, isSupporter } from "./license";

const REPO_URL = "https://github.com/cyKim0115/MdEditor";

/** 무엇이 무료이고 무엇이 열리는지 — 정보 탭과 안내 팝업이 같은 글을 쓴다 */
export const PURCHASE_SUMMARY =
  "보기·편집·저장 등 모든 문서 기능과 내장·추천 테마는 무료입니다. Microsoft Store판에서 한 번 구매하면 사용자 테마 만들기(가져오기·복제)와 구매자 전용 테마가 열립니다.";
const NOT_YET = "구매는 Microsoft Store 출시 뒤에 열립니다.";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** 구매자 기능을 눌렀을 때 — 무엇이 열리는지 알리고 정보 탭으로 안내한다 */
export async function showPurchaseInfo(hooks: { openAbout(): void }): Promise<void> {
  const choice = await showChoice({
    title: "구매자 기능입니다",
    message: `${PURCHASE_SUMMARY}\n${NOT_YET}`,
    choices: [{ value: "about", label: "정보 탭 보기", kind: "primary" }],
    cancelLabel: "닫기",
  });
  if (choice === "about") hooks.openAbout();
}

export interface AboutPanel {
  element: HTMLElement;
  /** 권리가 바뀌었을 때 상태 줄을 다시 쓴다 */
  refresh(): void;
}

export function createAboutPanel(hooks: { isTauri: boolean }): AboutPanel {
  const root = el("div", "about-panel");
  root.append(el("h3", undefined, "Frond"));

  const facts = el("dl", "about-facts");
  const version = el("dd", undefined, "—");
  const install = el("dd", undefined, "—");
  const status = el("dd");
  for (const [label, value] of [
    ["버전", version],
    ["설치 방식", install],
    ["상태", status],
  ] as const) {
    facts.append(el("dt", undefined, label), value);
  }

  const summary = el("p", "about-note", PURCHASE_SUMMARY);
  const actions = el("div", "about-actions");
  const buy = el("button", "theme-btn", "구매하기");
  const restore = el("button", "theme-btn", "구매 복원");
  for (const b of [buy, restore]) {
    b.type = "button";
    b.disabled = true;
    b.title = NOT_YET;
  }
  actions.append(buy, restore);
  const pending = el("p", "about-hint", NOT_YET);
  const elevated = el("p", "about-warn", "관리자 권한으로 실행 중입니다. Store 구매 창은 관리자 권한 창에서 열리지 않을 수 있습니다 — 일반 권한으로 다시 실행해 주세요.");
  elevated.hidden = true;

  const links = el("p", "about-links");
  const repo = el("a", undefined, "GitHub 저장소");
  repo.href = REPO_URL;
  repo.addEventListener("click", (event) => {
    event.preventDefault();
    if (hooks.isTauri) void openUrl(REPO_URL);
    else window.open(REPO_URL, "_blank", "noopener");
  });
  links.append("소스는 MIT 라이선스입니다. \"Frond\" 이름과 앱 아이콘은 따로 보유합니다 · ", repo);

  root.append(facts, summary, actions, pending, elevated, links);

  function refresh(): void {
    status.textContent = entitlementLabel();
    // 이미 구매자(또는 Store 밖 설치본)면 구매 안내 대신 상태만
    const supporter = isSupporter(entitlement());
    actions.hidden = supporter;
    pending.hidden = supporter;
  }
  refresh();

  if (hooks.isTauri) {
    void getVersion().then((v) => (version.textContent = v), () => undefined);
    void invoke<{ kind: InstallKind }>("get_install_info").then((info) => (install.textContent = installKindLabel(info.kind)), () => undefined);
    void invoke<boolean>("is_elevated").then((on) => (elevated.hidden = !on), () => undefined);
  } else {
    version.textContent = "브라우저 미리보기";
  }

  return { element: root, refresh };
}
