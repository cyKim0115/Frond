// WebView2 원격 디버깅(CDP) 작은 클라이언트 — Node 24 내장 WebSocket만 쓴다.
// `eval`은 CDP Runtime.evaluate로 시험 앱 안에서 이 스크립트가 쓴 식을 돌리는 것이다(바깥 입력을 평가하지 않음).
// 시험 앱은 WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=<포트>로 띄운다(e2e.mjs launch).

import { writeFileSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 앱 페이지(http://tauri.localhost/) 대상 주소 — 없으면 null */
export async function findPage(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
    const list = await res.json();
    return list.find((t) => t.type === "page" && /^https?:\/\/tauri\.localhost\//.test(t.url)) ?? null;
  } catch {
    return null;
  }
}

export class Cdp {
  /** @param {string} wsUrl */
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.waiting = new Map();
    /** 콘솔·예외 — S17 판정용 */
    this.console = [];
    this.closed = false;
  }

  static async connect(port, timeoutMs = 60_000) {
    const until = Date.now() + timeoutMs;
    let page = null;
    while (!page && Date.now() < until) {
      page = await findPage(port);
      if (!page) await sleep(500);
    }
    if (!page) throw new Error(`CDP ${port}에 앱 페이지가 없습니다`);
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Page.enable");
    return cdp;
  }

  open() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(new Error(`WebSocket 오류: ${e.message ?? e.type}`));
      ws.onclose = () => {
        this.closed = true;
        for (const { reject: rej } of this.waiting.values()) rej(new Error("CDP 연결이 끊겼습니다"));
        this.waiting.clear();
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id !== undefined) {
          const w = this.waiting.get(msg.id);
          if (!w) return;
          this.waiting.delete(msg.id);
          if (msg.error) w.reject(new Error(`${msg.error.message} ${msg.error.data ?? ""}`));
          else w.resolve(msg.result);
          return;
        }
        this.onEvent(msg.method, msg.params);
      };
    });
  }

  onEvent(method, params) {
    if (method === "Runtime.consoleAPICalled") {
      const text = params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      this.console.push({ level: params.type, text });
    } else if (method === "Runtime.exceptionThrown") {
      const d = params.exceptionDetails;
      this.console.push({ level: "exception", text: d.exception?.description ?? d.text });
    } else if (method === "Log.entryAdded") {
      this.console.push({ level: params.entry.level, text: `${params.entry.source}: ${params.entry.text}` });
    }
  }

  send(method, params = {}) {
    if (this.closed) return Promise.reject(new Error("CDP 연결이 끊겼습니다"));
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.waiting.set(id, { resolve, reject }));
  }

  /** 식을 평가해 값을 돌려준다(Promise면 기다림). 예외는 던진다 */
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    return r.result.value;
  }

  /** 함수에 JSON 값을 넘겨 평가 — 경로의 `\`가 두 번 이스케이프되지 않게 */
  call(fn, arg) {
    return this.eval(`(${fn})(${JSON.stringify(arg)})`);
  }

  /** 조건 식이 참이 될 때까지 */
  async waitFor(expression, timeoutMs = 15_000, label = expression) {
    const until = Date.now() + timeoutMs;
    let last;
    while (Date.now() < until) {
      try {
        last = await this.eval(expression);
        if (last) return last;
      } catch (e) {
        last = e.message;
      }
      await sleep(250);
    }
    throw new Error(`기다림 시간 넘음: ${label} (마지막 값 ${JSON.stringify(last)})`);
  }

  async shot(file) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(r.data, "base64"));
    return file;
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      /* 이미 닫힘 */
    }
  }
}

// ---- 앱 화면 조작 (Frond 셀렉터) -------------------------------------------------------

/** 열린 팝업 { title, message, detail, buttons } — 없으면 null */
export const dialogState = `(() => {
  const d = document.querySelector('#app-dialog');
  if (!d || !d.open) return null;
  return {
    title: d.querySelector('#dialog-title')?.textContent ?? '',
    message: d.querySelector('#dialog-message')?.textContent ?? '',
    detail: d.querySelector('#dialog-detail')?.textContent ?? '',
    buttons: [...d.querySelectorAll('.dialog-actions button')].map((b) => b.textContent.trim()),
  };
})()`;

/** 열린 팝업의 버튼을 글자로 누른다 */
export async function clickDialog(cdp, label, timeoutMs = 10_000) {
  await cdp.waitFor(`(${dialogState})?.buttons.includes(${JSON.stringify(label)})`, timeoutMs, `팝업 버튼 '${label}'`);
  const r = await cdp.call(
    (l) => {
      const b = [...document.querySelectorAll("#app-dialog .dialog-actions button")].find((x) => x.textContent.trim() === l);
      if (!b) return "없음";
      b.click();
      return "ok";
    },
    label,
  );
  if (r !== "ok") throw new Error(`팝업 버튼 '${label}' ${r}`);
}

/** 알약 상태 */
export const pillState = `(() => {
  const p = document.querySelector('#update-pill');
  return p ? { hidden: p.hidden, level: p.dataset.level ?? null, text: p.querySelector('.pill-text')?.textContent ?? '', title: p.title } : null;
})()`;

/** 탭 목록·활성 — 세션 저장값과 화면 둘 다 */
export const tabsState = `(() => {
  const s = JSON.parse(localStorage.getItem('frond.session') ?? 'null');
  return {
    session: s,
    status: document.querySelector('#status-path')?.title ?? '',
    tabNames: [...document.querySelectorAll('.tab .tab-name')].map((t) => t.textContent),
    dirty: [...document.querySelectorAll('.tab')].map((t) => t.classList.contains('dirty')),
  };
})()`;

/** 설정 '업데이트' 탭 열기 → 상태 문구 */
export async function openUpdateSettings(cdp) {
  await cdp.eval(`document.querySelector('#open-settings').click()`);
  await cdp.waitFor(`!!document.querySelector('#settings-tab-update')`, 5000);
  await cdp.eval(`document.querySelector('#settings-tab-update').click()`);
  await cdp.waitFor(`!!document.querySelector('.update-panel .update-status')?.offsetParent`, 5000, "업데이트 패널");
}

export const panelState = `(() => {
  const p = document.querySelector('.update-panel');
  if (!p) return null;
  return {
    status: p.querySelector('.update-status')?.textContent ?? '',
    detail: p.querySelector('.update-detail')?.textContent ?? '',
    buttons: [...p.querySelectorAll('.update-actions button')].filter((b) => !b.hidden).map((b) => b.textContent.trim()),
    skippedLine: p.querySelector('.update-hint')?.hidden ? '' : p.querySelector('.update-hint')?.textContent ?? '',
    settingRowHidden: document.querySelector('#setting-updateCheck')?.closest('.setting-row')?.hidden ?? null,
  };
})()`;

/** 업데이트 패널 버튼을 글자로 */
export async function clickPanel(cdp, label) {
  const r = await cdp.call(
    (l) => {
      const b = [...document.querySelectorAll(".update-panel .update-actions button")].find((x) => !x.hidden && x.textContent.trim() === l);
      if (!b) return "없음";
      b.click();
      return "ok";
    },
    label,
  );
  if (r !== "ok") throw new Error(`패널 버튼 '${label}' ${r}`);
}

/** 설정 팝업 닫기 */
export async function closeSettings(cdp) {
  await cdp.eval(`(() => { const d = document.querySelector('#settings-dialog'); if (d?.open) d.close(); return true; })()`);
}
