//! 폴더 트리 (로드맵 3-2) — 탐색 영역 '폴더' 탭. 폴더 하나의 목록(하위 폴더·마크다운 문서만)과 트리 감시.
//!
//! 목록은 펼친 폴더만 그때그때 읽는다(지연). 감시는 루트를 **재귀로** 걸고, 이름이 생기거나 사라진 폴더만
//! `tree-changed`로 알린다 — 문서 내용 변경은 문서 감시(watch.rs)가 따로 맡는다. 큰 폴더(사용자 폴더 전체 등)를
//! 루트로 잡아도 시작이 느려지지 않게 파일 ID 캐시(하위 전체를 훑는다)는 쓰지 않는다(`NoCache`).

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use notify_debouncer_full::notify::event::ModifyKind;
use notify_debouncer_full::notify::{Config, EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer_opt, DebounceEventResult, Debouncer, NoCache};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

/// 트리에 보이는 문서 확장자 (파일 연결과 같은 것 + 흔한 변형)
const DOC_EXTS: [&str; 6] = ["md", "markdown", "mdown", "mkd", "mkdn", "mdwn"];
/// 열어도 마크다운이 거의 없고 아주 큰 폴더
const SKIP_DIRS: [&str; 1] = ["node_modules"];

#[derive(Debug, Serialize, PartialEq)]
pub struct TreeEntry {
    pub name: String,
    pub path: String,
    pub dir: bool,
}

pub struct TreeWatch(pub Mutex<Option<Debouncer<RecommendedWatcher, NoCache>>>);

pub fn is_doc(name: &str) -> bool {
    Path::new(name)
        .extension()
        .map(|e| DOC_EXTS.contains(&e.to_string_lossy().to_lowercase().as_str()))
        .unwrap_or(false)
}

/// 점으로 시작하는 이름(`.git`·`.claude`)과 Windows 숨김 속성은 트리에 보이지 않는다
fn is_hidden(name: &str, meta: &std::fs::Metadata) -> bool {
    if name.starts_with('.') {
        return true;
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
        if meta.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0 {
            return true;
        }
    }
    #[cfg(not(windows))]
    let _ = meta;
    false
}

fn strip_verbatim(path: &Path) -> String {
    let s = path.to_string_lossy();
    s.strip_prefix(r"\\?\").unwrap_or(&s).to_owned()
}

/// 폴더 하나의 목록 — 하위 폴더 먼저, 그다음 문서. 각각 이름순(대소문자 무시)
pub fn read_entries(dir: &Path) -> std::io::Result<Vec<TreeEntry>> {
    let mut dirs = Vec::new();
    let mut docs = Vec::new();
    for entry in std::fs::read_dir(dir)? {
        let Ok(entry) = entry else { continue };
        let name = entry.file_name().to_string_lossy().into_owned();
        let Ok(meta) = entry.metadata() else { continue };
        if is_hidden(&name, &meta) {
            continue;
        }
        let path = strip_verbatim(&entry.path());
        if meta.is_dir() {
            if !SKIP_DIRS.iter().any(|s| s.eq_ignore_ascii_case(&name)) {
                dirs.push(TreeEntry { name, path, dir: true });
            }
        } else if meta.is_file() && is_doc(&name) {
            docs.push(TreeEntry { name, path, dir: false });
        }
    }
    let key = |e: &TreeEntry| e.name.to_lowercase();
    dirs.sort_by_key(key);
    docs.sort_by_key(key);
    dirs.extend(docs);
    Ok(dirs)
}

#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<TreeEntry>, String> {
    read_entries(Path::new(&path)).map_err(|e| format!("{path}: {e}"))
}

/// 감시 이벤트에서 목록이 바뀐 폴더들 — 이름이 생기거나 사라지거나 바뀐 항목의 부모. 내용·속성만 바뀐 것은 뺀다
pub fn changed_dirs<'a>(events: impl IntoIterator<Item = (&'a EventKind, &'a [PathBuf])>) -> BTreeSet<String> {
    let mut dirs = BTreeSet::new();
    for (kind, paths) in events {
        let structural = match kind {
            EventKind::Create(_) | EventKind::Remove(_) | EventKind::Any => true,
            EventKind::Modify(ModifyKind::Name(_)) | EventKind::Modify(ModifyKind::Any) => true,
            _ => false,
        };
        if !structural {
            continue;
        }
        for path in paths {
            if let Some(parent) = path.parent() {
                dirs.insert(strip_verbatim(parent));
            }
        }
    }
    dirs
}

/// `root`를 재귀로 감시한다. 이전 트리 감시는 끊는다
#[tauri::command]
pub fn watch_tree(app: AppHandle, state: State<'_, TreeWatch>, root: String) -> Result<(), String> {
    let handle = app.clone();
    let mut debouncer = new_debouncer_opt::<_, RecommendedWatcher, NoCache>(
        Duration::from_millis(400),
        None,
        move |result: DebounceEventResult| {
            let Ok(events) = result else { return };
            let dirs = changed_dirs(events.iter().map(|e| (&e.event.kind, e.event.paths.as_slice())));
            if !dirs.is_empty() {
                let _ = handle.emit("tree-changed", dirs.into_iter().collect::<Vec<_>>());
            }
        },
        NoCache,
        Config::default(),
    )
    .map_err(|e| e.to_string())?;
    debouncer
        .watch(Path::new(&root), RecursiveMode::Recursive)
        .map_err(|e| format!("{root}: {e}"))?;
    *state.0.lock().expect("tree watch lock") = Some(debouncer);
    Ok(())
}

#[tauri::command]
pub fn unwatch_tree(state: State<'_, TreeWatch>) {
    *state.0.lock().expect("tree watch lock") = None;
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify_debouncer_full::notify::event::{CreateKind, DataChange, RemoveKind, RenameMode};

    #[test]
    fn doc_extensions_ignore_case() {
        assert!(is_doc("a.md"));
        assert!(is_doc("노트.MARKDOWN"));
        assert!(is_doc("x.mkd"));
        assert!(!is_doc("a.txt"));
        assert!(!is_doc("md"));
    }

    #[test]
    fn lists_dirs_then_docs_and_skips_hidden() {
        let root = std::env::temp_dir().join(format!("mdeditor-tree-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        for dir in ["b폴더", "A폴더", ".git", "node_modules"] {
            std::fs::create_dir_all(root.join(dir)).unwrap();
        }
        for file in ["z.md", "가.markdown", "image.png", ".hidden.md", "B.MD"] {
            std::fs::write(root.join(file), b"x").unwrap();
        }
        let names: Vec<(String, bool)> = read_entries(&root).unwrap().into_iter().map(|e| (e.name, e.dir)).collect();
        let _ = std::fs::remove_dir_all(&root);
        assert_eq!(
            names,
            vec![
                ("A폴더".into(), true),
                ("b폴더".into(), true),
                ("B.MD".into(), false),
                ("z.md".into(), false),
                ("가.markdown".into(), false),
            ]
        );
    }

    #[test]
    fn only_structural_events_mark_parent_dirs() {
        let a = vec![PathBuf::from(r"C:\r\sub\new.md")];
        let b = vec![PathBuf::from(r"C:\r\old.md"), PathBuf::from(r"C:\r\other\moved.md")];
        let c = vec![PathBuf::from(r"C:\r\edited.md")];
        let create = EventKind::Create(CreateKind::File);
        let rename = EventKind::Modify(ModifyKind::Name(RenameMode::Both));
        let data = EventKind::Modify(ModifyKind::Data(DataChange::Content));
        let remove = EventKind::Remove(RemoveKind::File);
        let dirs = changed_dirs([(&create, a.as_slice()), (&rename, b.as_slice()), (&data, c.as_slice()), (&remove, c.as_slice())]);
        assert_eq!(dirs.into_iter().collect::<Vec<_>>(), vec![r"C:\r".to_owned(), r"C:\r\other".to_owned(), r"C:\r\sub".to_owned()]);
    }
}
