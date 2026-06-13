// js/audio-engine.js
// Controla el elemento <audio> y expone eventos útiles para la UI.

import { clamp, dispatchAppEvent } from './utils.js';

const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z"/>';

const audio = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');

let currentSource = null;
let isSeeking = false;

export function getAudio() {
  return audio;
}

export function getCurrentSource() {
  return currentSource;
}

export function setSource(track) {
  if (!track) return;

  currentSource = track;
  audio.src = track.url;
  audio.load();
  setSeeking(false);
}

export function play() {
  if (!currentSource) return Promise.reject(new Error('No hay pista cargada'));
  return audio.play().catch((error) => {
    dispatchAppEvent('audio:error', { error: error?.message || 'Error de reproducción' });
    throw error;
  });
}

export function pause() {
  audio.pause();
}

export function togglePlay() {
  if (!currentSource) return;

  if (audio.paused) {
    play();
  } else {
    pause();
  }
}

export function seek(seconds) {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = clamp(seconds, 0, audio.duration);
}

export function seekBy(offsetSeconds) {
  seek(audio.currentTime + offsetSeconds);
}

export function setSeeking(value) {
  isSeeking = Boolean(value);
}

export function isSeekingActive() {
  return isSeeking;
}

export function next() {
  dispatchAppEvent('audio:next');
}

export function previous() {
  dispatchAppEvent('audio:previous');
}

export function back10() {
  seekBy(-10);
}

export function forward10() {
  seekBy(10);
}

function updatePlayIcon() {
  playPauseBtn.setAttribute('aria-label', audio.paused ? 'Reproducir' : 'Pausar');
  playPauseIcon.innerHTML = audio.paused ? ICON_PLAY : ICON_PAUSE;
}

function attachListeners() {
  audio.addEventListener('play', () => {
    updatePlayIcon();
    dispatchAppEvent('audio:state', { state: 'playing', track: currentSource });
  });

  audio.addEventListener('pause', () => {
    updatePlayIcon();
    dispatchAppEvent('audio:state', { state: 'paused', track: currentSource });
  });

  audio.addEventListener('timeupdate', () => {
    dispatchAppEvent('audio:time', {
      currentTime: audio.currentTime,
      duration: audio.duration
    });
  });

  audio.addEventListener('loadedmetadata', () => {
    dispatchAppEvent('audio:metadata', {
      duration: audio.duration,
      track: currentSource
    });
  });

  audio.addEventListener('ended', () => {
    dispatchAppEvent('audio:ended', { track: currentSource });
  });

  audio.addEventListener('error', () => {
    dispatchAppEvent('audio:error', { error: 'No se pudo reproducir este archivo' });
  });

  playPauseBtn.addEventListener('click', () => {
    if (!currentSource) return;
    togglePlay();
  });
}

export function init() {
  updatePlayIcon();
  attachListeners();
}
