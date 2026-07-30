'use strict';

/* =========================================================
   STATION CONFIG
   Edit this list to set your own stations: name, logo image,
   and stream URL. Keep exactly 10 entries here (the settings
   screen lets you pick 4 favorites from this list).
   ========================================================= */
const STATIONS = [
  { id: 's1',  name: 'Groove Salad',   logo: 'logos/station1.png',  stream: 'https://ice1.somafm.com/groovesalad-256-mp3' },
  { id: 's2',  name: 'Drone Zone',     logo: 'logos/station2.png',  stream: 'https://ice1.somafm.com/dronezone-256-mp3' },
  { id: 's3',  name: 'Indie Pop',      logo: 'logos/station3.png',  stream: 'https://ice1.somafm.com/indiepop-128-mp3' },
  { id: 's4',  name: 'Lush',           logo: 'logos/station4.png',  stream: 'https://ice1.somafm.com/lush-128-mp3' },
  { id: 's5',  name: 'Beat Blender',   logo: 'logos/station5.png',  stream: 'https://ice1.somafm.com/beatblender-128-mp3' },
  { id: 's6',  name: '70s Gold',       logo: 'logos/station6.png',  stream: 'https://ice1.somafm.com/seventies-128-mp3' },
  { id: 's7',  name: 'Secret Agent',   logo: 'logos/station7.png',  stream: 'https://ice1.somafm.com/secretagent-128-mp3' },
  { id: 's8',  name: 'Space Station',  logo: 'logos/station8.png',  stream: 'https://ice1.somafm.com/spacestation-128-mp3' },
  { id: 's9',  name: 'Deep Space',     logo: 'logos/station9.png',  stream: 'https://ice1.somafm.com/deepspaceone-128-mp3' },
  { id: 's10', name: 'Suburbs of Goa', logo: 'logos/station10.png', stream: 'https://ice1.somafm.com/suburbsofgoa-128-mp3' },
];

const DEFAULT_FAVORITES = ['s1', 's2', 's6', 's8'];
const STORAGE_FAVORITES = 'radio.favorites';
const STORAGE_VOLUME = 'radio.volume';

/* =========================================================
   STATE
   ========================================================= */
let favorites = loadFavorites();
let currentStation = null;
let clockInterval = null;
let wakeLock = null;

const audio = document.getElementById('audio-player');

/* =========================================================
   ELEMENTS
   ========================================================= */
const mainScreen = document.getElementById('main-screen');
const playerScreen = document.getElementById('player-screen');
const settingsScreen = document.getElementById('settings-screen');

const stationGrid = document.getElementById('station-grid');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsList = document.getElementById('settings-list');
const settingsCount = document.getElementById('settings-count');
const saveSettingsBtn = document.getElementById('save-settings');

const exitPlayerBtn = document.getElementById('exit-player');
const playerLogo = document.getElementById('player-logo');
const playerStationName = document.getElementById('player-station-name');
const playerClock = document.getElementById('player-clock');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const volumeSlider = document.getElementById('volume-slider');

/* =========================================================
   STORAGE HELPERS
   ========================================================= */
function loadFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_FAVORITES));
    if (Array.isArray(raw) && raw.length === 4 && raw.every(id => STATIONS.some(s => s.id === id))) {
      return raw;
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_FAVORITES.slice();
}

function saveFavorites(ids) {
  favorites = ids;
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(ids));
}

function loadVolume() {
  const v = parseInt(localStorage.getItem(STORAGE_VOLUME), 10);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 70;
}

function saveVolume(v) {
  localStorage.setItem(STORAGE_VOLUME, String(v));
}

/* =========================================================
   MAIN SCREEN
   ========================================================= */
function renderMainScreen() {
  stationGrid.innerHTML = '';
  const favStations = favorites.map(id => STATIONS.find(s => s.id === id)).filter(Boolean);

  for (let i = 0; i < 4; i++) {
    const station = favStations[i];
    const btn = document.createElement('button');
    if (station) {
      btn.className = 'station-btn';
      btn.innerHTML = `
        <img src="${station.logo}" alt="">
        <span class="station-label">${escapeHtml(station.name)}</span>
      `;
      btn.addEventListener('click', () => playStation(station));
    } else {
      btn.className = 'station-btn empty';
      btn.disabled = true;
      btn.innerHTML = `<span class="station-label">Not set</span>`;
    }
    stationGrid.appendChild(btn);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   SCREEN SWITCHING
   ========================================================= */
function showScreen(screen) {
  [mainScreen, playerScreen, settingsScreen].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

/* =========================================================
   PLAYER
   ========================================================= */
function playStation(station) {
  currentStation = station;

  playerLogo.src = station.logo;
  playerLogo.alt = station.name;
  playerStationName.textContent = station.name;
  setStatus('connecting');

  audio.pause();
  audio.src = station.stream;
  audio.volume = volumeSlider.value / 100;
  audio.load();
  const playPromise = audio.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(() => setStatus('error'));
  }

  showScreen(playerScreen);
  startClock();
  requestWakeLock();
}

function stopStation() {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  currentStation = null;
  stopClock();
  releaseWakeLock();
  showScreen(mainScreen);
}

function setStatus(state) {
  statusDot.classList.remove('playing', 'error');
  if (state === 'playing') {
    statusDot.classList.add('playing');
    statusText.textContent = 'Playing';
  } else if (state === 'error') {
    statusDot.classList.add('error');
    statusText.textContent = 'No signal — tap here to retry';
  } else {
    statusText.textContent = 'Connecting…';
  }
}

audio.addEventListener('playing', () => setStatus('playing'));
audio.addEventListener('waiting', () => setStatus('connecting'));
audio.addEventListener('error', () => setStatus('error'));
audio.addEventListener('stalled', () => setStatus('error'));

document.getElementById('player-status').addEventListener('click', () => {
  if (currentStation && (audio.paused || audio.error)) {
    playStation(currentStation);
  }
});
playerLogo.addEventListener('click', () => {
  if (currentStation && (audio.paused || audio.error)) {
    playStation(currentStation);
  }
});

exitPlayerBtn.addEventListener('click', stopStation);

/* =========================================================
   CLOCK
   ========================================================= */
function startClock() {
  updateClock();
  stopClock();
  clockInterval = setInterval(updateClock, 1000);
}
function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  playerClock.textContent = `${hh}:${mm}`;
}

/* =========================================================
   VOLUME
   ========================================================= */
volumeSlider.value = loadVolume();
volumeSlider.addEventListener('input', () => {
  const v = parseInt(volumeSlider.value, 10);
  audio.volume = v / 100;
  saveVolume(v);
});

/* =========================================================
   WAKE LOCK (keep screen on while playing, best effort)
   ========================================================= */
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) { /* not critical */ }
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentStation && !audio.paused) {
    requestWakeLock();
  }
});

/* =========================================================
   SETTINGS SCREEN
   ========================================================= */
let pendingFavorites = [];

openSettingsBtn.addEventListener('click', () => {
  pendingFavorites = favorites.slice();
  renderSettingsList();
  showScreen(settingsScreen);
});

closeSettingsBtn.addEventListener('click', () => {
  showScreen(mainScreen);
});

function renderSettingsList() {
  settingsList.innerHTML = '';
  STATIONS.forEach(station => {
    const checked = pendingFavorites.includes(station.id);
    const li = document.createElement('li');
    li.className = 'settings-item' + (checked ? ' checked' : '');
    li.innerHTML = `
      <img src="${station.logo}" alt="">
      <span class="settings-name">${escapeHtml(station.name)}</span>
      <input type="checkbox" ${checked ? 'checked' : ''} data-id="${station.id}">
    `;
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => onToggleStation(station.id, checkbox));
    li.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        onToggleStation(station.id, checkbox);
      }
    });
    settingsList.appendChild(li);
  });
  updateSettingsFooter();
}

function onToggleStation(id, checkbox) {
  if (checkbox.checked) {
    if (pendingFavorites.length >= 4) {
      checkbox.checked = false;
      return;
    }
    pendingFavorites.push(id);
  } else {
    pendingFavorites = pendingFavorites.filter(x => x !== id);
  }
  renderSettingsList();
}

function updateSettingsFooter() {
  settingsCount.textContent = `${pendingFavorites.length} / 4 selected`;
  saveSettingsBtn.disabled = pendingFavorites.length !== 4;

  const items = settingsList.querySelectorAll('.settings-item');
  items.forEach(item => {
    const cb = item.querySelector('input');
    const isChecked = cb.checked;
    item.classList.toggle('disabled', !isChecked && pendingFavorites.length >= 4);
    cb.disabled = !isChecked && pendingFavorites.length >= 4;
  });
}

saveSettingsBtn.addEventListener('click', () => {
  if (pendingFavorites.length === 4) {
    saveFavorites(pendingFavorites);
    renderMainScreen();
    showScreen(mainScreen);
  }
});

/* =========================================================
   INIT
   ========================================================= */
renderMainScreen();
showScreen(mainScreen);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
