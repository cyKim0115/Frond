/** 스크립트가 만드는 버튼용 16×16 선 아이콘 — 모양은 CSS `.icon-btn svg`가 정한다. 정적 아이콘은 index.html에 직접 둔다 */

const SVG_NS = "http://www.w3.org/2000/svg";

export const ICON_CLOSE = "M4.5 4.5l7 7M11.5 4.5l-7 7";
export const ICON_RESET = "M2.75 8a5.25 5.25 0 1 0 1.6-3.77M2.75 2.75v2.5h2.5";

export function icon(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}
