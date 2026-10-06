# Frond 코드베이스 — 테마 시스템과 유료 해금(후원자 라이선스) 게이팅 지점

> 조사 범위: 로컬 저장소 `C:/Users/cykim/repo/MdEditor` main `e8dc25a`(2026-10-06). v2 워크트리(`../MdEditor-v2`, `a0b2c44`)는 main보다 앞선 코드 변경이 없다 — `a0b2c44..e8dc25a` 차이는 문서 6개뿐(`git diff --stat`). 그래서 main 기준으로 본다.
> 표기: "Cited Findings" = **현재 구조(사실)**, 근거는 `파일:줄`. "Inferences" = **제안(설계안)**. 링크는 이 노트 위치에서 저장소 루트(`../../../../`) 기준 상대 경로다.

## 1. 테마 시스템 인벤토리 — 테마란 무엇이고, 사용자 테마 기능은 지금 무엇으로 이뤄져 있나

### Takeaway
테마는 색 토큰만 담은 `ThemeDef`(셸 8개 + 문서 48개, 빠진 토큰은 GitHub 기본 팔레트로 채움)이다. 앱에 박힌 테마는 내장 라이트·다크(세이지 차콜) 두 개뿐이다. 그 밖의 테마는 추천 테마든 가져온 테마든 모두 `%APPDATA%\Frond\themes\<id>.json` 한 폴더에 같은 형식으로 저장되고, 저장된 뒤에는 출처를 구분하지 않는다. 앱 안에서 토큰을 고치는 편집기나 팔레트로 테마를 만드는 UI는 없다. "사용자 테마 기능"의 실체는 가져오기·폴더 열기·다시 읽기·복제·내보내기·삭제·적용, 그리고 추천 테마 추가다.

### Cited Findings (현재 구조)
**모델·토큰**
- `ThemeDef { id, name, base: "light"|"dark", shell?, doc? }`, `ResolvedTheme`는 모든 토큰을 가진 형태다 — [src/theme/themes.ts:85-102](../../../../src/theme/themes.ts#L85-L102)
- 셸 토큰 `SHELL_TOKENS` 8개(fg·bg·muted·line·accent·on-accent·danger·sidebar-bg) — [src/theme/themes.ts:21-31](../../../../src/theme/themes.ts#L21-L31). 문서 토큰 `DOC_TOKENS` 48개(github-markdown 변수 + selection-bg 2개) — [src/theme/themes.ts:33-83](../../../../src/theme/themes.ts#L33-L83)
- 기본 팔레트 `GITHUB_LIGHT`·`GITHUB_DARK`(2026-10-06까지의 내장 색)는 빈 토큰을 채우는 데 쓴다 — [src/theme/themes.ts:104-238](../../../../src/theme/themes.ts#L104-L238). 채우는 함수는 `resolveTheme` — [src/theme/themes.ts:283-293](../../../../src/theme/themes.ts#L283-L293)
- 적용: `themeCss()`가 `@media screen` 안에 `:root`·`.markdown-body`·`.cm-editor` 변수 한 벌을 만든다 — [src/theme/themes.ts:299-308](../../../../src/theme/themes.ts#L299-L308). `applyTheme()`은 그것을 `<style id="theme-vars">`에 쓰고 `data-theme=base`를 붙인다 — [src/theme/themes.ts:311-320](../../../../src/theme/themes.ts#L311-L320). 전환 연출은 `registerColorTokens`·`themeTransitionCss`가 맡는다 — [src/theme/themes.ts:333-351](../../../../src/theme/themes.ts#L333-L351)

**내장 테마**
- 내장 라이트·다크 = `resolveTheme(paletteTheme("light"|"dark", …, sageCharcoalLight()/Dark()))`. `BUILTIN_THEMES = [LIGHT, DARK]`이고 지우거나 고칠 수 없다. `isBuiltinTheme(id)` — [src/theme/themes.ts:240-249](../../../../src/theme/themes.ts#L240-L249)

**팔레트 → 토큰 파생 (palette.ts)**
- 역할 `Roles { bg, surface, fg, accent, second, muted?, line? }` — [src/theme/palette.ts:91-106](../../../../src/theme/palette.ts#L91-L106)
- `paletteTheme(id, name, base, roles)`는 셸 7개와 문서 약 24개 토큰을 만든다. 대비가 모자라면 `readable()`로 밝기만 옮겨 WCAG 기준(글자 7:1, 강조 4.5:1)을 맞추고, 나머지 토큰은 base 기본 팔레트에서 가져온다 — [src/theme/palette.ts:108-150](../../../../src/theme/palette.ts#L108-L150), [src/theme/palette.ts:77-87](../../../../src/theme/palette.ts#L77-L87)
- `SAGE_CHARCOAL` 5색, `sageCharcoalLight`·`sageCharcoalDark` — [src/theme/palette.ts:152-176](../../../../src/theme/palette.ts#L152-L176)
- `paletteTheme`는 코드에서만 쓴다(내장·추천). 사용자가 팔레트 5색을 골라 테마를 만드는 UI는 없다(theme-panel.ts·recommended-dialog.ts 어디에서도 부르지 않음) — [src/theme-panel.ts:1-287](../../../../src/theme-panel.ts), [src/recommended-dialog.ts:1-130](../../../../src/recommended-dialog.ts)

**추천 테마 (recommended.ts / recommended-dialog.ts)**
- `RecommendedTheme { theme, group: "mdeditor"|"wedding", description, palette? }`, 묶음 `RECOMMENDED_GROUPS`(Frond / 웨딩 컬러 팔레트) — [src/theme/recommended.ts:17-31](../../../../src/theme/recommended.ts#L17-L31)
- 세피아는 `docs/themes/sepia.json?raw`를 가져오기와 같은 검증(`parseThemeFile`)으로 읽는다 — [src/theme/recommended.ts:11](../../../../src/theme/recommended.ts#L11), [src/theme/recommended.ts:82-85](../../../../src/theme/recommended.ts#L82-L85). GitHub 라이트·다크 2개 — [src/theme/recommended.ts:87-91](../../../../src/theme/recommended.ts#L87-L91). 웨딩 팔레트 20개(`wedding-<slug>` id, `paletteTheme`으로 생성) — [src/theme/recommended.ts:33-80](../../../../src/theme/recommended.ts#L33-L80). 전체 `RECOMMENDED_THEMES`는 23개다 — [src/theme/recommended.ts:93-98](../../../../src/theme/recommended.ts#L93-L98)
- 추천 테마는 "고르면 사용자 테마로 테마 폴더에 복사된다(가져오기와 같은 길)" — [src/theme/recommended.ts:1-9](../../../../src/theme/recommended.ts#L1-L9)
- 팝업 훅 `has/add/apply/currentThemeId/chips` — [src/recommended-dialog.ts:10-21](../../../../src/recommended-dialog.ts#L10-L21). 항목마다 '추가'·'적용' 버튼이 있고 — [src/recommended-dialog.ts:49-90](../../../../src/recommended-dialog.ts#L49-L90), 묶음별로 그리며 '모두 추가 (n)' 버튼이 있다 — [src/recommended-dialog.ts:92-114](../../../../src/recommended-dialog.ts#L92-L114). DOM은 `#recommended-dialog` — [index.html:147-161](../../../../index.html#L147-L161)

**사용자 테마 (저장·목록·검증)**
- 원본은 `%APPDATA%\Frond\themes`다. 시작할 때 동기로 쓰려고 localStorage `mdeditor.userThemes`에 캐시해 둔다. 설정 모듈이 저장된 `theme` 값을 읽는 순간 목록에 없으면 기본값으로 되돌리기 때문이다 — [src/theme/themes.ts:251-266](../../../../src/theme/themes.ts#L251-L266)
- `setUserThemes`는 내장 id와 겹치는 항목을 버리고 캐시에 쓴다. `listThemes()`는 내장 → 사용자 순서이고, `findTheme`이 있다 — [src/theme/themes.ts:268-281](../../../../src/theme/themes.ts#L268-L281)
- 테마 파일 형식(2026-10-01 확정): 색 토큰만 담는 JSON — [src/theme/themes.ts:353-357](../../../../src/theme/themes.ts#L353-L357), [docs/decisions/ideas/20260930-theme-file-format.md:37-46](../../../../docs/decisions/ideas/20260930-theme-file-format.md)
- 검증 `validateTheme`: id 정규식, 내장 id 금지, name 1–60자, base, 허용 키(`id,name,base,shell,doc,$schema,description`, 그 밖은 경고), 색 값(`CSS.supports`, `url(`·`@import` 등 금지) — [src/theme/themes.ts:359-418](../../../../src/theme/themes.ts#L359-L418). `parseThemeFile`은 BOM을 제거한다 — [src/theme/themes.ts:420-429](../../../../src/theme/themes.ts#L420-L429). `themeToJson(theme, full)` — [src/theme/themes.ts:431-435](../../../../src/theme/themes.ts#L431-L435)
- 백엔드 커맨드(themes.rs). 폴더 = `appdata::root()/themes` — [src-tauri/src/themes.rs:15-17](../../../../src-tauri/src/themes.rs#L15-L17). 파일 이름 id 검사 `valid_id` — [src-tauri/src/themes.rs:19-32](../../../../src-tauri/src/themes.rs#L19-L32). 상한은 256 KB·200개 — [src-tauri/src/themes.rs:11-13](../../../../src-tauri/src/themes.rs#L11-L13). 커맨드는 `list_user_themes`·`read_theme_file`·`save_user_theme`·`delete_user_theme`·`export_theme`·`open_themes_folder` — [src-tauri/src/themes.rs:70-123](../../../../src-tauri/src/themes.rs#L70-L123). 형식 검증은 프런트가 한다(Rust는 id만 본다) — [src-tauri/src/themes.rs:1-4](../../../../src-tauri/src/themes.rs#L1-L4). 등록 — [src-tauri/src/lib.rs:221-226](../../../../src-tauri/src/lib.rs#L221-L226)

**사용자에게 보이는 기능 전체 목록 (설정 '테마' 탭 커스텀 패널 theme-panel.ts)**
1. 머리 버튼 4개: **추천 테마…**, **가져오기…**, **폴더 열기**, **다시 읽기** — [src/theme-panel.ts:76-84](../../../../src/theme-panel.ts#L76-L84). 브라우저 미리보기(non-Tauri)에서는 가져오기·폴더·다시 읽기를 끈다 — [src/theme-panel.ts:94-97](../../../../src/theme-panel.ts#L94-L97)
2. 목록 항목마다 색 칩 미리보기(`themeChips`, 5토큰) — [src/theme-panel.ts:37-72](../../../../src/theme-panel.ts#L37-L72). 이름과 메타(`라이트/다크 · 내장/파일`) — [src/theme-panel.ts:113-118](../../../../src/theme-panel.ts#L113-L118)
3. 항목 버튼: **적용**(설정 `theme`으로 고정), **복제**(모든 토큰을 채운 `<id>-copy` 파일), **내보내기**(JSON 저장, 내장은 full), **삭제**(내장 제외) — [src/theme-panel.ts:120-129](../../../../src/theme-panel.ts#L120-L129), [src/theme-panel.ts:232-258](../../../../src/theme-panel.ts#L232-L258)
4. 가져오기 흐름: 파일 대화상자 → `read_theme_file` → `parseThemeFile` → 같은 id면 덮어쓸지 확인 → `save_user_theme` → `reload` → '지금 적용' 선택지 — [src/theme-panel.ts:190-230](../../../../src/theme-panel.ts#L190-L230)
5. 다시 읽기: `list_user_themes` → 파일마다 검증 → `setUserThemes` → `onListChanged`(선택지 다시 채움·테마 재적용). 읽지 못한 파일은 목록 아래에 보인다 — [src/theme-panel.ts:136-160](../../../../src/theme-panel.ts#L136-L160)
6. 삭제하면 그 테마를 가리키던 `theme`은 base 내장 테마로, `themeLight/Dark`는 기본값으로 되돌린다 — [src/theme-panel.ts:260-280](../../../../src/theme-panel.ts#L260-L280)
7. "새 테마 만들기"는 복제한 뒤 폴더에서 JSON을 직접 고치고 '다시 읽기'를 누르는 방식이다(안내 문구) — [src/theme-panel.ts:88-92](../../../../src/theme-panel.ts#L88-L92), [src/theme-panel.ts:244-247](../../../../src/theme-panel.ts#L244-L247). README에도 같은 내용이 있다 — [README.md:185-195](../../../../README.md)
8. 설정 선택지 `theme`(기본 `system`), `themeLight`, `themeDark`. 선택지는 `listThemes()`에서 동적으로 만든다(내장과 사용자 테마 모두) — [src/settings.ts:46-76](../../../../src/settings.ts#L46-L76). Ctrl+Shift+D는 라이트·다크 쌍을 오간다 — [src/main.ts:1764-1767](../../../../src/main.ts#L1764-L1767)

**활성 테마 결정·저장**
- `effectiveTheme()`: `theme === "system"`이면 OS 모드에 따라 `themeDark`/`themeLight`를 쓴다. 테마를 못 찾으면 그 모드의 내장 테마로 대체하되 **설정값은 고치지 않는다** — [src/main.ts:1703-1711](../../../../src/main.ts#L1703-L1711)
- `applyEffectiveTheme()`은 Mermaid 다시 그리기, 편집기 다크 전환, 연출(큰 문서는 View Transition)을 맡는다 — [src/main.ts:1724-1748](../../../../src/main.ts#L1724-L1748). OS 모드가 바뀌면 다시 적용한다 — [src/main.ts:1759-1761](../../../../src/main.ts#L1759-L1761)
- `applySetting`의 theme 분기 — [src/main.ts:1771-1776](../../../../src/main.ts#L1771-L1776). 부팅 순서: `SETTING_KEYS.forEach(applySetting)` → `initSettingsDialog()` → `createThemePanel(...)` → `addPanel("theme", …)` → `themePanel.reload()` — [src/main.ts:1795-1811](../../../../src/main.ts#L1795-L1811)
- 설정 저장소는 localStorage `mdeditor.settings` 한 키다. `load()`는 **모듈 import 시점**에 돌고, 선택지에 없는 값은 기본값으로 정규화한다. `setSetting`은 값 전체를 다시 쓴다 — [src/settings.ts:205-250](../../../../src/settings.ts#L205-L250)

**개발자 본인 환경(2026-10-06 관찰)**
- `%APPDATA%\Frond\themes`에 `sepia.json`, `wedding-art-deco-emerald-gold.json`, `wedding-sage-champagne-blush.json` 3개가 있다. 출처는 셸 `ls` 결과다. 이 셸은 Claude MSIX 컨테이너 안이라 합쳐진(가상화) 보기일 수 있다 — [CLAUDE.md:95](../../../../CLAUDE.md)

### Inferences (제안)
- 개발자가 말한 "custom theme 기능"을 코드 단위로 정의하면 다음 셋이다. ① 외부 JSON을 들이는 길(가져오기·폴더 열기 + 다시 읽기로 직접 넣은 파일 인식) ② 새 테마를 만드는 길(복제) ③ 그렇게 들인 테마를 적용하는 길(설정 선택지·적용 버튼). 추천 테마(23개)는 지금 같은 폴더·같은 형식으로 저장되므로, 무료로 둘지 유료로 묶을지 먼저 정해야 한다.
- 팔레트 5색으로 테마를 만드는 UI(palette.ts `paletteTheme` 재사용)는 지금 없다. 후원자 전용 "새 기능"으로 추가하면 해금 가치가 분명해진다(제안. 현재 범위 밖).

### Gaps
- 개발자 본인이 지금 고른 `theme`·`themeLight`·`themeDark` 값은 WebView2 localStorage(`%LOCALAPPDATA%\com.cykim.mdeditor\EBWebView`, LevelDB)에 있어 이번 조사에서 읽지 않았다.

## 2. 자연스러운 게이팅 지점 — (a) 사용자 테마 사용·생성·가져오기 (b) 전용 테마 노출 (c) 이미 사용자 테마를 쓰는 비구매자

### Takeaway
UI 게이트를 걸 곳은 theme-panel.ts의 버튼 핸들러 4~5곳과 recommended-dialog.ts의 `item()`이다. "적용 중인 테마" 게이트는 `listThemes()`가 아니라 `effectiveTheme()`(main.ts:1706)에 걸어야 한다. 설정 `load()`가 모듈 초기화 시점에 `listThemes()`로 저장값을 정규화하기 때문이다. 목록에서 테마를 빼 버리면 비동기로 오는 라이선스 확인보다 먼저 저장값이 지워진다. 그리고 테마 파일은 서명 없는 평문 JSON이고 소스는 MIT라서, 어떤 게이트든 "정직한 사용자용 잠금" 수준이다.

### Cited Findings (현재 구조)
- **목록의 단일 출처**는 `listThemes()`다. 설정 선택지([src/settings.ts:46-50](../../../../src/settings.ts#L46-L50)), 테마 패널 목록([src/theme-panel.ts:107](../../../../src/theme-panel.ts#L107)), 추천 팝업의 `has()`([src/theme-panel.ts:182-188](../../../../src/theme-panel.ts#L182-L188)), `findTheme`/`effectiveTheme`([src/theme/themes.ts:279-281](../../../../src/theme/themes.ts#L279-L281), [src/main.ts:1710](../../../../src/main.ts#L1710))이 모두 여기서 가져간다.
- **출처 구분 없음**: 추천 테마를 추가해도 가져오기와 같은 `save_user_theme`로 폴더에 쓴다([src/theme-panel.ts:162-180](../../../../src/theme-panel.ts#L162-L180)). 목록에서는 내장이 아닌 테마가 모두 "파일"로 보인다([src/theme-panel.ts:114-118](../../../../src/theme-panel.ts#L114-L118)). `ThemeDef`에는 출처·잠금 필드가 없다([src/theme/themes.ts:85-94](../../../../src/theme/themes.ts#L85-L94)).
- **허용 키 고정**: `validateTheme`은 `id,name,base,shell,doc,$schema,description` 밖의 키에 경고를 낸다([src/theme/themes.ts:411-413](../../../../src/theme/themes.ts#L411-L413)). 추천 테마 테스트는 "경고 없이 통과"를 요구한다([src/theme/recommended.test.ts:15-20](../../../../src/theme/recommended.test.ts#L15-L20)).
- **설정 정규화 시점**: `let values = load()`가 import 시점에 돌고, select 값은 `options()` → `listThemes()`로 검사한다([src/settings.ts:209-234](../../../../src/settings.ts#L209-L234)). 이후 어느 키든 `setSetting`이 불리면 `values` 전체를 저장한다([src/settings.ts:242-250](../../../../src/settings.ts#L242-L250)). 캐시가 있는 이유도 같다(themes.ts 주석) — [src/theme/themes.ts:251-255](../../../../src/theme/themes.ts#L251-L255)
- **런타임 대체는 이미 있다**: `effectiveTheme()`은 못 찾은 테마를 시스템 모드 쪽 내장 테마로 바꿔 보이되 설정값은 두는 구조다 — [src/main.ts:1706-1711](../../../../src/main.ts#L1706-L1711)
- **게이트 후보 핸들러**: 머리 버튼(추천·가져오기·폴더·다시 읽기) [src/theme-panel.ts:79-83](../../../../src/theme-panel.ts#L79-L83), 항목 적용·복제·내보내기·삭제 [src/theme-panel.ts:121-128](../../../../src/theme-panel.ts#L121-L128), `importTheme` [src/theme-panel.ts:190](../../../../src/theme-panel.ts#L190), `duplicate` [src/theme-panel.ts:232](../../../../src/theme-panel.ts#L232), `exportTheme` [src/theme-panel.ts:250](../../../../src/theme-panel.ts#L250), 추천 항목 추가·적용 [src/recommended-dialog.ts:71-86](../../../../src/recommended-dialog.ts#L71-L86), 모두 추가 [src/recommended-dialog.ts:107-114](../../../../src/recommended-dialog.ts#L107-L114)
- **우회 경로**: 폴더 열기로 아무 JSON이나 넣고 다시 읽기를 누르면 목록에 오른다([src/theme-panel.ts:81-82](../../../../src/theme-panel.ts#L81-L82), [src-tauri/src/themes.rs:117-123](../../../../src-tauri/src/themes.rs#L117-L123)). 내보내기는 고른 경로에 JSON 전체를 쓴다([src-tauri/src/themes.rs:109-115](../../../../src-tauri/src/themes.rs#L109-L115)). HTML 내보내기는 지금 테마 CSS(`#theme-vars`)를 파일에 넣는다([src/main.ts:1893-1896](../../../../src/main.ts#L1893-L1896)).
- **라이선스·공개 상태**: README와 워크스페이스 라이선스가 MIT이고([README.md:289-291](../../../../README.md), [Cargo.toml:8](../../../../Cargo.toml)), 원격은 `git@github.com:cyKim0115/MdEditor.git`이다(`git remote -v`). 저장소가 공개인지는 확인하지 않았다.
- **UI 재료**: 항목 모양 `.theme-item`·`.theme-meta`·`aria-current` 강조([src/style.css:864-891](../../../../src/style.css)), 배지 모양 `.nav-badge`(accent/on-accent 토큰)([src/style.css:243-258](../../../../src/style.css)), 추천 묶음 머리 `.rec-group-head`·`.rec-source`([src/style.css:897-899](../../../../src/style.css)). 색은 테마 토큰만 쓴다는 규칙 — [CLAUDE.md:99](../../../../CLAUDE.md)
- 개발 실행이 기댈 수 있는 구분은 런타임 `IS_TAURI`뿐이다([src/main.ts:166](../../../../src/main.ts#L166)). 프런트에 빌드 종류를 나누는 env·define은 없다([vite.config.ts:1-22](../../../../vite.config.ts)).

### Inferences (제안)
**(a) 사용자 테마 사용·생성·가져오기**
- 권장 게이트 범위(Fork식 "무료로 다 쓰되 꾸미기는 후원자"): 가져오기, 폴더 열기, 복제는 후원자 전용으로 한다. 다시 읽기는 남겨 두되, 후원자가 아니면 "출처가 무료 카탈로그가 아닌 파일"을 목록에 잠금 상태로 보인다. 추천 테마(세피아·GitHub·웨딩 20)는 무료로 두는 편이 자연스럽다. 이 경우 출처 판정이 필요하다.
  - 출처 판정 안: 추천 카탈로그 id 집합(`RECOMMENDED_THEMES.map(e=>e.theme.id)`)을 "무료 카탈로그"로 본다. 파일 id가 이 집합에 있으면 무료로 취급한다. 더 엄격하게 하려면 내용까지 카탈로그 정의와 같은지(`themeToJson` 비교) 본다. 파일 형식에 키를 더하는 방식(예: `"source"`)은 허용 키·테스트([src/theme/themes.ts:411-413](../../../../src/theme/themes.ts#L411-L413), [src/theme/recommended.test.ts:15-20](../../../../src/theme/recommended.test.ts#L15-L20))를 바꿔야 하고 손으로 위조하기도 쉽다.
  - 더 단순한 안: 추천 테마를 폴더 복사 없이 "카탈로그 테마"로 `listThemes()`에 직접 싣는다(내장과 같은 대우). 그러면 폴더 = 순수 사용자 테마가 되어 게이트 조건이 "폴더 테마는 후원자 전용" 한 줄이 된다. 대신 기존 추천 → 폴더 흐름([src/recommended-dialog.ts:1-5](../../../../src/recommended-dialog.ts#L1-L5))과 이미 폴더에 있는 추천 파일(개발자 환경 3개)을 옮기는 작업이 생긴다.
- 게이트 함수는 DOM 없는 순수 모듈로 둔다(예: `src/license.ts`의 `canUseTheme(theme, ent)`, `isCatalogTheme(id)`, `canImport(ent)`). theme-panel·recommended-dialog·main.ts가 이 함수만 부르게 한다. DOM 파일에는 테스트가 없다(§5).
- 잠긴 버튼은 숨기지 말고 보인다. 눌렀을 때 `showChoice`로 "후원자 기능입니다 — 구매하기 / 닫기"를 띄운다(구매 동선).

**(b) 전용(exclusive) 테마 노출**
- `RECOMMENDED_GROUPS`에 `{ id: "supporter", label: "후원자 전용" }` 묶음을 더하고, `RecommendedTheme`에 `exclusive?: true`를 둔다([src/theme/recommended.ts:17-31](../../../../src/theme/recommended.ts#L17-L31)). 팝업 `item()`에서 비구매자에게는 칩·이름·팔레트를 보이되 '추가/적용' 대신 잠금 배지와 '구매…' 버튼을 그린다([src/recommended-dialog.ts:49-90](../../../../src/recommended-dialog.ts#L49-L90)). 숨기지 않고 잠금으로 보이는 쪽이 발견성에 좋다. '모두 추가' 개수에서는 빼야 한다([src/recommended-dialog.ts:107-109](../../../../src/recommended-dialog.ts#L107-L109)).
- 전용 테마 정의를 JS 번들(recommended.ts)에 두면 번들에서 바로 읽힌다. 덜 드러나게 하려면 Rust 바이너리에 `include_str!`로 넣고 `get_exclusive_themes`(entitled일 때만 반환)로 내려준다. 어느 쪽이든 MIT 소스 + 평문 JSON이라 막을 수는 없고, 가리는 정도다. 후원자 전용 테마는 폴더에 저장하지 않는 "카탈로그 테마"로 싣는다. 그 항목에는 복제·내보내기를 끄면 파일로 퍼지는 것을 줄일 수 있다(완전 차단은 아님. HTML 내보내기에는 색이 남는다).
- 배지 색은 `--accent`/`--on-accent` 토큰을 쓴다. 새 색이 필요하면 토큰을 늘리고 내장 라이트·다크 둘 다 채운다(CLAUDE.md 규칙).

**(c) 이미 사용자 테마를 쓰는 비구매자(구매 취소·라이선스 만료·오프라인 포함)**
- `listThemes()`에서 빼지 않는다. 빼면 `settings.load()`가 저장값을 지운다. `effectiveTheme()`에서 `canUseTheme`가 거짓이면 같은 base의 내장 테마로 보인다(기존 대체 구조 재사용, 설정값 보존). 라이선스가 돌아오면 원래 테마가 자동으로 되살아난다.
- 시작할 때 비동기 확인 결과가 오기 전에는 localStorage 캐시(`mdeditor.entitlement`, 화면 표시 전용)로 첫 그림을 정한다. 확인 결과가 다르면 `applyEffectiveTheme()`을 다시 부른다. 캐시가 없으면 "free"로 시작하되 깜빡임을 줄이려면 첫 적용 전에 짧게 기다리는 안도 있다.
- 대체가 일어나면 테마 탭 해당 항목에 "후원자 기능 — 지금은 라이트 내장 테마로 보입니다"를 표시한다. 모달은 띄우지 않는다.
- 0.1.0 미공개라 공개 사용자 grandfathering은 필요 없다. 개발자 본인 환경은 debug 빌드(`cfg!(debug_assertions)`)나 개발용 env로 entitled 처리하거나 본인 라이선스 키로 해결하면 된다. 추천 테마를 무료로 두면 개발자 폴더의 3개 파일(sepia·wedding 2개)은 전부 카탈로그 id라서 영향이 없다.

### Gaps
- 게이트 범위(추천 테마 무료 여부, 내보내기 허용 여부, 이미 만든 테마 "읽기만 허용" 여부)는 제품 결정이다. 코드로 정할 수 없다.

## 3. 구매 권유 팝업 — 어디서 띄우고, 카운터를 어디에 두고, 입력·저장·첫 실행을 어떻게 피하나

### Takeaway
시작 흐름 `init()`(main.ts:2251-2304) 끝에 이미 "부팅 뒤 알림" 선례(`checkWebviewVersion`, 배너 또는 상태바)가 있다. 저장 성공 지점(`flashStatus("저장됨")`, main.ts:1133)은 카운터를 올리기 좋은 자리다. 다만 `showChoice`는 열려 있는 `#app-dialog`를 닫아 이전 질문을 취소시킨다. 그래서 권유 팝업은 반드시 `dialog[open]`·IME 조합 중·최근 입력 여부를 확인한 뒤 지연 실행해야 한다. 카운터는 잃어도 되는 상태라 prefs.ts(localStorage `mdeditor.*`)가 맞다.

### Cited Findings (현재 구조)
- **부팅 흐름** `init()`: 이벤트 구독 → `onCloseRequested` → `take_pending_paths`로 연 파일 → 세션 복원 → `sessionReady` → 열린 게 없으면 `showWelcome()` → 기본 앱 상태 → 관리자 권한 표시 → `checkWebviewVersion()` — [src/main.ts:2251-2304](../../../../src/main.ts#L2251-L2304). `checkWebviewVersion`은 문서가 열려 있으면 배너, 없으면 상태바 깜빡임으로 알린다 — [src/main.ts:2306-2315](../../../../src/main.ts#L2306-L2315). Tauri 밖(브라우저 미리보기)에서는 `init()`을 부르지 않는다 — [src/main.ts:2326-2339](../../../../src/main.ts#L2326-L2339)
- **팝업 API**: `showChoice({title,message,detail,choices,cancelLabel,focus,vertical})`는 Esc·바깥 클릭이면 null이다 — [src/dialog.ts:6-66](../../../../src/dialog.ts#L6-L66). **열려 있는 `#app-dialog`를 먼저 `close()`한다** — [src/dialog.ts:44](../../../../src/dialog.ts#L44). `showDialog` — [src/dialog.ts:68-90](../../../../src/dialog.ts#L68-L90). DOM `#app-dialog` — [index.html:163-170](../../../../index.html#L163-L170)
- **이미 쓰는 가드 패턴**: 단축키 처리가 `document.querySelector("dialog[open]")`이면 팝업에 양보한다 — [src/main.ts:2072](../../../../src/main.ts#L2072), [src/main.ts:2084](../../../../src/main.ts#L2084). IME 조합 중(`event.isComposing || keyCode === 229`) 분기 — [src/main.ts:2069-2083](../../../../src/main.ts#L2069-L2083). `editor.view.composing`과 `flushComposition` — [src/main.ts:1076-1082](../../../../src/main.ts#L1076-L1082)
- **저장 경로**: `save()` → `flushComposition` → `save_document` → 성공 시 `flashStatus("저장됨")` — [src/main.ts:1092-1138](../../../../src/main.ts#L1092-L1138). 실패하면 충돌·인코딩 팝업이 연쇄로 뜬다(`handleSaveFailure`) — [src/main.ts:1140-1185](../../../../src/main.ts#L1140-L1185)
- **닫기 경로**: `onCloseRequested` → `confirmCloseWindow`(저장 안 한 탭 확인) → `saveSessionNow` — [src/main.ts:2283-2290](../../../../src/main.ts#L2283-L2290), [src/main.ts:1267-1298](../../../../src/main.ts#L1267-L1298)
- **입력 활동**: `onEditorChange`가 편집마다 불린다(dirty 250 ms, 미리보기 120/700 ms 타이머) — [src/main.ts:900-930](../../../../src/main.ts#L900-L930). 별도 idle 감지는 없다(grep `idle` 결과 없음).
- **비모달 알림 수단**: 탭별 배너 `showBanner(message, actions, warn, kind, tab)` — [src/main.ts:1455-1479](../../../../src/main.ts#L1455-L1479), 상태바 `flashStatus` 1.6초 — [src/main.ts:1445-1453](../../../../src/main.ts#L1445-L1453), 상태바 숨김 버튼 선례 `#status-default`('기본 앱으로 설정') — [index.html:127](../../../../index.html#L127), [src/main.ts:2164-2178](../../../../src/main.ts#L2164-L2178). 처음 화면 `#welcome` — [index.html:109-113](../../../../index.html#L109-L113), [src/main.ts:430-440](../../../../src/main.ts#L430-L440)
- **저장소 선택지**: prefs.ts는 localStorage `mdeditor.` 접두사이고 "잃어도 되는 상태만" 둔다. 실패는 무시한다 — [src/prefs.ts:1-25](../../../../src/prefs.ts#L1-L25). 지금 쓰는 키: `settings`, `userThemes`, `recent`, `session`, `inbox`, `navTab`, `navOpen`, `sidebarWidth`, `splitRatio`, `treeRoot`, `treeExpanded`, `settingsTab`(grep `readPref|writePref`). Rust 쪽 데이터 폴더는 `appdata::root()` = `%APPDATA%\Frond`(옛 MdEditor 폴더 이전 포함)이고 drafts·themes가 쓴다 — [src-tauri/src/appdata.rs:1-26](../../../../src-tauri/src/appdata.rs#L1-L26), [src-tauri/src/drafts.rs:23](../../../../src-tauri/src/drafts.rs#L23)
- **첫 실행 표식 없음**: 첫 실행·설치일을 기록하는 코드가 없다(main.ts grep `first`는 무관한 1건, 730행).

### Inferences (제안)
- **카운터 저장**: `mdeditor.supportNag = { firstSeenAt, launches, saves, lastShownAt, shownCount }`를 prefs.ts에 둔다. 지워지면 처음부터 다시 셀 뿐이라 괜찮다. 라이선스 상태와 달리 Rust 저장은 필요 없다. `firstSeenAt`이 없으면 첫 실행으로 보고 기록만 한다.
- **트리거 후보(권장 순)**
  1. 부팅 뒤 지연: `init()` 끝(현재 `checkWebviewVersion()` 다음, [src/main.ts:2303](../../../../src/main.ts#L2303))에서 `scheduleSupportNag()`을 건다. 예: 실행 횟수 ≥ 5, 첫 실행 뒤 7일 이상, 마지막 표시 뒤 7–14일 이상일 때만 3–10분 뒤 시도한다.
  2. 저장 N회: `save()` 성공 분기([src/main.ts:1133](../../../../src/main.ts#L1133))에서는 카운터만 올리고, 표시는 같은 지연·유휴 조건으로 미룬다. 저장 직후 동기로 띄우지 않는다.
  3. 닫을 때는 띄우지 않는다. `onCloseRequested`에서 막으면 종료가 지연되고 `confirmCloseWindow`와 충돌한다.
- **표시 직전 가드(모두 참일 때만)**: `!entitled` && `!document.querySelector("dialog[open]")` && `!editor?.view.composing` && 마지막 입력 뒤 ≥ 5–10초(`onEditorChange`에서 `lastInputAt` 기록) && 저장·인쇄·내보내기 진행 중 아님 && `document.hasFocus()`. 조건이 안 맞으면 다음 기회(예: 1분 뒤 재시도, 최대 몇 회)로 미룬다. `showChoice`가 열린 팝업을 닫는 문제([src/dialog.ts:44](../../../../src/dialog.ts#L44)) 때문에 `dialog[open]` 가드는 필수다.
- **형식**: Fork처럼 모달을 쓰려면 `showChoice({ title: "Frond가 마음에 드셨나요?", choices: [{value:"buy",label:"구매하기",kind:"primary"}], cancelLabel: "나중에" })`를 쓴다. 덜 방해되는 대안은 배너(`showBanner`, 액션 '구매하기'·'닫기')나 상태바 숨김 버튼(`#status-default` 패턴, 비구매자에게만 '후원하기')이다. 첫 단계는 비모달, 반복 무시 시 모달 같은 단계적 강도도 가능하다.
- **설정 스키마에 넣지 않는다**: 권유 빈도를 `SETTINGS`에 두면 "끄기"가 생겨 의미가 없다. 사용자 조절값 규칙([CLAUDE.md:100-101](../../../../CLAUDE.md))은 사용자 설정용이므로, 권유 주기 상수는 `license.ts` 한 곳에 상수로 둔다.

### Gaps
- 권유 빈도·지연 값(5회·7일 등)은 근거 없는 예시값이다. 코드베이스에 기준이 없다.

## 4. "정보 / 라이선스" UI 위치와 라이선스 상태가 살 곳

### Takeaway
설정 팝업은 카테고리를 `SETTING_CATEGORIES` 한 곳에서 정하고, 항목이 없는 카테고리도 `addPanel`로 커스텀 패널만 붙이면 탭이 보인다. 그래서 "정보" 탭을 새로 만들어 license-panel을 붙이는 것이 기존 구조에 가장 맞는다. 라이선스 판정은 Rust 모듈(새 `license.rs`)이 맡고, 프런트에는 커맨드로 상태만 넘긴다. 앱 정의 커맨드는 지금 capabilities에 따로 적지 않아도 동작하는 구조다.

### Cited Findings (현재 구조)
- 카테고리 정의 `SETTING_CATEGORIES`(보기·편집·테마·탐색·파일) — [src/settings.ts:10-18](../../../../src/settings.ts#L10-L18). 항목도 커스텀 패널도 없는 카테고리는 탭을 숨긴다(`visibleCategories`) — [src/settings-dialog.ts:161-164](../../../../src/settings-dialog.ts#L161-L164). `addPanel(category, element)` — [src/settings-dialog.ts:189-220](../../../../src/settings-dialog.ts#L189-L220). 커스텀 패널 선례는 테마 패널 — [src/main.ts:1801-1811](../../../../src/main.ts#L1801-L1811). 카테고리 규칙·표 — [.claude/skills/add-setting/SKILL.md:11-30](../../../../.claude/skills/add-setting/SKILL.md)
- 설정 팝업 DOM과 하단 "모두 기본값으로" 버튼 — [index.html:131-145](../../../../index.html#L131-L145). `resetSettings()`는 `SETTINGS` 키만 되돌린다 — [src/settings.ts:252-254](../../../../src/settings.ts#L252-L254)
- 제목 표시줄: 탭 띠, 문서 메뉴(⋯), 설정(톱니), 창 버튼 — [index.html:77-90](../../../../index.html#L77-L90). 문서 메뉴 항목(파일 열기·폴더 열기·HTML 내보내기·인쇄·설정) — [src/main.ts:1912-1938](../../../../src/main.ts#L1912-L1938)
- 상태바 항목(경로·관리자·새 문서·글자 수·모드·인코딩·EOL·기본 앱·줌) — [index.html:118-129](../../../../index.html#L118-L129)
- 버전: `tauri.conf.json` `version: "0.1.0"`, `identifier: com.cykim.mdeditor` — [src-tauri/tauri.conf.json:3-5](../../../../src-tauri/tauri.conf.json#L3-L5). Cargo·package.json도 0.1.0 — [src-tauri/Cargo.toml:3](../../../../src-tauri/Cargo.toml#L3), [package.json:4](../../../../package.json#L4). 앱 버전을 보이는 UI(정보 화면)는 없다(grep `about|getVersion` 결과 없음. `webview_version`만 있다 — [src-tauri/src/lib.rs:116-121](../../../../src-tauri/src/lib.rs#L116-L121)).
- 커맨드 등록은 `generate_handler!` 한 곳이다 — [src-tauri/src/lib.rs:197-227](../../../../src-tauri/src/lib.rs#L197-L227). `build.rs`는 `tauri_build::build()`뿐이고(app manifest 지정 없음) — [src-tauri/build.rs:1-3](../../../../src-tauri/build.rs#L1-L3). capabilities에는 core·dialog·opener 권한만 있는데도 `list_user_themes` 같은 자체 커맨드가 동작한다 — [src-tauri/capabilities/default.json:1-19](../../../../src-tauri/capabilities/default.json#L1-L19). CLAUDE.md 규칙은 "창 API를 새로 쓰면 capabilities에 권한을 더한다"이다 — [CLAUDE.md:98](../../../../CLAUDE.md)
- CSP `connect-src 'self' ipc: http://ipc.localhost`이므로 프런트가 외부 서버로 직접 요청할 수 없다 — [src-tauri/tauri.conf.json:15-23](../../../../src-tauri/tauri.conf.json#L15-L23)
- URI·폴더 열기는 Rust `assoc::shell_open`(ShellExecuteW)을 쓴다. `ms-settings:` 같은 스킴도 이 길로 연다 — [src-tauri/src/assoc.rs:47-60](../../../../src-tauri/src/assoc.rs#L47-L60), [src-tauri/src/themes.rs:117-123](../../../../src-tauri/src/themes.rs#L117-L123)
- Win32 조회를 커맨드로 감싸고 실패하면 안전한 기본값을 돌려주는 선례가 있다(`is_elevated`) — [src-tauri/src/elevation.rs:11-37](../../../../src-tauri/src/elevation.rs#L11-L37)

### Inferences (제안)
- **UI 위치(권장)**: `SETTING_CATEGORIES` 끝에 `{ id: "about", label: "정보" }`를 추가하고 `license-panel.ts`(버전, 라이선스 상태 "무료 / 후원자 — Store·키", 구매하기…, 라이선스 키 입력·파일 불러오기…, Store 구매 복원, 후원자 전용 테마 안내)를 `addPanel("about", …)`로 붙인다. add-setting 스킬 표에도 행을 더한다. 보조 진입점으로 문서 메뉴 끝에 "Frond 정보·후원…"([src/main.ts:1937](../../../../src/main.ts#L1937) 옆)을 둔다. 비구매자 상태바에 작은 '후원하기' 버튼(`#status-default` 패턴)은 선택 사항이다.
- **"모두 기본값으로"와 분리**: 라이선스·권유 카운터는 `SETTINGS` 밖에 두어 `resetSettings()`에 지워지지 않게 한다.
- **상태의 원본은 Rust**: `src-tauri/src/license.rs`에 다음을 둔다.
  - `enum Source { Store, KeyFile, Dev, None }`, `struct Entitlement { tier: Free|Supporter, source, checked_at, holder: Option<String> }`
  - 커맨드 `get_entitlement() -> Entitlement`(가벼운 캐시 + 필요할 때 재확인), `activate_license(text: String)`(서명 검증 뒤 `appdata::root()/license.json`에 저장), `request_store_purchase()`(Store 판만), `refresh_entitlement()`(구매 복원·재확인), `open_purchase_page()`(웹 결제 URL·`ms-windows-store://pdp/?productid=…`는 `assoc::shell_open`)
  - 내부에 `trait LicenseProvider { fn check(&self) -> Option<Entitlement> }`를 두고 Store 구현과 키 파일 구현을 순서대로 시도해 둘을 추상화한다.
- 커맨드는 `generate_handler!`에 더하면 된다. 지금 구조로는 capabilities 수정이 필요 없을 것으로 보인다(새 플러그인을 쓰지 않는 한). 프런트 `@tauri-apps/api/app`의 `getVersion()`을 쓰려면 `core:app` 권한이 `core:default`에 들어 있는지 확인이 필요하다. Rust 커맨드로 `app.package_info().version`을 돌려주면 확인할 필요가 없다.
- 프런트 `src/license.ts`: 시작용 캐시 `mdeditor.entitlement`(표시용, 판정 근거 아님), `getEntitlement()`, `onEntitlementChange()`, 순수 판정 함수(`canUseTheme`·`canImport`·`shouldNag`)를 둔다. 상태가 바뀌면 `themePanel.reload()`·`applyEffectiveTheme()`·추천 팝업 `refresh()`를 부른다.
- **MSIX 저장 위치 주의**: Store(MSIX) 판에서 `%APPDATA%\Frond`가 새로 생기면 LocalCache로 가상화되고, 앱을 제거하면 함께 지워진다(동료 조사) — [docs/research/research_notes/Frond 윈도우 앱 배포 방법/msix_packaging.md:181-204](../Frond%20윈도우%20앱%20배포%20방법/msix_packaging.md). Store 판은 라이선스를 Store가 들고 있으므로 문제가 작다. 키 파일 판(NSIS)은 실제 `%APPDATA%\Frond\license.json`이다.

### Gaps
- Tauri 2.12에서 app manifest 없이 자체 커맨드가 모두 허용되는지는 문서로 확인하지 않았다. 동작하는 기존 커맨드에서 추론한 것이다.

## 5. 손봐야 할 기존 테스트

### Takeaway
테마 목록 순서·추천 테마 개수·허용 키 경고를 고정한 단언이 있다. 그래서 전용 테마 묶음 추가, 카탈로그 테마 도입, 파일 형식 키 추가는 recommended.test.ts·themes.test.ts를 깬다. 설정 카테고리 테스트는 새 탭을 자동으로 검사한다. UI 파일(theme-panel·recommended-dialog·main)에는 테스트가 없다.

### Cited Findings (현재 구조)
- `themes.test.ts`: 내장 토큰 완비·세이지 차콜 대비·style.css 대체값 일치 — [src/theme/themes.test.ts:21-75](../../../../src/theme/themes.test.ts#L21-L75). 사용자 테마 목록 순서 `["light","dark","mine"]`과 내장 id 충돌 버림 — [src/theme/themes.test.ts:98-106](../../../../src/theme/themes.test.ts#L98-L106). 설정 선택지가 목록을 따라온다(`normalizeSetting(SETTINGS.theme, "mine")`) — [src/theme/themes.test.ts:108-115](../../../../src/theme/themes.test.ts#L108-L115). `parseThemeFile` 경고·오류·왕복 — [src/theme/themes.test.ts:117-163](../../../../src/theme/themes.test.ts#L117-L163). 매 테스트 뒤 `setUserThemes([])` — [src/theme/themes.test.ts:19](../../../../src/theme/themes.test.ts#L19)
- `recommended.test.ts`: 첫 세 id `sepia, github-light, github-dark`, 웨딩 20개, id 중복·내장 id 없음, 모든 group이 `RECOMMENDED_GROUPS`에 있음 — [src/theme/recommended.test.ts:5-13](../../../../src/theme/recommended.test.ts#L5-L13). 저장 → 가져오기 경고 0 — [src/theme/recommended.test.ts:15-20](../../../../src/theme/recommended.test.ts#L15-L20). 팔레트 테마 WCAG 대비, 세이지·GitHub 색 고정 — [src/theme/recommended.test.ts:22-49](../../../../src/theme/recommended.test.ts#L22-L49)
- `settings.test.ts`: 모든 `section`이 카테고리 id다, 카테고리 id·라벨이 겹치지 않는다 — [src/settings.test.ts:14-24](../../../../src/settings.test.ts#L14-L24). 정규화·저장·리셋 — [src/settings.test.ts:26-75](../../../../src/settings.test.ts#L26-L75)
- 테스트 파일은 `src/**/*.test.ts`(jsdom)다. theme-panel·recommended-dialog·settings-dialog·dialog·main용 테스트 파일은 없다 — [vite.config.ts:18-21](../../../../vite.config.ts#L18-L21)(파일 목록 `ls src/*.test.ts`). 현재 수는 vitest 139건, cargo 백엔드 34건 — [docs/next-session.md:58](../../../../docs/next-session.md)
- Rust 테스트: themes.rs 왕복·id 탈출 — [src-tauri/src/themes.rs:125-156](../../../../src-tauri/src/themes.rs#L125-L156), appdata 이전 — [src-tauri/src/appdata.rs:28-61](../../../../src-tauri/src/appdata.rs#L28-L61)

### Inferences (제안)
- 추천 테마에 전용 묶음을 섞으면 `recommended.test.ts` 5-13행의 그룹 단언은 통과하지만(그룹을 `RECOMMENDED_GROUPS`에 더하면), 팔레트 대비 테스트(22-32행)가 전용 테마에도 적용된다. 이것은 오히려 품질 게이트로 유지하는 편이 좋다.
- 카탈로그 테마를 `listThemes()`에 직접 싣는 안을 고르면 themes.test.ts 98-106행의 순서 기대값을 `[내장, 카탈로그, 사용자]`로 바꿔야 한다.
- 새 테스트 대상: `src/license.test.ts`(canUseTheme·shouldNag 시간 경계·dialog/IME 가드는 순수 함수 인자로), `license.rs` 서명 검증(정상·변조·만료·다른 머신 바인딩 여부), "비구매자 + 사용자 테마 저장값 → effectiveTheme 대체·설정값 보존" 회귀 테스트(effectiveTheme를 순수 함수로 빼야 가능).
- "정보" 카테고리를 커스텀 패널만으로 만들면 settings.test.ts는 그대로 통과한다(라벨만 겹치지 않으면).

### Gaps
- 없음.

## 6. 패키지 identity 감지·빌드 flavor 장치 (Store/MSIX 판 vs NSIS 판)

### Takeaway
지금은 둘을 나누는 장치가 하나도 없다. 패키지 identity 조회 코드, cargo feature, `option_env!`/Vite define, 별도 tauri conf 모두 없다. 번들 대상은 NSIS 하나다. 계획 문서는 MSI/MSIX 패키징을 "하지 않는 것"으로 적어 두었다. Store 판을 하려면 이 결정부터 고쳐야 한다.

### Cited Findings (현재 구조)
- grep(`GetCurrentPackage|PackageFamily|msix|appx|cfg(feature|option_env!|import.meta.env|VITE_`) 결과가 src·src-tauri/src·crates에서 0건이다. `env!("CARGO_MANIFEST_DIR")` 1건은 코어 테스트 픽스처 경로다 — [crates/mdeditor-core/tests/fixtures.rs:13](../../../../crates/frond-core/tests/fixtures.rs)
- `src-tauri/Cargo.toml`에 `[features]` 절이 없다. `windows` 0.62 features는 `Win32_Foundation, Win32_Security, Win32_System_Com, Win32_System_Threading, Win32_UI_Shell, Win32_UI_WindowsAndMessaging`뿐이다(WinRT `Services_Store`·`Win32_Storage_Packaging_Appx` 없음) — [src-tauri/Cargo.toml:18-37](../../../../src-tauri/Cargo.toml#L18-L37)
- tauri 설정 파일은 `src-tauri/tauri.conf.json` 하나다(`tauri.windows.conf.json` 등 overlay 없음). `bundle.targets: ["nsis"]`, NSIS `installMode: currentUser`, 훅 `nsis/hooks.nsh` — [src-tauri/tauri.conf.json:30-58](../../../../src-tauri/tauri.conf.json#L30-L58). 빌드 스크립트는 `app:build = tauri build` 하나다 — [package.json:7-14](../../../../package.json#L7-L14)
- Vite 설정에 `define`·env 사용이 없다 — [vite.config.ts:1-22](../../../../vite.config.ts#L1-L22). 프런트 런타임 구분은 `IS_TAURI = "__TAURI_INTERNALS__" in window`뿐이다 — [src/main.ts:166](../../../../src/main.ts#L166)
- 계획 범위: "하지 않는 것(… MSI/MSIX …)" — [docs/plan.md:147](../../../../docs/plan.md), [docs/roadmap.md:127](../../../../docs/roadmap.md)
- 동료 조사: Store 패키지와 사이드로드 패키지는 Publisher가 달라 PFN·데이터·AUMID·ProgId가 따로다 — [msix_packaging.md:295](../Frond%20윈도우%20앱%20배포%20방법/msix_packaging.md). 패키지 exe는 `runFullTrust`·`packagedClassicApp`로 돈다 — [msix_packaging.md:57-64](../Frond%20윈도우%20앱%20배포%20방법/msix_packaging.md)
- 내부 식별자 고정 규칙: ProgId `MdEditor.Markdown`, identifier `com.cykim.mdeditor`, localStorage `mdeditor.*`, exe `mdeditor.exe`는 바꾸지 않는다 — [CLAUDE.md:92-94](../../../../CLAUDE.md)

### Inferences (제안)
- **런타임 감지 + 컴파일 feature 병행**:
  - 런타임: `license.rs`(또는 `packaging.rs`)에 `is_packaged() -> bool`을 둔다. Win32 `GetCurrentPackageFullName`이 "패키지 없음" 오류를 내면 false다. `windows` crate에 `Win32_Storage_Packaging_Appx` feature가 필요할 것으로 보인다(확인 필요). `elevation.rs`처럼 실패하면 false다. Store 라이선스 공급자는 `is_packaged()`일 때만 시도하므로, 같은 exe가 NSIS로 돌아도 안전하다.
  - 컴파일: `[features] store = ["windows/Services_Store", …]`로 Store 코드를 Store 빌드에만 넣는다. Store 빌드는 `tauri build --features store` 또는 별도 conf overlay(`--config tauri.store.conf.json`, 번들 대상·identity)로 만든다. NSIS 판은 키 파일 공급자만 넣는다. 정책상 Store 판에서 외부 결제 링크를 숨겨야 한다면 이 feature로 UI 분기(`get_entitlement`가 `channel: "store"|"direct"`도 돌려줌)를 한다.
  - 개발: `cfg!(debug_assertions)`이거나 env `FROND_DEV_ENTITLED=1`이면 `Source::Dev`로 entitled. 개발자 본인 설정 보호용이다.
- Store `StoreContext`를 데스크톱(Win32) 앱에서 쓸 때 창 핸들 연결(IInitializeWithWindow)이 필요한지, `windows` 0.62의 정확한 feature 이름은 이 조사 범위(코드베이스) 밖이다. 다른 연구 노트에서 확인해야 한다.
- MSIX 판 도입은 `docs/plan.md`·`roadmap.md`의 "하지 않는 것"과 충돌한다. system-crew `idea` 형식으로 `docs/decisions/ideas/`에 판정을 남겨야 한다(CLAUDE.md 상시 규칙 — [CLAUDE.md:12](../../../../CLAUDE.md)).

### Gaps
- `GetCurrentPackageFullName`·`Windows.Services.Store` 바인딩의 `windows` 0.62 feature 이름과 데스크톱 앱 호출 요건은 이 코드베이스에 근거가 없다. 웹·문서 조사가 필요하다.
