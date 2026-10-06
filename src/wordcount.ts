/**
 * 상태바 글자 수 (로드맵 백로그 "워드카운트"). 보기 화면에 그려진 본문 글자(마크다운 기호·링크 주소 제외)를 센다.
 *
 * 단어: 띄어 쓰지 않는 한자·가나는 Typora처럼 한 글자를 한 단어로 세고(참고 T3 "CJK 1자=1단어"), 한글·영문·숫자는
 * 띄어쓰기·문장 부호로 나뉜 덩어리(한글은 어절)를 한 단어로 센다 — 한글까지 음절마다 세면 "안녕하세요"가 5단어가 된다.
 * 글자: 줄바꿈을 뺀 모든 글자(유니코드 코드 포인트). 공백 제외는 공백류도 뺀 수.
 */

export interface TextCount {
  words: number;
  chars: number;
  charsNoSpace: number;
}

const CJK = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}";
/** 한자·가나 한 글자, 또는 그 밖의 글자·숫자 덩어리(안쪽의 ' ’ - _ . 은 이어 붙인다: don't, e-mail, 3.14) */
const WORD_RE = new RegExp(
  `[${CJK}]|(?:(?![${CJK}])[\\p{L}\\p{N}\\p{M}])+(?:['’\\-_.](?:(?![${CJK}])[\\p{L}\\p{N}\\p{M}])+)*`,
  "gu",
);
/** JS `\s`와 같은 공백류 (줄바꿈 제외) — 10 MB 문서에서 글자마다 정규식을 돌리지 않으려고 코드로 비교한다 */
function isSpace(c: number): boolean {
  return (
    c === 0x20 || c === 0x09 || c === 0x0b || c === 0x0c || c === 0xa0 || c === 0x1680 ||
    (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 || c === 0x202f || c === 0x205f ||
    c === 0x3000 || c === 0xfeff
  );
}

export function countText(text: string): TextCount {
  let words = 0;
  for (const _ of text.matchAll(WORD_RE)) words++;
  let chars = 0;
  let spaces = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0x0a || c === 0x0d) continue;
    // 서로게이트 쌍은 뒤쪽 반만 세어 한 글자로
    if (c >= 0xd800 && c <= 0xdbff) continue;
    chars++;
    if (isSpace(c)) spaces++;
  }
  return { words, chars, charsNoSpace: chars - spaces };
}
