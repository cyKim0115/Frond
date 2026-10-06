/**
 * DOMPurify — `innerHTML` 직전의 마지막 방어선 (brief R7).
 * 원문 HTML은 html.ts가 이미 허용 목록 태그·속성만 남기고 나머지는 이스케이프했다(결정 D1). 여기서는 그 결과와 우리 렌더러·플러그인
 * 출력을 한 번 더 거른다. `style` 속성은 표 정렬(`text-align`)이, `input`은 태스크 리스트 체크박스가 써서 막지 않는다.
 */

import DOMPurify, { type Config } from "dompurify";

/**
 * DOMPurify 기본 `IS_ALLOWED_URI`는 `C:%5C…` 드라이브 경로와 `file:`을 통째로 지운다(스킴 뒤 `:`를 거부).
 * 기본 규칙(http·https·mailto·스킴 없는 값)에 로컬 문서 링크가 쓰는 두 형태만 더한다 — 드라이브 절대 경로(`C:\`·`C:/`·`C:%5C`)와
 * `.md`/`.markdown`으로 끝나는 `file:`. 그 외 `file:`·`javascript:`·`data:` 등은 여전히 속성이 지워진다 (`validateLink`가 먼저 거르는 2차 방어)
 */
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|file:[^?#]*\.(?:md|markdown)(?:[?#]|$)|[a-z]:(?:[\\/]|%5c|%2f)|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const CONFIG: Config = {
  USE_PROFILES: { html: true },
  ALLOWED_URI_REGEXP,
  // data-*는 기본 허용이지만 계약을 명시한다. `target`은 기본 차단이라 반드시 추가
  ADD_ATTR: ["data-line", "data-local-path", "target", "loading"],
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "svg", "math"],
  // 기본값(true)은 `id`가 `document`의 프로퍼티명과 겹치면(`title`·`links`·`images`·`body`…) 속성을 지워
  // 영어 제목의 앵커·목차가 조용히 깨진다. 이 앱은 전역 이름 참조(`window.x`)를 쓰지 않아 DOM clobbering 위험이 없다
  // (유일한 예외인 Mermaid는 스크립트가 `globalThis.mermaid`에 진짜 속성을 만든 뒤에만 읽는다 — mermaid.ts)
  SANITIZE_DOM: false,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, CONFIG);
}

/**
 * Mermaid가 그린 SVG — Mermaid `securityLevel: "strict"`가 라벨을 이미 정화하지만 한 번 더 거른다.
 * 그림 안 `<style>`(Mermaid 테마)과 라벨용 `foreignObject` 안 HTML은 남기고, 스크립트·이벤트 속성·외부 참조는 지운다
 */
const SVG_CONFIG: Config = {
  USE_PROFILES: { svg: true, svgFilters: true, html: true },
  ADD_TAGS: ["foreignObject", "style"],
  HTML_INTEGRATION_POINTS: { foreignobject: true },
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "image"],
  SANITIZE_DOM: false,
};

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, SVG_CONFIG);
}
