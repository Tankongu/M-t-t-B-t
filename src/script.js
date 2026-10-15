const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
$('#year').textContent = new Date().getFullYear();
$('#todayDate').textContent = new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());

const menuToggle = $('#menuToggle');
const nav = $('#nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '×' : '☰';
});
$$('#nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); menuToggle.textContent='☰';
}));

// Interactive daily study planner
let tasks = [];
const taskForm = $('#taskForm');
const taskInput = $('#taskInput');
const taskList = $('#taskList');
function renderTasks() {
  taskList.innerHTML = '';
  if (!tasks.length) taskList.innerHTML = '<div class="empty-state">Thêm nhiệm vụ đầu tiên của bạn nhé ✨</div>';
  tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'user-task' + (task.done ? ' done' : '');
    const check = document.createElement('input');
    check.type = 'checkbox'; check.checked = task.done; check.setAttribute('aria-label','Đánh dấu hoàn thành');
    check.addEventListener('change', () => { task.done = check.checked; renderTasks(); });
    const text = document.createElement('span'); text.textContent = task.title;
    const remove = document.createElement('button'); remove.className = 'delete-task'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label','Xóa nhiệm vụ');
    remove.addEventListener('click', () => { tasks = tasks.filter(item => item.id !== task.id); renderTasks(); });
    row.append(check,text,remove); taskList.append(row);
  });
  const done = tasks.filter(t => t.done).length;
  $('#taskSummary').textContent = `${done} / ${tasks.length} nhiệm vụ hoàn thành`;
  $('#plannerProgress').style.width = tasks.length ? `${done/tasks.length*100}%` : '0%';
}
taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  tasks.push({id: Date.now()+Math.random(), title, done:false});
  taskInput.value = ''; renderTasks(); taskInput.focus();
});
$('#clearDone').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); renderTasks(); });
renderTasks();

// Focus timer: countdown pauses/resets cleanly when a mode changes.
let duration = 25 * 60;
let remaining = duration;
let interval = null;
let running = false;
let currentLabel = 'Tập trung';
const display = $('#timerDisplay');
const ring = $('#timerRing');
const startButton = $('#timerStart');
function paintTimer() {
  const minutes = Math.floor(remaining/60).toString().padStart(2,'0');
  const seconds = (remaining%60).toString().padStart(2,'0');
  display.textContent = minutes + ':' + seconds;
  $('#timerLabel').textContent = currentLabel.toLocaleUpperCase('vi-VN');
  $('#timerStatus').textContent = running ? 'Đang chạy · Hãy tập trung' : remaining === 0 ? 'Hoàn thành phiên này!' : 'Sẵn sàng bắt đầu';
  const progress = duration ? (duration-remaining)/duration : 0;
  ring.style.background = `conic-gradient(var(--purple) ${progress*100}%, #eeecf7 0)`;
  startButton.textContent = running ? 'Tạm dừng' : remaining === 0 ? 'Bắt đầu lại' : 'Bắt đầu';
}
function stopTimer() { if (interval) clearInterval(interval); interval = null; running = false; }
function tick() {
  if (remaining > 0) remaining--;
  if (remaining === 0) { stopTimer(); paintTimer(); startButton.textContent = 'Bắt đầu lại'; return; }
  paintTimer();
}
startButton.addEventListener('click', () => {
  if (running) { stopTimer(); paintTimer(); return; }
  if (remaining === 0) remaining = duration;
  running = true;
  interval = setInterval(tick, 1000);
  paintTimer();
});
$('#timerReset').addEventListener('click', () => { stopTimer(); remaining = duration; paintTimer(); });
$$('.mode').forEach(button => button.addEventListener('click', () => {
  stopTimer();
  $$('.mode').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  duration = Number(button.dataset.minutes)*60;
  remaining = duration;
  currentLabel = button.dataset.label;
  paintTimer();
}));
paintTimer();

// Group intro motion: small pointer parallax, sparse falling particles, no audio.
// Pause decorative motion whenever the tab is hidden or the section leaves the viewport.
(() => {
  const scene = $('.intro-scene');
  if (!scene) return;
  const particlesLayer = $('.intro-particles');
  const groupPhoto = $('.intro-photo');
  if (groupPhoto) groupPhoto.addEventListener('error', () => { groupPhoto.style.display = 'none'; scene.classList.add('intro-image-missing'); });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  if (!reducedMotion.matches && particlesLayer) {
    for (let i = 0; i < 14; i++) {
      const particle = document.createElement('span');
      particle.className = 'intro-particle';
      particle.style.left = (4 + Math.random() * 92) + '%';
      particle.style.setProperty('--fall-duration', (10 + Math.random() * 8) + 's');
      particle.style.setProperty('--fall-delay', (-Math.random() * 16) + 's');
      particle.style.width = particle.style.height = (2 + Math.random() * 2) + 'px';
      particlesLayer.appendChild(particle);
    }
  }

  const setPaused = () => {
    const paused = document.hidden || !inView || reducedMotion.matches;
    scene.classList.toggle('is-paused', paused);
    if (paused) {
      scene.style.setProperty('--photo-x', '0px');
      scene.style.setProperty('--photo-y', '0px');
      scene.style.setProperty('--content-x', '0px');
      scene.style.setProperty('--content-y', '0px');
    }
  };

  const paintParallax = () => {
    frame = 0;
    if (document.hidden || !inView || reducedMotion.matches) return;
    scene.style.setProperty('--photo-x', (-pointerX * 9).toFixed(2) + 'px');
    scene.style.setProperty('--photo-y', (-pointerY * 6).toFixed(2) + 'px');
    scene.style.setProperty('--content-x', (pointerX * 5).toFixed(2) + 'px');
    scene.style.setProperty('--content-y', (pointerY * 3).toFixed(2) + 'px');
  };

  scene.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    const rect = scene.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    pointerY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    if (!frame) frame = requestAnimationFrame(paintParallax);
  }, { passive: true });

  scene.addEventListener('pointerleave', () => {
    pointerX = 0; pointerY = 0;
    scene.style.setProperty('--photo-x', '0px');
    scene.style.setProperty('--photo-y', '0px');
    scene.style.setProperty('--content-x', '0px');
    scene.style.setProperty('--content-y', '0px');
  }, { passive: true });

  const observer = new IntersectionObserver(entries => {
    inView = Boolean(entries[0] && entries[0].isIntersecting);
    setPaused();
  }, { threshold: 0.08 });
  observer.observe(scene);
  document.addEventListener('visibilitychange', setPaused);
  reducedMotion.addEventListener?.('change', setPaused);
  setPaused();
})();
