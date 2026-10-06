//! `samples/raw/*` 바이트 픽스처 왕복 테스트 — 로드맵 Phase 0-2 EARS 기준.
//!
//! - 무편집 저장 → 바이트 불변 (메모리·디스크 둘 다)
//! - 한 줄 편집 → 그 줄 밖의 바이트·EOL·BOM·끝 개행 보존
//! - CP949로 표현 불가한 문자 → 조용히 손상하지 않고 오류

use encoding_rs::{EUC_KR, UTF_8};
use frond_core::{DetectSource, Eol, FileDocument, SaveError, WriteMethod};
use std::fs;
use std::path::PathBuf;

fn raw_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../samples/raw")
}

fn fixtures() -> Vec<PathBuf> {
    let mut list: Vec<PathBuf> = fs::read_dir(raw_dir())
        .expect("samples/raw 폴더")
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "md"))
        .collect();
    list.sort();
    assert!(list.len() >= 6, "픽스처가 {}개뿐", list.len());
    list
}

fn name(p: &std::path::Path) -> String {
    p.file_name().unwrap().to_string_lossy().into_owned()
}

#[test]
fn unedited_save_is_byte_identical_in_memory() {
    for path in fixtures() {
        let bytes = fs::read(&path).unwrap();
        let doc = FileDocument::from_bytes(bytes.clone());
        assert!(!doc.is_modified(doc.text()));
        assert_eq!(doc.to_bytes(doc.text()).unwrap(), bytes, "{}", name(&path));
    }
}

#[test]
fn unedited_save_to_disk_is_byte_identical() {
    let dir = tempfile::tempdir().unwrap();
    for path in fixtures() {
        let copy = dir.path().join(path.file_name().unwrap());
        fs::copy(&path, &copy).unwrap();
        let bytes = fs::read(&copy).unwrap();
        let mut doc = FileDocument::open(&copy).unwrap();
        let text = doc.text().to_owned();
        let method = doc.save_to(&copy, &text).unwrap();
        assert_eq!(method, WriteMethod::Replaced, "{}", name(&path));
        assert_eq!(fs::read(&copy).unwrap(), bytes, "{}", name(&path));
        let expected_hash: [u8; 32] = blake3::hash(&bytes).into();
        assert_eq!(doc.content_hash(), expected_hash);
    }
    let leftovers: Vec<_> = fs::read_dir(dir.path())
        .unwrap()
        .flatten()
        .filter(|e| e.file_name().to_string_lossy().contains(".tmp"))
        .collect();
    assert!(leftovers.is_empty(), "임시 파일이 남았다: {leftovers:?}");
}

#[test]
fn detects_expected_properties() {
    // samples/README.md 표와 일치해야 한다: (인코딩, BOM, 지배 EOL, 섞임, 끝 개행)
    let expected = [
        ("cp949.md", "EUC-KR", false, "CRLF", false, true),
        ("mixed-eol.md", "UTF-8", false, "LF", true, true), // LF 3 : CRLF 3 동률 → 먼저 나온 LF
        ("no-final-newline.md", "UTF-8", false, "LF", false, false),
        ("utf8-bom.md", "UTF-8", true, "CRLF", false, true),
        ("utf8-crlf.md", "UTF-8", false, "CRLF", false, true),
        ("utf8-lf.md", "UTF-8", false, "LF", false, true),
    ];
    for (file, enc, bom, eol, mixed, final_nl) in expected {
        let doc = FileDocument::open(raw_dir().join(file)).unwrap();
        let info = doc.info();
        assert_eq!(info.encoding, enc, "{file} 인코딩");
        assert_eq!(info.bom, bom, "{file} BOM");
        assert_eq!(info.eol, eol, "{file} EOL");
        assert_eq!(info.mixed_eol, mixed, "{file} 섞임");
        assert_eq!(info.final_newline, final_nl, "{file} 끝 개행");
        assert!(!info.lossy, "{file} 손실 디코드");
        if file == "cp949.md" {
            assert!(
                matches!(info.source, DetectSource::Detected | DetectSource::Fallback),
                "{file} source={:?}",
                info.source
            );
        }
    }
}

/// 한 줄 끝에 문자열을 붙여 저장하면, 결과는 원본에 그 문자열의 바이트만 끼워 넣은 것과 같아야 한다.
#[test]
fn one_line_edit_only_touches_that_line() {
    const SUFFIX: &str = " (편집)";
    for path in fixtures() {
        let original = fs::read(&path).unwrap();
        let doc = FileDocument::from_bytes(original.clone());
        let lines: Vec<&str> = doc.text().split('\n').collect();
        let target = lines.len().min(3) - 1; // 3번째 줄, 짧으면 마지막 줄
        let mut edited = lines.clone();
        let new_line = format!("{}{}", lines[target], SUFFIX);
        edited[target] = &new_line;
        let new_text = edited.join("\n");

        let out = doc.to_bytes(&new_text).unwrap();
        let (ins, _, had_errors) = doc.encoding().encode(SUFFIX);
        assert!(!had_errors);

        let prefix = original
            .iter()
            .zip(out.iter())
            .take_while(|(a, b)| a == b)
            .count();
        assert_eq!(
            out.len(),
            original.len() + ins.len(),
            "{} 길이",
            name(&path)
        );
        assert_eq!(
            &out[prefix..prefix + ins.len()],
            &ins[..],
            "{} 삽입 바이트",
            name(&path)
        );
        assert_eq!(
            &out[prefix + ins.len()..],
            &original[prefix..],
            "{} 뒤쪽 보존",
            name(&path)
        );

        // 다시 열면 같은 메타데이터·같은 텍스트
        let reopened = FileDocument::from_bytes(out);
        assert_eq!(reopened.text(), new_text, "{}", name(&path));
        let (a, b) = (doc.info(), reopened.info());
        assert_eq!(
            (a.encoding, a.bom, a.eol, a.mixed_eol, a.final_newline),
            (b.encoding, b.bom, b.eol, b.mixed_eol, b.final_newline),
            "{}",
            name(&path)
        );
    }
}

#[test]
fn cp949_unmappable_char_is_reported_not_silently_replaced() {
    let doc = FileDocument::open(raw_dir().join("cp949.md")).unwrap();
    let new_text = format!("{}😀 끝", doc.text());
    match doc.to_bytes(&new_text) {
        Err(SaveError::Unmappable(e)) => {
            assert_eq!(e.ch, '😀');
            assert_eq!(e.encoding, "EUC-KR");
            assert_eq!(e.line, doc.text().split('\n').count());
            assert_eq!(e.col, 1);
        }
        other => panic!("Unmappable이어야 함: {other:?}"),
    }
    // UTF-8로 변환하면 저장 가능하고, 다시 열면 UTF-8로 읽힌다
    let mut converted = doc.clone();
    converted.convert(UTF_8, false);
    let bytes = converted.to_bytes(&new_text).unwrap();
    let reopened = FileDocument::from_bytes(bytes);
    assert_eq!(reopened.encoding(), UTF_8);
    assert_eq!(reopened.text(), new_text);
}

#[test]
fn convert_without_edit_rewrites_bytes_but_keeps_text_and_eols() {
    let mut doc = FileDocument::open(raw_dir().join("cp949.md")).unwrap();
    let text = doc.text().to_owned();
    doc.convert(UTF_8, true);
    let bytes = doc.to_bytes(&text).unwrap();
    assert_ne!(bytes, doc.original_bytes());
    let reopened = FileDocument::from_bytes(bytes);
    assert_eq!(reopened.text(), text);
    assert!(reopened.has_bom());
    assert_eq!(reopened.eols(), doc.eols());
}

#[test]
fn convert_eol_rewrites_every_line_and_keeps_text_encoding_bom() {
    for (fixture, target) in [("mixed-eol.md", Eol::CrLf), ("utf8-crlf.md", Eol::Lf), ("utf8-bom.md", Eol::Lf)] {
        let mut doc = FileDocument::open(raw_dir().join(fixture)).unwrap();
        let text = doc.text().to_owned();
        doc.convert_eol(target);
        let bytes = doc.to_bytes(&text).unwrap();
        assert_ne!(bytes, doc.original_bytes(), "{fixture}");
        let reopened = FileDocument::from_bytes(bytes);
        assert_eq!(reopened.text(), text, "{fixture}");
        assert_eq!(reopened.encoding(), doc.encoding(), "{fixture}");
        assert_eq!(reopened.has_bom(), doc.has_bom(), "{fixture}");
        assert!(reopened.eols().iter().all(|e| *e == target), "{fixture}");
        assert!(!reopened.info().mixed_eol, "{fixture}");
    }
}

#[test]
fn convert_eol_to_what_every_line_already_has_keeps_bytes() {
    let path = raw_dir().join("utf8-crlf.md");
    let original = fs::read(&path).unwrap();
    let mut doc = FileDocument::from_bytes(original.clone());
    doc.convert_eol(Eol::CrLf);
    assert_eq!(doc.to_bytes(doc.text()).unwrap(), original);
}

#[test]
fn convert_eol_with_edit_uses_target_for_new_lines_too() {
    let mut doc = FileDocument::open(raw_dir().join("mixed-eol.md")).unwrap();
    let new_text = format!("새 첫 줄\n{}\n끝에 더한 줄", doc.text());
    doc.convert_eol(Eol::Lf);
    let reopened = FileDocument::from_bytes(doc.to_bytes(&new_text).unwrap());
    assert_eq!(reopened.text(), new_text);
    assert!(reopened.eols().iter().all(|e| *e == Eol::Lf));
}

#[test]
fn save_after_convert_eol_updates_dominant() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("m.md");
    fs::copy(raw_dir().join("mixed-eol.md"), &path).unwrap();
    let mut doc = FileDocument::open(&path).unwrap();
    let text = doc.text().to_owned();
    doc.convert_eol(Eol::Lf);
    doc.save_to(&path, &text).unwrap();
    let info = doc.info();
    assert_eq!(info.eol, "LF");
    assert!(!info.mixed_eol);
    assert_eq!(fs::read(&path).unwrap(), doc.original_bytes());
    // 변환은 한 번만 — 다음 저장은 다시 줄별 보존
    assert_eq!(doc.to_bytes(&text).unwrap(), doc.original_bytes());
}

#[test]
fn reinterpret_keeps_bytes_and_unedited_save_still_identical() {
    let path = raw_dir().join("cp949.md");
    let original = fs::read(&path).unwrap();
    let mut doc = FileDocument::from_bytes(original.clone());
    doc.reinterpret(encoding_rs::WINDOWS_1252); // 잘못 해석해도
    assert_eq!(doc.info().source, DetectSource::Forced);
    assert_eq!(doc.to_bytes(doc.text()).unwrap(), original); // 무편집 저장은 바이트 그대로
    doc.reinterpret(EUC_KR);
    assert!(doc.text().contains("한글"));
}

#[test]
fn inserted_line_in_mixed_eol_file_gets_dominant_and_neighbors_keep_theirs() {
    let doc = FileDocument::open(raw_dir().join("mixed-eol.md")).unwrap();
    let old_eols = doc.eols().to_vec();
    let mut lines: Vec<&str> = doc.text().split('\n').collect();
    lines.insert(1, "끼워 넣은 줄");
    let new_text = lines.join("\n");
    let out = doc.to_bytes(&new_text).unwrap();
    let reopened = FileDocument::from_bytes(out);
    let mut expected = old_eols.clone();
    expected.insert(1, doc.dominant_eol());
    assert_eq!(reopened.eols(), expected.as_slice());
}

#[test]
fn adding_final_newline_appends_dominant_eol_only() {
    let path = raw_dir().join("no-final-newline.md");
    let original = fs::read(&path).unwrap();
    let doc = FileDocument::from_bytes(original.clone());
    assert!(!doc.final_newline());
    let out = doc.to_bytes(&format!("{}\n", doc.text())).unwrap();
    let mut expected = original.clone();
    expected.extend_from_slice(doc.dominant_eol().as_str().as_bytes());
    assert_eq!(out, expected);
}

#[test]
fn empty_and_bom_only_inputs() {
    let doc = FileDocument::from_bytes(Vec::new());
    assert_eq!(doc.text(), "");
    assert_eq!(doc.to_bytes("").unwrap(), Vec::<u8>::new());
    assert_eq!(doc.to_bytes("a").unwrap(), b"a");

    let bom = frond_core::encoding::UTF8_BOM.to_vec();
    let doc = FileDocument::from_bytes(bom.clone());
    assert_eq!(doc.text(), "");
    assert!(doc.has_bom());
    assert_eq!(doc.to_bytes("").unwrap(), bom);
    let mut with_a = bom.clone();
    with_a.push(b'a');
    assert_eq!(doc.to_bytes("a").unwrap(), with_a);
}

#[test]
fn lossy_document_blocks_edit_but_allows_unedited_save() {
    // 잘린 UTF-16LE (홀수 바이트) 는 손실 디코드된다
    let mut bytes = vec![0xFF, 0xFE];
    bytes.extend_from_slice(&[0x41, 0x00, 0x42]);
    let doc = FileDocument::from_bytes(bytes.clone());
    assert!(doc.is_lossy());
    assert_eq!(doc.to_bytes(doc.text()).unwrap(), bytes);
    assert!(matches!(
        doc.to_bytes("edited"),
        Err(SaveError::LossyDocument)
    ));
}
