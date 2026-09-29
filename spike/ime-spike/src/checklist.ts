/** 시나리오 ①–⑧ × 편집면 A/B/C 체크리스트. localStorage에 저장하고 마크다운으로 내보낸다. */

export const SCENARIOS: { no: string; title: string; hint: string; surfaces: string[] }[] = [
  { no: "①", title: "기존 텍스트 첫 클릭 후 즉시 한글 입력", hint: "tauri #15436 — 첫 글자 유실·영문 전환 없이 입력되는가", surfaces: ["A", "B", "C"] },
  { no: "②", title: "조합 중 버튼 클릭·Alt+Tab", hint: "#5475 — 조합 중이던 글자가 사라지거나 두 번 들어가지 않는가", surfaces: ["A", "B", "C"] },
  { no: "③", title: "조합 중 Enter·Ctrl+S", hint: "G18 — 줄이 한 줄만 늘고 Ctrl+S 배지가 한 번만 오르는가", surfaces: ["A", "B", "C"] },
  { no: "④", title: "자동 줄바꿈 경계에서 입력", hint: "G17 — 접히는 지점에서 자소 분리·커서 튐이 없는가", surfaces: ["A", "B", "C"] },
  { no: "⑤", title: "선택 + Backspace 후 입력", hint: "T20 — 지운 자리에 바로 조합이 시작되는가", surfaces: ["A", "B", "C"] },
  { no: "⑥", title: "YAML front matter 직후 문단", hint: "T20 — 첫 문단에서 정상 입력되는가", surfaces: ["A", "B", "C"] },
  { no: "⑦", title: "백틱·** 뒤 한글", hint: "#4251 — 마크 뒤에서 조합이 깨지지 않는가", surfaces: ["A", "B", "C"] },
  { no: "⑧", title: "데코 위젯 바로 앞에서 조합", hint: "C면 전용 — 인라인 위젯·블록 위젯 앞. 가드 ON/OFF, 캐럿 줄 노출 ON/OFF 각각", surfaces: ["C"] },
];

export type Verdict = "" | "pass" | "fail" | "partial";
export interface Entry {
  verdict: Verdict;
  note: string;
}
export type Results = Record<string, Entry>; // key: `${no}-${surface}`

const KEY = "ime-spike-results-v1";

export function loadResults(): Results {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveResults(r: Results) {
  localStorage.setItem(KEY, JSON.stringify(r));
}

export function renderChecklist(root: HTMLElement, results: Results, onChange: () => void) {
  root.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = "체크리스트 (통과 / 부분 / 실패 — 메모는 증상)";
  root.appendChild(h);
  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>#</th><th>시나리오</th><th>A</th><th>B</th><th>C</th></tr></thead>`;
  const tbody = document.createElement("tbody");
  for (const s of SCENARIOS) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.no}</td><td title="${s.hint}">${s.title}<br><small>${s.hint}</small></td>`;
    for (const surface of ["A", "B", "C"]) {
      const td = document.createElement("td");
      if (!s.surfaces.includes(surface)) {
        td.textContent = "—";
        td.className = "na";
      } else {
        const key = `${s.no}-${surface}`;
        const entry = (results[key] ??= { verdict: "", note: "" });
        const sel = document.createElement("select");
        sel.innerHTML = `<option value="">미실시</option><option value="pass">통과</option><option value="partial">부분</option><option value="fail">실패</option>`;
        sel.value = entry.verdict;
        sel.className = entry.verdict;
        sel.addEventListener("change", () => {
          entry.verdict = sel.value as Verdict;
          sel.className = entry.verdict;
          onChange();
        });
        const note = document.createElement("input");
        note.placeholder = "증상";
        note.value = entry.note;
        note.addEventListener("input", () => {
          entry.note = note.value;
          onChange();
        });
        td.append(sel, note);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  root.appendChild(table);
}

const LABEL: Record<Verdict, string> = { "": "—", pass: "통과", partial: "부분", fail: "실패" };

export function resultsToMarkdown(results: Results, env: Record<string, unknown>, runLabel: string): string {
  const lines: string[] = [];
  lines.push(`## IME 스파이크 결과 — ${runLabel}`);
  lines.push("");
  lines.push(`- 기록: ${new Date().toISOString()}`);
  for (const [k, v] of Object.entries(env)) lines.push(`- ${k}: ${String(v)}`);
  lines.push("");
  lines.push("| # | 시나리오 | A textarea | B CM6 plain | C CM6 + 데코 |");
  lines.push("|---|---|---|---|---|");
  for (const s of SCENARIOS) {
    const cell = (surface: string) => {
      if (!s.surfaces.includes(surface)) return "—";
      const e = results[`${s.no}-${surface}`];
      if (!e || !e.verdict) return "미실시";
      return e.note ? `${LABEL[e.verdict]} (${e.note.replace(/\|/g, "\\|")})` : LABEL[e.verdict];
    };
    lines.push(`| ${s.no} | ${s.title} | ${cell("A")} | ${cell("B")} | ${cell("C")} |`);
  }
  const b = SCENARIOS.filter((s) => s.surfaces.includes("B")).map((s) => results[`${s.no}-B`]?.verdict ?? "");
  const gate = b.every((v) => v === "pass") ? "**통과** → 스택 판정 ADOPT" : b.some((v) => v === "fail") ? "**실패** → G6 플래그 → G7 EditContext → Electron 순 재판정" : "미완 (B면 ①–⑦ 전부 통과가 게이트)";
  lines.push("");
  lines.push(`게이트(B CM6 plain ①–⑦): ${gate}`);
  return lines.join("\n") + "\n";
}
