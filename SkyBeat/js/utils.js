// js/utils.js
// Utilidades compartidas para formateo y validación.

export const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'flac', 'webm'];
export const AUDIO_MIME_PREFIX = 'audio/';

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const secs = String(whole % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

export function cleanName(fileName) {
  return String(fileName).replace(/\.[^.]+$/, '');
}

export function getExtension(fileName) {
  const match = String(fileName).match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

export function isAudioFile(file) {
  const byType = file.type && file.type.startsWith(AUDIO_MIME_PREFIX);

  if (byType) return true;

  const ext = getExtension(file.name);
  return AUDIO_EXTENSIONS.includes(ext);
}

export function supportsDirectoryPicker() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function dispatchAppEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(`skybeat:${name}`, { detail }));
}

export function listenAppEvent(name, handler) {
  const wrapper = (event) => handler(event.detail);
  window.addEventListener(`skybeat:${name}`, wrapper);
  return () => window.removeEventListener(`skybeat:${name}`, wrapper);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
