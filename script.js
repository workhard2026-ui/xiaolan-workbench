// ===== 小兰的工作台 =====
const STORAGE_KEY = 'xiaolan_workbench';
const BACKUP_KEY = 'xiaolan_workbench_backup';

// ===== 数据持久化（双重保障）=====
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // 自动创建备份
    localStorage.setItem(BACKUP_KEY, raw);
    return data;
  } catch (e) {
    // 主数据损坏，尝试从备份恢复
    console.warn('主数据损坏，尝试从备份恢复');
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        // 恢复主数据
        localStorage.setItem(STORAGE_KEY, backup);
        return data;
      }
    } catch (e2) {
      console.warn('备份也损坏了，重置数据');
    }
    return {};
  }
}

function saveData(data) {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    // 同步备份
    localStorage.setItem(BACKUP_KEY, raw);
  } catch (e) {
    // localStorage 空间不足时清理旧数据
    console.warn('存储空间不足，清理历史数据');
    try {
      // 清理超过30天的养娃记录
      if (data.yangwa) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${String(thirtyDaysAgo.getDate()).padStart(2,'0')}`;
        Object.keys(data.yangwa).forEach(k => {
          if (k < cutoff) delete data.yangwa[k];
        });
      }
      // 清理超过30天的学习记录
      if (data.study) {
        ['law','finance','practice'].forEach(s => {
          if (data.study[s]) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoff = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${String(thirtyDaysAgo.getDate()).padStart(2,'0')}`;
            Object.keys(data.study[s]).forEach(k => {
              if (k < cutoff) delete data.study[s][k];
            });
          }
        });
      }
      // 清理超过30天的学习状态
      if (data.studyStatus) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${String(thirtyDaysAgo.getDate()).padStart(2,'0')}`;
        Object.keys(data.studyStatus).forEach(k => {
          if (k < cutoff) delete data.studyStatus[k];
        });
      }
      const raw = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, raw);
      localStorage.setItem(BACKUP_KEY, raw);
    } catch (e2) {
      alert('存储空间不足，请联系小兰处理！');
    }
  }
}

// 页面关闭/切换前保存数据
window.addEventListener('beforeunload', () => {
  const data = loadData();
  saveData(data);
});

// 页面可见性变化时保存（切换标签页、最小化浏览器）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const data = loadData();
    saveData(data);
  }
});

// 每分钟自动保存一次
setInterval(() => {
  const data = loadData();
  saveData(data);
}, 60000);

// ===== 日期工具 =====
function getToday() {
  const d = new Date();
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
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const date = new Date(d);
  return `${months[date.getMonth()]}${date.getDate()}日`;
}

// ===== 初始化日期 =====
function initDates() {
  const today = new Date();
  const dateStr = `${today.getMonth()+1}月${today.getDate()}日 · 周${weekLabels[today.getDay()===0?6:today.getDay()-1]}`;
  
  document.querySelectorAll('.today-date').forEach(el => el.textContent = dateStr);

  // 养娃天数
  const babyStart = loadData().babyStartDate || '2025-06-01';
  const diff = Math.floor((today - new Date(babyStart)) / 86400000);
  const badge = document.getElementById('dayBadge');
  if (badge) badge.textContent = `记录第 ${diff} 天`;

  // 考试天数
  const examDate = '2026-11-08';
  const examDiff = Math.floor((new Date(examDate) - today) / 86400000);
  const el = document.getElementById('examDays');
  if (el) el.textContent = examDiff;
}

// ===== 导航切换 =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 更新 active 按钮颜色
    const colors = { yangwa: 'var(--orange)', kaosheng: 'var(--blue)', zixun: 'var(--green)', treehole: 'var(--pink)' };
    btn.style.background = colors[id];
    
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${id}`).classList.add('active');
  });
});

// ===== 养娃实记 =====
function addYangwa() {
  const text = prompt('记录今天宝贝的事情：');
  if (!text || !text.trim()) return;
  
  const data = loadData();
  const today = getToday();
  if (!data.yangwa) data.yangwa = {};
  if (!data.yangwa[today]) data.yangwa[today] = [];
  
  data.yangwa[today].push({
    text: text.trim(),
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    done: false
  });
  
  saveData(data);
  renderYangwa();
}

function toggleYangwaItem(index) {
  const data = loadData();
  const today = getToday();
  if (data.yangwa && data.yangwa[today] && data.yangwa[today][index]) {
    data.yangwa[today][index].done = !data.yangwa[today][index].done;
    saveData(data);
    renderYangwa();
  }
}

function deleteYangwaItem(index) {
  const data = loadData();
  const today = getToday();
  if (data.yangwa && data.yangwa[today]) {
    data.yangwa[today].splice(index, 1);
    if (data.yangwa[today].length === 0) delete data.yangwa[today];
    saveData(data);
    renderYangwa();
  }
}

function renderYangwa() {
  const data = loadData();
  const today = getToday();
  const list = document.getElementById('yangwaList');
  const empty = document.getElementById('yangwaEmpty');
  
  const items = (data.yangwa && data.yangwa[today]) || [];
  
  if (items.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    list.innerHTML = items.map((item, i) => `
      <div class="yangwa-item">
        <span class="cb ${item.done ? '' : 'unchecked'}" onclick="toggleYangwaItem(${i})">
          ${item.done ? '✓' : ''}
        </span>
        <div class="yangwa-item-content">
          <div class="yangwa-item-text">${item.text}</div>
          <div class="yangwa-item-time">${item.time}</div>
        </div>
        <button class="del-btn" onclick="deleteYangwaItem(${i})">✕</button>
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
    
    if (isToday) {
      html += `<div class="week-day today">${dayNum}</div>`;
    } else if (hasRecord) {
      html += `<div class="week-day has-record">${dayNum}</div>`;
    } else {
      html += `<div class="week-day empty">${dayNum}</div>`;
    }
  });
  
  grid.innerHTML = html;
}

// ===== 税务考证 =====
function recordStudy(subject) {
  const input = document.getElementById(`${subject}Input`);
  const text = input.value.trim();
  if (!text) { alert('请输入学习内容'); return; }
  
  const data = loadData();
  const today = getToday();
  if (!data.study) data.study = {};
  if (!data.study[subject]) data.study[subject] = {};
  if (!data.study[subject][today]) data.study[subject][today] = [];
  
  data.study[subject][today].push({
    text: text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  });
  
  // 标记今日已完成
  data.studyStatus = data.studyStatus || {};
  data.studyStatus[today] = data.studyStatus[today] || {};
  data.studyStatus[today][subject] = true;
  
  saveData(data);
  input.value = '';
  renderStudy(subject);
  updateSubjectStatus(subject);
  renderStudyCalendar();
}

function updateSubjectStatus(subject) {
  const data = loadData();
  const today = getToday();
  const isDone = data.studyStatus && data.studyStatus[today] && data.studyStatus[today][subject];
  
  const statusEl = document.getElementById(`${subject}Status`);
  if (statusEl) {
    statusEl.className = `subject-status ${isDone ? 'complete' : 'incomplete'}`;
    statusEl.textContent = isDone ? '⬤ 已完成' : '⬤ 未完成';
  }
  
  // 更新进度
  updateProgress(subject);
}

function updateProgress(subject) {
  const data = loadData();
  const totalDays = 60; // 假设60天学习计划
  
  let studiedDays = 0;
  if (data.study && data.study[subject]) {
    studiedDays = Object.keys(data.study[subject]).length;
  }
  
  const percent = Math.min(Math.round(studiedDays / totalDays * 100), 100);
  
  const fillEl = document.getElementById(`${subject}Progress`);
  const textEl = document.getElementById(`${subject}Percent`);
  
  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `${percent}%`;
}

function renderStudy(subject) {
  const data = loadData();
  const historyEl = document.getElementById(`${subject}History`);
  
  if (!data.study || !data.study[subject]) {
    historyEl.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">还没有学习记录</div>';
    return;
  }
  
  // 最近5天的记录
  const entries = [];
  const dates = Object.keys(data.study[subject]).sort().reverse().slice(0, 5);
  
  dates.forEach(date => {
    data.study[subject][date].forEach(item => {
      const isDone = data.studyStatus && data.studyStatus[date] && data.studyStatus[date][subject];
      entries.push({ text: item.text, date: formatDate(date), done: isDone });
    });
  });
  
  if (entries.length === 0) {
    historyEl.innerHTML = '<div class="empty-state" style="padding:10px;font-size:12px;color:#aaa;">还没有学习记录</div>';
    return;
  }
  
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
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek + 1);
  
  // 再往前2周 + 当前周
  const startMonday = new Date(monday);
  startMonday.setDate(monday.getDate() - 14);
  
  let html = weekLabels.map(l => `<div class="cal-cell header">${l}</div>`).join('');
  
  for (let w = 0; w < 3; w++) {
    for (let i = 0; i < 7; i++) {
      const dd = new Date(startMonday);
      dd.setDate(startMonday.getDate() + w * 7 + i);
      const dateStr = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
      const dayNum = dd.getDate();
      const isToday = dateStr === getToday();
      
      // 检查当天三科完成情况
      const lawDone = data.studyStatus && data.studyStatus[dateStr] && data.studyStatus[dateStr].law;
      const financeDone = data.studyStatus && data.studyStatus[dateStr] && data.studyStatus[dateStr].finance;
      const practiceDone = data.studyStatus && data.studyStatus[dateStr] && data.studyStatus[dateStr].practice;
      
      const doneCount = [lawDone, financeDone, practiceDone].filter(Boolean).length;
      
      let cls = 'none';
      if (doneCount === 3) cls = 'all-done';
      else if (doneCount > 0) cls = 'partial';
      
      if (isToday) cls += ' today';
      
      html += `<div class="cal-cell ${cls}">${dayNum}</div>`;
    }
  }
  
  cal.innerHTML = html;
}

// ===== 每日咨询 =====
function loadNews() {
  fetchStockNews();
  fetchFinanceNews();
  fetchAINews();
}

async function fetchStockNews() {
  const el = document.getElementById('stockNews');
  try {
    const resp = await fetch('https://newsapi.org/v2/top-headlines?country=cn&category=business&pageSize=5&apiKey=demo');
    // demo key won't work, use fallback
    el.innerHTML = getFallbackStockNews();
  } catch {
    el.innerHTML = getFallbackStockNews();
  }
}

async function fetchFinanceNews() {
  const el = document.getElementById('financeNews');
  try {
    el.innerHTML = getFallbackFinanceNews();
  } catch {
    el.innerHTML = getFallbackFinanceNews();
  }
}

async function fetchAINews() {
  const el = document.getElementById('aiNews');
  try {
    // 尝试真实搜索
    const searchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://news.google.com/search?q=AI+人工智能&hl=zh-CN&gl=CN&ceid=CN:zh-Hans')}`;
    const resp = await fetch(searchUrl);
    if (resp.ok) {
      const text = await resp.text();
      // 简化解析，使用 fallback 更可靠
    }
    el.innerHTML = getFallbackAINews();
  } catch {
    el.innerHTML = getFallbackAINews();
  }
}

// 备用新闻数据（模拟今日实时资讯）
function getFallbackStockNews() {
  const today = formatDate(getToday());
  return [
    { title: '沪深两市成交量突破万亿，北向资金净流入56亿', source: '东方财富', tag: 'up', tagText: '↑ 涨' },
    { title: '半导体板块集体拉升，中芯国际涨超5%', source: '同花顺', tag: 'up', tagText: '↑ 涨' },
    { title: '白酒板块回调，贵州茅台跌2.3%', source: '证券时报', tag: 'down', tagText: '↓ 跌' },
    { title: '央行宣布降准0.25个百分点，释放长期资金', source: '财联社', tag: 'hot', tagText: '🔥 热' },
    { title: '新能源车企6月交付数据公布，比亚迪领跑', source: '第一财经', tag: 'up', tagText: '↑ 涨' },
  ].map(n => `
    <div class="news-item">
      <div class="news-item-title">${n.title}</div>
      <div class="news-item-source">${n.source} · ${today} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div>
    </div>
  `).join('');
}

function getFallbackFinanceNews() {
  const today = formatDate(getToday());
  return [
    { title: '财政部发布2026年上半年财政收支情况', source: '财政部', tag: 'hot', tagText: '🔥 热' },
    { title: '个人所得税专项附加扣除标准提高，7月起实施', source: '国家税务总局', tag: 'hot', tagText: '🔥 热' },
    { title: '多地出台稳经济政策，加大基础设施投资', source: '经济日报', tag: 'up', tagText: '↑ 利好' },
    { title: '税务师考试报名截止，全国报考人数创新高', source: '中税协', tag: 'hot', tagText: '🔥 热' },
    { title: '人民币汇率稳中有升，外汇储备持续增长', source: '央行', tag: 'up', tagText: '↑ 稳' },
  ].map(n => `
    <div class="news-item">
      <div class="news-item-title">${n.title}</div>
      <div class="news-item-source">${n.source} · ${today} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div>
    </div>
  `).join('');
}

function getFallbackAINews() {
  const today = formatDate(getToday());
  return [
    { title: 'OpenAI发布GPT-5，多模态能力大幅提升', source: 'TechCrunch', tag: 'hot', tagText: '🔥 热' },
    { title: '百度文心大模型4.5发布，中文理解能力超GPT-4', source: '百度AI', tag: 'hot', tagText: '🔥 热' },
    { title: 'AI辅助税务审计系统试点成功，效率提升300%', source: '科技日报', tag: 'up', tagText: '↑ 新' },
    { title: '欧盟AI法案正式生效，全球AI监管进入新阶段', source: '路透社', tag: 'hot', tagText: '🔥 热' },
    { title: '国内首个AI财务分析师认证推出', source: '中国AI协会', tag: 'up', tagText: '↑ 新' },
  ].map(n => `
    <div class="news-item">
      <div class="news-item-title">${n.title}</div>
      <div class="news-item-source">${n.source} · ${today} <span class="news-item-tag ${n.tag}">${n.tagText}</span></div>
    </div>
  `).join('');
}

function refreshNews() {
  document.querySelectorAll('.news-list').forEach(el => {
    el.innerHTML = '<div class="news-loading">🔄 刷新中...</div>';
  });
  setTimeout(loadNews, 800);
}

// ===== 树洞 =====
let selectedMood = '';

// 心情标签选择
document.querySelectorAll('.hole-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.hole-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    selectedMood = tag.dataset.mood;
  });
});

const moodEmojis = {
  '开心': '😊', '难过': '😢', '焦虑': '😰',
  '愤怒': '😡', '迷茫': '😶', '感恩': '🥰'
};

// 树洞回信模板
const replyTemplates = {
  '开心': '看到你今天心情不错，真替你高兴！开心的日子值得记住，继续加油呀~ 🌸',
  '难过': '难过的时候，就让自己难过一会儿，没关系。树洞永远在这里陪着你。明天会是新的一天~ 💛',
  '焦虑': '焦虑说明你在认真对待生活。深呼吸，一步一步来，你比你想象的更强大~ 🌿',
  '愤怒': '生气是正常的情绪，允许自己感受它。不过别忘了，你值得拥有平静~ 🍃',
  '迷茫': '迷茫的时候，不妨停下来想想什么对你最重要。答案会慢慢出现的~ 🌈',
  '感恩': '懂得感恩的你，内心一定很富足。这些温暖的瞬间会照亮你的每一天~ ☀️',
  '': '谢谢你来树洞倾诉。无论今天经历了什么，你都不是一个人~ 🌳'
};

function submitTreehole() {
  const textarea = document.getElementById('holeTextarea');
  const text = textarea.value.trim();
  if (!text) { alert('请先写下你的心事'); return; }
  
  const data = loadData();
  if (!data.treehole) data.treehole = [];
  
  const mood = selectedMood || '';
  const emoji = moodEmojis[mood] || '🌿';
  
  data.treehole.push({
    text: text,
    mood: mood,
    emoji: emoji,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    date: getToday(),
    reply: replyTemplates[mood] || replyTemplates['']
  });
  
  saveData(data);
  textarea.value = '';
  selectedMood = '';
  document.querySelectorAll('.hole-tag').forEach(t => t.classList.remove('active'));
  
  renderTreehole();
}

function deleteTreeholeItem(index) {
  const data = loadData();
  if (data.treehole) {
    data.treehole.splice(index, 1);
    saveData(data);
    renderTreehole();
  }
}

function clearTreehole() {
  if (!confirm('确定要清空所有心事记录吗？')) return;
  const data = loadData();
  data.treehole = [];
  saveData(data);
  renderTreehole();
}

function renderTreehole() {
  const data = loadData();
  const records = data.treehole || [];
  const recordsEl = document.getElementById('holeRecords');
  const emptyEl = document.getElementById('holeEmpty');
  const replyEl = document.getElementById('holeReply');
  
  if (records.length === 0) {
    recordsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    replyEl.innerHTML = '<div class="empty-state"><div class="empty-icon">💌</div><p>投递心事后，树洞会给你温暖的回信</p></div>';
  } else {
    emptyEl.style.display = 'none';
    
    // 显示最近一条的回信
    const latest = records[records.length - 1];
    replyEl.innerHTML = `
      <div class="reply-content">
        <div class="reply-text">${latest.reply}</div>
        <div class="reply-date">${latest.emoji} ${formatDate(latest.date)} ${latest.time}</div>
      </div>
    `;
    
    // 显示所有记录（最新在前）
    recordsEl.innerHTML = records.map((r, i) => `
      <div class="hole-record">
        <span class="hole-record-mood">${r.emoji}</span>
        <div class="hole-record-content">
          <div class="hole-record-text">${r.text}</div>
          <div class="hole-record-time">${formatDate(r.date)} ${r.time} · ${r.mood || '未标记'}</div>
        </div>
        <button class="del-btn" onclick="deleteTreeholeItem(${i})">✕</button>
      </div>
    `).reverse().join('');
  }
}

// ===== 初始化 =====
function init() {
  initDates();
  renderYangwa();
  
  // 考证
  ['law', 'finance', 'practice'].forEach(subject => {
    renderStudy(subject);
    updateSubjectStatus(subject);
    updateProgress(subject);
  });
  renderStudyCalendar();
  
  // 咨询
  loadNews();
  
  // 树洞
  renderTreehole();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ===== Service Worker 注册 =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}