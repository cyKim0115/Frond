//! `frond-core` — 바이트 보존 파일 코어.
//!
//! 마크다운 파일을 열어 편집기에 넘길 텍스트(LF 정규화)를 만들고, 저장할 때 원본의
//! 인코딩·BOM·줄별 줄바꿈·끝 개행을 그대로 되살린다.
//!
//! 보장하는 것:
//! - 편집하지 않고 저장하면 **원본 바이트를 그대로** 쓴다 (재인코딩 없음).
//! - 한 줄만 고치면 그 줄 밖의 바이트·EOL·BOM·끝 개행은 바뀌지 않는다.
//! - 대상 인코딩으로 표현할 수 없는 문자가 있으면 조용히 바꾸지 않고
//!   [`Unmappable`](encoding::Unmappable)(행·열·문자)을 돌려준다.
//! - 쓰기는 임시 파일 + `ReplaceFileW`(Windows)로 원자적이며, 실패하면 제자리 쓰기로 물러난다.
//!
//! 흐름:
//!
//! ```text
//! 바이트 ─▶ BOM 스니핑 ─▶ UTF-8 검증 ─▶ chardetng(kr 힌트) + 후보 검증 ─▶ 디코드
//!        ─▶ 줄바꿈 정규화(LF 텍스트 + EOL 맵) ─▶ FileDocument
//!
//! FileDocument + 새 텍스트 ─▶ (무편집이면 원본 바이트) / (편집이면 EOL 맵 재대응 ─▶ 재결합 ─▶ 인코딩)
//!        ─▶ write_atomic
//! ```

pub mod atomic;
pub mod document;
pub mod encoding;
pub mod eol;

pub use atomic::{write_atomic, WriteMethod};
pub use document::{DocumentInfo, FileDocument, SaveError};
pub use encoding::{DetectSource, Unmappable};
pub use eol::Eol;
