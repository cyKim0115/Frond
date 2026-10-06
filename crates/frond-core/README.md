# mdeditor-core

MdEditor의 바이트 보존 파일 코어. UI 없이 `cargo test`로 검증한다 (로드맵 Phase 0-2).

## 보장

| 상황 | 결과 |
|---|---|
| 편집 없이 저장 | 원본 바이트 그대로 (재인코딩 없음) |
| 한 줄만 편집 | 그 줄 밖의 바이트·줄별 EOL·BOM·끝 개행 보존 |
| CP949(EUC-KR)로 표현 불가한 문자 | `SaveError::Unmappable { ch, line, col }` — 조용히 `?`로 바꾸지 않음 |
| 손실 디코드(깨진 바이트) 상태 | 무편집 저장은 허용, 편집 저장은 `SaveError::LossyDocument` |
| 쓰기 | 임시 파일 + `ReplaceFileW` 원자 교체, 실패 시 제자리 쓰기(`WriteMethod::InPlace`) |

## 흐름

```text
바이트 → BOM → UTF-8 검증 → chardetng(kr 힌트) + 후보 무손실 검증 → 디코드
      → 줄바꿈 정규화 (LF 텍스트 + Vec<Eol>) → FileDocument

FileDocument::to_bytes(new_text)
      → 무편집·인코딩 불변이면 원본 복사
      → 아니면 줄 diff로 EOL 재대응(eol::remap) → 재결합 → 인코딩(손실 검사)
```

- `text()`는 항상 LF 텍스트. CodeMirror 6는 `\n`만 다루므로 여기에 그대로 넣는다.
- `reinterpret(enc)` = Notepad++ "Encode in" (바이트 그대로, 해석만 변경). `convert(enc, bom)` = "Convert to" (다음 저장부터 바이트 변경).
- 새로 끼어든 줄의 EOL 정책은 [`src/eol.rs`](src/eol.rs) `remap` 한 곳에서만 정한다.

## 확인

```powershell
cd crates/mdeditor-core
cargo test
cargo run --example roundtrip -- ../../samples/raw   # 제자리 저장 후
git status --short ../../samples/raw                 # 아무것도 안 나와야 함
```
