/**
 * 구매자 전용 테마 묶음 (store-launch A-3) — 색 토큰 JSON(테마 파일 형식 그대로)이 `docs/themes/supporter/`에 공개돼 있다.
 * 누구나 '추천 테마…' 팝업에서 미리보기는 하고, 적용은 구매자만 한다(license.ts `canUseTheme`). 결정 `20261006-license`:
 * 소스는 MIT라 파일을 가져다 쓰는 것까지 막지는 않는다 — 앱 안에서 바로 고르는 편의를 파는 것이다.
 *
 * 색은 palette.ts `paletteTheme`의 역할 5개로 만들었다(배경·보조면·글자·강조·보조 강조). 바꾸려면 JSON을 직접 고친다.
 */

import fernDawnJson from "../../docs/themes/supporter/frond-fern-dawn.json?raw";
import hanjiJson from "../../docs/themes/supporter/frond-hanji.json?raw";
import meokJson from "../../docs/themes/supporter/frond-meok.json?raw";
import mossNightJson from "../../docs/themes/supporter/frond-moss-night.json?raw";
import { parseThemeFile, type ThemeDef } from "./themes";

export interface SupporterTheme {
  theme: ThemeDef;
  description: string;
}

function fromFile(text: string, stem: string, description: string): SupporterTheme[] {
  const parsed = parseThemeFile(text, stem);
  return parsed.ok ? [{ theme: parsed.theme, description }] : [];
}

export const SUPPORTER_THEMES: readonly SupporterTheme[] = [
  ...fromFile(fernDawnJson, "frond-fern-dawn", "새순 같은 연둣빛 바탕에 고사리 초록 — 아침에 읽기 좋은 라이트"),
  ...fromFile(mossNightJson, "frond-moss-night", "이끼 낀 숲의 밤 — 초록 차콜 바탕에 연한 잎색 강조"),
  ...fromFile(hanjiJson, "frond-hanji", "닥종이 바탕에 인주 빨강·쪽빛 — 따뜻한 종이 라이트"),
  ...fromFile(meokJson, "frond-meok", "먹색 바탕에 금빛 강조 — 차분한 다크"),
];
