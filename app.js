const DAYS = ["月", "火", "水", "木", "金"];
const COLORS = ["#2f6fd6", "#d9483b", "#1f9d61", "#e07b14", "#8b4fd6", "#0f97a8", "#d0427f", "#6f8f12", "#b0662a", "#4955d1", "#c49a00", "#5c6b7a"];
const STATUS_LABEL = { tentative: "迷い中", either: "どちらか" };
const STORAGE_KEY = "timetable.tab";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 単語の切れ目でだけ改行できるように <wbr> を入れる（未対応ブラウザではそのまま）
const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("ja", { granularity: "word" }) : null;
// 1文字の語（学・法・室など）と数字は前の語にくっつけ、「・」の後ろで切る
function units(s) {
  const out = [];
  for (const { segment: seg } of segmenter.segment(s)) {
    const prev = out[out.length - 1];
    const glue = prev !== undefined && !prev.endsWith("・") && (
      seg === "・" || seg.length === 1 || /^[0-9]+$/.test(seg) ||
      (/^[ァ-ヶー]+$/.test(seg) && /[ァ-ヶー]$/.test(prev))
    );
    if (glue) out[out.length - 1] = prev + seg;
    else out.push(seg);
  }
  return out;
}
function breakable(s) {
  if (!segmenter) return esc(s);
  return units(s).map(esc).join("<wbr>");
}

// コマの中では末尾の（…）と「講義室」を省く。履修科目リストには全部出す
function shortName(name) {
  return name.replace(/（[^（）]*）$/, "");
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

// 同じ科目名には同じ色
function colorMap(person) {
  const map = new Map();
  for (const c of person.classes) {
    if (!map.has(c.name)) map.set(c.name, COLORS[map.size % COLORS.length]);
  }
  return map;
}

function slotText(c) {
  return c.from === c.to ? `${DAYS[c.day]}${c.from}` : `${DAYS[c.day]}${c.from}-${c.to}`;
}

function renderTabs(activeId) {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = PEOPLE.map((p) =>
    `<button role="tab" data-id="${p.id}" aria-selected="${p.id === activeId}">${esc(p.label)}</button>`
  ).join("");
}

function renderGrid(person, colors) {
  const grid = document.getElementById("grid");
  const today = new Date().getDay() - 1; // 月=0
  const n = person.periods.length;
  let html = '<div></div>';
  DAYS.forEach((d, i) => {
    html += `<div class="day${i === today ? " today" : ""}" style="grid-column:${i + 2};grid-row:1">${d}</div>`;
  });

  person.periods.forEach((p) => {
    html += `<div class="period" style="grid-column:1;grid-row:${p.no + 1}"><b>${p.no}限</b>${p.start}<br>|<br>${p.end}</div>`;
  });

  const filled = DAYS.map(() => new Array(n + 1).fill(false));
  for (const c of person.classes) {
    for (let k = c.from; k <= c.to; k++) filled[c.day][k] = true;
    const status = c.status ? ` ${c.status}` : "";
    const long = c.to > c.from ? " long" : "";
    html += `<div class="card${status}${long}" style="grid-column:${c.day + 2};grid-row:${c.from + 1} / ${c.to + 2};--c:${colors.get(c.name)}">`
      + (c.status ? `<span class="flag">${STATUS_LABEL[c.status]}</span>` : "")
      + (c.code ? `<span class="code">${esc(c.code)}</span>` : "")
      + `<span class="name">${breakable(shortName(c.name))}</span>`
      + `<span class="room">${breakable(c.room.replace(/講義室$/, ""))}</span>`
      + `</div>`;
  }

  DAYS.forEach((_, d) => {
    for (let k = 1; k <= n; k++) {
      if (!filled[d][k]) html += `<div class="empty" style="grid-column:${d + 2};grid-row:${k + 1}"></div>`;
    }
  });

  grid.innerHTML = html;
}

function renderList(person, colors) {
  // 同じ科目の複数コマを1行にまとめる
  const groups = new Map();
  for (const c of person.classes) {
    const key = c.code + c.name;
    if (!groups.has(key)) groups.set(key, { ...c, slots: [] });
    groups.get(key).slots.push(slotText(c));
  }
  document.getElementById("list").innerHTML = [...groups.values()].map((g) => {
    const where = g.building && !g.room.startsWith(g.building) ? `${g.room}（${g.building}）` : g.room;
    const detail = [g.code, g.slots.join("・") + "限", g.teacher, where].filter(Boolean).map(esc).join(" · ");
    const flag = g.status ? `<span class="flag">${STATUS_LABEL[g.status]}</span>` : "";
    return `<li style="--c:${colors.get(g.name)}"><span class="dot"></span><div><div class="title">${esc(g.name)}${flag}</div><div class="detail">${detail}</div></div></li>`;
  }).join("");
}

function render(id) {
  const person = PEOPLE.find((p) => p.id === id);
  const colors = colorMap(person);
  renderTabs(id);
  document.getElementById("meta").textContent = `${person.school} · ${person.term}`;
  renderGrid(person, colors);
  renderList(person, colors);
}

document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.dataset.id;
  saveTab(id);
  history.replaceState(null, "", "#" + id);
  render(id);
});

render(loadTab());

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
