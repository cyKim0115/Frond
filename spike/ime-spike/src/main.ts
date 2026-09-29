import { invoke } from "@tauri-apps/api/core";
import { loadResults, renderChecklist, resultsToMarkdown, saveResults, type Results } from "./checklist";
import { decoOptions } from "./deco";
import { clearLog, initLog, log, logText } from "./log";
import { SAMPLE } from "./sample";
import { createDecorated, createPlain, createTextarea, saveCounts, setSaveHandler, type Surface } from "./surfaces";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

initLog($("#log"), $("#log-count"));

const surfaces: Surface[] = [
  createTextarea($("#ta")),
  createPlain($("#cm-plain")),
  createDecorated($("#cm-deco")),
];

function refreshBadges() {
  for (const s of surfaces) {
    const sec = document.querySelector(`.surface[data-surface="${s.id}"]`)!;
    sec.querySelector("[data-lines]")!.textContent = `${s.lineCount()}줄`;
    sec.querySelector("[data-saves]")!.textContent = `Ctrl+S ${saveCounts[s.id]}`;
  }
}
for (const s of surfaces) {
  s.setText(SAMPLE);
  s.onChange(refreshBadges);
}
setSaveHandler(refreshBadges);
refreshBadges();

// 옵션 (C면)
$<HTMLInputElement>("#opt-guard").addEventListener("change", (e) => {
  decoOptions.imeGuard = (e.target as HTMLInputElement).checked;
  log("C", `IME 가드 ${decoOptions.imeGuard ? "ON" : "OFF"}`);
});
$<HTMLInputElement>("#opt-reveal").addEventListener("change", (e) => {
  decoOptions.revealCaretLine = (e.target as HTMLInputElement).checked;
  log("C", `캐럿 줄 원문 노출 ${decoOptions.revealCaretLine ? "ON" : "OFF"}`);
  surfaces[2].setText(surfaces[2].getText()); // 재빌드 유도
});

// 툴바
let clicks = 0;
const btnClick = $<HTMLButtonElement>("#btn-click");
btnClick.addEventListener("mousedown", () => log("UI", "조합 중 클릭 버튼 mousedown"));
btnClick.addEventListener("click", () => {
  clicks++;
  btnClick.textContent = `조합 중 클릭 (${clicks})`;
  log("UI", `조합 중 클릭 버튼 click → ${clicks}`);
});
$("#btn-reset").addEventListener("click", () => {
  for (const s of surfaces) s.setText(SAMPLE);
  log("UI", "샘플 다시 넣기");
});
$("#btn-load-cp949").addEventListener("click", async () => {
  try {
    const root = await invoke<string>("repo_root");
    const doc = await invoke<{ text: string; info: Record<string, unknown> }>("load_document", { path: `${root}\\samples\\raw\\cp949.md` });
    for (const s of surfaces) s.setText(doc.text);
    log("UI", `cp949.md 로드: ${JSON.stringify(doc.info)}`);
  } catch (e) {
    log("UI", `cp949.md 로드 실패: ${e}`);
  }
});
$("#btn-clear-log").addEventListener("click", clearLog);
$("#btn-copy-log").addEventListener("click", async () => {
  await navigator.clipboard.writeText(logText());
  log("UI", "로그를 클립보드에 복사");
});

// 환경 정보 + 체크리스트
let env: Record<string, unknown> = {};
const results: Results = loadResults();
const checklistRoot = $("#checklist");
renderChecklist(checklistRoot, results, () => saveResults(results));

const exportBar = document.createElement("div");
exportBar.className = "export";
exportBar.innerHTML = `
  <input id="run-label" placeholder="실행 라벨 (예: win10-19045-newIME)" />
  <button id="btn-export">결과 내보내기 (results/ + 클립보드)</button>
  <button id="btn-reset-results">체크 초기화</button>
  <span id="export-msg"></span>`;
checklistRoot.appendChild(exportBar);

$("#btn-export").addEventListener("click", async () => {
  const label = ($<HTMLInputElement>("#run-label").value || `run-${Date.now()}`).trim();
  const md = resultsToMarkdown(results, env, label);
  try {
    await navigator.clipboard.writeText(md);
  } catch {
    /* 클립보드 실패는 무시 */
  }
  try {
    const path = await invoke<string>("save_results", { name: label, markdown: md });
    $("#export-msg").textContent = `저장: ${path}`;
    log("UI", `결과 저장 ${path}`);
  } catch (e) {
    $("#export-msg").textContent = `저장 실패: ${e}`;
  }
});
$("#btn-reset-results").addEventListener("click", () => {
  for (const k of Object.keys(results)) delete results[k];
  saveResults(results);
  renderChecklist(checklistRoot, results, () => saveResults(results));
  checklistRoot.appendChild(exportBar);
});

(async () => {
  try {
    env = await invoke<Record<string, unknown>>("env_info");
    env.user_agent = navigator.userAgent;
    env.ime_guard_default = decoOptions.imeGuard;
    $("#env").innerHTML = `
      <b>Windows</b> ${env.windows_display_version} (${env.windows_build}) ·
      <b>IME</b> ${env.ime_version} ·
      <b>WebView2</b> ${env.webview2_version} ·
      <b>Tauri</b> ${env.tauri_version} ·
      <b>TSFHonorAutocorrectOff 비활성 플래그</b> ${env.tsf_flag_off ? "ON" : "off"}`;
    log("UI", `env ${JSON.stringify(env)}`);
  } catch (e) {
    $("#env").textContent = `환경 정보 실패: ${e}`;
  }
})();

// 전역: Alt+Tab 복귀 감지용
window.addEventListener("focus", () => log("UI", "window focus"));
window.addEventListener("blur", () => log("UI", "window blur"));
