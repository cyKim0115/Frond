#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn ready(window: tauri::Window) {
    let _ = window.set_title("READY");
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ready])
        .run(tauri::generate_context!())
        .expect("error while running tauri-hello");
}
