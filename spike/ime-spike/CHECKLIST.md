# IME 스파이크 체크리스트 (Phase 0-1)

목적: 스택 판정([`docs/decisions/ideas/20260929-stack.md`](../../docs/decisions/ideas/20260929-stack.md)) 조건 1 — **WebView2 + CodeMirror 6가 한국어 MS IME 입력을 유실·중복·자소 분리 없이 받는가**를 실측한다.
게이트: **B면(CM6 plain)에서 ①–⑦ 전부 통과 → `ADOPT`**. A면(textarea)은 대조군, C면(데코)은 Phase 5 예습이라 게이트가 아니다.

이 앱은 폐기용이다. 결과만 [`docs/decisions/ideas/20260929-stack.md`](../../docs/decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란"에 옮긴다.

## 실행

```powershell
cd spike/ime-spike
npm install
npm run spike            # Tauri dev (Vite 1421 + cargo run)
npm run spike:tsf-off    # 실패 시 재시도용: --disable-features=…,TSFHonorAutocorrectOff 플래그 (G6)
```

창 상단에 Windows 빌드·IME 버전·WebView2 버전·플래그 상태가 뜬다. 결과 파일에도 같이 찍힌다.

## 테스트 매트릭스

| 축 | 값 | 전환 방법 |
|---|---|---|
| Windows | 10 19045 (개발 PC) / 11 | 다른 PC 또는 VM |
| MS IME | **새 IME**(기본) / **이전 IME** | 설정 → 시간 및 언어 → 언어 → 한국어 → 옵션 → Microsoft 입력기 → 호환성 → "이전 버전의 Microsoft IME 사용" 켜기. 또는 아래 레지스트리 |
| 플래그 | off(기본) / `--tsf-off` | 실패한 셀에서만 |

이전 IME 레지스트리 (재로그인 필요):

```powershell
reg add "HKCU\Software\Policies\Microsoft\InputMethod\Settings\KOR" /v ConfigureImeVersion /t REG_DWORD /d 1 /f
# 되돌리기
reg delete "HKCU\Software\Policies\Microsoft\InputMethod\Settings\KOR" /v ConfigureImeVersion /f
```

실행 라벨 규칙: `win10-19045-newIME`, `win10-19045-oldIME`, `win11-26200-newIME`, `…-tsfoff`

## 시나리오 (편집면 A·B·C 각각)

샘플 본문에 번호가 적혀 있다. 각 항목은 **두벌식 한글**로, 받침 있는 글자(예: "값", "닭", "한글")를 섞어 친다.

| # | 하는 일 | 통과 기준 | 실패 징후 |
|---|---|---|---|
| ① | 앱을 막 띄우고(다른 곳 클릭 없이) ①줄 끝을 한 번 클릭 → 곧바로 "한글" 입력 | 첫 글자부터 한글로 들어감 | 첫 글자 유실, 영문 "gksrmf"로 들어감, 두 번째부터 한글 (tauri #15436) |
| ② | "한" 조합 중(밑줄 상태)에 오른쪽 **조합 중 클릭** 버튼 클릭 / 조합 중 Alt+Tab 후 복귀 | 조합 중이던 글자가 확정되고 한 번만 남음 | 글자 사라짐, 두 번 들어감, 커서 위치 이탈 (#5475) |
| ③ | "한" 조합 중 Enter / 조합 중 Ctrl+S | 줄 수 배지 +1, Ctrl+S 배지 +1 (또는 `isComposing` 무시 로그 1건) | 줄이 두 줄 늘거나 Ctrl+S 두 번, 조합 글자 유실 (G18) |
| ④ | ④줄이 접히는 지점에 커서를 두고 계속 입력 | 자소가 떨어지지 않고 커서가 튀지 않음 | "ㅎㅏㄴ" 자소 분리, 커서가 앞줄로 점프 (G17) |
| ⑤ | ⑤ 문장을 드래그 선택 → Backspace → 곧바로 한글 입력 | 지운 자리에 바로 조합 시작 | 첫 글자 유실, 선택이 남아 있음 (T20) |
| ⑥ | YAML 블록 바로 아래 ⑥줄 끝에 입력 | 정상 | C면에서 front matter가 위젯으로 바뀌면 안 됨 |
| ⑦ | `**굵게**` 뒤, `` `코드` `` 뒤에 입력 | 정상. C면은 캐럿 줄이라 마크가 다시 보여야 함 | 조합이 마크 안으로 들어감, 백틱 뒤 첫 글자 유실 (#4251) |
| ⑧ | **C면만.** 이미지 위젯 바로 앞·가로줄 위젯 다음 줄 맨 앞에서 조합. 상단 체크박스 4조합(가드 ON/OFF × 캐럿 줄 노출 ON/OFF) 모두 | 조합 중 위젯이 깜빡이거나 커서가 위젯 뒤로 밀리지 않음 | 조합 글자 유실·중복, 위젯 안으로 커서 진입 |

로그 읽는 법: `keydown key=Process keyCode=229`는 IME가 키를 먹었다는 뜻(정상). `compositionstart → compositionupdate… → compositionend data="한"`이 한 글자당 한 번씩 나와야 한다. `compositionend data=""` 뒤에 `input insertText data="한"`이 따로 오면 브라우저가 조합을 취소했다가 다시 넣은 것 — 유실·중복의 전조다. C면의 `deco: 조합 중 → map만`은 IME 가드가 작동한 표시.

## 기록

1. 오른쪽 체크리스트에서 셀마다 통과/부분/실패 + 증상 메모 (localStorage에 남는다).
2. 실행 라벨을 넣고 **결과 내보내기** → `spike/ime-spike/results/<라벨>.md` + 클립보드.
3. 매트릭스 셀마다 1·2 반복. 실패 셀은 `npm run spike:tsf-off`로 한 번 더.
4. 결과 표를 `docs/decisions/ideas/20260929-stack.md` "Phase 0 결과 기록란"에 붙이고 Verdict를 갱신한다.

판정 순서(스택 판정 Modified approach 1): B면 통과 → `ADOPT`. 실패 → (a) 플래그 (b) textarea/EditContext 입력 모델(A면 결과가 근거) (c) Electron 재판정.

## raw 샘플

**raw/cp949.md 불러오기** 버튼은 `mdeditor-core`로 CP949 파일을 읽어 세 면에 넣는다. 로그에 감지된 인코딩·EOL이 찍힌다. 저장은 하지 않는다.
