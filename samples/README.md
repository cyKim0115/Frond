# 샘플

| 경로 | 용도 |
|---|---|
| `showcase.md` | 렌더링 확인. 제목·표·코드·체크리스트·이미지·한글 등 흔한 문법을 한 파일에 모았다 |
| `raw/` | 파일 처리 확인. 인코딩·줄바꿈이 다른 파일들. **바이트 단위 픽스처**라 `.gitattributes`에서 `-text`로 정규화를 막았다 |

## raw/ 픽스처

| 파일 | 인코딩 | 줄바꿈 | 파일 끝 개행 |
|---|---|---|---|
| `utf8-lf.md` | UTF-8 | LF | 있음 |
| `utf8-crlf.md` | UTF-8 | CRLF | 있음 |
| `utf8-bom.md` | UTF-8 BOM | CRLF | 있음 |
| `cp949.md` | CP949 (EUC-KR) | CRLF | 있음 |
| `mixed-eol.md` | UTF-8 | LF·CRLF 섞임 | 있음 |
| `no-final-newline.md` | UTF-8 | LF | **없음** |

편집기로 열어 아무것도 고치지 않고 저장했을 때 `git status`에 변경이 없어야 한다.
