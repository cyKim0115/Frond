//! WebView2 기본 오른쪽 클릭 메뉴의 '인쇄'를 앱 인쇄로 돌린다 — 큰 문서 인쇄 확인(결정 D7)을 메뉴 경로도 거치게.
//!
//! 기본 메뉴의 인쇄는 웹뷰가 바로 인쇄 미리보기를 열어 `Ctrl+P` 가드(main.ts `printDocument`)를 건너뛴다.
//! 메뉴가 열릴 때마다 그 항목을 같은 글자의 사용자 항목으로 바꿔 끼우고, 고르면 프런트에 [`PRINT_REQUESTED`]를 보낸다.

use tauri::{Manager, WebviewWindow};

/// 프런트(main.ts)가 듣고 `printDocument()`를 부르는 이벤트
pub const PRINT_REQUESTED: &str = "print-requested";

/// 실패해도 앱은 그대로 뜬다 — 그때는 기본 메뉴 인쇄가 예전처럼 확인 없이 열린다
pub fn route_print_to_app(window: &WebviewWindow) {
    #[cfg(windows)]
    {
        let app = window.app_handle().clone();
        let result = window.with_webview(move |webview| {
            // SAFETY: with_webview 콜백은 웹뷰를 만든 UI 스레드에서 돈다 — WebView2 COM 호출은 이 스레드에서만 한다
            if let Err(e) = unsafe { win::install(&webview, app) } {
                eprintln!("오른쪽 클릭 메뉴의 인쇄를 앱 인쇄로 돌리지 못했습니다: {e}");
            }
        });
        if let Err(e) = result {
            eprintln!("오른쪽 클릭 메뉴의 인쇄를 앱 인쇄로 돌리지 못했습니다: {e}");
        }
    }
    #[cfg(not(windows))]
    let _ = window;
}

#[cfg(windows)]
mod win {
    use tauri::{AppHandle, Emitter};
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2Environment9, ICoreWebView2_11, COREWEBVIEW2_CONTEXT_MENU_ITEM_KIND_COMMAND,
    };
    use webview2_com::{take_pwstr, ContextMenuRequestedEventHandler, CustomItemSelectedEventHandler};
    use windows::core::{Interface, HSTRING, PWSTR};
    use windows::Win32::System::Com::IStream;

    /// WebView2 기본 메뉴 항목 이름 (`ICoreWebView2ContextMenuItem.Name`)
    const PRINT_ITEM: &str = "print";

    pub unsafe fn install(webview: &tauri::webview::PlatformWebview, app: AppHandle) -> windows::core::Result<()> {
        let core = unsafe { webview.controller().CoreWebView2()? };
        let core11: ICoreWebView2_11 = core.cast()?;
        let env: ICoreWebView2Environment9 = webview.environment().cast()?;
        let handler = ContextMenuRequestedEventHandler::create(Box::new(move |_, args| {
            let Some(args) = args else { return Ok(()) };
            unsafe {
                let items = args.MenuItems()?;
                let mut count = 0u32;
                items.Count(&mut count)?;
                for i in 0..count {
                    let item = items.GetValueAtIndex(i)?;
                    let mut name = PWSTR::null();
                    item.Name(&mut name)?;
                    if take_pwstr(name) != PRINT_ITEM {
                        continue;
                    }
                    let mut label = PWSTR::null();
                    item.Label(&mut label)?;
                    let custom = env.CreateContextMenuItem(
                        &HSTRING::from(take_pwstr(label)),
                        None::<&IStream>,
                        COREWEBVIEW2_CONTEXT_MENU_ITEM_KIND_COMMAND,
                    )?;
                    let app = app.clone();
                    let selected = CustomItemSelectedEventHandler::create(Box::new(move |_, _| {
                        let _ = app.emit(super::PRINT_REQUESTED, ());
                        Ok(())
                    }));
                    let mut token = 0i64;
                    custom.add_CustomItemSelected(&selected, &mut token)?;
                    items.RemoveValueAtIndex(i)?;
                    items.InsertValueAtIndex(i, &custom)?;
                    break;
                }
            }
            Ok(())
        }));
        let mut token = 0i64;
        unsafe { core11.add_ContextMenuRequested(&handler, &mut token) }
    }
}
