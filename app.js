const GLASS_ML = 250;
const BASE_LITERS = 3.5;
const WORKOUT_LITERS = 4.0;
const CAFFEINE_BUMP_ML = 150;
const WAKE_HOUR = 7;
const SLEEP_HOUR = 23;
const STORAGE_PREFIX = 'wt_';
const LAST_CHECK_KEY = 'wt_last_check_iso';
const SPACE_KEY = 'wt_sync_space';

const TYPE_LABEL = { water: 'Water', buttermilk: 'Buttermilk', tea: 'Tea', coffee: 'Coffee' };

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadDay(key) {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  return raw ? JSON.parse(raw) : { workout: false, entries: [] };
}

function saveDay(key, data) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
}

function computeTargets(day) {
  const caffeineCount = day.entries.filter((e) => e.type === 'tea' || e.type === 'coffee').length;
  const liters = (day.workout ? WORKOUT_LITERS : BASE_LITERS) + (caffeineCount * CAFFEINE_BUMP_ML) / 1000;
  const glasses = Math.ceil((liters * 1000) / GLASS_ML);
  return { liters, glasses, caffeineCount };
}

function expectedGlassesByNow(targetGlasses, now = new Date()) {
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour <= WAKE_HOUR) return 0;
  if (hour >= SLEEP_HOUR) return targetGlasses;
  const fraction = (hour - WAKE_HOUR) / (SLEEP_HOUR - WAKE_HOUR);
  return Math.round(targetGlasses * fraction);
}

const today = dateKey();
let day = loadDay(today);

const el = {
  todayLabel: document.getElementById('today-label'),
  notifBtn: document.getElementById('notif-btn'),
  syncBtn: document.getElementById('sync-btn'),
  syncStatus: document.getElementById('sync-status'),
  catchupBanner: document.getElementById('catchup-banner'),
  catchupText: document.getElementById('catchup-text'),
  catchupDismiss: document.getElementById('catchup-dismiss'),
  workoutToggle: document.getElementById('workout-toggle'),
  ringFg: document.getElementById('ring-fg'),
  glassesCount: document.getElementById('glasses-count'),
  glassesTarget: document.getElementById('glasses-target'),
  litersSoFar: document.getElementById('liters-so-far'),
  litersTarget: document.getElementById('liters-target'),
  paceText: document.getElementById('pace-text'),
  timeline: document.getElementById('timeline'),
  timelineEmpty: document.getElementById('timeline-empty'),
  history: document.getElementById('history'),
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

function render() {
  el.todayLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric',
  });
  el.workoutToggle.checked = day.workout;

  const { liters, glasses, caffeineCount } = computeTargets(day);
  const waterGlasses = day.entries.filter((e) => e.type === 'water').length;
  const litersSoFar = (waterGlasses * GLASS_ML) / 1000;

  el.glassesCount.textContent = waterGlasses;
  el.glassesTarget.textContent = glasses;
  el.litersSoFar.textContent = litersSoFar.toFixed(2);
  el.litersTarget.textContent = liters.toFixed(2);

  const pct = Math.min(1, waterGlasses / glasses);
  el.ringFg.style.strokeDasharray = String(RING_CIRCUMFERENCE);
  el.ringFg.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct));

  const expected = expectedGlassesByNow(glasses);
  if (waterGlasses >= expected) {
    el.paceText.textContent = caffeineCount
      ? `On pace · +${caffeineCount} caffeinated drink${caffeineCount > 1 ? 's' : ''} today`
      : 'On pace for today';
  } else {
    el.paceText.textContent = `${expected - waterGlasses} glass${expected - waterGlasses > 1 ? 'es' : ''} behind pace`;
  }

  el.timeline.innerHTML = '';
  const sorted = [...day.entries].sort((a, b) => b.ts.localeCompare(a.ts));
  el.timelineEmpty.classList.toggle('hidden', sorted.length > 0);
  for (const entry of sorted) {
    const li = document.createElement('li');
    const time = new Date(entry.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    li.innerHTML = `<span>${TYPE_LABEL[entry.type]}</span><span class="muted">${time}</span>`;
    el.timeline.appendChild(li);
  }

  renderHistory();
}

function renderHistory() {
  const dayKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const keys = Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX) && dayKeyPattern.test(k.slice(STORAGE_PREFIX.length)) && k !== STORAGE_PREFIX + today)
    .sort()
    .reverse()
    .slice(0, 7);

  el.history.innerHTML = '';
  if (keys.length === 0) {
    el.history.innerHTML = '<li class="muted">No history yet.</li>';
    return;
  }
  for (const key of keys) {
    const d = JSON.parse(localStorage.getItem(key));
    const { glasses } = computeTargets(d);
    const waterGlasses = d.entries.filter((e) => e.type === 'water').length;
    const met = waterGlasses >= glasses;
    const li = document.createElement('li');
    const label = key.slice(STORAGE_PREFIX.length);
    li.innerHTML = `<span>${label}${d.workout ? ' 🏋️' : ''}</span><span class="${met ? 'met' : 'missed'}">${waterGlasses}/${glasses} glasses</span>`;
    el.history.appendChild(li);
  }
}

function logDrink(type) {
  const entry = { id: crypto.randomUUID(), type, ts: new Date().toISOString(), date: today };
  day.entries.push(entry);
  saveDay(today, day);
  render();
  pushEntry(entry);
}

el.workoutToggle.addEventListener('change', () => {
  day.workout = el.workoutToggle.checked;
  saveDay(today, day);
  render();
  pushWorkout(today, day.workout);
});

document.querySelectorAll('.log-btn').forEach((btn) => {
  btn.addEventListener('click', () => logDrink(btn.dataset.type));
});

el.catchupDismiss.addEventListener('click', () => {
  el.catchupBanner.classList.add('hidden');
});

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('sw.js');
  } catch (err) {
    console.error('Service worker registration failed', err);
    return null;
  }
}

async function notify(title, body) {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    reg.showNotification(title, { body, icon: 'icon.svg', badge: 'icon.svg' });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'icon.svg' });
  }
}

function updateNotifBtn() {
  const granted = 'Notification' in window && Notification.permission === 'granted';
  el.notifBtn.classList.toggle('active', granted);
  el.notifBtn.title = granted ? 'Hourly reminders on' : 'Enable hourly reminders';
}

el.notifBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications.');
    return;
  }
  await Notification.requestPermission();
  updateNotifBtn();
});

let syncModulePromise = null;
function loadSyncModule() {
  // Dynamic import keeps the Firebase SDK (and its CDN fetches) out of the
  // load path entirely until sync is actually turned on, so the app stays
  // fully usable offline when it isn't configured.
  if (!syncModulePromise) syncModulePromise = import('./firebase-sync.js');
  return syncModulePromise;
}

function getSpaceId() {
  return localStorage.getItem(SPACE_KEY);
}

async function pushEntry(entry) {
  const spaceId = getSpaceId();
  if (!spaceId) return;
  try {
    const { logEntryRemote } = await loadSyncModule();
    await logEntryRemote(spaceId, entry);
  } catch (err) {
    console.error('Sync push failed (will retry once Firestore reconnects)', err);
  }
}

async function pushWorkout(date, workout) {
  const spaceId = getSpaceId();
  if (!spaceId) return;
  try {
    const { setWorkoutRemote } = await loadSyncModule();
    await setWorkoutRemote(spaceId, date, workout);
  } catch (err) {
    console.error('Sync push failed (will retry once Firestore reconnects)', err);
  }
}

function applyRemoteEntries(entries) {
  const byDate = {};
  for (const entry of entries) {
    (byDate[entry.date] ??= []).push(entry);
  }
  for (const [date, list] of Object.entries(byDate)) {
    const existing = loadDay(date);
    existing.entries = list;
    saveDay(date, existing);
  }
  if (byDate[today]) day = loadDay(today);
  render();
}

function applyRemoteDays(days) {
  for (const d of days) {
    const existing = loadDay(d.date);
    existing.workout = !!d.workout;
    saveDay(d.date, existing);
  }
  if (days.some((d) => d.date === today)) day = loadDay(today);
  render();
}

let unsubscribeSpace = null;
async function startSync(spaceId) {
  if (unsubscribeSpace) unsubscribeSpace();
  try {
    const { subscribeToSpace } = await loadSyncModule();
    unsubscribeSpace = subscribeToSpace(spaceId, (kind, data) => {
      if (kind === 'entries') applyRemoteEntries(data);
      else applyRemoteDays(data);
      const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      el.syncStatus.textContent = `Synced · ${time}`;
    });
  } catch (err) {
    console.error('Could not start sync', err);
    el.syncStatus.textContent = 'Sync failed to connect';
  }
}

function updateSyncBtn() {
  const on = !!getSpaceId();
  el.syncBtn.classList.toggle('active', on);
  el.syncBtn.title = on ? 'Sync connected (tap to change or disconnect)' : 'Connect sync across devices';
}

el.syncBtn.addEventListener('click', () => {
  const current = getSpaceId() || '';
  const value = prompt('Shared sync ID — use the exact same value on every device you want linked:', current);
  if (value === null) return;
  const trimmed = value.trim();
  localStorage.removeItem(SPACE_KEY);
  if (unsubscribeSpace) {
    unsubscribeSpace();
    unsubscribeSpace = null;
  }
  el.syncStatus.textContent = '';
  if (trimmed) {
    localStorage.setItem(SPACE_KEY, trimmed);
    startSync(trimmed);
  }
  updateSyncBtn();
});

function withinWakeWindow(now = new Date()) {
  const h = now.getHours();
  return h >= WAKE_HOUR && h < SLEEP_HOUR;
}

function checkCatchUp() {
  const lastIso = localStorage.getItem(LAST_CHECK_KEY);
  if (!lastIso) return;
  const last = new Date(lastIso);
  const now = new Date();
  const hoursSince = (now - last) / 3600000;
  if (hoursSince >= 2 && withinWakeWindow(now)) {
    const hrs = Math.floor(hoursSince);
    el.catchupText.textContent = `It's been ${hrs} hours since you last checked in. Log your water to stay on track.`;
    el.catchupBanner.classList.remove('hidden');
  }
}

function startHourlyScheduler() {
  let lastFiredHour = null;
  setInterval(() => {
    const now = new Date();
    localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
    if (!withinWakeWindow(now)) return;
    if (now.getHours() === lastFiredHour) return;
    lastFiredHour = now.getHours();
    notify('Water check-in', 'How many glasses have you had this hour? Tap to log.');
  }, 60 * 1000);
}

(async function init() {
  checkCatchUp();
  render();
  await registerServiceWorker();
  updateNotifBtn();
  updateSyncBtn();
  const spaceId = getSpaceId();
  if (spaceId) startSync(spaceId);
  startHourlyScheduler();
  window.addEventListener('focus', () => {
    day = loadDay(today);
    checkCatchUp();
    render();
  });
})();
