//! HTML 내보내기 (로드맵 4-4) — 프런트가 만든 HTML을 사용자가 고른 경로에 쓰고, 이미지를 파일 안에 넣을 때 그 바이트를 읽어 준다.
//! 쓰기는 코어의 원자적 쓰기(임시 파일 + 교체)를 쓴다. 문서가 아니므로 바이트 보존 대상이 아니다(UTF-8, BOM 없음).

use std::path::Path;

use tauri::ipc::Response;

const IMAGE_EXTS: [&str; 8] = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"];

#[tauri::command]
pub fn write_export(path: String, text: String) -> Result<(), String> {
    mdeditor_core::write_atomic(Path::new(&path), text.as_bytes())
        .map(|_| ())
        .map_err(|e| format!("{path}: {e}"))
}

/// 내보낼 HTML에 넣을 이미지 바이트. 이미지 확장자만 읽는다 (다른 파일을 이 통로로 꺼내지 못하게)
#[tauri::command]
pub fn read_image_bytes(path: String) -> Result<Response, String> {
    let ext = Path::new(&path)
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    if !IMAGE_EXTS.contains(&ext.as_str()) {
        return Err(format!("이미지 파일이 아닙니다: {path}"));
    }
    std::fs::read(&path).map(Response::new).map_err(|e| format!("{path}: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refuses_non_images() {
        assert!(read_image_bytes(r"C:\Windows\win.ini".into()).is_err());
    }

    #[test]
    fn writes_utf8_text() {
        let path = std::env::temp_dir().join(format!("mdeditor-export-{}.html", std::process::id()));
        write_export(path.to_string_lossy().into_owned(), "<p>한글</p>".into()).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), "<p>한글</p>".as_bytes());
        let _ = std::fs::remove_file(path);
    }
}
