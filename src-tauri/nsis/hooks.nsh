; MdEditor NSIS 훅 — tauri.conf.json bundle.windows.nsis.installerHooks
; Phase 1-6에서 채운다: OpenWithProgids / Applications\mdeditor.exe\SupportedTypes /
; Software\MdEditor\Capabilities + RegisteredApplications / UPDATEFILEASSOC (SHChangeNotify)
; POSTUNINSTALL은 자기 ProgId·OpenWithProgids 값만 지운다.

!macro NSIS_HOOK_PREINSTALL
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
!macroend
