// js/main.js
// Punto de entrada: conecta los módulos y coordina la lógica principal.

import { init as initAudio } from './audio-engine.js';
import { init as initFiles } from './file-loader.js';
import { init as initUI } from './ui.js';
import {
  addFiles as addTracks,
  getCurrentTrack,
  hasTracks,
  selectNext,
  selectPrevious
} from './playlist.js';
import {
  back10,
  forward10,
  pause,
  play,
  seek,
  setSeeking,
  setSource
} from './audio-engine.js';
import { formatTime } from './utils.js';

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const back10Btn = document.getElementById('back10Btn');
const forward10Btn = document.getElementById('forward10Btn');
const progressBar = document.getElementById('progressBar');

function loadCurrentTrack(shouldPlay = true) {
  const track = getCurrentTrack();
  if (!track) return;

  setSource(track);
  window.dispatchEvent(new CustomEvent('skybeat:track:loaded', { detail: { track } }));
  if (shouldPlay) {
    play().catch(() => {});
  }
}

function buildTrackFromDescriptor(descriptor) {
  return {
    id: `index-${descriptor.name}`,
    file: { name: descriptor.name, type: '' },
    name: descriptor.name,
    displayName: String(descriptor.name).replace(/\.[^.]+$/, ''),
    url: descriptor.url || `musicas/${encodeURIComponent(descriptor.name)}`,
    duration: 0,
    durationText: '--:--',
    source: 'folder'
  };
}

async function tryAutoLoadFromIndex() {
  try {
    const response = await fetch('musicas/index.json', { cache: 'no-store' });
    if (!response.ok) return 0;

    const data = await response.json();
    const files = Array.isArray(data?.files) ? data.files : [];
    if (!files.length) return 0;

    const tracks = files
      .filter((entry) => entry && entry.name)
      .map(buildTrackFromDescriptor);

    if (!tracks.length) return 0;

    addTracks(tracks.map(toSyntheticFile));
    tracks.forEach((track) => probeIndexedTrack(track));
    return tracks.length;
  } catch (_) {
    return 0;
  }
}

function toSyntheticFile(track) {
  // El módulo playlist espera objetos tipo File, pero nuestro flujo de carpeta
  // ya creó la URL. Enviamos un objeto compatible con la misma interfaz.
  return track;
}

function probeIndexedTrack(track) {
  const probe = new Audio();
  probe.preload = 'metadata';
  probe.src = track.url;
  probe.addEventListener('loadedmetadata', () => {
    track.duration = Number.isFinite(probe.duration) ? probe.duration : 0;
    track.durationText = formatTime(track.duration);
    const node = document.querySelector(`.track-item[data-id="${cssEscape(track.id)}"] .track-duration`);
    if (node) node.textContent = track.durationText;
    probe.removeAttribute('src');
    probe.load();
  }, { once: true });
}

function cssEscape(value) {
  if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
}

function attachControlEvents() {
  prevBtn.addEventListener('click', handlePrevious);
  nextBtn.addEventListener('click', handleNext);
  back10Btn.addEventListener('click', () => back10());
  forward10Btn.addEventListener('click', () => forward10());
}

function handleNext() {
  if (!hasTracks()) return;
  const audio = document.getElementById('audioPlayer');
  const willKeepPlaying = !audio.paused;
  const track = selectNext();
  if (track) loadCurrentTrack(willKeepPlaying);
}

function handlePrevious() {
  if (!hasTracks()) return;
  const audio = document.getElementById('audioPlayer');
  if (audio.currentTime > 3) {
    seek(0);
    return;
  }
  const willKeepPlaying = !audio.paused;
  const track = selectPrevious();
  if (track) loadCurrentTrack(willKeepPlaying);
}

window.addEventListener('skybeat:audio:ended', () => {
  if (!hasTracks()) return;
  const track = selectNext();
  if (track) loadCurrentTrack(true);
});

window.addEventListener('skybeat:file:folder-loaded', (event) => {
  const { count } = event.detail || {};
  if (count) {
    loadCurrentTrack(false);
  }
});

window.addEventListener('skybeat:file:files-added', (event) => {
  const { count } = event.detail || {};
  if (count) {
    loadCurrentTrack(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (!hasTracks()) return;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (event.code === 'Space') {
    event.preventDefault();
    const audio = document.getElementById('audioPlayer');
    if (audio.paused) play().catch(() => {});
    else pause();
  }

  if (event.code === 'ArrowRight') {
    if (event.shiftKey) forward10();
    else handleNext();
  }

  if (event.code === 'ArrowLeft') {
    if (event.shiftKey) back10();
    else handlePrevious();
  }
});

function bootstrap() {
  initUI();
  initFiles();
  initAudio();
  attachControlEvents();
  tryAutoLoadFromIndex();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
