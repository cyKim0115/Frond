//! [`FileDocument`] — 원본 바이트와 편집기용 텍스트를 함께 들고 있는 문서.

use crate::atomic::{write_atomic, WriteMethod};
use crate::encoding::{self, DetectSource, Unmappable};
use crate::eol::{self, Eol};
use encoding_rs::Encoding;
use serde::Serialize;
use std::io;
use std::path::Path;

/// 상태바·경고에 쓸 문서 메타데이터.
#[derive(Clone, Debug, Serialize)]
pub struct DocumentInfo {
    /// WHATWG 이름 (`UTF-8`, `EUC-KR`, `UTF-16LE` …). 저장 대상 인코딩.
    pub encoding: String,
    pub bom: bool,
    /// 지배 종결자 이름 (`LF` / `CRLF` / `CR`).
    pub eol: String,
    /// 종결자가 두 종류 이상 섞여 있다.
    pub mixed_eol: bool,
    pub final_newline: bool,
    /// 손실 디코드 상태 — 편집 저장이 막힌다.
    pub lossy: bool,
    pub source: DetectSource,
    pub line_count: usize,
    pub byte_len: usize,
}

#[derive(Debug, thiserror::Error)]
pub enum SaveError {
    #[error(transparent)]
    Unmappable(#[from] Unmappable),
    #[error(
        "손실 디코드된 문서는 편집 저장할 수 없습니다. 인코딩을 다시 지정하거나 UTF-8로 변환하세요"
    )]
    LossyDocument,
    #[error(transparent)]
    Io(#[from] io::Error),
}

/// 파일 하나의 바이트·인코딩·줄바꿈 상태.
///
/// `text()`는 LF로 정규화된 편집기용 텍스트다. 저장은 항상 새 텍스트를 인수로 받는다 —
/// 편집기(CodeMirror)가 진실이고, 이 구조체는 원본과의 차이를 바이트로 되돌리는 역할만 한다.
#[derive(Clone, Debug)]
pub struct FileDocument {
    original: Vec<u8>,
    text: String,
    eols: Vec<Eol>,
    dominant: Eol,
    /// 읽을 때 감지한 인코딩.
    detected_encoding: &'static Encoding,
    detected_bom: bool,
    /// 저장할 인코딩. `convert()`로 바뀔 수 있다.
    encoding: &'static Encoding,
    bom: bool,
    source: DetectSource,
    lossy: bool,
}

impl FileDocument {
    pub fn from_bytes(bytes: Vec<u8>) -> Self {
        let (raw, meta) = encoding::decode(&bytes);
        Self::build(bytes, raw, meta)
    }

    /// 인코딩을 강제해 해석한다 ("Encode in").
    pub fn from_bytes_as(bytes: Vec<u8>, encoding: &'static Encoding) -> Self {
        let (raw, meta) = encoding::decode_as(&bytes, encoding);
        Self::build(bytes, raw, meta)
    }

    pub fn open(path: impl AsRef<Path>) -> io::Result<Self> {
        Ok(Self::from_bytes(std::fs::read(path)?))
    }

    fn build(bytes: Vec<u8>, raw: String, meta: encoding::Decoded) -> Self {
        let (text, eols) = eol::normalize(&raw);
        let dominant = eol::dominant(&eols, Eol::platform_default());
        FileDocument {
            original: bytes,
            text,
            eols,
            dominant,
            detected_encoding: meta.encoding,
            detected_bom: meta.bom,
            encoding: meta.encoding,
            bom: meta.bom,
            source: meta.source,
            lossy: meta.lossy,
        }
    }

    /// 편집기에 넘길 LF 정규화 텍스트.
    pub fn text(&self) -> &str {
        &self.text
    }

    pub fn original_bytes(&self) -> &[u8] {
        &self.original
    }

    pub fn encoding(&self) -> &'static Encoding {
        self.encoding
    }

    pub fn has_bom(&self) -> bool {
        self.bom
    }

    pub fn eols(&self) -> &[Eol] {
        &self.eols
    }

    pub fn dominant_eol(&self) -> Eol {
        self.dominant
    }

    pub fn is_lossy(&self) -> bool {
        self.lossy
    }

    pub fn final_newline(&self) -> bool {
        self.text.ends_with('\n')
    }

    /// 외부 변경 감지용 원본 바이트 해시.
    pub fn content_hash(&self) -> [u8; 32] {
        blake3::hash(&self.original).into()
    }

    pub fn info(&self) -> DocumentInfo {
        let mixed = self.eols.iter().any(|e| *e != self.dominant);
        DocumentInfo {
            encoding: self.encoding.name().to_owned(),
            bom: self.bom,
            eol: self.dominant.label().to_owned(),
            mixed_eol: mixed,
            final_newline: self.final_newline(),
            lossy: self.lossy,
            source: self.source,
            line_count: self.text.split('\n').count(),
            byte_len: self.original.len(),
        }
    }

    /// 편집기 텍스트가 열었을 때와 다른가.
    pub fn is_modified(&self, new_text: &str) -> bool {
        new_text != self.text
    }

    /// 같은 바이트를 다른 인코딩으로 다시 해석한다 ("Encode in"). 바이트는 그대로다.
    pub fn reinterpret(&mut self, encoding: &'static Encoding) {
        *self = Self::from_bytes_as(std::mem::take(&mut self.original), encoding);
    }

    /// 저장 대상 인코딩을 바꾼다 ("Convert to"). 다음 저장부터 바이트가 달라진다.
    pub fn convert(&mut self, encoding: &'static Encoding, bom: bool) {
        self.encoding = encoding;
        self.bom = bom;
    }

    fn target_unchanged(&self) -> bool {
        self.encoding == self.detected_encoding && self.bom == self.detected_bom
    }

    /// `new_text`를 저장할 때 디스크에 쓸 바이트와 그때의 EOL 맵.
    fn render(&self, new_text: &str) -> Result<(Vec<u8>, Vec<Eol>), SaveError> {
        if !self.is_modified(new_text) && self.target_unchanged() {
            return Ok((self.original.clone(), self.eols.clone()));
        }
        if self.lossy {
            return Err(SaveError::LossyDocument);
        }
        let eols = eol::remap(&self.text, &self.eols, new_text, self.dominant);
        let raw = eol::join(new_text, &eols, self.dominant);
        let bytes = encoding::encode(&raw, self.encoding, self.bom)?;
        Ok((bytes, eols))
    }

    /// 디스크에 쓰지 않고 저장 결과 바이트만 만든다. 무편집이면 원본 바이트의 복사본.
    pub fn to_bytes(&self, new_text: &str) -> Result<Vec<u8>, SaveError> {
        self.render(new_text).map(|(bytes, _)| bytes)
    }

    /// `path`에 원자적으로 저장하고, 성공하면 이 문서의 원본 상태를 저장한 내용으로 바꾼다.
    pub fn save_to(
        &mut self,
        path: impl AsRef<Path>,
        new_text: &str,
    ) -> Result<WriteMethod, SaveError> {
        let (bytes, eols) = self.render(new_text)?;
        let method = write_atomic(path.as_ref(), &bytes)?;
        self.original = bytes;
        self.eols = eols;
        if self.is_modified(new_text) {
            self.text = new_text.to_owned();
        }
        self.detected_encoding = self.encoding;
        self.detected_bom = self.bom;
        if self.source != DetectSource::Forced && !self.target_unchanged() {
            self.source = DetectSource::Forced;
        }
        Ok(method)
    }
}
