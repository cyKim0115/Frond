/**
 * 렌더 파이프라인 — 스캐폴딩 단계의 임시 구현.
 * 로드맵 1-3에서 markdown-it 15 + cjk-friendly + anchor + task lists + footnote + front matter +
 * data-line + DOMPurify + highlight.js 로 교체한다. 계약은 `types.ts`.
 */

import type { RenderOptions, RenderResult } from "./types";

export function renderMarkdown(source: string, _options: RenderOptions): RenderResult {
  const escaped = source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return { html: `<pre data-line="0">${escaped}</pre>`, toc: [] };
}
