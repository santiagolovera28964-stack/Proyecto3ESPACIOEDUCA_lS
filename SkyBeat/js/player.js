/**
 * player.js
 * -------------------------------------------------------------
 * Control del elemento <audio>: play/pause, saltos de 10s,
 * búsqueda de minuto exacto, atajos de teclado y disparo de
 * eventos a otros módulos.
 *
 * Expone todo a través del objeto global SkyBeat.player.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const audio = document.getElementById('audioPlayer');
  const STEP_SECONDS = 10;
  const listeners = {};

  function emit(event) {
    (listeners[event] || []).forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
  }

  const player = {
    audio,

    load(url, autoplay = false) {
      audio.src = url;
      audio.load();
      if (autoplay) {
        audio.play().catch(() => {});
      }
      emit('load');
    },

    togglePlay() {
      if (!audio.src) return;
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    },

    seekBy(seconds) {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + seconds),
        audio.duration
      );
    },

    back10() {
      this.seekBy(-STEP_SECONDS);
    },

    forward10() {
      this.seekBy(STEP_SECONDS);
    },

    seekTo(seconds) {
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = seconds;
      }
    },

    getDuration() {
      return Number.isFinite(audio.duration) ? audio.duration : 0;
    },

    getCurrentTime() {
      return Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    },

    isPlaying() {
      return !audio.paused;
    },

    on(event, fn) {
      if (typeof fn !== 'function') return;
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },

    bindAudioEvents() {
      audio.addEventListener('timeupdate', () => emit('timeupdate'));
      audio.addEventListener('play', () => emit('play'));
      audio.addEventListener('pause', () => emit('pause'));
      audio.addEventListener('ended', () => emit('ended'));
      audio.addEventListener('error', () => emit('error'));
      audio.addEventListener('loadedmetadata', () => emit('metadata'));
    },

    /**
     * Atajos globales:
     *   Flecha izquierda  → retrocede 10s
     *   Flecha derecha    → adelanta 10s
     *   Espacio           → play/pause
     * Se ignoran cuando el foco está en un input o textarea.
     */
    bindKeyboardShortcuts() {
      document.addEventListener('keydown', (event) => {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            player.back10();
            break;
          case 'ArrowRight':
            event.preventDefault();
            player.forward10();
            break;
          case ' ':
            event.preventDefault();
            player.togglePlay();
            break;
          default:
            break;
        }
      });
    }
  };

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.player = player;
})(window);
