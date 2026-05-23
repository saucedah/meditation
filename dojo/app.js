// Claude Ninja Dojo — main app logic

const STORAGE_KEY = 'claude-dojo-state-v1';

const defaultState = {
  studied: {},        // { [lessonId]: true }   — earned 10 XP for reading
  quizzes: {},        // { [lessonId]: { best: number, attempts: number, perfect: bool } }
  xp: 0
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function awardXp(amount, reason) {
  state.xp += amount;
  saveState();
  showToast(`+${amount} XP — ${reason}`);
  renderBelt();
  renderDashboard();
}

function currentBelt() {
  let belt = BELTS[0];
  let next = null;
  for (let i = 0; i < BELTS.length; i++) {
    if (state.xp >= BELTS[i].min) {
      belt = BELTS[i];
      next = BELTS[i + 1] || null;
    }
  }
  return { belt, next };
}

function progressToNext() {
  const { belt, next } = currentBelt();
  if (!next) return 1;
  const span = next.min - belt.min;
  const into = state.xp - belt.min;
  return Math.max(0, Math.min(1, into / span));
}

// Toast -------------------------------------------------------------------
let toastTimer = null;
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2000);
}

// Tabs --------------------------------------------------------------------
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.panel').forEach(p =>
        p.classList.toggle('active', p.id === `panel-${target}`)
      );
      if (target === 'quiz') exitQuizRunner();
    });
  });
}

// Belt display -----------------------------------------------------------
function renderBelt() {
  const { belt } = currentBelt();
  document.getElementById('beltName').textContent = belt.name;
  document.getElementById('beltPoints').textContent = `${state.xp} XP`;
  document.getElementById('beltBand').style.background = belt.color;
}

// Dashboard --------------------------------------------------------------
function renderDashboard() {
  const { belt, next } = currentBelt();
  document.getElementById('heroBelt').textContent = belt.name;

  const lessonsCount = Object.keys(state.studied).length;
  const acedCount = Object.values(state.quizzes).filter(q => q.perfect).length;
  document.getElementById('statLessons').textContent = lessonsCount;
  document.getElementById('statQuizzes').textContent = acedCount;
  document.getElementById('statXp').textContent = state.xp;

  const msg = document.getElementById('heroMsg');
  if (!next) {
    msg.textContent = 'Black Belt achieved. You are now a Claude ninja sensei. 🥷';
  } else {
    const need = next.min - state.xp;
    msg.textContent = `${need} XP until ${next.name}. Read scrolls (+10 XP each), ace quizzes (+25 bonus).`;
  }

  const pct = progressToNext();
  const circ = 2 * Math.PI * 52;
  document.getElementById('ringFg').style.strokeDashoffset = circ * (1 - pct);
  document.getElementById('ringFg').style.stroke = belt.color === '#f5f5f5' ? '#ff4757' : belt.color;
  document.getElementById('ringPct').textContent = `${Math.round(pct * 100)}%`;

  // Belt ladder
  const ladder = document.getElementById('beltLadder');
  ladder.innerHTML = '';
  BELTS.forEach(b => {
    const earned = state.xp >= b.min;
    const isCurrent = b.name === belt.name;
    const rung = document.createElement('div');
    rung.className = 'belt-rung' + (earned ? ' earned' : '') + (isCurrent ? ' current' : '');
    rung.innerHTML = `
      <div class="belt-rung-band" style="background:${b.color}"></div>
      <div class="belt-rung-name">${b.name}</div>
      <div class="belt-rung-xp">${b.min} XP</div>
    `;
    ladder.appendChild(rung);
  });
}

// Lessons grid -----------------------------------------------------------
function renderLessonsGrid(containerId, mode) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';
  LESSONS.forEach(lesson => {
    const studied = state.studied[lesson.id];
    const quiz = state.quizzes[lesson.id];
    const card = document.createElement('button');
    card.className = 'lesson-card';
    const badges = [];
    if (studied) badges.push('<span class="badge studied">✓ Studied</span>');
    if (quiz?.perfect) badges.push('<span class="badge aced">★ Aced</span>');
    else if (quiz?.best) badges.push(`<span class="badge passed">${quiz.best}/${QUIZZES[lesson.id].length}</span>`);
    card.innerHTML = `
      <div class="icon">${lesson.icon}</div>
      <h3>${lesson.title}</h3>
      <p>${lesson.summary}</p>
      <div class="meta">${badges.join('')}</div>
    `;
    card.addEventListener('click', () => {
      if (mode === 'lesson') openLesson(lesson.id);
      else startQuiz(lesson.id);
    });
    grid.appendChild(card);
  });
}

// Lesson modal -----------------------------------------------------------
let currentLessonId = null;
function openLesson(id) {
  currentLessonId = id;
  const lesson = LESSONS.find(l => l.id === id);
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${lesson.icon} ${lesson.title}</h2>
    <p class="summary">${lesson.summary}</p>
    ${lesson.sections.map(s => `
      <h4>${s.heading}</h4>
      <p>${formatInline(s.body)}</p>
    `).join('')}
    <ul class="takeaways">
      ${lesson.takeaways.map(t => `<li>${formatInline(t)}</li>`).join('')}
    </ul>
  `;
  document.getElementById('modalDone').textContent = state.studied[id]
    ? '✓ Already Studied'
    : 'Mark as Studied (+10 XP)';
  document.getElementById('modalDone').disabled = !!state.studied[id];
  document.getElementById('modalBackdrop').classList.remove('hidden');
}

function formatInline(text) {
  // Convert `code` to <code>code</code>; **bold** to <strong>
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function closeLesson() {
  document.getElementById('modalBackdrop').classList.add('hidden');
  currentLessonId = null;
}

function initModal() {
  document.getElementById('modalClose').addEventListener('click', closeLesson);
  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target.id === 'modalBackdrop') closeLesson();
  });
  document.getElementById('modalDone').addEventListener('click', () => {
    if (!currentLessonId || state.studied[currentLessonId]) return;
    state.studied[currentLessonId] = true;
    saveState();
    awardXp(10, 'lesson studied');
    document.getElementById('modalDone').textContent = '✓ Already Studied';
    document.getElementById('modalDone').disabled = true;
    renderLessonsGrid('lessonGrid', 'lesson');
    renderLessonsGrid('quizGrid', 'quiz');
  });
  document.getElementById('modalQuiz').addEventListener('click', () => {
    const id = currentLessonId;
    closeLesson();
    switchTab('quiz');
    startQuiz(id);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLesson();
  });
}

function switchTab(name) {
  const btn = document.querySelector(`.tab[data-tab="${name}"]`);
  if (btn) btn.click();
}

// Quiz runner ------------------------------------------------------------
let activeQuiz = null;  // { lessonId, questions, idx, correct }

function startQuiz(lessonId) {
  const questions = QUIZZES[lessonId];
  if (!questions) return;
  activeQuiz = { lessonId, questions, idx: 0, correct: 0 };
  document.getElementById('quizHome').classList.add('hidden');
  document.getElementById('quizResult').classList.add('hidden');
  document.getElementById('quizRunner').classList.remove('hidden');
  renderQuizQuestion();
}

function exitQuizRunner() {
  activeQuiz = null;
  document.getElementById('quizRunner').classList.add('hidden');
  document.getElementById('quizResult').classList.add('hidden');
  document.getElementById('quizHome').classList.remove('hidden');
}

function renderQuizQuestion() {
  const { lessonId, questions, idx } = activeQuiz;
  const q = questions[idx];
  const lesson = LESSONS.find(l => l.id === lessonId);
  document.getElementById('quizTopic').textContent = `${lesson.icon} ${lesson.title}`;
  document.getElementById('quizCount').textContent = `Question ${idx + 1} / ${questions.length}`;
  document.getElementById('quizQuestion').innerHTML = formatInline(q.q);

  const opts = document.getElementById('quizOptions');
  opts.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = formatInline(opt);
    btn.addEventListener('click', () => answerQuiz(i));
    opts.appendChild(btn);
  });

  const exp = document.getElementById('quizExplain');
  exp.classList.add('hidden');
  exp.innerHTML = '';
  document.getElementById('quizNext').classList.add('hidden');
}

function answerQuiz(choice) {
  const { questions, idx } = activeQuiz;
  const q = questions[idx];
  const options = document.querySelectorAll('.quiz-option');
  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === choice) btn.classList.add('wrong');
  });
  if (choice === q.correct) {
    activeQuiz.correct++;
    awardXp(5, 'correct answer');
  }
  const exp = document.getElementById('quizExplain');
  exp.innerHTML = formatInline(q.explain);
  exp.classList.remove('hidden');
  const isLast = idx === questions.length - 1;
  const nextBtn = document.getElementById('quizNext');
  nextBtn.textContent = isLast ? 'See Result →' : 'Next →';
  nextBtn.classList.remove('hidden');
}

function nextQuestion() {
  if (!activeQuiz) return;
  if (activeQuiz.idx < activeQuiz.questions.length - 1) {
    activeQuiz.idx++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  const { lessonId, questions, correct } = activeQuiz;
  const total = questions.length;
  const perfect = correct === total;
  const prior = state.quizzes[lessonId] || { best: 0, attempts: 0, perfect: false };
  const firstPerfect = perfect && !prior.perfect;
  state.quizzes[lessonId] = {
    best: Math.max(prior.best, correct),
    attempts: prior.attempts + 1,
    perfect: prior.perfect || perfect
  };
  saveState();
  let bonus = 0;
  if (firstPerfect) {
    bonus = 25;
    awardXp(25, 'perfect quiz bonus');
  }
  const lesson = LESSONS.find(l => l.id === lessonId);
  document.getElementById('resultTitle').textContent = perfect
    ? `🥷 ${lesson.title} — Perfect!`
    : `${lesson.title} — ${correct}/${total}`;
  document.getElementById('resultScore').textContent = perfect
    ? 'You aced it. The scroll is yours.'
    : 'Review the lesson and try again to ace it.';
  const earned = correct * 5 + bonus;
  document.getElementById('resultXp').textContent = `+${earned} XP earned`;

  document.getElementById('quizRunner').classList.add('hidden');
  document.getElementById('quizResult').classList.remove('hidden');
  renderLessonsGrid('quizGrid', 'quiz');
  renderLessonsGrid('lessonGrid', 'lesson');
}

function initQuiz() {
  document.getElementById('quizNext').addEventListener('click', nextQuestion);
  document.getElementById('quizBack').addEventListener('click', exitQuizRunner);
  document.getElementById('resultBack').addEventListener('click', exitQuizRunner);
  document.getElementById('resultRetry').addEventListener('click', () => {
    if (activeQuiz) startQuiz(activeQuiz.lessonId);
  });
}

// Reset -------------------------------------------------------------------
function initReset() {
  document.getElementById('resetProgress').addEventListener('click', () => {
    if (!confirm('Reset all progress? This clears all XP, studied lessons, and quiz scores.')) return;
    state = structuredClone(defaultState);
    saveState();
    renderAll();
    showToast('Progress reset');
  });
}

// Init --------------------------------------------------------------------
function renderAll() {
  renderBelt();
  renderDashboard();
  renderLessonsGrid('lessonGrid', 'lesson');
  renderLessonsGrid('quizGrid', 'quiz');
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModal();
  initQuiz();
  initReset();
  renderAll();
});
