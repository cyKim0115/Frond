//! 외부 변경 감지 (로드맵 1-5) — notify-debouncer-full 2 s + 내용 해시.
//!
//! 파일이 아니라 **문서 폴더를 비재귀로** 감시한다. 다른 편집기(우리 코어 포함)가 임시 파일 +
//! 교체로 저장하면 파일 자체의 감시 핸들이 끊기기 때문이다. 이벤트가 오면 파일을 다시 읽어
//! blake3 해시가 바뀐 경우에만 `file-changed`를 보낸다 (mtime만 바뀐 저장·자기 저장은 무시).
//! 탭(로드맵 3-1)마다 문서 하나씩 감시한다 — 경로(대소문자 무시)를 키로 감시 핸들을 둔다.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use notify_debouncer_full::notify::{EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

/// 감시 중인 문서들 — 키는 [`path_key`]
pub struct WatchState(pub Mutex<HashMap<String, Active>>);

/// 살아 있는 감시 핸들. 드롭되면 감시가 끝난다.
pub struct Active {
    _debouncer: Debouncer<RecommendedWatcher, RecommendedCache>,
}

#[derive(Clone, Serialize)]
pub struct FileChanged {
    pub path: String,
    pub hash: String,
}

fn hash_hex(bytes: &[u8]) -> String {
    blake3::hash(bytes).to_hex().to_string()
}

/// Windows 경로는 대소문자를 구분하지 않으므로 소문자로 비교한다.
fn same_path(a: &Path, b: &Path) -> bool {
    path_key(a) == path_key(b)
}

fn path_key(path: &Path) -> String {
    path.to_string_lossy().to_lowercase()
}

/// `path`의 폴더를 감시한다. `hash`는 지금 화면에 있는 내용의 blake3(hex). 같은 문서의 이전 감시는 바꾼다.
#[tauri::command]
pub fn watch_document(
    app: AppHandle,
    state: State<'_, WatchState>,
    path: String,
    hash: String,
) -> Result<(), String> {
    let path = PathBuf::from(path);
    let dir = path
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .ok_or_else(|| "문서 폴더를 알 수 없음".to_owned())?
        .to_path_buf();

    let target = path.clone();
    let last = Arc::new(Mutex::new(hash));
    let handle = app.clone();

    let mut debouncer = new_debouncer(
        Duration::from_secs(2),
        None,
        move |result: DebounceEventResult| {
            let events = match result {
                Ok(events) => events,
                Err(_) => return,
            };
            let touched = events.iter().any(|event| {
                matches!(
                    event.kind,
                    EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_) | EventKind::Any
                ) && event.paths.iter().any(|p| same_path(p, &target))
            });
            if !touched {
                return;
            }
            let path_str = target.to_string_lossy().into_owned();
            match std::fs::read(&target) {
                Ok(bytes) => {
                    let hash = hash_hex(&bytes);
                    let mut guard = last.lock().expect("watch hash lock");
                    if *guard != hash {
                        *guard = hash.clone();
                        #[cfg(debug_assertions)]
                        eprintln!("[watch] file-changed {path_str} {hash}");
                        let _ = handle.emit("file-changed", FileChanged { path: path_str, hash });
                    }
                }
                Err(_) => {
                    // 같은 내용으로 다시 생겨도 `file-changed`가 가도록 마지막 해시를 비운다 — 프런트가 사라짐 배너를 거둔다
                    last.lock().expect("watch hash lock").clear();
                    #[cfg(debug_assertions)]
                    eprintln!("[watch] file-missing {path_str}");
                    let _ = handle.emit("file-missing", path_str);
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watch(&dir, RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    state
        .0
        .lock()
        .expect("watch state lock")
        .insert(path_key(&path), Active { _debouncer: debouncer });
    Ok(())
}

/// `path` 문서의 감시를 끊는다 (탭 닫기·다른 이름으로 저장). `path`가 없으면 모두 끊는다
#[tauri::command]
pub fn unwatch_document(state: State<'_, WatchState>, path: Option<String>) {
    let mut map = state.0.lock().expect("watch state lock");
    match path {
        Some(p) => {
            map.remove(&path_key(Path::new(&p)));
        }
        None => map.clear(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_path_ignores_case() {
        assert!(same_path(Path::new(r"C:\Docs\A.md"), Path::new(r"c:\docs\a.md")));
        assert!(!same_path(Path::new(r"C:\Docs\A.md"), Path::new(r"C:\Docs\B.md")));
    }

    #[test]
    fn path_key_matches_for_case_variants() {
        assert_eq!(path_key(Path::new(r"C:\Docs\노트.md")), path_key(Path::new(r"c:\DOCS\노트.MD")));
    }
}
