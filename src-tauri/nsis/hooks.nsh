; Frond NSIS 훅 — tauri.conf.json bundle.windows.nsis.installerHooks (roadmap 1-6 설치기·파일 연결)
;
; 이 파일은 UTF-8 **BOM 포함**이어야 한다. makensis 는 BOM 으로 인코딩을 판별한다
; (bundler 도 -INPUTCHARSET UTF8 로 호출하지만 !include 파일은 BOM 이 기준).
;
; 삽입 위치 (tauri-bundler installer.nsi, tag tauri-cli-v2.12.0 소스 기준. 렌더된 target/release/nsis/x64/installer.nsi 는
;   Handlebars 블록이 접혀 32행·649-650행·710행·769-770행·845행이 된다):
;   36행  !include "{{installer_hooks}}"        — 템플릿의 !define 들(41-72행)보다 앞. 그래서 이 파일의
;                                                최상위 !define 은 ${PRODUCTNAME} 등을 참조하지 않는다
;   734행 !insertmacro NSIS_HOOK_POSTINSTALL    — Section Install 끝. 매크로 본문은 이 시점에 전개되므로
;                                                ${PRODUCTNAME} ${MAINBINARYNAME} ${INSTALLMODE} $INSTDIR SHCTX 사용 가능
;   887행 !insertmacro NSIS_HOOK_POSTUNINSTALL  — Section Uninstall 끝
;   SHCTX: installMode currentUser → RequestExecutionLevel user(110행) + utils.nsh SetContext(3-8행)의
;          SetShellVarContext current → HKCU. x64 는 SetRegView 64(utils.nsh 10-13행)
;
; 템플릿이 이미 하는 일 (installer.nsi 664-669행 → FileAssociation.nsh 68-80행):
;   HKCU\Software\Classes\.md, .markdown 기본값 = "MdEditor.Markdown"
;     (+ "MdEditor.Markdown_backup" 값에 이전 기본값 보관)
;   HKCU\Software\Classes\MdEditor.Markdown 기본값 "Markdown 문서", DefaultIcon "$INSTDIR\mdeditor.exe,0",
;     shell = "open", shell\open = "Open with MdEditor", shell\open\command = $INSTDIR\mdeditor.exe "%1"
;   제거 (799-804행 → FileAssociation.nsh 108-114행): .md/.markdown 기본값을 _backup 으로 되돌리고
;     ProgId 키를 통째로 삭제
; 템플릿이 하지 않는 일 (여기서 채운다):
;   OpenWithProgids, Applications\mdeditor.exe, Software\MdEditor\Capabilities + RegisteredApplications,
;   SHChangeNotify — UPDATEFILEASSOC 매크로는 FileAssociation.nsh 131-135행에 정의만 있고 템플릿 어디에서도
;   삽입하지 않는다 (installer.nsi 에 UPDATEFILEASSOC/SHChangeNotify 없음)
;
; 업데이트: /UPDATE(업데이터) 는 이전 버전을 제거하지 않고 덮어쓴다(319-322행) → POSTINSTALL 이 같은 값을
; 다시 쓴다. 수동 재설치에서 '제거 후 설치'를 고르면 이전 제거기가 먼저 돌아 POSTUNINSTALL 이 지우고
; POSTINSTALL 이 다시 만든다. 어느 쪽이든 UserChoice 는 건드리지 않으므로 사용자가 고른 기본 앱이 유지된다.

; ProgId — tauri.conf.json bundle.fileAssociations[0].name 과 같아야 한다 (템플릿은 이 값을 define 으로 주지 않는다)
; 앱 이름(PRODUCTNAME)이 MdEditor → Frond 로 바뀌어도 그대로 둔다 — UserChoice 가 이 ProgId 를 가리킨다
!define MDEDITOR_PROGID "MdEditor.Markdown"

; 확장자 하나: '연결 프로그램' 추천 목록(OpenWithProgids) + 실행 파일 지원 유형(SupportedTypes)
; OpenWithProgids 값은 Windows 관례대로 REG_NONE(데이터 없음)
!macro MDEDITOR_ADD_EXT EXT
  WriteRegNone SHCTX "Software\Classes\.${EXT}\OpenWithProgids" "${MDEDITOR_PROGID}"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".${EXT}" ""
!macroend

; 확장자 하나 정리: 우리 ProgId 값만 지운다. 다른 앱의 값·기본값은 남긴다.
; OpenWithProgids 하위 키와 .ext 키 자체는 비었을 때만(/ifempty) 정리한다 — .mdown 등은 ADD_EXT 가 키를 새로
; 만들었을 수 있다. .md/.markdown 은 템플릿이 기본값·_backup 값을 남기므로 /ifempty 에 걸리지 않는다
!macro MDEDITOR_REMOVE_EXT EXT
  DeleteRegValue SHCTX "Software\Classes\.${EXT}\OpenWithProgids" "${MDEDITOR_PROGID}"
  DeleteRegKey /ifempty SHCTX "Software\Classes\.${EXT}\OpenWithProgids"
  DeleteRegKey /ifempty SHCTX "Software\Classes\.${EXT}"
!macroend

; 셸에 연결 변경 알림 — 템플릿의 UPDATEFILEASSOC(SHCNE_ASSOCCHANGED | SHCNF_FLUSH)를 쓰고, 없으면 직접 호출
!macro MDEDITOR_NOTIFY_SHELL
  !ifmacrodef UPDATEFILEASSOC
    !insertmacro UPDATEFILEASSOC
  !else
    System::Call "shell32::SHChangeNotify(i 0x08000000, i 0x1000, p 0, p 0)"
  !endif
!macroend

!macro NSIS_HOOK_PREINSTALL
!macroend

!macro NSIS_HOOK_POSTINSTALL
  !if "${INSTALLMODE}" != "currentUser"
    !warning "hooks.nsh: assoc.rs 는 HKCU(currentUser) 등록을 전제한다. INSTALLMODE=${INSTALLMODE}"
  !endif

  ; 1) ProgId 보강 — 키는 템플릿(APP_ASSOCIATE)이 만들었다. 표시 이름을 붙이고, 실행 파일 경로를 따옴표로
  ;    감싼다 (템플릿 667행은 $INSTDIR 에 공백이 있으면 깨질 수 있는 무따옴표 명령을 쓴다)
  ;    FriendlyTypeName 은 문서가 권하는 간접 문자열("@exe,-id")이 아닌 리터럴이다 — 실행 파일에 문자열 테이블
  ;    리소스가 없고, SHLoadIndirectString 은 리터럴을 그대로 돌려주므로 탐색기 표시는 같다
  WriteRegStr SHCTX "Software\Classes\${MDEDITOR_PROGID}" "FriendlyTypeName" "Markdown 문서"
  WriteRegStr SHCTX "Software\Classes\${MDEDITOR_PROGID}\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'

  ; 2) 확장자 → '연결 프로그램' 추천. .md/.markdown 은 기본값도 템플릿이 걸었고, 나머지는 추천에만 오른다
  !insertmacro MDEDITOR_ADD_EXT "md"
  !insertmacro MDEDITOR_ADD_EXT "markdown"
  !insertmacro MDEDITOR_ADD_EXT "mdown"
  !insertmacro MDEDITOR_ADD_EXT "mkd"
  !insertmacro MDEDITOR_ADD_EXT "mkdn"
  !insertmacro MDEDITOR_ADD_EXT "mdwn"

  ; 3) Applications\mdeditor.exe — '연결 프로그램' 대화상자와 Default Apps 가 실행 파일을 식별하는 키
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "FriendlyAppName" "${PRODUCTNAME}"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\DefaultIcon" "" '"$INSTDIR\${MAINBINARYNAME}.exe",0'
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'

  ; 4) 설정 > 앱 > 기본 앱 노출 — ApplicationDescription 이 없으면 목록에 뜨지 않는다
  WriteRegStr SHCTX "Software\${PRODUCTNAME}\Capabilities" "ApplicationName" "${PRODUCTNAME}"
  WriteRegStr SHCTX "Software\${PRODUCTNAME}\Capabilities" "ApplicationDescription" "Markdown 문서 뷰어·편집기"
  WriteRegStr SHCTX "Software\${PRODUCTNAME}\Capabilities" "ApplicationIcon" '"$INSTDIR\${MAINBINARYNAME}.exe",0'
  WriteRegStr SHCTX "Software\${PRODUCTNAME}\Capabilities\FileAssociations" ".md" "${MDEDITOR_PROGID}"
  WriteRegStr SHCTX "Software\${PRODUCTNAME}\Capabilities\FileAssociations" ".markdown" "${MDEDITOR_PROGID}"
  WriteRegStr SHCTX "Software\RegisteredApplications" "${PRODUCTNAME}" "Software\${PRODUCTNAME}\Capabilities"

  ; 5) 탐색기 아이콘·연결 캐시 갱신
  !insertmacro MDEDITOR_NOTIFY_SHELL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; 템플릿(APP_UNASSOCIATE)이 .md/.markdown 기본값 복원과 ProgId 키 삭제를 이미 했다.
  ; 여기서는 POSTINSTALL 이 만든 것만 지운다. 확장자 키·다른 앱의 값·UserChoice 는 건드리지 않는다.
  !insertmacro MDEDITOR_REMOVE_EXT "md"
  !insertmacro MDEDITOR_REMOVE_EXT "markdown"
  !insertmacro MDEDITOR_REMOVE_EXT "mdown"
  !insertmacro MDEDITOR_REMOVE_EXT "mkd"
  !insertmacro MDEDITOR_REMOVE_EXT "mkdn"
  !insertmacro MDEDITOR_REMOVE_EXT "mdwn"

  DeleteRegKey SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe"
  DeleteRegValue SHCTX "Software\RegisteredApplications" "${PRODUCTNAME}"
  DeleteRegKey SHCTX "Software\${PRODUCTNAME}\Capabilities"
  DeleteRegKey /ifempty SHCTX "Software\${PRODUCTNAME}"

  ; ProgId 가 아직 남아 있고(템플릿이 못 지운 경우) 이 설치의 실행 파일을 가리키면 지운다.
  ; 다른 설치 경로를 가리키면 그쪽 설치의 것이므로 남긴다
  ReadRegStr $R0 SHCTX "Software\Classes\${MDEDITOR_PROGID}\shell\open\command" ""
  ${If} $R0 == '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  ${OrIf} $R0 == '$INSTDIR\${MAINBINARYNAME}.exe "%1"'
    DeleteRegKey SHCTX "Software\Classes\${MDEDITOR_PROGID}"
  ${EndIf}

  !insertmacro MDEDITOR_NOTIFY_SHELL
!macroend
