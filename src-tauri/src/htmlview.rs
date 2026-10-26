//! HTML 문서 보기 (결정 `docs/decisions/ideas/20261026-html-view.md`) — 문서마다 토큰을 주는 커스텀 프로토콜 `htmlview`.
//!
//! `http://htmlview.localhost/<토큰>/<경로>`는 연 HTML 문서의 폴더(하위 포함) 안 일반 파일만 낸다. 본문 문서는 디스크가 아니라
//! 앱이 넘긴 편집 중 텍스트(`html_view_set`)로 낸다 — 분할 뷰 미리보기가 저장 전 내용을 보인다.
//! - 안전 보기의 본문은 앱이 `srcdoc`으로 직접 넣고, 이 프로토콜은 그 문서의 상대 리소스(이미지·CSS·글꼴·미디어)만 낸다
//! - 스크립트 허용 보기는 본문까지 이 프로토콜로 연다. frame은 `sandbox`로 불투명 origin이라 IPC(`Origin: null`)·앱 DOM에 닿지 않는다
//!
//! 응답에는 `Access-Control-Allow-Origin`을 **붙이지 않는다** — 스크립트가 옆 파일을 `fetch`해도 내용을 읽지 못한다(Chrome의
//! `file://` 제한과 같다). 모든 응답에 모드별 CSP(`sandbox` 지시어 포함)를 달아, 어떻게 끼워 넣든 이 프로토콜이 낸 문서는
//! 불투명 origin에서만 돈다 — 꼭 지켜야 한다. Tauri는 앱이 등록한 커스텀 프로토콜(`http://htmlview.localhost`)을 로컬 origin으로
//! 보고, Windows wry는 invoke 키가 든 초기화 스크립트를 모든 frame에 넣는다. 진짜 origin으로 스크립트가 돌면 IPC가 열린다.
//! `Referrer-Policy: no-referrer`로 파일 이름·토큰이 외부 서버에 가지 않게 한다.

use std::collections::HashMap;
use std::hash::{BuildHasher, Hasher};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use percent_encoding::percent_decode_str;
use tauri::http::{header, Request, Response, StatusCode};
use tauri::{AppHandle, Manager, State, WebviewWindow};

pub const SCHEME: &str = "htmlview";

/// 한 파일 응답 상한 — 응답을 통째로 메모리에 올리므로 아주 큰 동영상 등은 거절한다
const MAX_BYTES: u64 = 256 * 1024 * 1024;

/// 안전 보기 — 본문(`srcdoc`)이 끼워 넣은 하위 문서(iframe 안 HTML·SVG)도 스크립트·외부 리소스 없이
const SAFE_CSP: &str = "sandbox; default-src 'none'; img-src http://htmlview.localhost data:; \
media-src http://htmlview.localhost data:; style-src http://htmlview.localhost 'unsafe-inline'; \
font-src http://htmlview.localhost data:; frame-src http://htmlview.localhost; script-src 'none'; \
object-src 'none'; form-action 'none'; base-uri 'none'";

/// 스크립트 허용 — 외부(`https:`) 리소스는 받되 IPC(`ipc.localhost`)·asset 프로토콜은 목록에 없다. `sandbox`에
/// `allow-same-origin`이 없어 문서는 늘 불투명 origin이다. 문서 폴더 파일을 읽는 `fetch`는 CSP·CORS 둘 다 막는다
const SCRIPT_CSP: &str = "sandbox allow-scripts allow-modals; \
default-src http://htmlview.localhost https: data: blob:; \
script-src http://htmlview.localhost https: data: blob: 'unsafe-inline' 'unsafe-eval'; \
style-src http://htmlview.localhost https: data: blob: 'unsafe-inline'; \
connect-src https: wss: data: blob:; worker-src http://htmlview.localhost blob: data:; \
object-src 'none'; form-action 'none'; base-uri http://htmlview.localhost https:";

/// 스크립트 허용 문서에 넣는 앱 도우미 (링크·단축키·인쇄를 앱으로 넘긴다)
const HELPER_JS: &str = include_str!("htmlview_helper.js");

struct View {
    /// 정규화한 문서 폴더 — 이 안의 파일만 낸다
    root: PathBuf,
    /// 본문 파일 이름
    entry: String,
    /// 본문으로 낼 텍스트 (앱이 넘긴 편집 중 내용). 없으면 디스크 파일
    text: Option<String>,
    scripts: bool,
}

#[derive(Default)]
pub struct HtmlViews(Mutex<HashMap<String, View>>);

/// 추측할 수 없는 토큰 — 문서마다 하나. 한 문서가 다른 문서의 폴더를 주소로 집지 못하게 한다
fn new_token() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let mut hasher = blake3::Hasher::new();
    // RandomState는 OS 난수로 시작한 키를 쓴다 — 두 번 뽑아 시각·순번과 섞는다
    for salt in 0..2u64 {
        let mut h = std::collections::hash_map::RandomState::new().build_hasher();
        h.write_u64(salt);
        hasher.update(&h.finish().to_le_bytes());
    }
    hasher.update(&COUNTER.fetch_add(1, Ordering::Relaxed).to_le_bytes());
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    hasher.update(&nanos.to_le_bytes());
    hasher.update(&std::process::id().to_le_bytes());
    crate::hash_hex(hasher.finalize().as_bytes())[..32].to_owned()
}

/// HTML 문서를 보기 시작한다 — 토큰을 돌려준다. 앱은 `http://htmlview.localhost/<토큰>/`을 base로 쓴다
#[tauri::command]
pub fn html_view_open(views: State<'_, HtmlViews>, path: String) -> Result<String, String> {
    let file = PathBuf::from(&path).canonicalize().map_err(|e| format!("{path}: {e}"))?;
    let root = file.parent().ok_or_else(|| format!("{path}: 폴더를 알 수 없습니다"))?.to_path_buf();
    let entry = file.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let token = new_token();
    views.0.lock().expect("htmlview lock").insert(token.clone(), View { root, entry, text: None, scripts: false });
    Ok(token)
}

/// 스크립트 허용 여부와 본문 텍스트를 바꾼다 (렌더할 때마다). 안전 보기는 본문을 `srcdoc`으로 넣으니 `text`가 없다 — 그때는 디스크 파일
#[tauri::command]
pub fn html_view_set(views: State<'_, HtmlViews>, token: String, text: Option<String>, scripts: bool) -> Result<(), String> {
    let mut guard = views.0.lock().expect("htmlview lock");
    let view = guard.get_mut(&token).ok_or("htmlview: 모르는 토큰")?;
    view.text = text;
    view.scripts = scripts;
    Ok(())
}

/// 탭을 닫았다 — 그 문서 폴더를 더는 내지 않는다
#[tauri::command]
pub fn html_view_close(views: State<'_, HtmlViews>, token: String) {
    views.0.lock().expect("htmlview lock").remove(&token);
}

/// HTML 문서만 기본 브라우저(`.html` 기본 앱)로 연다 — 다른 파일을 실행하는 통로가 되지 않게 확장자를 본다
#[tauri::command]
pub fn open_in_browser(path: String) -> Result<(), String> {
    let file = PathBuf::from(&path).canonicalize().map_err(|e| format!("{path}: {e}"))?;
    if !is_html_file(&file) || !file.is_file() {
        return Err(format!("{path}: HTML 문서가 아닙니다"));
    }
    let shown = file.to_string_lossy();
    let shown = shown.strip_prefix(r"\\?\").unwrap_or(&shown).to_owned();
    tauri_plugin_opener::open_path(shown, None::<&str>).map_err(|e| e.to_string())
}

/// HTML 탭 frame이 갈 수 있는 곳 — 이 프로토콜(`http://htmlview.localhost/…`)과 안전 보기 `srcdoc`·빈 frame
pub fn frame_navigation_allowed(uri: &str) -> bool {
    let lower = uri.to_ascii_lowercase();
    lower.starts_with("http://htmlview.localhost/") || lower == "about:srcdoc" || lower == "about:blank"
}

/// HTML 탭 frame이 문서 밖으로 이동하지 못하게 한다. 앱 CSP `frame-src`는 앱이 넣는 frame만 거르고, frame이 스스로 가는 이동
/// (스크립트 허용 문서의 `location.href = 'https://…'`, 페이지가 가로채 도우미가 못 본 링크)은 막지 못한다(2026-10-26 릴리스 실측).
/// 앱 문서 바로 아래 frame(= HTML 탭 frame)마다 이동을 보고 [`frame_navigation_allowed`] 밖이면 취소한다.
/// frame 안의 하위 frame(문서가 넣은 iframe)은 건드리지 않는다 — 그쪽은 문서 CSP `frame-src`가 거른다. 실패해도 앱은 그대로 뜬다
pub fn guard_frames(window: &WebviewWindow) {
    #[cfg(windows)]
    {
        let result = window.with_webview(|webview| {
            // SAFETY: with_webview 콜백은 웹뷰를 만든 UI 스레드에서 돈다 — WebView2 COM 호출은 이 스레드에서만 한다
            if let Err(e) = unsafe { win::install(&webview) } {
                eprintln!("HTML 보기 frame 이동 막기를 걸지 못했습니다: {e}");
            }
        });
        if let Err(e) = result {
            eprintln!("HTML 보기 frame 이동 막기를 걸지 못했습니다: {e}");
        }
    }
    #[cfg(not(windows))]
    let _ = window;
}

#[cfg(windows)]
mod win {
    use webview2_com::Microsoft::Web::WebView2::Win32::{ICoreWebView2Frame2, ICoreWebView2_4};
    use webview2_com::{take_pwstr, FrameCreatedEventHandler, FrameNavigationStartingEventHandler};
    use windows::core::{Interface, PWSTR};

    pub unsafe fn install(webview: &tauri::webview::PlatformWebview) -> windows::core::Result<()> {
        let core = unsafe { webview.controller().CoreWebView2()? };
        let core4: ICoreWebView2_4 = core.cast()?;
        let created = FrameCreatedEventHandler::create(Box::new(|_, args| {
            let Some(args) = args else { return Ok(()) };
            let starting = FrameNavigationStartingEventHandler::create(Box::new(|_, args| {
                let Some(args) = args else { return Ok(()) };
                let mut uri = PWSTR::null();
                unsafe { args.Uri(&mut uri)? };
                if !super::frame_navigation_allowed(&take_pwstr(uri)) {
                    unsafe { args.SetCancel(true)? };
                }
                Ok(())
            }));
            unsafe {
                let frame: ICoreWebView2Frame2 = args.Frame()?.cast()?;
                let mut token = 0i64;
                frame.add_NavigationStarting(&starting, &mut token)?;
            }
            Ok(())
        }));
        let mut token = 0i64;
        unsafe { core4.add_FrameCreated(&created, &mut token) }
    }
}

fn is_html_file(path: &Path) -> bool {
    path.extension()
        .map(|e| matches!(e.to_string_lossy().to_ascii_lowercase().as_str(), "html" | "htm"))
        .unwrap_or(false)
}

/// URL 경로 `/<토큰>/<a>/<b>`를 토큰과 문서 폴더 안 구성 요소로 나눈다. 구성 요소마다 퍼센트 디코딩을 **한 번** 하고,
/// 폴더를 벗어나거나 다른 이름을 가리킬 수 있는 구성 요소(`..`·`.`·구분자·드라이브·ADS `:`·NUL·끝 점·끝 공백)가 있으면 None
pub fn split_request_path(path: &str) -> Option<(String, Vec<String>)> {
    let mut parts = path.trim_start_matches('/').split('/');
    let token = parts.next().filter(|t| !t.is_empty() && t.bytes().all(|b| b.is_ascii_hexdigit()))?;
    let mut segments = Vec::new();
    for raw in parts {
        if raw.is_empty() {
            continue;
        }
        let segment = percent_decode_str(raw).decode_utf8().ok()?.into_owned();
        // Windows는 이름 끝의 점·공백을 버린다 (`a.html.` = `a.html`) — 같은 파일을 다른 이름으로 집는 길을 막는다
        let unsafe_name = segment == "."
            || segment == ".."
            || segment.ends_with('.')
            || segment.ends_with(' ')
            || segment.contains(['/', '\\', ':', '\0']);
        if unsafe_name {
            return None;
        }
        segments.push(segment);
    }
    Some((token.to_owned(), segments))
}

/// 문서 폴더 안의 일반 파일이면 그 정규화 경로. 심볼릭 링크·정션으로 밖을 가리키면 None (구성 요소 단위 비교)
fn resolve(root: &Path, segments: &[String]) -> Option<PathBuf> {
    let mut path = root.to_path_buf();
    for segment in segments {
        path.push(segment);
    }
    let real = path.canonicalize().ok()?;
    (real.starts_with(root) && real.is_file()).then_some(real)
}

/// 확장자로 고른 MIME. 디스크의 HTML·CSS·글은 charset을 붙이지 않는다 — 문서의 BOM·meta가 정하게 (EUC-KR 문서 보존)
pub fn mime_for(path: &Path) -> &'static str {
    let ext = path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default();
    match ext.as_str() {
        "html" | "htm" => "text/html",
        "xhtml" => "application/xhtml+xml",
        "css" => "text/css",
        "js" | "mjs" => "text/javascript",
        "json" | "map" => "application/json",
        "txt" | "md" | "markdown" | "csv" => "text/plain",
        "xml" => "application/xml",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        "mp4" | "m4v" => "video/mp4",
        "webm" => "video/webm",
        "ogv" => "video/ogg",
        "mp3" => "audio/mpeg",
        "m4a" => "audio/mp4",
        "ogg" | "oga" => "audio/ogg",
        "wav" => "audio/wav",
        "pdf" => "application/pdf",
        _ => "application/octet-stream",
    }
}

/// 스크립트 허용 문서에 도우미 `<script>`를 넣는다 — `<head …>` 바로 뒤, 없으면 `<html …>` 뒤, 그것도 없으면 doctype 뒤나 맨 앞.
/// 바이트 단위로 ASCII 태그만 찾으므로 UTF-8·EUC-KR 등 ASCII 호환 인코딩은 그대로 둔다(도우미도 ASCII뿐이다)
pub fn inject_helper(html: &[u8]) -> Vec<u8> {
    let script = format!("<script>{HELPER_JS}</script>");
    let at = tag_end(html, b"<head").or_else(|| tag_end(html, b"<html")).or_else(|| tag_end(html, b"<!doctype")).unwrap_or(0);
    let mut out = Vec::with_capacity(html.len() + script.len());
    out.extend_from_slice(&html[..at]);
    out.extend_from_slice(script.as_bytes());
    out.extend_from_slice(&html[at..]);
    out
}

/// `name`(소문자, `<` 포함)으로 시작하는 첫 태그의 `>` 다음 위치. `<header`처럼 더 긴 이름은 건너뛴다
fn tag_end(html: &[u8], name: &[u8]) -> Option<usize> {
    let mut from = 0;
    while from + name.len() <= html.len() {
        let rel = html[from..].windows(name.len()).position(|w| w.eq_ignore_ascii_case(name))?;
        let start = from + rel;
        let after = start + name.len();
        let boundary = html.get(after).map_or(true, |b| b.is_ascii_whitespace() || *b == b'>' || *b == b'/');
        if boundary {
            return html[after..].iter().position(|b| *b == b'>').map(|p| after + p + 1);
        }
        from = after;
    }
    None
}

fn response(status: StatusCode, content_type: &str, scripts: bool, body: Vec<u8>) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "no-store")
        .header("X-Content-Type-Options", "nosniff")
        .header("Referrer-Policy", "no-referrer")
        .header("Content-Security-Policy", if scripts { SCRIPT_CSP } else { SAFE_CSP })
        .body(body)
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

fn not_found() -> Response<Vec<u8>> {
    response(StatusCode::NOT_FOUND, "text/plain", false, Vec::new())
}

/// 프로토콜 요청 하나를 처리한다 (파일 읽기는 호출자가 UI 스레드 밖에서 돌린다)
pub fn respond(app: &AppHandle, request: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let Some((token, segments)) = split_request_path(request.uri().path()) else {
        return response(StatusCode::FORBIDDEN, "text/plain", false, Vec::new());
    };
    let views = app.state::<HtmlViews>();
    let (root, entry_text, scripts) = {
        let guard = views.0.lock().expect("htmlview lock");
        let Some(view) = guard.get(&token) else { return not_found() };
        let is_entry = segments.len() == 1 && segments[0].to_lowercase() == view.entry.to_lowercase();
        (view.root.clone(), if is_entry { view.text.clone() } else { None }, view.scripts)
    };
    let (body, content_type) = if let Some(text) = entry_text {
        (text.into_bytes(), "text/html; charset=utf-8")
    } else {
        let Some(path) = resolve(&root, &segments) else { return not_found() };
        match std::fs::metadata(&path) {
            Ok(meta) if meta.len() > MAX_BYTES => {
                return response(StatusCode::PAYLOAD_TOO_LARGE, "text/plain", scripts, Vec::new())
            }
            Ok(_) => {}
            Err(_) => return not_found(),
        }
        let Ok(bytes) = std::fs::read(&path) else { return not_found() };
        (bytes, mime_for(&path))
    };
    let body = if scripts && content_type.starts_with("text/html") { inject_helper(&body) } else { body };
    response(StatusCode::OK, content_type, scripts, body)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOKEN: &str = "0123456789abcdef0123456789abcdef";

    fn split(path: &str) -> Option<Vec<String>> {
        split_request_path(path).map(|(t, s)| {
            assert_eq!(t, TOKEN);
            s
        })
    }

    #[test]
    fn splits_token_and_decodes_each_segment_once() {
        assert_eq!(split(&format!("/{TOKEN}/img/a%20b.png")), Some(vec!["img".into(), "a b.png".into()]));
        assert_eq!(split(&format!("/{TOKEN}/%ED%95%9C%EA%B8%80.css")), Some(vec!["한글.css".into()]));
        assert_eq!(split(&format!("/{TOKEN}//a.html")), Some(vec!["a.html".into()]));
        // %2525 → %25 (한 번만 푼다)
        assert_eq!(split(&format!("/{TOKEN}/100%2525.png")), Some(vec!["100%25.png".into()]));
    }

    #[test]
    fn rejects_traversal_and_alias_names() {
        for bad in [
            "..", "%2e%2e", ".", "a%2fb", "a%5cb", "C%3A", "a:b", "x%00", "a.html.", "a.html%20", "...", "%2E%2E%5C",
        ] {
            assert_eq!(split(&format!("/{TOKEN}/{bad}/x.png")), None, "{bad}");
        }
    }

    #[test]
    fn rejects_missing_or_odd_token() {
        assert_eq!(split_request_path("/"), None);
        assert_eq!(split_request_path("//a.png"), None);
        assert_eq!(split_request_path("/not-hex/a.png"), None);
    }

    #[test]
    fn resolve_stays_inside_root() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        std::fs::create_dir(root.join("img")).unwrap();
        std::fs::write(root.join("img").join("a.png"), b"x").unwrap();
        std::fs::write(dir.path().parent().unwrap().join(format!("frond-outside-{}.txt", std::process::id())), b"s").ok();
        assert!(resolve(&root, &["img".into(), "a.png".into()]).is_some());
        assert!(resolve(&root, &["img".into()]).is_none(), "폴더는 내지 않는다");
        assert!(resolve(&root, &["none.png".into()]).is_none());
        // 구성 요소 검사를 건너뛰어도 canonicalize 뒤 포함 검사로 막힌다
        assert!(resolve(&root, &["..".into(), format!("frond-outside-{}.txt", std::process::id())]).is_none());
        std::fs::remove_file(dir.path().parent().unwrap().join(format!("frond-outside-{}.txt", std::process::id()))).ok();
    }

    #[test]
    fn helper_goes_after_head_or_fallbacks() {
        let s = |b: Vec<u8>| String::from_utf8(b).unwrap();
        let out = s(inject_helper(b"<!DOCTYPE html><html lang=\"ko\"><HEAD><title>t</title></HEAD><body>x</body></html>"));
        assert!(out.starts_with("<!DOCTYPE html><html lang=\"ko\"><HEAD><script>"), "{out}");
        assert!(out.ends_with("</script><title>t</title></HEAD><body>x</body></html>"));
        // <header>는 <head>가 아니다
        let out = s(inject_helper(b"<!doctype html><html><body><header>h</header></body></html>"));
        assert!(out.starts_with("<!doctype html><html><script>"), "{out}");
        let out = s(inject_helper(b"<!doctype html>\n<p>x"));
        assert!(out.starts_with("<!doctype html><script>"), "{out}");
        let out = s(inject_helper(b"<p>x"));
        assert!(out.starts_with("<script>"));
    }

    #[test]
    fn helper_injection_keeps_non_utf8_bytes() {
        // EUC-KR "한" = B0 A1 — 바이트를 그대로 둔다
        let page = b"<html><head><meta charset=\"euc-kr\"></head><body>\xB0\xA1</body></html>".to_vec();
        let out = inject_helper(&page);
        assert!(out.windows(2).any(|w| w == [0xB0, 0xA1]));
        assert!(HELPER_JS.is_ascii(), "도우미 스크립트는 ASCII만");
    }

    #[test]
    fn mime_by_extension() {
        assert_eq!(mime_for(Path::new("a.HTML")), "text/html");
        assert_eq!(mime_for(Path::new("a.woff2")), "font/woff2");
        assert_eq!(mime_for(Path::new("a.svg")), "image/svg+xml");
        assert_eq!(mime_for(Path::new("a.exe")), "application/octet-stream");
        assert_eq!(mime_for(Path::new("noext")), "application/octet-stream");
    }

    #[test]
    fn csp_never_lists_ipc_or_asset_and_always_sandboxes() {
        for csp in [SAFE_CSP, SCRIPT_CSP] {
            assert!(csp.starts_with("sandbox"), "{csp}");
            assert!(!csp.contains("allow-same-origin"));
            assert!(!csp.contains("ipc"));
            assert!(!csp.contains("asset"));
        }
        assert!(SAFE_CSP.contains("script-src 'none'"));
    }

    #[test]
    fn frames_stay_on_protocol_srcdoc_or_blank() {
        assert!(frame_navigation_allowed("http://htmlview.localhost/0123/a.html?v=2"));
        assert!(frame_navigation_allowed("about:srcdoc"));
        assert!(frame_navigation_allowed("about:blank"));
        assert!(!frame_navigation_allowed("https://example.com/"));
        assert!(!frame_navigation_allowed("http://htmlview.localhost.evil.example/"));
        assert!(!frame_navigation_allowed("http://tauri.localhost/"));
        assert!(!frame_navigation_allowed("http://asset.localhost/C%3A%5Cx.png"));
        assert!(!frame_navigation_allowed("data:text/html,<p>x"));
        assert!(!frame_navigation_allowed("javascript:alert(1)"));
    }

    #[test]
    fn tokens_are_hex_and_distinct() {
        let a = new_token();
        let b = new_token();
        assert_eq!(a.len(), 32);
        assert!(a.bytes().all(|c| c.is_ascii_hexdigit()));
        assert_ne!(a, b);
    }
}
