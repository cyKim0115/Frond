//! 초안 백업 (로드맵 2-4) — 저장하지 않은 편집을 `%APPDATA%\Frond\drafts\`(appdata.rs)에 주기적으로 남긴다.
//!
//! 문서 경로(소문자)의 blake3 앞 32자를 파일 이름으로 쓰는 JSON 한 개가 문서 하나다. 자동 저장이 아니라
//! 강제 종료·정전 뒤 복구용이다: 문서를 다시 열 때 초안이 디스크 내용과 다르면 프런트가 복구를 제안한다.
//! 저장·변경 버리기에 성공하면 지운다.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Serialize, Deserialize)]
pub struct Draft {
    pub path: String,
    pub text: String,
    /// 초안을 만들 때 편집하던 디스크 내용의 해시 — 그 뒤 파일이 바뀌었는지 알려 준다
    pub base_hash: String,
    /// 유닉스 밀리초
    pub saved_at: u64,
}

fn drafts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(crate::appdata::root(app)?.join("drafts"))
}

fn draft_file(app: &AppHandle, path: &str) -> Result<PathBuf, String> {
    let key = blake3::hash(path.to_lowercase().as_bytes()).to_hex();
    Ok(drafts_dir(app)?.join(format!("{}.json", &key[..32])))
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn write_draft(app: AppHandle, path: String, text: String, base_hash: String) -> Result<u64, String> {
    let file = draft_file(&app, &path)?;
    std::fs::create_dir_all(file.parent().expect("drafts dir")).map_err(|e| e.to_string())?;
    let saved_at = now_ms();
    let json = serde_json::to_vec(&Draft { path, text, base_hash, saved_at }).map_err(|e| e.to_string())?;
    frond_core::write_atomic(&file, &json).map_err(|e| e.to_string())?;
    Ok(saved_at)
}

/// 없거나 깨졌으면 `None`
#[tauri::command]
pub fn read_draft(app: AppHandle, path: String) -> Result<Option<Draft>, String> {
    let file = draft_file(&app, &path)?;
    let Ok(bytes) = std::fs::read(&file) else { return Ok(None) };
    // 이름은 해시라 드물게 겹칠 수 있다 — 안에 적힌 경로가 같을 때만 그 문서의 초안이다
    Ok(serde_json::from_slice::<Draft>(&bytes).ok().filter(|d| d.path.to_lowercase() == path.to_lowercase()))
}

#[tauri::command]
pub fn delete_draft(app: AppHandle, path: String) -> Result<(), String> {
    let file = draft_file(&app, &path)?;
    match std::fs::remove_file(&file) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Serialize)]
pub struct DraftMeta {
    pub path: String,
    pub saved_at: u64,
}

/// 남아 있는 초안 목록(최근 것부터) — 앱 시작 시 "복구할 초안" 안내용
#[tauri::command]
pub fn list_drafts(app: AppHandle) -> Result<Vec<DraftMeta>, String> {
    let dir = drafts_dir(&app)?;
    let Ok(entries) = std::fs::read_dir(&dir) else { return Ok(Vec::new()) };
    let mut list: Vec<DraftMeta> = entries
        .filter_map(Result::ok)
        .filter_map(|e| std::fs::read(e.path()).ok())
        .filter_map(|bytes| serde_json::from_slice::<Draft>(&bytes).ok())
        .map(|d| DraftMeta { path: d.path, saved_at: d.saved_at })
        .collect();
    list.sort_by(|a, b| b.saved_at.cmp(&a.saved_at));
    Ok(list)
}
