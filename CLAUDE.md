# MdEditor

Markdown(.md) 파일을 보고 편집하는 개인용 Windows 데스크톱 앱.

**현재 단계: 초기세팅만 끝났다. 기술 스택·MVP 범위 미정.**
열려 있는 결정과 첫 세션 안건은 [docs/next-session.md](docs/next-session.md)를 먼저 본다.

## 상시 규칙

- 스택이 [docs/decisions/](docs/decisions/)에 기록되기 전에는 앱 코드·스캐폴딩을 만들지 않는다
- 확정된 결정은 `docs/decisions/NNNN-제목.md`로 남긴다. 대화로만 정한 것은 다음 세션에 사라진다
- `samples/raw/`는 바이트 단위 테스트 픽스처다. 편집기로 열어 저장하거나 줄바꿈을 정규화하지 않는다
- 커밋은 전역 `korean-git-commit` 룰을 따른다
- 스택이 정해지면 이 파일의 `구조`·`빌드` 절을 채우고 `.gitignore`에 산출물 경로를 추가한다

## 구조

```
docs/next-session.md   지금 열려 있는 것 (결정 대기·다음 할 일)
docs/decisions/        확정된 설계 결정 (ADR)
samples/               렌더링·파일 처리 확인용 마크다운 샘플
```

## 빌드

미정 — 스택 결정 후 작성.
