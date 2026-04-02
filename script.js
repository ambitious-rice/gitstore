const KEY = "checkin_plan_v1";
const START_DATE = new Date("2026-04-02");

const BLOCKS = [
  ["09:30-10:00", "到场/启动"],
  ["10:00-12:00", "深度工作 1（最硬任务）"],
  ["12:00-13:30", "午饭/休息"],
  ["13:30-15:30", "工作 2（推进段）"],
  ["15:30-17:00", "工作 3（收尾段）"],
  ["17:00-19:00", "健身窗口"],
  ["19:30-21:00", "晚间轻工作/整理"],
];

const DAILY_PROMPTS = [
  "今天完成了什么",
  "今天卡在哪里",
  "明天最重要的一件事",
  "是否按时健身/按时离开床",
];

const $ = (id) => document.getElementById(id);
const timeline = $("timeline");
const dailySummary = $("dailySummary");
const datePicker = $("datePicker");
const weekLabel = $("weekLabel");
const daysChecked = $("daysChecked");

const store = JSON.parse(localStorage.getItem(KEY) || "{}");

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getWeekKey(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day + 3);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const diff = date - firstThursday;
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  return `${date.getFullYear()}-W${pad(week)}`;
}

function getDayRecord(key) {
  if (!store.days) store.days = {};
  if (!store.days[key]) {
    store.days[key] = {
      arrived: false,
      workout: false,
      blocks: {},
      summary: {},
    };
  }
  return store.days[key];
}

function getWeekRecord(weekKey) {
  if (!store.weeks) store.weeks = {};
  if (!store.weeks[weekKey]) {
    store.weeks[weekKey] = { progress: "", blockers: "", next: "" };
  }
  return store.weeks[weekKey];
}

function renderInputs() {
  timeline.innerHTML = "";
  dailySummary.innerHTML = "";

  BLOCKS.forEach(([time, label]) => {
    const block = document.createElement("label");
    block.className = "block";
    block.innerHTML = `
      <div class="block-title">${time} · ${label}</div>
      <textarea rows="2" data-type="block" data-key="${time}" placeholder="记录你在这个时间块做了什么..."></textarea>
    `;
    timeline.appendChild(block);
  });

  DAILY_PROMPTS.forEach((prompt) => {
    const field = document.createElement("label");
    field.className = "field";
    field.innerHTML = `
      <span>${prompt}</span>
      <textarea rows="2" data-type="summary" data-key="${prompt}" placeholder="简要写下你的记录"></textarea>
    `;
    dailySummary.appendChild(field);
  });
}

function fillDay(dateKey) {
  const rec = getDayRecord(dateKey);
  $("arrived").checked = !!rec.arrived;
  $("workout").checked = !!rec.workout;

  document.querySelectorAll("textarea[data-type='block']").forEach((node) => {
    node.value = rec.blocks[node.dataset.key] || "";
  });

  document.querySelectorAll("textarea[data-type='summary']").forEach((node) => {
    node.value = rec.summary[node.dataset.key] || "";
  });

  const wk = getWeekKey(dateKey);
  const wkRec = getWeekRecord(wk);
  weekLabel.textContent = wk;
  $("weeklyProgress").value = wkRec.progress;
  $("weeklyBlockers").value = wkRec.blockers;
  $("weeklyNext").value = wkRec.next;

  refreshCounters();
}

function refreshCounters() {
  const dayMap = store.days || {};
  const checked = Object.values(dayMap).filter((d) => d.arrived).length;
  daysChecked.textContent = `${checked} / 21`;
}

function saveCurrent() {
  const dateKey = datePicker.value;
  if (!dateKey) return;
  const rec = getDayRecord(dateKey);
  rec.arrived = $("arrived").checked;
  rec.workout = $("workout").checked;

  document.querySelectorAll("textarea[data-type='block']").forEach((node) => {
    rec.blocks[node.dataset.key] = node.value.trim();
  });

  document.querySelectorAll("textarea[data-type='summary']").forEach((node) => {
    rec.summary[node.dataset.key] = node.value.trim();
  });

  const wk = getWeekKey(dateKey);
  const wkRec = getWeekRecord(wk);
  wkRec.progress = $("weeklyProgress").value.trim();
  wkRec.blockers = $("weeklyBlockers").value.trim();
  wkRec.next = $("weeklyNext").value.trim();

  localStorage.setItem(KEY, JSON.stringify(store));
  $("saveStatus").textContent = `已保存：${new Date().toLocaleTimeString()}`;
  refreshCounters();
}

function resetDay() {
  const dateKey = datePicker.value;
  if (!dateKey) return;
  store.days[dateKey] = {
    arrived: false,
    workout: false,
    blocks: {},
    summary: {},
  };
  localStorage.setItem(KEY, JSON.stringify(store));
  fillDay(dateKey);
  $("saveStatus").textContent = "当天记录已清空。";
}

function setup() {
  renderInputs();
  const today = toDateKey(new Date());
  datePicker.min = toDateKey(START_DATE);
  datePicker.value = today;
  fillDay(today);

  datePicker.addEventListener("change", () => fillDay(datePicker.value));
  $("saveBtn").addEventListener("click", saveCurrent);
  $("resetDayBtn").addEventListener("click", resetDay);
}

setup();
