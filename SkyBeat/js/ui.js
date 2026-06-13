// js/ui.js
// Actualiza los textos, tiempos y progreso de la interfaz según los eventos del reproductor.

import { formatTime } from './utils.js';
import { getAudio } from './audio-engine.js';
import { getCurrentTrack, getCurrentIndex, getTracks } from './playlist.js';

const trackTitle = document.getElementById('trackTitle');
const trackInfo = document.getElementById('trackInfo');
const currentTimeEl = document.getElementById('currentTime');
const remainingTimeEl = document.getElementById('remainingTime');
const totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const playerHint = document.getElementById('playerHint');
const animatedSections = document.querySelectorAll('[data-animate]');

function updateProgressFill(duration, current) {
  const percent = duration ? (current / duration) * 100 : 0;
  progressBar.style.background = `linear-gradient(90deg, #5dc4ff 0%, #5dc4ff ${percent}%, rgba(18, 52, 82, 0.12) ${percent}%, rgba(18, 52, 82, 0.12) 100%)`;
}

function updateNowPlayingMeta() {
  const track = getCurrentTrack();
  const audio = getAudio();

  if (!track) {
    trackTitle.textContent = 'Sin canción cargada';
    trackInfo.textContent = 'Carga la carpeta musicas/ para comenzar.';
    currentTimeEl.textContent = '0:00';
    remainingTimeEl.textContent = '-0:00';
    totalTimeEl.textContent = '0:00';
    playerHint.textContent = 'El reproductor se activará cuando cargues al menos una canción. Usa la carpeta musicas/ o sube archivos manualmente.';
    return;
  }

  trackTitle.textContent = track.displayName;
  trackInfo.textContent = `${getCurrentIndex() + 1} de ${getTracks().length} canciones cargadas.`;

  playerHint.textContent = audio.paused
    ? 'Listo para reproducir. Usa el botón principal o selecciona otra pista desde la lista.'
    : 'La pista está sonando. Mueve la barra, salta entre canciones o avanza y retrocede 10 segundos.';

  updateTime(currentTimeEl, audio.currentTime);
  updateTime(totalTimeEl, audio.duration);
  updateTime(remainingTimeEl, Math.max((audio.duration || 0) - audio.currentTime, 0), true);
}

function updateTime(node, seconds, isRemaining = false) {
  if (!node) return;
  const formatted = formatTime(seconds || 0);
  node.textContent = isRemaining ? `-${formatted}` : formatted;
}

function refreshTime(eventDetail = {}) {
  const { currentTime = getAudio().currentTime, duration = getAudio().duration } = eventDetail || {};

  updateTime(currentTimeEl, currentTime);
  updateTime(totalTimeEl, duration);
  updateTime(remainingTimeEl, Math.max(duration - currentTime, 0), true);

  if (Number.isFinite(duration) && duration > 0) {
    progressBar.max = duration;
    progressBar.value = currentTime;
  }

  updateProgressFill(duration, currentTime);
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.18 });

  animatedSections.forEach((section) => observer.observe(section));
}

export function init() {
  progressBar.addEventListener('input', () => {
    const value = Number(progressBar.value);
    updateTime(currentTimeEl, value);
    const duration = getAudio().duration || 0;
    updateTime(remainingTimeEl, Math.max(duration - value, 0), true);
    updateProgressFill(duration, value);
  });

  progressBar.addEventListener('change', () => {
    const audio = getAudio();
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Number(progressBar.value);
    }
    refreshTime();
  });

  window.addEventListener('skybeat:audio:time', (event) => {
    refreshTime(event.detail);
  });

  window.addEventListener('skybeat:audio:metadata', () => {
    refreshTime();
  });

  window.addEventListener('skybeat:audio:state', () => {
    updateNowPlayingMeta();
  });

  window.addEventListener('skybeat:track:changed', () => {
    updateNowPlayingMeta();
  });

  window.addEventListener('skybeat:track:loaded', () => {
    updateNowPlayingMeta();
  });

  initScrollAnimations();
  updateNowPlayingMeta();
}
