//! 이미지 붙여넣기·끌어다 놓기 (로드맵 2-5, brief T11) — 문서 폴더의 `assets/`에 복사하고 문서 기준 상대 경로를 돌려준다.
//! 같은 이름이 있으면 `-1`, `-2`를 붙인다. 쓰기는 코어의 원자적 쓰기를 쓴다.

use std::path::{Path, PathBuf};

use percent_encoding::percent_decode_str;
use tauri::ipc::{InvokeBody, Request};

const ASSETS_DIR: &str = "assets";
const IMAGE_EXTS: [&str; 7] = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

/// 확장자가 이미지면 소문자로 돌려준다
pub fn image_ext(name: &str) -> Option<String> {
    let ext = Path::new(name).extension()?.to_string_lossy().to_lowercase();
    IMAGE_EXTS.contains(&ext.as_str()).then_some(ext)
}

/// `dir/stem.ext`가 있으면 `stem-1.ext`, `stem-2.ext` …
fn unique_path(dir: &Path, stem: &str, ext: &str) -> PathBuf {
    let first = dir.join(format!("{stem}.{ext}"));
    if !first.exists() {
        return first;
    }
    (1..)
        .map(|n| dir.join(format!("{stem}-{n}.{ext}")))
        .find(|p| !p.exists())
        .expect("무한 반복자")
}

/// 파일 이름에 쓸 수 없는 문자를 `-`로
fn sanitize_stem(stem: &str) -> String {
    let cleaned: String = stem
        .chars()
        .map(|c| if c.is_control() || r#"\/:*?"<>|"#.contains(c) { '-' } else { c })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.').to_owned();
    if trimmed.is_empty() { "image".to_owned() } else { trimmed }
}

fn write_into_assets(doc_dir: &Path, stem: &str, ext: &str, bytes: &[u8]) -> Result<String, String> {
    let dir = doc_dir.join(ASSETS_DIR);
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let target = unique_path(&dir, &sanitize_stem(stem), ext);
    frond_core::write_atomic(&target, bytes).map_err(|e| format!("{}: {e}", target.display()))?;
    let name = target.file_name().expect("file name").to_string_lossy();
    Ok(format!("{ASSETS_DIR}/{name}"))
}

fn header(request: &Request<'_>, name: &str) -> Result<String, String> {
    let raw = request
        .headers()
        .get(name)
        .ok_or_else(|| format!("{name} 헤더 없음"))?
        .to_str()
        .map_err(|e| e.to_string())?;
    Ok(percent_decode_str(raw).decode_utf8_lossy().into_owned())
}

/// 붙여넣은 이미지 바이트(본문 그대로)를 저장한다. 헤더: `x-doc-dir`·`x-stem`·`x-ext` (퍼센트 인코딩)
#[tauri::command]
pub fn save_pasted_image(request: Request<'_>) -> Result<String, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("이미지 바이트가 없습니다".into());
    };
    let doc_dir = PathBuf::from(header(&request, "x-doc-dir")?);
    let stem = header(&request, "x-stem")?;
    let ext = header(&request, "x-ext")?.to_lowercase();
    if !IMAGE_EXTS.contains(&ext.as_str()) {
        return Err(format!("이미지 형식이 아닙니다: {ext}"));
    }
    write_into_assets(&doc_dir, &stem, &ext, bytes)
}

/// 끌어다 놓은 이미지 파일을 복사한다. 이미 문서 폴더 안에 있으면 복사하지 않고 그 상대 경로를 쓴다
#[tauri::command]
pub fn copy_image_to_assets(doc_dir: String, source: String) -> Result<String, String> {
    let doc_dir = PathBuf::from(doc_dir);
    let source = PathBuf::from(source);
    let name = source.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let ext = image_ext(&name).ok_or_else(|| format!("이미지 파일이 아닙니다: {name}"))?;
    if let Ok(rel) = source.strip_prefix(&doc_dir) {
        return Ok(rel.to_string_lossy().replace('\\', "/"));
    }
    let bytes = std::fs::read(&source).map_err(|e| format!("{}: {e}", source.display()))?;
    let stem = source.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    write_into_assets(&doc_dir, &stem, &ext, &bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_unique_names_under_assets() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(write_into_assets(dir.path(), "shot", "png", b"1").unwrap(), "assets/shot.png");
        assert_eq!(write_into_assets(dir.path(), "shot", "png", b"2").unwrap(), "assets/shot-1.png");
        assert_eq!(std::fs::read(dir.path().join("assets/shot-1.png")).unwrap(), b"2");
    }

    #[test]
    fn sanitizes_stem_and_detects_images() {
        assert_eq!(sanitize_stem(r#"a/b:c*?"#), "a-b-c--");
        assert_eq!(sanitize_stem("  ..  "), "image");
        assert_eq!(image_ext("그림.PNG").as_deref(), Some("png"));
        assert_eq!(image_ext("notes.md"), None);
    }

    #[test]
    fn image_inside_doc_dir_is_linked_not_copied() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join("img")).unwrap();
        let src = dir.path().join("img").join("a b.png");
        std::fs::write(&src, b"x").unwrap();
        let rel = copy_image_to_assets(dir.path().to_string_lossy().into(), src.to_string_lossy().into()).unwrap();
        assert_eq!(rel, "img/a b.png");
        assert!(!dir.path().join("assets").exists());
    }
}
