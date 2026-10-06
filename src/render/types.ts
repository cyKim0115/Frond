/** 렌더 파이프라인 계약 — `src/render/index.ts`가 구현한다. */

export interface TocEntry {
  /** 1–6 */
  level: number;
  /** 제목의 평문 (인라인 마크업 제거) */
  text: string;
  /** 본문 제목 요소의 id (markdown-it-anchor가 부여, GitHub식 슬러그 — 한글 유지) */
  id: string;
  /** 소스 줄 번호 (0 기준). 스크롤 동기·복원용 */
  line: number;
}

export interface RenderOptions {
  /** 문서 폴더의 절대 경로 — 상대 이미지·링크 기준 */
  baseDir: string;
  /** 절대 파일 경로 → 웹뷰에서 쓸 URL (Tauri `convertFileSrc`). 테스트에서는 그대로 돌려줘도 된다 */
  toAssetUrl: (absPath: string) => string;
  /** 이미지에 `loading="lazy"` — 셸이 큰 문서(스펙 `largeSoftLimit` 초과)에 켠다. 기본 false */
  lazyImages?: boolean;
  /** 최상위 블록을 이 개수씩 `<div class="md-chunk">`로 묶는다(chunks.ts) — 셸이 큰 문서에 켠다. 없으면 묶지 않는다 */
  chunkBlocks?: number;
}

export interface RenderResult {
  /**
   * DOMPurify를 거친 안전한 HTML.
   * - 블록 요소에 `data-line="시작줄"` (0 기준). `chunkBlocks`면 최상위 블록이 `.md-chunk` 안에 한 단계 들어간다
   * - 상대 `.md`/`.markdown` 링크에 `data-local-path="절대 Windows 경로"` (셸이 앱 내에서 연다)
   * - http(s) 링크에 `target="_blank" rel="noopener"`
   * - 코드 펜스는 `<pre><code class="language-xxx" data-lang="xxx">` — 하이라이트는 `highlightCodeBlocks()`가 나중에
   */
  html: string;
  toc: TocEntry[];
  /** `---` 블록이 있으면 그 원문 (YAML 파싱은 하지 않는다) */
  frontMatter?: string;
}
