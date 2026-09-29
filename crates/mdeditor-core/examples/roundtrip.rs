//! 폴더 안 `.md`를 전부 열어 **편집 없이 제자리 저장**하고 바이트가 같은지 확인한다.
//!
//! ```text
//! cargo run --example roundtrip -- ../../samples/raw
//! git status --short samples/raw   # 아무것도 안 나와야 한다
//! ```

use mdeditor_core::FileDocument;
use std::{env, fs, process};

fn main() {
    let dir = env::args()
        .nth(1)
        .unwrap_or_else(|| "../../samples/raw".to_owned());
    let mut entries: Vec<_> = fs::read_dir(&dir)
        .unwrap_or_else(|e| {
            eprintln!("{dir}: {e}");
            process::exit(2)
        })
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "md"))
        .collect();
    entries.sort();

    println!(
        "{:<22} {:<9} {:<4} {:<5} {:<5} {:<5} {:>6}  결과",
        "파일", "인코딩", "BOM", "EOL", "섞임", "끝\\n", "바이트"
    );
    let mut failed = 0;
    for path in entries {
        let before = fs::read(&path).unwrap();
        let mut doc = FileDocument::open(&path).unwrap();
        let text = doc.text().to_owned();
        let info = doc.info();
        let result = match doc.save_to(&path, &text) {
            Ok(method) => {
                let after = fs::read(&path).unwrap();
                if after == before {
                    format!("OK ({method:?})")
                } else {
                    failed += 1;
                    format!("DIFF! {} -> {} bytes", before.len(), after.len())
                }
            }
            Err(e) => {
                failed += 1;
                format!("ERR {e}")
            }
        };
        println!(
            "{:<22} {:<9} {:<4} {:<5} {:<5} {:<5} {:>6}  {}",
            path.file_name().unwrap().to_string_lossy(),
            info.encoding,
            if info.bom { "yes" } else { "-" },
            info.eol,
            if info.mixed_eol { "yes" } else { "-" },
            if info.final_newline { "yes" } else { "no" },
            info.byte_len,
            result
        );
    }
    if failed > 0 {
        eprintln!("{failed}개 실패");
        process::exit(1);
    }
}
