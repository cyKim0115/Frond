//! 원자적 파일 쓰기.
//!
//! 같은 폴더에 임시 파일을 완전히 쓴 뒤 `ReplaceFileW`로 바꿔치기한다. 도중에 죽어도 원본은
//! 온전하다. `ReplaceFileW`가 실패하면(권한·특수 파일시스템) 제자리 쓰기로 물러나고 그 사실을
//! [`WriteMethod::InPlace`]로 알린다.

use serde::Serialize;
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

/// 실제로 어떤 방식으로 썼는지.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum WriteMethod {
    /// 대상이 없어서 새로 만들었다.
    Created,
    /// 임시 파일을 쓰고 원자적으로 바꿔치기했다.
    Replaced,
    /// 바꿔치기가 실패해 제자리에 덮어썼다 (원자성 없음).
    InPlace,
}

/// `path`에 `bytes`를 원자적으로 쓴다.
pub fn write_atomic(path: &Path, bytes: &[u8]) -> io::Result<WriteMethod> {
    if !path.exists() {
        fs::write(path, bytes)?;
        return Ok(WriteMethod::Created);
    }

    let tmp = temp_path(path)?;
    let written = (|| -> io::Result<()> {
        let mut f = File::create(&tmp)?;
        f.write_all(bytes)?;
        f.sync_all()
    })();
    if let Err(e) = written {
        let _ = fs::remove_file(&tmp);
        return Err(e);
    }

    match replace_file(path, &tmp) {
        Ok(()) => Ok(WriteMethod::Replaced),
        Err(_) => {
            let _ = fs::remove_file(&tmp);
            fs::write(path, bytes)?;
            Ok(WriteMethod::InPlace)
        }
    }
}

fn temp_path(path: &Path) -> io::Result<PathBuf> {
    let parent = path
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let name = path
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "파일 이름이 없음"))?
        .to_string_lossy();
    Ok(parent.join(format!(".{name}.mdeditor-{}.tmp", std::process::id())))
}

#[cfg(windows)]
fn replace_file(target: &Path, replacement: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        ReplaceFileW, REPLACEFILE_IGNORE_ACL_ERRORS, REPLACEFILE_IGNORE_MERGE_ERRORS,
    };

    fn wide(p: &Path) -> Vec<u16> {
        p.as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }
    let target_w = wide(target);
    let replacement_w = wide(replacement);
    // SAFETY: 두 경로는 NUL 종료 UTF-16이며 호출 동안 살아 있다. 백업·예약 인수는 null 허용.
    let ok = unsafe {
        ReplaceFileW(
            target_w.as_ptr(),
            replacement_w.as_ptr(),
            std::ptr::null(),
            REPLACEFILE_IGNORE_MERGE_ERRORS | REPLACEFILE_IGNORE_ACL_ERRORS,
            std::ptr::null(),
            std::ptr::null(),
        )
    };
    if ok == 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(windows))]
fn replace_file(target: &Path, replacement: &Path) -> io::Result<()> {
    fs::rename(replacement, target)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_then_replaces_and_leaves_no_temp_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        assert_eq!(write_atomic(&path, b"one").unwrap(), WriteMethod::Created);
        assert_eq!(write_atomic(&path, b"two").unwrap(), WriteMethod::Replaced);
        assert_eq!(fs::read(&path).unwrap(), b"two");
        let leftovers: Vec<_> = fs::read_dir(dir.path()).unwrap().flatten().collect();
        assert_eq!(leftovers.len(), 1, "임시 파일이 남았다: {leftovers:?}");
    }
}
