//! 저장 (로드맵 2-2·2-3) — 상태 없이 동작한다. 저장할 때마다 디스크의 파일을 다시 열어
//!
//! 1. 내용 해시가 프런트가 연 때의 해시와 같은지 본다(etag). 다르면 [`SaveFailure::Conflict`] — 그 사이 다른 편집기가 고쳤다.
//! 2. 같으면 그 [`FileDocument`]가 곧 연 때의 원본이므로 `save_to`가 원본 바이트·EOL 맵·인코딩·BOM을 기준으로
//!    바뀐 줄만 다시 쓴다 (무편집이면 원본 바이트 그대로, 코어 `render`).
//!
//! 인코딩 "변환"(Convert to)은 저장 옵션 `convert_to`, "해석만 바꾸기"(Encode in)는 [`crate::load_document`]의 `encoding`.
//! 줄바꿈 변환(모든 줄을 LF 또는 CRLF로)은 저장 옵션 `eol`.

use std::path::{Path, PathBuf};

use mdeditor_core::{DocumentInfo, Eol, FileDocument, SaveError};
use serde::Serialize;

use crate::hash_hex;

#[derive(Debug, Serialize)]
pub struct SavedPayload {
    /// 저장한 바이트의 blake3 — 다음 저장의 etag, 외부 변경 비교값
    pub hash: String,
    pub info: DocumentInfo,
}

/// 프런트가 종류별로 다른 팝업을 띄울 수 있게 구조로 돌려준다
#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum SaveFailure {
    /// 연 뒤에 다른 곳에서 파일이 바뀌었다(또는 지워졌다) — 덮어쓰기·다른 이름으로 저장을 고르게 한다
    Conflict { missing: bool },
    /// 저장 인코딩(예: EUC-KR)으로 표현할 수 없는 문자
    Unmappable { ch: String, line: usize, col: usize, encoding: String },
    /// 손실 디코드 문서 — 편집 저장 금지(스펙 경계 사례). 인코딩을 다시 지정해 열어야 한다
    Lossy,
    Io { message: String },
}

impl From<SaveError> for SaveFailure {
    fn from(error: SaveError) -> Self {
        match error {
            SaveError::Unmappable(u) => SaveFailure::Unmappable {
                ch: u.ch.to_string(),
                line: u.line,
                col: u.col,
                encoding: u.encoding.to_owned(),
            },
            SaveError::LossyDocument => SaveFailure::Lossy,
            SaveError::Io(e) => SaveFailure::Io { message: e.to_string() },
        }
    }
}

fn io_failure(path: &Path, error: impl std::fmt::Display) -> SaveFailure {
    SaveFailure::Io { message: format!("{}: {error}", path.display()) }
}

/// WHATWG 라벨(`UTF-8`, `EUC-KR`, `UTF-16LE` …) → 인코딩
pub fn encoding_for(label: &str) -> Result<&'static encoding_rs::Encoding, String> {
    encoding_rs::Encoding::for_label(label.trim().as_bytes()).ok_or_else(|| format!("알 수 없는 인코딩: {label}"))
}

/// 텍스트를 `path`에 저장한다.
///
/// - `expected_hash`: 연 때(또는 마지막 저장)의 해시. 디스크와 다르면 `Conflict`
/// - `force`: 충돌을 무시하고 덮어쓴다. 파일이 없어졌으면 새로 만든다(인코딩은 `convert_to` 또는 UTF-8)
/// - `convert_to`·`bom`: 저장 인코딩을 바꾼다 (Convert to)
/// - `eol`: 모든 줄의 줄바꿈을 이것(`LF`·`CRLF`)으로 바꾼다. 없으면 줄별 원본 줄바꿈을 지킨다
#[tauri::command]
pub fn save_document(
    path: String,
    text: String,
    expected_hash: String,
    force: bool,
    convert_to: Option<String>,
    bom: Option<bool>,
    eol: Option<String>,
) -> Result<SavedPayload, SaveFailure> {
    let path = PathBuf::from(path);
    let mut doc = match FileDocument::open(&path) {
        Ok(doc) => {
            if !force && hash_hex(&doc.content_hash()) != expected_hash {
                return Err(SaveFailure::Conflict { missing: false });
            }
            doc
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            if !force {
                return Err(SaveFailure::Conflict { missing: true });
            }
            FileDocument::from_bytes(Vec::new())
        }
        Err(e) => return Err(io_failure(&path, e)),
    };
    if let Some(label) = convert_to {
        let encoding = encoding_for(&label).map_err(|message| SaveFailure::Io { message })?;
        doc.convert(encoding, bom.unwrap_or(false));
    }
    if let Some(label) = eol {
        let eol = Eol::from_label(&label).ok_or_else(|| SaveFailure::Io { message: format!("알 수 없는 줄바꿈: {label}") })?;
        doc.convert_eol(eol);
    }
    doc.save_to(&path, &text)?;
    Ok(SavedPayload { hash: hash_hex(&doc.content_hash()), info: doc.info() })
}

/// 다른 이름으로 저장 — 원래 문서(`source_path`)의 인코딩·BOM·줄바꿈 맵을 그대로 써서 `target_path`에 만든다.
/// 원래 파일이 없으면(지워짐) UTF-8·플랫폼 줄바꿈으로 만든다
#[tauri::command]
pub fn save_document_as(source_path: String, target_path: String, text: String) -> Result<SavedPayload, SaveFailure> {
    let source = PathBuf::from(source_path);
    let target = PathBuf::from(target_path);
    let mut doc = match FileDocument::open(&source) {
        Ok(doc) => doc,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => FileDocument::from_bytes(Vec::new()),
        Err(e) => return Err(io_failure(&source, e)),
    };
    doc.save_to(&target, &text)?;
    Ok(SavedPayload { hash: hash_hex(&doc.content_hash()), info: doc.info() })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_file(name: &str, bytes: &[u8]) -> (tempfile::TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join(name);
        std::fs::write(&path, bytes).unwrap();
        (dir, path)
    }

    fn open_hash(path: &Path) -> (String, String) {
        let doc = FileDocument::open(path).unwrap();
        (doc.text().to_owned(), hash_hex(&doc.content_hash()))
    }

    #[test]
    fn unedited_save_keeps_bytes() {
        let original = b"\xEF\xBB\xBF# t\r\nline\nlast";
        let (_dir, path) = temp_file("a.md", original);
        let (text, hash) = open_hash(&path);
        save_document(path.to_string_lossy().into(), text, hash, false, None, None, None).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), original);
    }

    #[test]
    fn one_line_edit_keeps_other_eols() {
        let (_dir, path) = temp_file("a.md", b"a\r\nb\nc\r\n");
        let (text, hash) = open_hash(&path);
        let edited = text.replace('b', "B");
        let saved = save_document(path.to_string_lossy().into(), edited, hash, false, None, None, None).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"a\r\nB\nc\r\n");
        assert_eq!(saved.hash, open_hash(&path).1);
    }

    #[test]
    fn changed_on_disk_is_conflict_unless_forced() {
        let (_dir, path) = temp_file("a.md", b"one\n");
        let (text, hash) = open_hash(&path);
        std::fs::write(&path, b"someone else\n").unwrap();
        let p: String = path.to_string_lossy().into();
        let err = save_document(p.clone(), text.clone(), hash.clone(), false, None, None, None).unwrap_err();
        assert!(matches!(err, SaveFailure::Conflict { missing: false }));
        save_document(p, "mine\n".into(), hash, true, None, None, None).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"mine\n");
    }

    #[test]
    fn missing_file_is_conflict_then_recreated_when_forced() {
        let dir = tempfile::tempdir().unwrap();
        let p: String = dir.path().join("gone.md").to_string_lossy().into();
        let err = save_document(p.clone(), "x\n".into(), "h".into(), false, None, None, None).unwrap_err();
        assert!(matches!(err, SaveFailure::Conflict { missing: true }));
        save_document(p.clone(), "x\n".into(), "h".into(), true, None, None, None).unwrap();
        assert!(Path::new(&p).is_file());
    }

    #[test]
    fn unmappable_char_in_euc_kr_is_reported() {
        let (_dir, path) = temp_file("k.md", "가\n".as_bytes());
        let (_, hash) = open_hash(&path);
        let p: String = path.to_string_lossy().into();
        // EUC-KR로 변환해 저장하면 이모지는 표현할 수 없다
        let err = save_document(p.clone(), "가 😀\n".into(), hash.clone(), false, Some("EUC-KR".into()), None, None).unwrap_err();
        match err {
            SaveFailure::Unmappable { ch, line, .. } => {
                assert_eq!(ch, "😀");
                assert_eq!(line, 1);
            }
            other => panic!("{other:?}"),
        }
        // UTF-8로 변환하면 저장된다
        save_document(p, "가 😀\n".into(), hash, false, Some("UTF-8".into()), None, None).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), "가 😀\n".as_bytes());
    }

    #[test]
    fn eol_option_converts_every_line_once() {
        let (_dir, path) = temp_file("a.md", b"a\r\nb\nc\r\n");
        let (text, hash) = open_hash(&path);
        let p: String = path.to_string_lossy().into();
        let saved = save_document(p.clone(), text.clone(), hash, false, None, None, Some("LF".into())).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"a\nb\nc\n");
        assert_eq!(saved.info.eol, "LF");
        assert!(!saved.info.mixed_eol);
        let saved = save_document(p.clone(), format!("{text}d\n"), saved.hash, false, None, None, Some("crlf".into())).unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"a\r\nb\r\nc\r\nd\r\n");
        let err = save_document(p, text, saved.hash, false, None, None, Some("LFCR".into())).unwrap_err();
        assert!(matches!(err, SaveFailure::Io { .. }));
    }

    #[test]
    fn save_as_keeps_source_eol() {
        let (dir, path) = temp_file("a.md", b"a\r\nb\r\n");
        let (text, _) = open_hash(&path);
        let target = dir.path().join("b.md");
        save_document_as(path.to_string_lossy().into(), target.to_string_lossy().into(), format!("{text}c\n")).unwrap();
        assert_eq!(std::fs::read(&target).unwrap(), b"a\r\nb\r\nc\r\n");
    }
}
