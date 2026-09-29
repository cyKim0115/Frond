/**
 * DOMPurify — `innerHTML` 직전의 마지막 방어선 (brief R7).
 * markdown-it이 `html: false`라 원문 HTML은 이미 이스케이프돼 있고, 여기서는 우리 렌더러·플러그인 출력만 통과시킨다.
 */

import DOMPurify, { type Config } from "dompurify";

const CONFIG: Config = {
  USE_PROFILES: { html: true },
  // data-*는 기본 허용이지만 계약을 명시한다. `target`은 기본 차단이라 반드시 추가
  ADD_ATTR: ["data-line", "data-local-path", "target"],
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  // 기본값(true)은 `id`가 `document`의 프로퍼티명과 겹치면(`title`·`links`·`images`·`body`…) 속성을 지워
  // 영어 제목의 앵커·목차가 조용히 깨진다. 이 앱은 전역 이름 참조(`window.x`)를 쓰지 않아 DOM clobbering 위험이 없다
  SANITIZE_DOM: false,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, CONFIG);
}
