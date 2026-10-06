/**
 * 분할 뷰 (로드맵 3-3) — 왼쪽 소스(CM6) | 오른쪽 미리보기. 여기는 가운데 손잡이(폭 비율)와 스크롤 동기 계산만 한다.
 *
 * 스크롤 동기는 `data-line` 닻으로 한다(brief R1·R2): 미리보기 최상위 블록마다 (소스 줄, 미리보기 y) 쌍을 모아
 * 두 닻 사이를 선형 보간한다 — 긴 표·코드 블록 안에서도 양쪽이 같은 비율로 움직인다.
 */

import { isNumber, readPref, writePref } from "./prefs";

// ---- 스크롤 동기 계산 (순수 함수) -----------------------------------------------------

/** 닻 — 소스 줄(0 기준)과 그 블록의 미리보기 y(px, 스크롤 좌표). 둘 다 커지는 순서 */
export interface SyncMap {
  lines: number[];
  ys: number[];
}

/** `values`에서 `x` 이하인 마지막 칸 (없으면 -1) */
function floorIndex(values: readonly number[], x: number): number {
  let lo = 0;
  let hi = values.length - 1;
  let hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] <= x) {
      hit = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return hit;
}

/** 소스 줄(소수 가능) → 미리보기 y. 첫 닻 앞은 첫 닻, 마지막 닻 뒤는 마지막 닻 */
export function yForLine(map: SyncMap, line: number): number {
  const { lines, ys } = map;
  if (lines.length === 0) return 0;
  const i = floorIndex(lines, line);
  if (i < 0) return ys[0];
  if (i >= lines.length - 1) return ys[lines.length - 1];
  const span = lines[i + 1] - lines[i];
  const t = span > 0 ? (line - lines[i]) / span : 0;
  return ys[i] + t * (ys[i + 1] - ys[i]);
}

/** 미리보기 y → 소스 줄(소수) */
export function lineForY(map: SyncMap, y: number): number {
  const { lines, ys } = map;
  if (lines.length === 0) return 0;
  const i = floorIndex(ys, y);
  if (i < 0) return lines[0];
  if (i >= ys.length - 1) return lines[ys.length - 1];
  const span = ys[i + 1] - ys[i];
  const t = span > 0 ? (y - ys[i]) / span : 0;
  return lines[i] + t * (lines[i + 1] - lines[i]);
}

/** 닻을 모은다 — 줄·y가 거꾸로 가는 닻(겹친 블록 등)은 버려 보간이 뒤로 가지 않게 한다 */
export function buildSyncMap(anchors: Iterable<{ line: number; y: number }>): SyncMap {
  const lines: number[] = [];
  const ys: number[] = [];
  for (const { line, y } of anchors) {
    const n = lines.length;
    if (n > 0 && (line <= lines[n - 1] || y < ys[n - 1])) continue;
    lines.push(line);
    ys.push(y);
  }
  return { lines, ys };
}

// ---- 폭 손잡이 ------------------------------------------------------------------------

export const SPLIT_DEFAULT = 0.5;
const SPLIT_MIN = 0.2;
const SPLIT_MAX = 0.8;
const KEY_STEP = 0.05;

export const clampSplit = (ratio: number): number => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, ratio));

/** 손잡이 — 끌거나 ←/→, 두 번 누르면 반반. 비율은 `#panes`의 `--split-left`로 흐르고 localStorage에 남는다 */
export function initSplitResize(onChange: () => void): void {
  const panes = document.querySelector<HTMLElement>("#panes")!;
  const handle = document.querySelector<HTMLElement>("#split-resizer")!;
  const app = document.querySelector<HTMLElement>("#app")!;

  const set = (ratio: number, save: boolean): void => {
    const r = clampSplit(ratio);
    panes.style.setProperty("--split-left", `${(r * 100).toFixed(2)}%`);
    handle.setAttribute("aria-valuenow", String(Math.round(r * 100)));
    if (save) writePref("splitRatio", r);
    onChange();
  };
  const current = (): number => {
    const box = panes.getBoundingClientRect();
    const left = handle.getBoundingClientRect().left - box.left;
    return box.width > 0 ? left / box.width : SPLIT_DEFAULT;
  };

  set(readPref("splitRatio", SPLIT_DEFAULT, isNumber), false);

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    app.classList.add("resizing");
    const box = panes.getBoundingClientRect();
    const move = (e: PointerEvent): void => set((e.clientX - box.left) / box.width, false);
    handle.addEventListener("pointermove", move);
    handle.addEventListener(
      "lostpointercapture",
      () => {
        app.classList.remove("resizing");
        handle.removeEventListener("pointermove", move);
        writePref("splitRatio", current());
      },
      { once: true },
    );
  });
  handle.addEventListener("dblclick", () => set(SPLIT_DEFAULT, true));
  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    set(current() + (event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP), true);
  });
}
