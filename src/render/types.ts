/** 렌더 파이프라인 계약 — `src/render/index.ts`가 구현한다. */

export interface TocEntry {
  /** 1–6 */
  level: number;
  text: string;
  /** 본문 제목 요소의 id (markdown-it-anchor가 부여) */
  id: string;
  /** 소스 줄 번호 (0 기준). 스크롤 동기·복원용 */
  line: number;
}

export interface RenderOptions {
  /** 문서 폴더의 절대 경로 — 상대 이미지·링크 기준 */
  baseDir: string;
  /** 절대 파일 경로 → 웹뷰에서 쓸 URL (Tauri `convertFileSrc`). 테스트에서는 그대로 돌려줘도 된다 */
  toAssetUrl: (absPath: string) => string;
}

export interface RenderResult {
  /** DOMPurify를 거친 안전한 HTML. 블록 요소에 `data-line="시작줄"` 속성이 있다 */
  html: string;
  toc: TocEntry[];
  /** `---` 블록이 있으면 그 원문 (YAML 파싱은 하지 않는다) */
  frontMatter?: string;
}
