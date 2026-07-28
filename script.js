// ===== 小兰的工作台 =====
const STORAGE_KEY = 'xiaolan_workbench';
const BACKUP_KEY = 'xiaolan_workbench_backup';

// ===== 数据持久化（双重保障）=====
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    localStorage.setItem(BACKUP_KEY, raw);
    return data;
  } catch (e) {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) { const data = JSON.parse(backup); localStorage.setItem(STORAGE_KEY, backup); return data; }
    } catch (e2) {}
    return {};
  }
}

function saveData(data) {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    localStorage.setItem(BACKUP_KEY, raw);
  } catch (e) {
    // 清理30天前旧数据
    try {
      const cutoff = dateOffset(-30);
      if (data.yangwa) Object.keys(data.yangwa).forEach(k => { if (k < cutoff) delete data.yangwa[k]; });
      if (data.study) ['law','finance','practice'].forEach(s => { if (data.study[s]) Object.keys(data.study[s]).forEach(k => { if (k < cutoff) delete data.study[s][k]; }); });
      if (data.studyStatus) Object.keys(data.studyStatus).forEach(k => { if (k < cutoff) delete data.studyStatus[k]; });
      if (data.plans) Object.keys(data.plans).forEach(k => { if (k < cutoff) delete data.plans[k]; });
      if (data.expenses) Object.keys(data.expenses).forEach(k => { if (k < cutoff) delete data.expenses[k]; });
      const raw2 = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, raw2);
      localStorage.setItem(BACKUP_KEY, raw2);
    } catch (e2) {}
  }
}

// 页面关闭前保存
window.addEventListener('beforeunload', () => saveData(loadData()));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveData(loadData()); });
setInterval(() => saveData(loadData()), 60000);

// ===== 日期工具 =====
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekDays() {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    days.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`);
  }
  return days;
}

const weekLabels = ['一','二','三','四','五','六','日'];

function formatDate(d) {
  const date = new Date(d);
  return `${date.getMonth()+1}月${date.getDate()}日`;
}

function formatDateFull(d) {
  const date = new Date(d);
  const wk = weekLabels[date.getDay()===0?6:date.getDay()-1];
  return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 周${wk}`;
}

// ===== 导航切换 =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const colors = { plan:'var(--yellow)', expense:'var(--teal)', yangwa:'var(--orange)', kaosheng:'var(--blue)', zixun:'var(--green)', treehole:'var(--pink)' };
    btn.style.background = colors[id] || '';
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${id}`).classList.add('active');
  });
});

// ===== 初始化日期 =====
function initDates() {
  const today = new Date();
  const dateStr = formatDateFull(getToday());
  document.querySelectorAll('.today-date').forEach(el => el.textContent = dateStr);
  const babyStart = loadData().babyStartDate || '2025-06-01';
  const badge = document.getElementById('dayBadge');
  if (badge) badge.textContent = `记录第 ${Math.floor((today - new Date(babyStart)) / 86400000)} 天`;
  const el = document.getElementById('examDays');
  if (el) el.textContent = Math.floor((new Date('2026-11-08') - today) / 86400000);
  document.getElementById('planDate')?.textContent && (document.getElementById('planDate').textContent = dateStr);
  document.getElementById('planBadge')?.textContent && (document.getElementById('planBadge').textContent = '每天5件事');
  const ed = document.getElementById('expenseDate');
  if (ed) ed.textContent = dateStr;
}

// ==================== 每日计划 ====================
const DEFAULT_TASKS = ['读书30分钟', '运动30分钟', '开心放松30分钟', '晚上22:30之前睡觉', '工作台及日记记录'];

function ensureTodayPlan() {
  const data = loadData();
  const today = getToday();
  if (!data.plans) data.plans = {};
  if (!data.plans[today]) {
    data.plans[today] = DEFAULT_TASKS.map(t => ({ text: t, done: false }));
    saveData(data);
  }
  return data;
}

function addPlanTask() {
  const text = prompt('新增待办任务：');
  if (!text || !text.trim()) return;
  const data = ensureTodayPlan();
  data.plans[getToday()].push({ text: text.trim(), done: false });
  saveData(data);
  renderPlan();
}

function togglePlanTask(index) {
  const data = loadData();
  const today = getToday();
  if (data.plans && data.plans[today] && data.plans[today][index]) {
    data.plans[today][index].done = !data.plans[today][index].done;
    saveData(data);
    renderPlan();
  }
}

function deletePlanTask(index) {
  const data = loadData();
  const today = getToday();
  if (data.plans && data.plans[today]) {
    data.plans[today].splice(index, 1);
    saveData(data);
    renderPlan();
  }
}

function renderPlan() {
  ensureTodayPlan();
  const data = loadData();
  const today = getToday();
  const tasks = data.plans[today] || [];
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round(done/total*100) : 0;

  document.getElementById('planTotal').textContent = total;
  document.getElementById('planDone').textContent = done;
  document.getElementById('planPercentNum').textContent = pct + '%';
  document.getElementById('planProgressFill').style.width = pct + '%';

  const list = document.getElementById('planTaskList');
  list.innerHTML = tasks.map((t, i) => `
    <div class="plan-task ${t.done ? 'checked' : ''}">
      <span class="plan-checkbox" onclick="togglePlanTask(${i})">?</span>
      <span class="plan-task-text">${t.text}</span>
      <button class="del-btn" onclick="deletePlanTask(${i})">?</button>
    </div>
  `).join('');

  renderPlanHistory();
}

let planOffset = 0;
function planPrev() { planOffset++; renderPlanHistory(); }
function planNext() { if (planOffset > 0) { planOffset--; renderPlanHistory(); } }

function renderPlanHistory() {
  const data = loadData();
  const viewDate = dateOffset(-planOffset);
  const isToday = viewDate === getToday();
  document.getElementById('planHistoryDate').textContent = isToday ? '今天' : formatDate(viewDate);

  const tasks = (data.plans && data.plans[viewDate]) || [];
  const el = document.getElementById('planHistoryList');
  if (tasks.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">该日无计划记录</div>';
  } else {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    el.innerHTML = tasks.map(t => `
      <div class="history-task ${t.done ? 'done' : ''}">
        <span class="mini-check">${t.done ? '?' : '?'}</span>
        <span class="mini-text">${t.text}</span>
      </div>
    `).join('') + `<div class="history-stat">${done}/${total} 完成 (${Math.round(done/total*100)}%)</div>`;
  }
}

// ==================== 消费记账 ====================
const categoryIcons = { '餐饮':'?', '购物':'?', '交通':'?', '住房':'?', '娱乐':'?', '教育':'?', '医疗':'?', '日用品':'?', '其他':'?' };

function addExpense() {
  const name = document.getElementById('expenseName').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  if (!name) { alert('请填写消费项目'); return; }
  if (!amount || amount <= 0) { alert('请填写金额'); return; }

  const data = loadData();
  const today = getToday();
  if (!data.expenses) data.expenses = {};
  if (!data.expenses[today]) data.expenses[today] = [];

  data.expenses[today].push({
    name, amount: Math.round(amount*100)/100, category,
    time: new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })
  });

  saveData(data);
  document.getElementById('expenseName').value = '';
  document.getElementById('expenseAmount').value = '';
  renderExpense();
}

function deleteExpenseItem(index) {
  const data = loadData();
  const today = getToday();
  if (data.expenses && data.expenses[today]) {
    data.expenses[today].splice(index, 1);
    if (data.expenses[today].length === 0) delete data.expenses[today];
    saveData(data);
    renderExpense();
  }
}

function renderExpense() {
  const data = loadData();
  const today = getToday();
  const bills = (data.expenses && data.expenses[today]) || [];

  // 今日总开销
  const todayTotal = bills.reduce((s, b) => s + b.amount, 0);
  document.getElementById('expenseTodayTotal').textContent = `?${todayTotal.toFixed(2)}`;

  // 月度累计
  const month = today.substring(0, 7);
  let monthTotal = 0;
  if (data.expenses) {
    Object.keys(data.expenses).forEach(d => {
      if (d.startsWith(month)) {
        monthTotal += data.expenses[d].reduce((s, b) => s + b.amount, 0);
      }
    });
  }
  document.getElementById('expenseMonthTotal').textContent = `?${monthTotal.toFixed(2)}`;

  // 分类汇总条
  const catTotals = {};
  bills.forEach(b => { catTotals[b.category] = (catTotals[b.category] || 0) + b.amount; });
  const catBar = document.getElementById('expenseCategoryBar');
  catBar.innerHTML = Object.entries(catTotals).map(([cat, amt]) =>
    `<span class="cat-tag">${categoryIcons[cat]||'?'} ${cat} ?${amt.toFixed(0)}</span>`
  ).join('');

  // 今日账单明细
  const billList = document.getElementById('expenseBillList');
  const empty = document.getElementById('expenseBillEmpty');
  if (bills.length === 0) {
    billList.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    billList.innerHTML = bills.map((b, i) => `
      <div class="bill-item">
        <span class="bill-category">${categoryIcons[b.category]||'?'}</span>
        <div class="bill-info">
          <div class="bill-name">${b.name}</div>
          <div class="bill-time">${b.time} · ${b.category}</div>
        </div>
        <span class="bill-amount">?${b.amount.toFixed(2)}</span>
        <button class="del-btn" onclick="deleteExpenseItem(${i})">?</button>
      </div>
    `).join('');
  }

  // 月度分类统计
  renderExpenseMonthChart(data, month);

  // 历史账单
  renderExpenseHistory();
}

function renderExpenseMonthChart(data, month) {
  const catTotals = {};
  if (data.expenses) {
    Object.keys(data.expenses).forEach(d => {
      if (d.startsWith(month)) {
        data.expenses[d].forEach(b => { catTotals[b.category] = (catTotals[b.category] || 0) + b.amount; });
      }
    });
  }
  const max = Math.max(...Object.values(catTotals), 1);
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const colors = { '餐饮':'#3A86FF', '购物':'#FF6B35', '交通':'#06D6A0', '住房':'#FFBE0B', '娱乐':'#FB5607', '教育':'#00B4D8', '医疗':'#d04a4a', '日用品':'#c46a00', '其他':'#888' };
  const chart = document.getElementById('expenseMonthChart');
  if (sorted.length === 0) {
    chart.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">本月暂无消费数据</div>';
  } else {
    chart.innerHTML = sorted.map(([cat, amt]) => `
      <div class="chart-row">
        <span class="chart-label">${categoryIcons[cat]||'?'} ${cat}</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${Math.round(amt/max*100)}%;background:${colors[cat]||'#888'}"></div></div>
        <span class="chart-amount">?${amt.toFixed(0)}</span>
      </div>
    `).join('');
  }
}

let expenseOffset = 0;
function expensePrev() { expenseOffset++; renderExpenseHistory(); }
function expenseNext() { if (expenseOffset > 0) { expenseOffset--; renderExpenseHistory(); } }

function renderExpenseHistory() {
  const data = loadData();
  const viewDate = dateOffset(-expenseOffset);
  const isToday = viewDate === getToday();
  document.getElementById('expenseHistoryDate').textContent = isToday ? '今天' : formatDate(viewDate);

  const bills = (data.expenses && data.expenses[viewDate]) || [];
  const el = document.getElementById('expenseHistoryBills');
  if (bills.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">该日无消费记录</div>';
  } else {
    const dayTotal = bills.reduce((s, b) => s + b.amount, 0);
    el.innerHTML = bills.map(b => `
      <div class="history-bill">
        <span class="h-cat">${categoryIcons[b.category]||'?'}</span>
        <span class="h-name">${b.name}</span>
        <span class="h-amount">?${b.amount.toFixed(2)}</span>
      </div>
    `).join('') + `<div class="history-bill .h-total" style="font-size:13px;font-weight:800;color:#006d77;text-align:center;padding:10px;border-radius:10px;background:#e0f7fa;">当日合计：?${dayTotal.toFixed(2)}</div>`;
  }
}

// ==================== 养娃实记 ====================
function addYangwa() {
  const text = prompt('记录今天宝贝的事情：');
  if (!text || !text.trim()) return;
  const data = loadData();
  const today = getToday();
  if (!data.yangwa) data.yangwa = {};
  if (!data.yangwa[today]) data.yangwa[today] = [];
  data.yangwa[today].push({ text: text.trim(), time: new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }), done: false });
  saveData(data); renderYangwa();
}

function toggleYangwaItem(index) {
  const data = loadData();
  const today = getToday();
  if (data.yangwa && data.yangwa[today] && data.yangwa[today][index]) {
    data.yangwa[today][index].done = !data.yangwa[today][index].done;
    saveData(data); renderYangwa();
  }
}

function deleteYangwaItem(index) {
  const data = loadData();
  const today = getToday();
  if (data.yangwa && data.yangwa[today]) {
    data.yangwa[today].splice(index, 1);
    if (data.yangwa[today].length === 0) delete data.yangwa[today];
    saveData(data); renderYangwa();
  }
}

function renderYangwa() {
  const data = loadData();
  const today = getToday();
  const list = document.getElementById('yangwaList');
  const empty = document.getElementById('yangwaEmpty');
  const items = (data.yangwa && data.yangwa[today]) || [];
  if (items.length === 0) { list.innerHTML = ''; empty.style.display = 'block'; }
  else {
    empty.style.display = 'none';
    list.innerHTML = items.map((item, i) => `
      <div class="yangwa-item">
        <span class="cb ${item.done ? '' : 'unchecked'}" onclick="toggleYangwaItem(${i})">${item.done ? '?' : ''}</span>
        <div class="yangwa-item-content"><div class="yangwa-item-text">${item.text}</div><div class="yangwa-item-time">${item.time}</div></div>
        <button class="del-btn" onclick="deleteYangwaItem(${i})">?</button>
      </div>
    `).join('');
  }
  renderWeekGrid();
}

function renderWeekGrid() {
  const data = loadData();
  const days = getWeekDays();
  const today = getToday();
  const grid = document.getElementById('weekGrid');
  let html = weekLabels.map(l => `<div class="week-day header">${l}</div>`).join('');
  days.forEach(d => {
    const hasRecord = data.yangwa && data.yangwa[d] && data.yangwa[d].length > 0;
    const isToday = d === today;
    const dayNum = new Date(d).getDate();
    if (isToday) html += `<div class="week-day today">${dayNum}</div>`;
    else if (hasRecord) html += `<div class="week-day has-record">${dayNum}</div>`;
    else html += `<div class="week-day empty">${dayNum}</div>`;
  });
  grid.innerHTML = html;
}

// ==================== 税务考证 ====================
function recordStudy(subject) {
  const input = document.getElementById(`${subject}Input`);
  const text = input.value.trim();
  if (!text) { alert('请输入学习内容'); return; }
  const data = loadData();
  const today = getToday();
  if (!data.study) data.study = {};
  if (!data.study[subject]) data.study[subject] = {};
  if (!data.study[subject][today]) data.study[subject][today] = [];
  data.study[subject][today].push({ text, time: new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }) });
  data.studyStatus = data.studyStatus || {};
  data.studyStatus[today] = data.studyStatus[today] || {};
  data.studyStatus[today][subject] = true;
  saveData(data);
  input.value = '';
  renderStudy(subject); updateSubjectStatus(subject); renderStudyCalendar();
}

function updateSubjectStatus(subject) {
  const data = loadData();
  const today = getToday();
  const isDone = data.studyStatus && data.studyStatus[today] && data.studyStatus[today][subject];
  const statusEl = document.getElementById(`${subject}Status`);
  if (statusEl) { statusEl.className = `subject-status ${isDone ? 'complete' : 'incomplete'}`; statusEl.textContent = isDone ? '? 已完成' : '? 未完成'; }
  updateProgress(subject);
}

function updateProgress(subject) {
  const data = loadData();
  let studiedDays = 0;
  if (data.study && data.study[subject]) studiedDays = Object.keys(data.study[subject]).length;
  const percent = Math.min(Math.round(studiedDays / 60 * 100), 100);
  const fillEl = document.getElementById(`${subject}Progress`);
  const textEl = document.getElementById(`${subject}Percent`);
  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `${percent}%`;
}

function renderStudy(subject) {
  const data = loadData();
  const historyEl = document.getElementById(`${subject}History`);
  if (!data.study || !data.study[subject]) {
    historyEl.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">还没有学习记录</div>'; return;
  }
  const entries = [];
  const dates = Object.keys(data.study[subject]).sort().reverse().slice(0, 5);
  dates.forEach(date => {
    data.study[subject][date].forEach(item => {
      const isDone = data.studyStatus && data.studyStatus[date] && data.studyStatus[date][subject];
      entries.push({ text: item.text, date: formatDate(date), done: isDone });
    });
  });
  if (entries.length === 0) { historyEl.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">还没有学习记录</div>'; return; }
  historyEl.innerHTML = entries.map(e => `
    <div class="study-entry">
      <span class="status-dot ${e.done ? 'done' : 'pending'}"></span>
      <span class="study-entry-text">${e.text}</span>
      <span class="study-entry-date">${e.date}</span>
    </div>
  `).join('');
}

function renderStudyCalendar() {
  const data = loadData();
  const cal = document.getElementById('studyCalendar');
  if (!cal) return;
  const d = new Date();
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  const monday = new Date(d); monday.setDate(d.getDate() - dayOfWeek + 1);
  const startMonday = new Date(monday); startMonday.setDate(monday.getDate() - 14);
  let html = weekLabels.map(l => `<div class="cal-cell header">${l}</div>`).join('');
  for (let w = 0; w < 3; w++) {
    for (let i = 0; i < 7; i++) {
      const dd = new Date(startMonday); dd.setDate(startMonday.getDate() + w*7 + i);
      const dateStr = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
      const isToday = dateStr === getToday();
      const lawDone = data.studyStatus?.[dateStr]?.law;
      const financeDone = data.studyStatus?.[dateStr]?.finance;
      const practiceDone = data.studyStatus?.[dateStr]?.practice;
      const doneCount = [lawDone, financeDone, practiceDone].filter(Boolean).length;
      let cls = 'none';
      if (doneCount === 3) cls = 'all-done';
      else if (doneCount > 0) cls = 'partial';
      if (isToday) cls += ' today';
      html += `<div class="cal-cell ${cls}">${dd.getDate()}</div>`;
    }
  }
  cal.innerHTML = html;
}

// ==================== 每日咨询 ====================
function loadNews() { fetchStockNews(); fetchFinanceNews(); fetchAINews(); }
async function fetchStockNews() { document.getElementById('stockNews').innerHTML = getFallbackStockNews(); }
async function fetchFinanceNews() { document.getElementById('financeNews').innerHTML = getFallbackFinanceNews(); }
async function fetchAINews() { document.getElementById('aiNews').innerHTML = getFallbackAINews(); }

function getFallbackStockNews() {
  const t = formatDate(getToday());
  return [{ title:'沪深两市成交量突破万亿，北向资金净流入56亿', source:'东方财富', tag:'up', tagText:'↑ 涨' },
    { title:'半导体板块集体拉升，中芯国际涨超5%', source:'同花顺', tag:'up', tagText:'↑ 涨' },
    { title:'白酒板块回调，贵州茅台跌2.3%', source:'证券时报', tag:'down', tagText:'↓ 跌' },
    { title:'央行宣布降准0.25个百分点，释放长期资金', source:'财联社', tag:'hot', tagText:'? 热' },
    { title:'新能源车企6月交付数据公布，比亚迪领跑', source:'第一财经', tag:'up', tagText:'↑ 涨' }]
    .map(n => `<div class="news-item"><div class="news-item-title">${n.title}</div><div class="news-item-source">${n.source} · ${t} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div></div>`).join('');
}
function getFallbackFinanceNews() {
  const t = formatDate(getToday());
  return [{ title:'财政部发布2026年上半年财政收支情况', source:'财政部', tag:'hot', tagText:'? 热' },
    { title:'个人所得税专项附加扣除标准提高，7月起实施', source:'国家税务总局', tag:'hot', tagText:'? 热' },
    { title:'多地出台稳经济政策，加大基础设施投资', source:'经济日报', tag:'up', tagText:'↑ 利好' },
    { title:'税务师考试报名截止，全国报考人数创新高', source:'中税协', tag:'hot', tagText:'? 热' },
    { title:'人民币汇率稳中有升，外汇储备持续增长', source:'央行', tag:'up', tagText:'↑ 稳' }]
    .map(n => `<div class="news-item"><div class="news-item-title">${n.title}</div><div class="news-item-source">${n.source} · ${t} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div></div>`).join('');
}
function getFallbackAINews() {
  const t = formatDate(getToday());
  return [{ title:'OpenAI发布GPT-5，多模态能力大幅提升', source:'TechCrunch', tag:'hot', tagText:'? 热' },
    { title:'百度文心大模型4.5发布，中文理解能力超GPT-4', source:'百度AI', tag:'hot', tagText:'? 热' },
    { title:'AI辅助税务审计系统试点成功，效率提升300%', source:'科技日报', tag:'up', tagText:'↑ 新' },
    { title:'欧盟AI法案正式生效，全球AI监管进入新阶段', source:'路透社', tag:'hot', tagText:'? 热' },
    { title:'国内首个AI财务分析师认证推出', source:'中国AI协会', tag:'up', tagText:'↑ 新' }]
    .map(n => `<div class="news-item"><div class="news-item-title">${n.title}</div><div class="news-item-source">${n.source} · ${t} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div></div>`).join('');
}
function refreshNews() { document.querySelectorAll('.news-list').forEach(el => el.innerHTML = '<div class="news-loading">? 刷新中...</div>'); setTimeout(loadNews, 800); }

// ==================== 树洞 ====================
let selectedMood = '';
document.querySelectorAll('.hole-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.hole-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    selectedMood = tag.dataset.mood;
  });
});

const moodEmojis = { '开心':'?', '难过':'?', '焦虑':'?', '愤怒':'?', '迷茫':'?', '感恩':'?' };
const replyTemplates = {
  '开心':'看到你今天心情不错，真替你高兴！开心的日子值得记住，继续加油呀~ ?',
  '难过':'难过的时候，就让自己难过一会儿，没关系。树洞永远在这里陪着你。明天会是新的一天~ ?',
  '焦虑':'焦虑说明你在认真对待生活。深呼吸，一步一步来，你比你想象的更强大~ ?',
  '愤怒':'生气是正常的情绪，允许自己感受它。不过别忘了，你值得拥有平静~ ?',
  '迷茫':'迷茫的时候，不妨停下来想想什么对你最重要。答案会慢慢出现的~ ?',
  '感恩':'懂得感恩的你，内心一定很富足。这些温暖的瞬间会照亮你的每一天~ ??',
  '':'谢谢你来树洞倾诉。无论今天经历了什么，你都不是一个人~ ?'
};

function submitTreehole() {
  const textarea = document.getElementById('holeTextarea');
  const text = textarea.value.trim();
  if (!text) { alert('请先写下你的心事'); return; }
  const data = loadData();
  if (!data.treehole) data.treehole = [];
  const mood = selectedMood || '';
  const emoji = moodEmojis[mood] || '?';
  data.treehole.push({ text, mood, emoji, time: new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }), date: getToday(), reply: replyTemplates[mood] || replyTemplates[''] });
  saveData(data);
  textarea.value = ''; selectedMood = '';
  document.querySelectorAll('.hole-tag').forEach(t => t.classList.remove('active'));
  renderTreehole();
}

function deleteTreeholeItem(index) {
  const data = loadData();
  if (data.treehole) { data.treehole.splice(index, 1); saveData(data); renderTreehole(); }
}

function clearTreehole() {
  if (!confirm('确定要清空所有心事记录吗？')) return;
  const data = loadData(); data.treehole = []; saveData(data); renderTreehole();
}

function renderTreehole() {
  const data = loadData();
  const records = data.treehole || [];
  const recordsEl = document.getElementById('holeRecords');
  const emptyEl = document.getElementById('holeEmpty');
  const replyEl = document.getElementById('holeReply');
  if (records.length === 0) {
    recordsEl.innerHTML = ''; emptyEl.style.display = 'block';
    replyEl.innerHTML = '<div class="empty-state"><div class="empty-icon">?</div><p>投递心事后，树洞会给你温暖的回信</p></div>';
  } else {
    emptyEl.style.display = 'none';
    const latest = records[records.length - 1];
    replyEl.innerHTML = `<div class="reply-content"><div class="reply-text">${latest.reply}</div><div class="reply-date">${latest.emoji} ${formatDate(latest.date)} ${latest.time}</div></div>`;
    recordsEl.innerHTML = records.map((r, i) => `
      <div class="hole-record">
        <span class="hole-record-mood">${r.emoji}</span>
        <div class="hole-record-content"><div class="hole-record-text">${r.text}</div><div class="hole-record-time">${formatDate(r.date)} ${r.time} · ${r.mood || '未标记'}</div></div>
        <button class="del-btn" onclick="deleteTreeholeItem(${i})">?</button>
      </div>
    `).reverse().join('');
  }
}

// ==================== 初始化 ====================
function init() {
  initDates();
  renderPlan();
  renderExpense();
  renderYangwa();
  ['law','finance','practice'].forEach(s => { renderStudy(s); updateSubjectStatus(s); updateProgress(s); });
  renderStudyCalendar();
  loadNews();
  renderTreehole();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});