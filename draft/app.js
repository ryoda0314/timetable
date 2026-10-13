// デザイン案: 週の時間割表はそのままに、見た目を整理したもの。日本語と韓国語を切り替えられる
const COLORS = ["#2f6fd6", "#d9483b", "#1f9d61", "#e07b14", "#8b4fd6", "#0f97a8", "#d0427f", "#6f8f12", "#b0662a", "#4955d1", "#c49a00", "#5c6b7a"];
const STORAGE_KEY = "timetable.tab";
const LANG_KEY = "timetable.lang";

const TEXT = {
  ja: {
    title: "時間割",
    days: ["月", "火", "水", "木", "金"],
    now: "いま",
    before: "授業前",
    rest: "休み時間",
    free: "空き",
    next: "次",
    done: "今日の授業は終わり",
    none: "今日は授業なし",
    left: (d) => `あと${d}`,
    from: (t) => `${t}〜`,
    duration: (h, m) => (h ? (m ? `${h}時間${m}分` : `${h}時間`) : `${m}分`),
    slots: (list) => list.join("・") + "限",
    slot: (day, range) => `${day}${range}`,
    list: "履修科目",
    other: "한국어",
  },
  ko: {
    title: "시간표",
    days: ["월", "화", "수", "목", "금"],
    now: "지금",
    before: "수업 전",
    rest: "쉬는 시간",
    free: "공강",
    next: "다음",
    done: "오늘 수업 끝",
    none: "오늘은 수업 없음",
    left: (d) => `${d} 남음`,
    from: (t) => `${t}~`,
    duration: (h, m) => (h ? (m ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`),
    slots: (list) => list.join(", ") + "교시",
    slot: (day, range) => `${day} ${range}`,
    list: "수강 과목",
    other: "日本語",
  },
};

// URL の ?lang=ko → 前回選んだ言語 → 端末の言語 の順で決める
function loadLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q in TEXT) return q;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved in TEXT) return saved;
  } catch (e) {}
  return (navigator.language || "").toLowerCase().startsWith("ko") ? "ko" : "ja";
}

let lang = loadLang();
const T = () => TEXT[lang];

// data.js の ko があれば韓国語、なければ日本語のまま
function tr(obj, key) {
  return lang === "ko" && obj.ko && obj.ko[key] ? obj.ko[key] : obj[key];
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 単語の切れ目でだけ改行できるように <wbr> を入れる（未対応ブラウザではそのまま）
const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("ja", { granularity: "word" }) : null;
// 1文字の語（学・法・室など）と数字は前の語にくっつけ、「・」の後ろで切る。
// カタカナは短い切れ端（メカ|トロ）だけつなぎ、長い語どうし（メカトロ|デザイン）は分けておく
function units(s) {
  const out = [];
  for (const { segment: seg } of segmenter.segment(s)) {
    const prev = out[out.length - 1];
    const kana = /^[ァ-ヶー]+$/.test(seg) && prev !== undefined && /[ァ-ヶー]$/.test(prev) && (seg.length <= 2 || prev.length <= 2);
    const glue = prev !== undefined && !prev.endsWith("・") && (
      seg === "・" || seg.length === 1 || /^[0-9]+$/.test(seg) || kana
    );
    if (glue) out[out.length - 1] = prev + seg;
    else out.push(seg);
  }
  return out;
}
// 韓国語は分かち書きのスペースで改行されるので、「·」の後ろだけ切れるようにする
function breakable(s) {
  if (lang === "ko") return esc(s).replace(/·/g, "·<wbr>");
  if (!segmenter) return esc(s);
  return units(s).map(esc).join("<wbr>");
}

// コマの中では末尾の（…）と「講義室」「大会議室」を省く。履修科目リストには全部出す
function shortName(name) {
  return name.replace(/\s*[（(][^（）()]*[）)]$/, "");
}
function shortRoom(room) {
  return room.replace(/\s*(講義室|大会議室|강의실|대회의실)$/, "");
}

// 確認用: URL に ?t=2026-10-08T14:05 を付けるとその時刻として表示する
function now() {
  const t = new URLSearchParams(location.search).get("t");
  const d = t ? new Date(t) : new Date();
  return isNaN(d) ? new Date() : d;
}
function toMin(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
function duration(min) {
  return T().duration(Math.floor(min / 60), min % 60);
}

// その時刻に受けている授業、なければ今日の次の授業
function statusAt(person, date) {
  const day = date.getDay() - 1;
  const m = date.getHours() * 60 + date.getMinutes();
  const today = person.classes
    .filter((c) => c.day === day)
    .map((c) => ({ c, start: person.periods[c.from - 1].start, end: person.periods[c.to - 1].end }))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const current = today.find((x) => toMin(x.start) <= m && m < toMin(x.end));
  if (current) return { kind: "in", ...current, left: toMin(current.end) - m };
  const next = today.find((x) => toMin(x.start) > m);
  if (next) return { kind: today.some((x) => toMin(x.end) <= m) ? "break" : "before", ...next, until: toMin(next.start) - m };
  return { kind: today.length ? "done" : "none" };
}

function loadTab() {
  const fromHash = location.hash.slice(1);
  if (PEOPLE.some((p) => p.id === fromHash)) return fromHash;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (PEOPLE.some((p) => p.id === saved)) return saved;
  } catch (e) {}
  return PEOPLE[0].id;
}

function saveTab(id) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
}

// 同じ科目には同じ色（言語を切り替えても色は変わらない）
function colorMap(person) {
  const map = new Map();
  for (const c of person.classes) {
    if (!map.has(c.name)) map.set(c.name, COLORS[map.size % COLORS.length]);
  }
  return map;
}

function slotText(c) {
  const range = c.from === c.to ? `${c.from}` : `${c.from}-${c.to}`;
  return T().slot(T().days[c.day], range);
}

function renderStatic() {
  document.documentElement.lang = lang;
  document.title = T().title;
  document.getElementById("title").textContent = T().title;
  document.getElementById("list-title").textContent = T().list;
  document.getElementById("grid").setAttribute("aria-label", T().title);
  document.getElementById("lang").textContent = T().other;
}

function renderTabs(activeId) {
  document.getElementById("tabs").innerHTML = PEOPLE.map((p) =>
    `<button role="tab" data-id="${p.id}" aria-selected="${p.id === activeId}">${esc(tr(p, "label"))}</button>`
  ).join("");
}

function renderNow() {
  const date = now();
  const hm = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  const rows = PEOPLE.map((p) => {
    const s = statusAt(p, date);
    const color = s.c ? colorMap(p).get(s.c.name) : "var(--faint)";
    let what, when = "";
    if (s.kind === "in") {
      what = `<b>${esc(shortName(tr(s.c, "name")))}</b><span class="nw"><span class="sep">·</span>${esc(tr(s.c, "room"))}</span>`;
      when = T().left(duration(s.left));
    } else if (s.kind === "break" || s.kind === "before") {
      const label = s.kind === "before" ? T().before : s.until <= 20 ? T().rest : T().free;
      what = `<span class="dim">${label}</span><span class="sep">·</span>${T().next} <b>${esc(shortName(tr(s.c, "name")))}</b>`;
      when = T().from(s.start);
    } else {
      what = `<span class="dim">${s.kind === "done" ? T().done : T().none}</span>`;
    }
    return `<button class="now-row${s.kind === "in" ? " in" : ""}" data-id="${p.id}" style="--c:${color}">`
      + `<span class="who">${esc(tr(p, "label"))}</span><span class="what">${what}</span><span class="when">${when}</span>`
      + `</button>`;
  }).join("");
  document.getElementById("now").innerHTML = `<div class="now-head"><span>${T().now}</span><time>${hm}</time></div>${rows}`;
}

function renderGrid(person, colors) {
  const grid = document.getElementById("grid");
  const days = T().days;
  const date = now();
  const today = date.getDay() - 1; // 月=0
  const isWeekday = today >= 0 && today < days.length;
  const m = date.getHours() * 60 + date.getMinutes();
  const current = statusAt(person, date);
  const n = person.periods.length;
  grid.style.gridTemplateRows = `28px repeat(${n}, minmax(88px, auto))`;

  let html = "";
  if (isWeekday) html += `<div class="today-col" style="grid-column:${today + 2};grid-row:1 / ${n + 2}"></div>`;
  days.forEach((d, i) => {
    html += `<div class="day${i === today ? " today" : ""}" style="grid-column:${i + 2};grid-row:1"><span>${d}</span></div>`;
  });

  person.periods.forEach((p) => {
    const cur = isWeekday && toMin(p.start) <= m && m < toMin(p.end);
    html += `<div class="period${cur ? " cur" : ""}" style="grid-column:1;grid-row:${p.no + 1}"><b>${p.no}</b><span>${p.start}</span><span>${p.end}</span></div>`;
  });

  const filled = days.map(() => new Array(n + 1).fill(false));
  for (const c of person.classes) {
    for (let k = c.from; k <= c.to; k++) filled[c.day][k] = true;
    const cls = (c.to > c.from ? " long" : "") + (current.kind === "in" && current.c === c ? " current" : "");
    html += `<div class="card${cls}" style="grid-column:${c.day + 2};grid-row:${c.from + 1} / ${c.to + 2};--c:${colors.get(c.name)}">`
      + `<span class="name">${breakable(shortName(tr(c, "name")))}</span>`
      + `<span class="room">${breakable(shortRoom(tr(c, "room")))}</span>`
      + `</div>`;
  }

  days.forEach((_, d) => {
    for (let k = 1; k <= n; k++) {
      if (!filled[d][k]) html += `<div class="slot${d === today ? " in-today" : ""}" style="grid-column:${d + 2};grid-row:${k + 1}"></div>`;
    }
  });

  grid.innerHTML = html;
}

function renderList(person, colors) {
  // 同じ科目の複数コマを1行にまとめる
  const groups = new Map();
  for (const c of person.classes) {
    const key = c.code + c.name;
    if (!groups.has(key)) groups.set(key, { c, slots: [] });
    groups.get(key).slots.push(slotText(c));
  }
  document.getElementById("list").innerHTML = [...groups.values()].map(({ c, slots }) => {
    const detail = [T().slots(slots), tr(c, "room"), tr(c, "teacher"), c.code].filter(Boolean).map(esc).join(" · ");
    return `<li style="--c:${colors.get(c.name)}"><span class="dot"></span><span class="li-main"><span class="li-name">${esc(tr(c, "name"))}</span><span class="li-sub">${detail}</span></span></li>`;
  }).join("");
}

function render(id) {
  const person = PEOPLE.find((p) => p.id === id);
  const colors = colorMap(person);
  renderStatic();
  renderTabs(id);
  renderNow();
  document.getElementById("meta").textContent = `${tr(person, "school")} · ${tr(person, "term")}`;
  renderGrid(person, colors);
  renderList(person, colors);
}

let activeId = loadTab();

function select(e) {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  activeId = btn.dataset.id;
  saveTab(activeId);
  history.replaceState(null, "", location.search + "#" + activeId);
  render(activeId);
}
document.getElementById("tabs").addEventListener("click", select);
document.getElementById("now").addEventListener("click", select);

document.getElementById("lang").addEventListener("click", () => {
  lang = lang === "ja" ? "ko" : "ja";
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  // URL の ?lang= は外しておく（残っていると次に開いたとき選んだ言語より優先されるため）
  const params = new URLSearchParams(location.search);
  params.delete("lang");
  const q = params.toString();
  history.replaceState(null, "", (q ? "?" + q : location.pathname) + "#" + activeId);
  render(activeId);
});

render(activeId);

// 時刻が進んだら「いま」と授業中の表示を更新する
setInterval(() => render(activeId), 30 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") render(activeId);
});

// iOS Safari は viewport の指定を無視して拡大するので、ジェスチャー自体を止める
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
