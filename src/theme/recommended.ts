/**
 * 추천 테마 — 설정 '테마' 탭의 '추천 테마…' 팝업(src/recommended-dialog.ts)에 보이는 기성 테마.
 * 고르면 사용자 테마로 테마 폴더에 복사된다(가져오기와 같은 길). 앱에는 내장 라이트·다크만 박혀 있고, 이 목록은 출발점이다.
 *
 * - 세피아: 손으로 고른 예제 테마 파일(docs/themes/sepia.json)을 가져오기와 같은 검증(`parseThemeFile`)으로 읽는다
 * - GitHub 라이트·다크: 2026-10-06까지의 내장 라이트·다크. 내장이 세이지 차콜로 바뀌어 예전 색으로 돌아갈 길로 둔다
 * - 웨딩 팔레트: media.io '웨딩 컬러 팔레트'(https://www.media.io/ko/color-palette/wedding-color-palette.html)의 5색 팔레트 20개.
 *   팔레트마다 역할 5개만 정하고 나머지 토큰은 섞기·대비로 만든다(palette.ts `paletteTheme`)
 */

import sepiaJson from "../../docs/themes/sepia.json?raw";
import { type Five, mix, paletteTheme, type Roles, SAGE_CHARCOAL, sageCharcoalLight, soft } from "./palette";
import { GITHUB_DARK, GITHUB_LIGHT, parseThemeFile, type ThemeBase, type ThemeDef } from "./themes";

export { contrast, mix, readable } from "./palette";

export interface RecommendedTheme {
  theme: ThemeDef;
  group: RecommendedGroupId;
  /** 목록에 보이는 한 줄 설명 */
  description: string;
  /** 원본 팔레트 색 (있으면 목록에 같이 보인다) */
  palette?: readonly string[];
}

export type RecommendedGroupId = "mdeditor" | "wedding";

export const RECOMMENDED_GROUPS: readonly { id: RecommendedGroupId; label: string; source?: string }[] = [
  { id: "mdeditor", label: "Frond" },
  { id: "wedding", label: "웨딩 컬러 팔레트", source: "색 출처: media.io '웨딩 컬러 팔레트'" },
];

function wedding(slug: string, name: string, mood: string, colors: Five, base: ThemeBase, roles: (c: Five) => Roles): RecommendedTheme {
  return { theme: paletteTheme(`wedding-${slug}`, name, base, roles(colors)), group: "wedding", description: mood, palette: colors };
}

// 원본 페이지 순서. 역할: 배경은 가장 밝은(다크면 가장 어두운) 색을 흰색과 섞어 누그러뜨리고, 보조면은 그 옆 색조
const WEDDING: readonly RecommendedTheme[] = [
  wedding("sage-champagne-blush", "세이지 샴페인 블러시", "부드럽고, 로맨틱하며, 경쾌한", ["#6f8f7a", "#f2e7d5", "#d9a0a7", "#ffffff", "#3a4a43"], "light",
    (c) => ({ bg: soft(c[1]), surface: c[1], fg: c[4], accent: c[0], second: c[2] })),
  wedding("dusty-rose-mauve-taupe", "더스티 로즈 모브 토프", "빈티지, 부드러운, 절제된", ["#c28a9a", "#9a5c6f", "#d7c6c2", "#a79a94", "#f7f1ef"], "light",
    (c) => ({ bg: c[4], surface: mix(c[4], c[2], 0.4), fg: mix(c[1], "#000000", 0.55), accent: c[1], second: c[0] })),
  wedding("eucalyptus-ivory-gold", "유칼립투스 아이보리 골드", "클래식, 보타니컬, 세련된", ["#5b7f65", "#f6f2e8", "#d4af37", "#b9c8b0", "#2f3b34"], "light",
    (c) => ({ bg: c[1], surface: mix(c[1], c[3], 0.35), fg: c[4], accent: c[0], second: c[2] })),
  wedding("coastal-navy-sand", "코스탈 네이비 샌드", "경쾌한, 모던한, 해변의", ["#1f2a44", "#6b8ba4", "#f1e3c8", "#c8b89a", "#ffffff"], "light",
    (c) => ({ bg: soft(c[2]), surface: c[2], fg: c[0], accent: c[1], second: c[3] })),
  wedding("terracotta-olive-cream", "테라코타 올리브 크림", "자연스러운, 따뜻한, 러스틱-시크", ["#c86b4a", "#6d7a4f", "#f7f0e6", "#8f5a3c", "#2f2b28"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[3], 0.1), fg: c[4], accent: c[0], second: c[1] })),
  wedding("lavender-lilac-silver", "라벤더 라일락 실버", "몽환적인, 가벼운, 우아한", ["#b79ad8", "#e7dbf4", "#cfcfd6", "#6d5a8c", "#ffffff"], "light",
    (c) => ({ bg: soft(c[1], 0.6), surface: soft(c[1], 0.25), fg: mix(c[3], "#000000", 0.5), accent: c[3], second: c[0] })),
  wedding("black-tie-pearl", "블랙 타이 펄", "격식 있는, 타임리스한, 고대비", ["#0f0f10", "#f6f1e8", "#d6cfc6", "#a6a1a0", "#2a2a2b"], "dark",
    (c) => ({ bg: c[0], surface: mix(c[0], c[4], 0.5), fg: c[1], accent: c[2], second: c[3] })),
  wedding("garden-mint-peony", "가든 민트 피오니", "신선한, 경쾌한, 봄 같은", ["#b7d8c4", "#f3b1c2", "#fff7f2", "#6aa37f", "#5a4a4f"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[0], 0.3), fg: c[4], accent: c[1], second: c[3] })),
  wedding("sunset-coral-peach", "선셋 코랄 피치", "즐거운, 빛나는, 여름 같은", ["#ff7a7a", "#ffb38a", "#ffd9b6", "#fff6ee", "#6a4b44"], "light",
    (c) => ({ bg: c[3], surface: mix(c[3], c[2], 0.45), fg: c[4], accent: c[0], second: c[1] })),
  wedding("winter-pine-cranberry", "윈터 파인 크랜베리", "아늑한, 축제적인, 드라마틱한", ["#1f3a2e", "#b1122a", "#f5f0e6", "#8a7e74", "#d8c7b2"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[4], 0.35), fg: c[0], accent: c[1], second: c[3] })),
  wedding("ocean-mist-slate", "오션 미스트 슬레이트", "차분한, 깨끗한, 현대적인", ["#cfe3e7", "#7aa3b4", "#4b5d67", "#e9eef0", "#1e2a2f"], "light",
    (c) => ({ bg: soft(c[3]), surface: mix(c[3], c[0], 0.5), fg: c[4], accent: c[1], second: c[2] })),
  wedding("modern-greige-blush", "모던 그레이지 블러시", "미니멀, 따뜻한, 모던-로맨틱", ["#cbbfb6", "#f1e6e2", "#b57a86", "#7a6f6a", "#ffffff"], "light",
    (c) => ({ bg: soft(c[1]), surface: c[1], fg: mix(c[3], "#000000", 0.5), accent: c[2], second: c[3] })),
  wedding("citrus-marigold-teal", "시트러스 메리골드 틸", "대담한, 경쾌한, 모던한", ["#f0b429", "#0f766e", "#f7f3e8", "#d97706", "#1f2937"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[0], 0.15), fg: c[4], accent: c[1], second: c[3] })),
  wedding("vintage-lace-sepia", "빈티지 레이스 세피아", "향수적인, 따뜻한, 전통적인", ["#f2e8dc", "#c9b7a6", "#8b6f61", "#5c4a44", "#ffffff"], "light",
    (c) => ({ bg: c[0], surface: mix(c[0], c[1], 0.3), fg: c[3], accent: c[2], second: c[1] })),
  wedding("boho-clay-denim", "보헤미안 클레이 데님", "보헤미안, 편안한, 야외 느낌", ["#b66a4b", "#3f5f7a", "#e7d6c8", "#8a8f86", "#2d2b29"], "light",
    (c) => ({ bg: soft(c[2], 0.55), surface: soft(c[2], 0.2), fg: c[4], accent: c[1], second: c[0] })),
  wedding("tropical-orchid-palm", "트로피컬 오키드 팜", "열대의, 생생한, 자신감 있는", ["#c45a9a", "#2f7d4a", "#f3f0e7", "#f6b5c8", "#1b2a2a"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[3], 0.25), fg: c[4], accent: c[0], second: c[1] })),
  // 내장 라이트와 같은 색 — 원본 팔레트 목록을 그대로 두려고 남긴다(palette.ts `sageCharcoalLight`)
  wedding("minimal-white-sage-charcoal", "미니멀 화이트 세이지 차콜", "깨끗한, 미니멀리스트, 차분한 — 내장 라이트와 같은 색", SAGE_CHARCOAL, "light",
    sageCharcoalLight),
  wedding("rustic-burlap-sage", "러스틱 벌랩 세이지", "소박한, 자연스러운, 아늑한", ["#d8c6a6", "#7b8f6a", "#f4efe6", "#5a4b3c", "#2f2b26"], "light",
    (c) => ({ bg: c[2], surface: mix(c[2], c[0], 0.4), fg: c[4], accent: c[1], second: c[3] })),
  wedding("art-deco-emerald-gold", "아르데코 에메랄드 골드", "화려한, 대담한, 빈티지-럭셔리", ["#0b6b4f", "#d4af37", "#0f1a1a", "#f5f0e6", "#2a3d36"], "dark",
    (c) => ({ bg: c[2], surface: mix(c[2], c[4], 0.45), fg: c[3], accent: c[1], second: c[0] })),
  wedding("celestial-midnight-lavender", "셀레스티얼 미드나잇 라벤더", "신비로운, 로맨틱한, 밤하늘", ["#121b3a", "#6a4c93", "#e7d6f5", "#f5f0e6", "#3a2a4b"], "dark",
    (c) => ({ bg: c[0], surface: mix(c[0], c[4], 0.5), fg: c[3], accent: c[2], second: c[1] })),
];

function fromFile(text: string, stem: string, description: string): RecommendedTheme[] {
  const parsed = parseThemeFile(text, stem);
  return parsed.ok ? [{ theme: parsed.theme, group: "mdeditor", description }] : [];
}

/** 예전 내장 테마 — 모든 토큰을 다 가진 팔레트를 id·이름만 바꿔 사용자 테마로 */
const GITHUB: readonly RecommendedTheme[] = [
  { theme: { ...GITHUB_LIGHT, id: "github-light", name: "GitHub 라이트" }, group: "mdeditor", description: "2026-10-06까지의 기본 라이트 — 흰 바탕에 GitHub 파랑" },
  { theme: { ...GITHUB_DARK, id: "github-dark", name: "GitHub 다크" }, group: "mdeditor", description: "2026-10-06까지의 기본 다크 — GitHub 다크 색" },
];

/** 팝업 순서 = 묶음 순서(RECOMMENDED_GROUPS) → 묶음 안 순서 */
export const RECOMMENDED_THEMES: readonly RecommendedTheme[] = [
  ...fromFile(sepiaJson, "sepia", "누런 종이 느낌 — 오래 읽기 편한 따뜻한 라이트"),
  ...GITHUB,
  ...WEDDING,
];
