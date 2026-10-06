//! 인코딩 감지·디코드·인코드.
//!
//! 감지 순서: BOM → UTF-8 검증 → chardetng(`kr` 힌트, UTF-8 후보 제외) → 후보를 차례로
//! *무손실* 디코드해 보고 처음 성공한 것을 채택. 모두 실패하면 손실 디코드 후 `lossy` 표시.
//!
//! 인코드는 `encode_from_utf8_without_replacement`를 써서 표현 불가 문자에서 멈추고
//! 그 문자의 위치를 돌려준다. 조용히 `?`나 `&#NNNN;`으로 바꾸지 않는다.

use chardetng::{EncodingDetector, Iso2022JpDetection, Utf8Detection};
use encoding_rs::{EncoderResult, Encoding, EUC_KR, UTF_16BE, UTF_16LE, UTF_8, WINDOWS_1252};
use serde::Serialize;

pub const UTF8_BOM: [u8; 3] = [0xEF, 0xBB, 0xBF];

/// 인코딩을 어떻게 정했는지.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectSource {
    /// BOM이 있었다 (UTF-8 / UTF-16LE / UTF-16BE).
    Bom,
    /// BOM은 없지만 전체가 유효한 UTF-8이었다.
    Utf8,
    /// chardetng 추정값이 무손실로 디코드됐다.
    Detected,
    /// 추정값은 실패했고 다른 후보(시스템 ANSI·EUC-KR·windows-1252)로 디코드했다.
    Fallback,
    /// 사용자가 인코딩을 직접 지정했다.
    Forced,
}

/// 디코드 결과 메타데이터.
#[derive(Clone, Copy, Debug)]
pub struct Decoded {
    pub encoding: &'static Encoding,
    pub bom: bool,
    pub source: DetectSource,
    /// 디코드 중 잘못된 시퀀스를 U+FFFD로 바꿨다. 이 상태로 편집 저장하면 손상이므로 막는다.
    pub lossy: bool,
}

/// 대상 인코딩으로 표현할 수 없는 문자.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, thiserror::Error)]
#[error("'{ch}' ({line}행 {col}열)은 {encoding}으로 표현할 수 없습니다")]
pub struct Unmappable {
    pub ch: char,
    /// 1부터 세는 행 (정규화 텍스트 기준이 아니라 원본 종결자 기준 — 둘은 같다).
    pub line: usize,
    /// 1부터 세는 열 (문자 단위).
    pub col: usize,
    pub encoding: &'static str,
}

/// 바이트를 감지·디코드한다. 반환 문자열은 **원본 종결자를 그대로** 담는다.
pub fn decode(bytes: &[u8]) -> (String, Decoded) {
    if let Some((enc, bom_len)) = Encoding::for_bom(bytes) {
        let (cow, had_errors) = enc.decode_without_bom_handling(&bytes[bom_len..]);
        return (
            cow.into_owned(),
            Decoded {
                encoding: enc,
                bom: true,
                source: DetectSource::Bom,
                lossy: had_errors,
            },
        );
    }

    if let Ok(s) = std::str::from_utf8(bytes) {
        return (
            s.to_owned(),
            Decoded {
                encoding: UTF_8,
                bom: false,
                source: DetectSource::Utf8,
                lossy: false,
            },
        );
    }

    let mut det = EncodingDetector::new(Iso2022JpDetection::Deny);
    det.feed(bytes, true);
    let guess = det.guess(Some(b"kr"), Utf8Detection::Deny);

    for enc in candidates(guess) {
        if let Some(cow) = enc.decode_without_bom_handling_and_without_replacement(bytes) {
            let source = if enc == guess {
                DetectSource::Detected
            } else {
                DetectSource::Fallback
            };
            return (
                cow.into_owned(),
                Decoded {
                    encoding: enc,
                    bom: false,
                    source,
                    lossy: false,
                },
            );
        }
    }

    let (cow, _) = guess.decode_without_bom_handling(bytes);
    (
        cow.into_owned(),
        Decoded {
            encoding: guess,
            bom: false,
            source: DetectSource::Fallback,
            lossy: true,
        },
    )
}

/// 사용자가 고른 인코딩으로 다시 해석한다 ("Encode in", 바이트 불변).
/// 해당 인코딩의 BOM이 앞에 있으면 벗겨내고 `bom = true`로 표시한다.
pub fn decode_as(bytes: &[u8], encoding: &'static Encoding) -> (String, Decoded) {
    let (body, bom) = match Encoding::for_bom(bytes) {
        Some((enc, len)) if enc == encoding => (&bytes[len..], true),
        _ => (bytes, false),
    };
    let (cow, had_errors) = encoding.decode_without_bom_handling(body);
    (
        cow.into_owned(),
        Decoded {
            encoding,
            bom,
            source: DetectSource::Forced,
            lossy: had_errors,
        },
    )
}

/// 추정값 뒤에 시스템 ANSI 코드페이지, EUC-KR, windows-1252를 붙인 후보 목록 (중복 제거).
fn candidates(guess: &'static Encoding) -> Vec<&'static Encoding> {
    let mut list: Vec<&'static Encoding> = vec![guess];
    for enc in [system_ansi_encoding(), Some(EUC_KR), Some(WINDOWS_1252)]
        .into_iter()
        .flatten()
    {
        if !list.contains(&enc) {
            list.push(enc);
        }
    }
    list
}

/// Windows 시스템 ANSI 코드페이지(예: 949)를 encoding_rs 인코딩으로. 다른 OS에서는 `None`.
pub fn system_ansi_encoding() -> Option<&'static Encoding> {
    #[cfg(windows)]
    {
        // SAFETY: GetACP는 인수 없이 현재 ANSI 코드페이지 번호를 돌려주는 순수 조회 함수다.
        let acp = unsafe { windows_sys::Win32::Globalization::GetACP() };
        return Encoding::for_label(format!("windows-{acp}").as_bytes());
    }
    #[allow(unreachable_code)]
    None
}

/// 텍스트(원본 종결자 포함)를 대상 인코딩으로 바꾼다. `bom`은 UTF-8·UTF-16에서만 의미 있다.
pub fn encode(text: &str, encoding: &'static Encoding, bom: bool) -> Result<Vec<u8>, Unmappable> {
    let mut out = Vec::with_capacity(text.len() + 3);

    if encoding == UTF_8 {
        if bom {
            out.extend_from_slice(&UTF8_BOM);
        }
        out.extend_from_slice(text.as_bytes());
        return Ok(out);
    }

    if encoding == UTF_16LE || encoding == UTF_16BE {
        let le = encoding == UTF_16LE;
        if bom {
            out.extend_from_slice(if le { &[0xFF, 0xFE] } else { &[0xFE, 0xFF] });
        }
        for unit in text.encode_utf16() {
            out.extend_from_slice(&if le {
                unit.to_le_bytes()
            } else {
                unit.to_be_bytes()
            });
        }
        return Ok(out);
    }

    let mut encoder = encoding.new_encoder();
    let cap = encoder
        .max_buffer_length_from_utf8_without_replacement(text.len())
        .expect("입력 길이가 usize를 넘지 않음");
    out.resize(cap, 0);
    let (result, read, written) =
        encoder.encode_from_utf8_without_replacement(text, &mut out, true);
    match result {
        EncoderResult::InputEmpty => {
            out.truncate(written);
            Ok(out)
        }
        EncoderResult::Unmappable(ch) => {
            let offset = read - ch.len_utf8();
            let (line, col) = line_col(text, offset);
            Err(Unmappable {
                ch,
                line,
                col,
                encoding: encoding.name(),
            })
        }
        EncoderResult::OutputFull => unreachable!("max_buffer_length가 보장한 버퍼가 모자람"),
    }
}

/// 바이트 오프셋의 (행, 열), 둘 다 1부터. 종결자는 `\r\n`·`\n`·`\r` 모두 인식.
fn line_col(text: &str, offset: usize) -> (usize, usize) {
    let head = &text[..offset];
    let mut line = 1;
    let mut col = 1;
    let mut prev_cr = false;
    for c in head.chars() {
        match c {
            '\r' => {
                line += 1;
                col = 1;
                prev_cr = true;
                continue;
            }
            '\n' => {
                if !prev_cr {
                    line += 1;
                }
                col = 1;
            }
            _ => col += 1,
        }
        prev_cr = false;
    }
    (line, col)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bom_is_detected_and_stripped() {
        let mut bytes = UTF8_BOM.to_vec();
        bytes.extend_from_slice("가\r\n".as_bytes());
        let (text, meta) = decode(&bytes);
        assert_eq!(text, "가\r\n");
        assert!(meta.bom);
        assert_eq!(meta.encoding, UTF_8);
        assert_eq!(meta.source, DetectSource::Bom);
        assert_eq!(encode(&text, UTF_8, true).unwrap(), bytes);
    }

    #[test]
    fn euc_kr_bytes_are_detected_without_loss() {
        let (bytes, _, had_errors) = EUC_KR.encode("# 인코딩 테스트\r\n한글 가나다\r\n");
        assert!(!had_errors);
        let (text, meta) = decode(&bytes);
        assert_eq!(meta.encoding, EUC_KR);
        assert!(!meta.lossy);
        assert_eq!(text, "# 인코딩 테스트\r\n한글 가나다\r\n");
        assert_eq!(encode(&text, EUC_KR, false).unwrap(), bytes.into_owned());
    }

    #[test]
    fn unmappable_reports_line_and_column() {
        let err = encode("가\r\n나다😀", EUC_KR, false).unwrap_err();
        assert_eq!(err.ch, '😀');
        assert_eq!((err.line, err.col), (2, 3));
        assert_eq!(err.encoding, "EUC-KR");
    }

    #[test]
    fn utf16le_roundtrip() {
        let mut bytes = vec![0xFF, 0xFE];
        for u in "한\r\nb".encode_utf16() {
            bytes.extend_from_slice(&u.to_le_bytes());
        }
        let (text, meta) = decode(&bytes);
        assert_eq!(text, "한\r\nb");
        assert_eq!(meta.encoding, UTF_16LE);
        assert!(meta.bom);
        assert_eq!(encode(&text, UTF_16LE, true).unwrap(), bytes);
    }

    #[test]
    fn decode_as_strips_matching_bom_only() {
        let mut bytes = UTF8_BOM.to_vec();
        bytes.extend_from_slice(b"abc");
        let (text, meta) = decode_as(&bytes, UTF_8);
        assert_eq!(text, "abc");
        assert!(meta.bom);
        let (text, meta) = decode_as(&bytes, WINDOWS_1252);
        assert_eq!(text.chars().count(), 6);
        assert!(!meta.bom);
    }
}
