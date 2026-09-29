/** 타입 선언이 없는 플러그인 */

declare module "markdown-it-footnote" {
  import type { MarkdownIt } from "markdown-it";
  const footnote: (md: MarkdownIt) => void;
  export default footnote;
}
