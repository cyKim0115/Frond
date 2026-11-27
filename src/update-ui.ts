/**
 * 앱 안 업데이트 화면 (결정 `20261127-app-update` §3) — 제목 표시줄 알약, 확인 팝업, 설정 '업데이트' 탭 패널.
 * 상태는 update.ts `Updater`가 갖고, 여기는 그 상태를 그리기만 한다.
 *
 * - 알약 `#update-pill`은 받기를 마친 뒤(`ready`)와 재시작 직후(`updated`)에만 보인다. 모달은 사용자가 누를 때만 띄운다
 *   (한글 조합을 가로채지 않게). 나타날 때 포커스를 가져가지 않는다
 * - 색은 테마 토큰만: 보통 `--accent` 테두리·글자, 같은 버전을 7일 넘게 미루면 `--accent` 바탕, '나중에'면 `--muted`·`--line`
 * - 브라우저 미리보기(`npm run dev`)는 `?update=ready|downloading|later|strong|updated|error|latest|skipped|store|scoop|dev|nokey`로
 *   가짜 업데이터를 띄운다(`previewUpdater`) — 실제 상태 기계를 그대로 탄다
 */

import { openUrl } from "@tauri-apps/plugin-opener";
import { showChoice } from "./dialog";
import {
  type FoundUpdate,
  notesPreview,
  pillLevel,
  readUpdatePrefs,
  RELEASES_URL,
  type UpdaterApi,
  type UpdateState,
  type UpdateSupport,
  Updater,
  withJosa,
  writeUpdatePrefs,
  EMPTY_PREFS,
} from "./update";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** 지원하지 않는 설치본에서 패널이 보일 사유 (§1 표) */
export const UNSUPPORTED_TEXT: Record<Exclude<UpdateSupport, "enabled">, string> = {
  store: "Microsoft Store판은 Store가 업데이트합니다.",
  scoop: "Scoop으로 설치했습니다. 터미널에서 scoop update frond로 업데이트합니다.",
  dev: "개발 빌드라 업데이트를 확인하지 않습니다.",
  nokey: "이 빌드에는 업데이트 서명 키가 없어 앱 안 업데이트를 쓰지 않습니다.",
};

const SCOOP_COMMAND = "scoop update frond";

export const releaseUrl = (version: string): string => `${RELEASES_URL}/tag/v${version.replace(/^v/, "")}`;

function hhmm(at: number): string {
  return new Date(at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** 설정 패널 상태 줄 */
export function statusText(state: UpdateState, current: string, lastCheckAt: number | null): string {
  const last = lastCheckAt === null ? "" : ` · 마지막 확인 ${hhmm(lastCheckAt)}`;
  switch (state.kind) {
    case "unsupported":
      return UNSUPPORTED_TEXT[state.reason];
    case "idle":
      return lastCheckAt === null ? `지금 버전은 ${current}입니다.` : `지금 버전은 ${current}입니다${last}`;
    case "checking":
      return "업데이트를 확인하는 중…";
    case "downloading": {
      const pct = state.total ? ` ${Math.min(100, Math.floor((state.got / state.total) * 100))}%` : "";
      return `${state.version} 받는 중…${pct}`;
    }
    case "ready":
      return `Frond ${withJosa(state.version, "이/가")} 준비됐습니다. 재시작하면 적용됩니다.`;
    case "skipped":
      return `${withJosa(state.version, "은/는")} 건너뛰기로 했습니다.`;
    case "latest":
      return `최신 버전입니다 (${current})${last}`;
    case "error":
      return state.message;
    case "installing":
      return "업데이트를 설치하고 다시 엽니다…";
    case "updated":
      return `${withJosa(state.to, "으로/로")} 업데이트했습니다.`;
  }
}

export interface UpdateUiHooks {
  isTauri: boolean;
  /** '재시작해 업데이트' — 문서 보존·설치 순서는 main.ts `restartToUpdate`가 맡는다 */
  restart(): void;
}

export interface UpdateUi {
  /** 설정 '업데이트' 탭에 붙일 패널 */
  panel: HTMLElement;
  /** 지원 판정이 끝나 업데이터가 생기면 붙인다 */
  attach(updater: Updater, currentVersion: string): void;
  /** 알약을 눌렀을 때와 같은 확인 팝업 */
  confirm(): Promise<void>;
}

export function createUpdateUi(hooks: UpdateUiHooks): UpdateUi {
  const pill = document.querySelector<HTMLButtonElement>("#update-pill")!;
  const pillText = pill.querySelector<HTMLElement>(".pill-text")!;

  const panel = el("div", "update-panel");
  const status = el("p", "update-status", "—");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const detail = el("p", "update-detail");
  const actions = el("div", "update-actions");
  const checkBtn = el("button", "theme-btn", "지금 확인");
  const restartBtn = el("button", "theme-btn primary", "재시작해 업데이트");
  const unskipBtn = el("button", "theme-btn", "다시 알리기");
  const copyBtn = el("button", "theme-btn", "명령 복사");
  for (const b of [checkBtn, restartBtn, unskipBtn, copyBtn]) b.type = "button";
  actions.append(checkBtn, restartBtn, unskipBtn, copyBtn);
  const skippedLine = el("p", "update-hint");
  const links = el("p", "update-links");
  const notesLink = el("a", undefined, "바뀐 점 전체 보기");
  notesLink.href = RELEASES_URL;
  links.append(notesLink);
  panel.append(status, detail, actions, skippedLine, links);

  let updater: Updater | null = null;
  let current = "—";

  const open = (url: string) => {
    if (hooks.isTauri) void openUrl(url);
    else window.open(url, "_blank", "noopener");
  };
  notesLink.addEventListener("click", (event) => {
    event.preventDefault();
    open(notesLink.href);
  });
  checkBtn.addEventListener("click", () => void updater?.checkNow());
  // 알약과 같은 확인 팝업을 거친다(노트·건너뛰기·나중에)
  restartBtn.addEventListener("click", () => void confirm());
  unskipBtn.addEventListener("click", () => void updater?.unskip());
  copyBtn.addEventListener("click", () => {
    void navigator.clipboard.writeText(SCOOP_COMMAND).then(
      () => (copyBtn.textContent = "복사했습니다"),
      () => undefined,
    );
  });

  function renderPill(state: UpdateState): void {
    pill.classList.remove("busy");
    if (state.kind === "ready" && updater) {
      pill.hidden = false;
      pill.dataset.level = pillLevel(state.seenAt, Date.now(), updater.later);
      pillText.textContent = "업데이트";
      pill.title = `Frond ${withJosa(state.version, "이/가")} 준비됐습니다 — 눌러서 재시작해 업데이트합니다`;
    } else if (state.kind === "installing") {
      pill.hidden = false;
      pill.dataset.level = "normal";
      pill.classList.add("busy");
      pillText.textContent = "업데이트 중…";
      pill.title = "업데이트를 설치하고 다시 엽니다";
    } else if (state.kind === "updated") {
      pill.hidden = false;
      pill.dataset.level = "normal";
      pillText.textContent = "업데이트됨";
      pill.title = `${withJosa(state.to, "으로/로")} 업데이트했습니다 — 눌러서 바뀐 점 보기`;
    } else {
      pill.hidden = true;
    }
    pill.setAttribute("aria-label", pill.title);
  }

  function renderPanel(state: UpdateState): void {
    const prefs = readUpdatePrefs();
    status.textContent = statusText(state, current, prefs.lastCheckAt);
    status.classList.toggle("warn", state.kind === "error");
    detail.textContent = state.kind === "error" ? state.detail : "";
    detail.hidden = detail.textContent === "";
    const enabled = updater?.support === "enabled";
    const busy = state.kind === "checking" || state.kind === "downloading" || state.kind === "installing";
    checkBtn.hidden = !enabled;
    checkBtn.disabled = busy;
    restartBtn.hidden = state.kind !== "ready";
    unskipBtn.hidden = !(enabled && (state.kind === "skipped" || (prefs.skipped !== null && state.kind !== "ready")));
    copyBtn.hidden = !(state.kind === "unsupported" && state.reason === "scoop");
    actions.hidden = [checkBtn, restartBtn, unskipBtn, copyBtn].every((b) => b.hidden);
    // 지금 상태가 건너뜀이 아니어도 건너뛴 버전이 남아 있으면 한 줄로
    skippedLine.textContent = enabled && prefs.skipped && state.kind !== "skipped" ? `건너뛴 버전: ${prefs.skipped}` : "";
    skippedLine.hidden = skippedLine.textContent === "";
    const version = state.kind === "ready" || state.kind === "skipped" || state.kind === "downloading" ? state.version : state.kind === "updated" ? state.to : null;
    notesLink.href = version ? releaseUrl(version) : RELEASES_URL;
    links.hidden = state.kind === "unsupported" && state.reason === "dev";
  }

  function render(state: UpdateState): void {
    renderPill(state);
    renderPanel(state);
  }

  async function showUpdatedNotes(state: Extract<UpdateState, { kind: "updated" }>): Promise<void> {
    const { lines, more } = notesPreview(state.notes);
    const picked = await showChoice({
      title: `${withJosa(state.to, "으로/로")} 업데이트했습니다`,
      message: lines.length ? lines.join("\n") + (more ? `\n외 ${more}개` : "") : "바뀐 점은 GitHub 릴리스에서 볼 수 있습니다.",
      choices: [{ value: "github", label: "GitHub에서 보기" }],
      cancelLabel: "닫기",
    });
    if (picked === "github") open(releaseUrl(state.to));
  }

  async function confirm(): Promise<void> {
    const state = updater?.current;
    if (!updater || !state) return;
    if (state.kind === "updated") return showUpdatedNotes(state);
    if (state.kind !== "ready") return;
    const { lines, more } = notesPreview(state.notes);
    const picked = await showChoice({
      title: `Frond ${withJosa(state.version, "으로/로")} 업데이트할까요?`,
      message: lines.length ? lines.join("\n") + (more ? `\n외 ${more}개` : "") : "새 버전이 준비됐습니다.",
      detail: "재시작하면 열린 탭이 그대로 돌아옵니다. 저장하지 않은 문서는 다음 단계에서 고릅니다.",
      choices: [
        { value: "skip", label: "이 버전 건너뛰기" },
        { value: "install", label: "재시작해 업데이트", kind: "primary" },
      ],
      cancelLabel: "나중에",
    });
    if (picked === "install") hooks.restart();
    else if (picked === "skip") updater.skip();
    else updater.postpone();
  }

  // 누를 때 포커스가 알약에 남지 않게 — 팝업이 닫히면 원래 자리(편집기 등)로 돌아가도록
  pill.addEventListener("mousedown", (event) => event.preventDefault());
  pill.addEventListener("click", () => void confirm());
  // 7일 강조는 시간이 지나면 바뀐다 — 한 시간마다 다시 그린다
  setInterval(() => updater && renderPill(updater.current), 60 * 60 * 1000);

  return {
    panel,
    attach(next, version) {
      updater = next;
      current = version;
      next.onChange(render);
      render(next.current);
    },
    confirm,
  };
}

// ---- 브라우저 미리보기 -------------------------------------------------------------------

const PREVIEW_NOTES = [
  "- 앱 안 업데이트 — 새 버전을 조용히 받아 두고 제목 표시줄에 알립니다",
  "- 설정 '업데이트' 탭 — 자동 확인 끄기·지금 확인·건너뛴 버전",
  "- 저장하지 않은 문서를 저장하거나 초안으로 남긴 뒤 재시작합니다",
  "- 분할 뷰 스크롤 동기를 고쳤습니다",
  "- HTML 문서 보기 시작 속도를 높였습니다",
  "- 큰 문서 목차 갱신이 빨라졌습니다",
  "- 다크 테마 표 줄 색을 고쳤습니다",
].join("\n");

export const PREVIEW_KINDS = ["ready", "downloading", "later", "strong", "updated", "error", "latest", "skipped", "store", "scoop", "dev", "nokey"] as const;
export type PreviewKind = (typeof PREVIEW_KINDS)[number];
export const PREVIEW_CURRENT = "0.2.0";

/** 미리보기용 가짜 업데이터 — `kind` 상태까지 실제 상태 기계로 몰아간다 */
export function previewUpdater(kind: PreviewKind, autoEnabled: () => boolean): Updater {
  const support: UpdateSupport = kind === "store" || kind === "scoop" || kind === "dev" || kind === "nokey" ? kind : "enabled";
  const fake = (stall: boolean): FoundUpdate => ({
    version: "0.2.1",
    notes: PREVIEW_NOTES,
    download: (onProgress) => {
      onProgress(stall ? 3_300_000 : 7_300_000, 7_300_000);
      return stall ? new Promise<void>(() => undefined) : Promise.resolve();
    },
    install: () => new Promise<void>(() => undefined),
    close: async () => undefined,
  });
  const api: UpdaterApi = {
    check: async () => {
      if (kind === "error") throw new Error("error sending request for url (https://github.com/…/latest.json)");
      return kind === "latest" ? null : fake(kind === "downloading");
    },
  };
  writeUpdatePrefs({
    ...EMPTY_PREFS,
    skipped: kind === "skipped" ? "0.2.1" : null,
    seen: kind === "strong" ? { version: "0.2.1", at: Date.now() - 8 * 24 * 60 * 60 * 1000 } : null,
  });
  const updater = new Updater({ support, api, autoEnabled });
  if (support !== "enabled") return updater;
  if (kind === "updated") updater.showUpdated("0.2.0", "0.2.1", PREVIEW_NOTES);
  // 건너뜀은 자동 확인에서만 생긴다(수동은 건너뛴 버전도 받는다). 나머지는 설정과 무관하게 수동 확인으로
  else if (kind === "skipped") void updater.auto();
  else void updater.checkNow().then(() => kind === "later" && updater.postpone());
  return updater;
}
