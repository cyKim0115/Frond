import { describe, expect, it } from "vitest";
import { countText } from "./wordcount";

describe("countText", () => {
  it("한글은 어절, 영문은 단어 단위로 센다", () => {
    expect(countText("안녕하세요 반갑습니다.").words).toBe(2);
    expect(countText("Hello, world! 한글과 English를 섞어도").words).toBe(5);
  });

  it("한자·가나는 한 글자를 한 단어로 센다", () => {
    expect(countText("日本語のテキスト").words).toBe(8);
    expect(countText("漢字abc").words).toBe(3);
  });

  it("안쪽 아포스트로피·하이픈·점은 한 단어로 잇고, 기호만 있는 덩어리는 세지 않는다", () => {
    expect(countText("don't e-mail 3.14 snake_case").words).toBe(4);
    expect(countText("— * # | ->").words).toBe(0);
  });

  it("글자는 줄바꿈을 빼고 세고, 공백 제외는 공백류도 뺀다. 이모지·확장 한자는 한 글자", () => {
    const c = countText("가 나\n다\r\n😀𠀀\t");
    expect(c.chars).toBe(7);
    expect(c.charsNoSpace).toBe(5);
  });

  it("빈 문자열은 모두 0", () => {
    expect(countText("")).toEqual({ words: 0, chars: 0, charsNoSpace: 0 });
  });
});
