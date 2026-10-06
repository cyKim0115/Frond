//! 줄바꿈(EOL) 정규화·재결합·편집 뒤 재대응.
//!
//! 편집기(CodeMirror 6)는 문서를 항상 `\n`으로만 다루므로, 원본 파일의 줄별 종결자는
//! 별도 목록(`Vec<Eol>`)으로 들고 있다가 저장할 때 다시 붙인다.
//!
//! 규칙: 정규화 텍스트의 `\n` 개수 == `eols.len()`. 끝 개행이 있으면 텍스트가 `\n`으로 끝난다.

use serde::Serialize;
use similar::{Algorithm, DiffOp};

/// 줄 종결자 종류.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize)]
pub enum Eol {
    /// `\n`
    Lf,
    /// `\r\n`
    CrLf,
    /// `\r` (구형 Mac)
    Cr,
}

impl Eol {
    pub fn as_str(self) -> &'static str {
        match self {
            Eol::Lf => "\n",
            Eol::CrLf => "\r\n",
            Eol::Cr => "\r",
        }
    }

    /// 상태바 등에 보일 이름.
    pub fn label(self) -> &'static str {
        match self {
            Eol::Lf => "LF",
            Eol::CrLf => "CRLF",
            Eol::Cr => "CR",
        }
    }

    /// [`label`](Self::label)의 역. 대소문자는 가리지 않는다.
    pub fn from_label(label: &str) -> Option<Eol> {
        match label.trim().to_ascii_uppercase().as_str() {
            "LF" => Some(Eol::Lf),
            "CRLF" => Some(Eol::CrLf),
            "CR" => Some(Eol::Cr),
            _ => None,
        }
    }

    /// 종결자가 하나도 없는 파일에 새 줄을 추가할 때 쓸 기본값.
    pub fn platform_default() -> Eol {
        if cfg!(windows) {
            Eol::CrLf
        } else {
            Eol::Lf
        }
    }
}

/// 원본 종결자를 담은 텍스트를 `(LF 정규화 텍스트, 종결자 목록)`으로 나눈다.
pub fn normalize(raw: &str) -> (String, Vec<Eol>) {
    let bytes = raw.as_bytes();
    let mut text = String::with_capacity(raw.len());
    let mut eols = Vec::new();
    let mut start = 0;
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'\r' => {
                text.push_str(&raw[start..i]);
                text.push('\n');
                if i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                    eols.push(Eol::CrLf);
                    i += 2;
                } else {
                    eols.push(Eol::Cr);
                    i += 1;
                }
                start = i;
            }
            b'\n' => {
                text.push_str(&raw[start..i]);
                text.push('\n');
                eols.push(Eol::Lf);
                i += 1;
                start = i;
            }
            _ => i += 1,
        }
    }
    text.push_str(&raw[start..]);
    (text, eols)
}

/// 가장 많이 쓰인 종결자. 동률이면 먼저 나온 것, 종결자가 없으면 `default`.
pub fn dominant(eols: &[Eol], default: Eol) -> Eol {
    let mut count = [0usize; 3];
    let mut first = [usize::MAX; 3];
    for (idx, e) in eols.iter().enumerate() {
        let k = *e as usize;
        count[k] += 1;
        if first[k] == usize::MAX {
            first[k] = idx;
        }
    }
    let mut best: Option<Eol> = None;
    for e in [Eol::Lf, Eol::CrLf, Eol::Cr] {
        let k = e as usize;
        if count[k] == 0 {
            continue;
        }
        best = match best {
            None => Some(e),
            Some(b) => {
                let bk = b as usize;
                if count[k] > count[bk] || (count[k] == count[bk] && first[k] < first[bk]) {
                    Some(e)
                } else {
                    Some(b)
                }
            }
        };
    }
    best.unwrap_or(default)
}

/// LF 정규화 텍스트를 종결자 목록으로 재결합한다. 목록이 모자라면 `fill`을 쓴다.
pub fn join(text: &str, eols: &[Eol], fill: Eol) -> String {
    let mut out = String::with_capacity(text.len() + eols.len());
    for (i, part) in text.split('\n').enumerate() {
        if i > 0 {
            out.push_str(eols.get(i - 1).copied().unwrap_or(fill).as_str());
        }
        out.push_str(part);
    }
    out
}

/// 편집 뒤 새 텍스트의 줄별 종결자를 정한다.
///
/// 정책 (Phase 0-2 결정, 바꾸려면 여기만 고친다):
/// - 원본과 같은 줄(diff `Equal`)은 자기 종결자를 그대로 유지한다.
/// - 제자리에서 내용만 바뀐 줄(`Replace`, 겹치는 구간)은 원래 그 자리 줄의 종결자를 유지한다.
///   사용자가 고친 건 글자이지 줄바꿈이 아니기 때문이다.
/// - 새로 끼어든 줄(`Insert`, `Replace` 초과분)은 파일의 지배 종결자를 쓴다.
pub fn remap(old_text: &str, old_eols: &[Eol], new_text: &str, dominant: Eol) -> Vec<Eol> {
    let old_lines: Vec<&str> = old_text.split('\n').collect();
    let new_lines: Vec<&str> = new_text.split('\n').collect();
    let mut out = vec![dominant; new_lines.len().saturating_sub(1)];

    let mut carry = |old_index: usize, new_index: usize| {
        if let Some(e) = old_eols.get(old_index) {
            if new_index < out.len() {
                out[new_index] = *e;
            }
        }
    };

    for op in similar::capture_diff_slices(Algorithm::Myers, &old_lines, &new_lines) {
        match op {
            DiffOp::Equal {
                old_index,
                new_index,
                len,
            } => {
                for k in 0..len {
                    carry(old_index + k, new_index + k);
                }
            }
            DiffOp::Replace {
                old_index,
                old_len,
                new_index,
                new_len,
            } => {
                for k in 0..old_len.min(new_len) {
                    carry(old_index + k, new_index + k);
                }
            }
            DiffOp::Insert { .. } | DiffOp::Delete { .. } => {}
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_splits_every_kind() {
        let (text, eols) = normalize("a\r\nb\nc\rd");
        assert_eq!(text, "a\nb\nc\nd");
        assert_eq!(eols, vec![Eol::CrLf, Eol::Lf, Eol::Cr]);
    }

    #[test]
    fn normalize_keeps_trailing_newline_as_empty_last_part() {
        let (text, eols) = normalize("a\r\n");
        assert_eq!(text, "a\n");
        assert_eq!(eols, vec![Eol::CrLf]);
        assert_eq!(text.split('\n').count() - 1, eols.len());
    }

    #[test]
    fn join_is_inverse_of_normalize() {
        for raw in ["", "a", "a\n", "a\r\nb\rc\n\n", "\r\n\r\n", "\r"] {
            let (text, eols) = normalize(raw);
            assert_eq!(join(&text, &eols, Eol::Lf), raw, "raw={raw:?}");
        }
    }

    #[test]
    fn from_label_is_inverse_of_label() {
        for e in [Eol::Lf, Eol::CrLf, Eol::Cr] {
            assert_eq!(Eol::from_label(e.label()), Some(e));
        }
        assert_eq!(Eol::from_label(" crlf "), Some(Eol::CrLf));
        assert_eq!(Eol::from_label("LFCR"), None);
    }

    #[test]
    fn dominant_prefers_count_then_first_seen() {
        assert_eq!(
            dominant(&[Eol::Lf, Eol::CrLf, Eol::CrLf], Eol::Lf),
            Eol::CrLf
        );
        assert_eq!(dominant(&[Eol::CrLf, Eol::Lf], Eol::Lf), Eol::CrLf);
        assert_eq!(dominant(&[], Eol::Cr), Eol::Cr);
    }

    #[test]
    fn remap_keeps_eol_of_unchanged_and_edited_lines_and_fills_inserted() {
        // 원본: a(CRLF) b(LF) c(CRLF) d
        let old = "a\nb\nc\nd";
        let eols = [Eol::CrLf, Eol::Lf, Eol::CrLf];
        // b를 고치고, c 뒤에 x를 끼워 넣음
        let new = "a\nB\nc\nx\nd";
        assert_eq!(
            remap(old, &eols, new, Eol::CrLf),
            vec![Eol::CrLf, Eol::Lf, Eol::CrLf, Eol::CrLf]
        );
        // 첫 줄 삭제
        assert_eq!(
            remap(old, &eols, "b\nc\nd", Eol::CrLf),
            vec![Eol::Lf, Eol::CrLf]
        );
    }

    #[test]
    fn remap_when_final_newline_is_added_uses_dominant() {
        assert_eq!(
            remap("a\nb", &[Eol::Lf], "a\nb\n", Eol::CrLf),
            vec![Eol::Lf, Eol::CrLf]
        );
    }
}
