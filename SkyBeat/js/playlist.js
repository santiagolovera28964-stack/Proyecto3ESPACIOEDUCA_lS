// js/playlist.js
// Administra la cola de reproducción y su representación visual.

import { cleanName, formatTime, isAudioFile } from './utils.js';

const playlistEl = document.getElementById('playlist');
const emptyState = document.getElementById('playlistEmpty');
const counterEl = document.getElementById('playlistCount');

let tracks = [];
let currentIndex = -1;

export function getTracks() {
  return tracks.slice();
}

export function getCurrentIndex() {
  return currentIndex;
}

export function getTrack(index) {
  return tracks[index] || null;
}

export function getCurrentTrack() {
  return getTrack(currentIndex);
}

export function hasTracks() {
  return tracks.length > 0;
}

export function addFiles(fileList) {
  const newFiles = Array.isArray(fileList?.files)
    ? Array.from(fileList.files).filter(isAudioFile)
    : Array.from(fileList || []).filter(isAudioFile);

  const formedTracks = newFiles.map((file, index) => {
    const alreadyTrack = file && typeof file === 'object' && file.url && file.name;
    if (alreadyTrack) {
      return {
        id: file.id || `track-${Date.now()}-${index}`,
        file,
        name: file.name,
        displayName: file.displayName || cleanName(file.name),
        url: file.url,
        duration: file.duration || 0,
        durationText: file.durationText || '--:--',
        source: file.source || 'manual'
      };
    }

    return {
      id: `${file.name}-${file.size}-${file.lastModified || Date.now()}-${tracks.length + index}`,
      file,
      name: file.name,
      displayName: cleanName(file.name),
      url: URL.createObjectURL(file),
      duration: 0,
      durationText: '--:--',
      source: 'manual'
    };
  });

  if (!formedTracks.length) return [];

  tracks = tracks.concat(formedTracks);
  render();
  probeDurations(formedTracks);
  return formedTracks;
}

function probeDurations(targetTracks) {
  targetTracks.forEach((track) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = track.url;

    probe.addEventListener('loadedmetadata', () => {
      track.duration = Number.isFinite(probe.duration) ? probe.duration : 0;
      track.durationText = formatTime(track.duration);
      updateDurationBadge(track);
      probe.removeAttribute('src');
      probe.load();
    }, { once: true });

    probe.addEventListener('error', () => {
      track.durationText = '??:??';
      updateDurationBadge(track);
      probe.removeAttribute('src');
      probe.load();
    }, { once: true });
  });
}

function updateDurationBadge(track) {
  const node = playlistEl.querySelector(`.track-item[data-id="${cssEscape(track.id)}"] .track-duration`);
  if (node) node.textContent = track.durationText;
}

function cssEscape(value) {
  if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
}

function setControlsEnabled(enabled) {
  const ids = ['playPauseBtn', 'prevBtn', 'nextBtn', 'back10Btn', 'forward10Btn', 'progressBar'];
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.disabled = !enabled;
  });
}

function syncActiveItem() {
  playlistEl.querySelectorAll('.track-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.id === tracks[currentIndex]?.id);
  });
}

function render() {
  playlistEl.innerHTML = '';

  if (!tracks.length) {
    playlistEl.hidden = true;
    emptyState.hidden = false;
    counterEl.textContent = '0 temas';
    setControlsEnabled(false);
    return;
  }

  playlistEl.hidden = false;
  emptyState.hidden = true;
  counterEl.textContent = `${tracks.length} tema${tracks.length === 1 ? '' : 's'}`;

  tracks.forEach((track, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'track-item';
    button.dataset.id = track.id;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `Reproducir ${track.displayName}`);

    const meta = document.createElement('span');
    meta.className = 'track-meta';

    const title = document.createElement('span');
    title.className = 'track-title';
    title.textContent = track.displayName;

    const subtitle = document.createElement('span');
    subtitle.className = 'track-subtitle';
    subtitle.textContent = track.source === 'folder' ? 'Carpeta musicas/' : 'Archivo local';

    const duration = document.createElement('span');
    duration.className = 'track-duration';
    duration.textContent = track.durationText || '--:--';

    meta.appendChild(title);
    meta.appendChild(subtitle);
    button.appendChild(meta);
    button.appendChild(duration);

    button.addEventListener('click', () => {
      selectTrack(index, true);
    });

    playlistEl.appendChild(button);
  });

  setControlsEnabled(true);
  syncActiveItem();
}

export function selectTrack(index, shouldPlay = false) {
  if (!tracks.length) return null;
  const safeIndex = ((index % tracks.length) + tracks.length) % tracks.length;
  currentIndex = safeIndex;
  syncActiveItem();
  return tracks[currentIndex];
}

export function selectNext() {
  if (!tracks.length) return null;
  return selectTrack(currentIndex + 1, true);
}

export function selectPrevious(restartIfPlaying = false) {
  if (!tracks.length) return null;

  if (restartIfPlaying) {
    return selectTrack(currentIndex - 1, true);
  }

  return selectTrack(currentIndex - 1, false);
}

export function clear() {
  tracks.forEach((track) => {
    if (track.url) URL.revokeObjectURL(track.url);
  });

  tracks = [];
  currentIndex = -1;
  render();
}
