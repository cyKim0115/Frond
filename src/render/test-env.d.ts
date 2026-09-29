/**
 * 테스트 전용 최소 선언 — `@types/node`가 설치돼 있지 않아(vitest peer dep) `node:fs` import가 tsc에서 막힌다.
 * 통합자가 `@types/node`를 devDependencies에 넣으면 이 파일은 지운다.
 */

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}
