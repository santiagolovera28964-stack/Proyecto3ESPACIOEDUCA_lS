/**
 * utils.js
 * -------------------------------------------------------------
 * Funciones auxiliares puras utilizadas por varios módulos:
 * formateo de tiempos, limpieza de nombres, sanitización y
 * pequeñas utilidades de detección.
 *
 * Expone todo a través del objeto global SkyBeat.utils.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const utils = {
    ICON_PLAY: '<path d="M8 5v14l11-7z"></path>',
    ICON_PAUSE: '<path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z"></path>',

    /**
     * Convierte un número de segundos a una cadena legible m:ss.
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00';
      }
      const whole = Math.floor(seconds);
      const minutes = Math.floor(whole / 60);
      const secs = String(whole % 60).padStart(2, '0');
      return `${minutes}:${secs}`;
    },

    /**
     * Quita la extensión de un nombre de archivo para mostrarlo limpio.
     * @param {string} fileName
     * @returns {string}
     */
    cleanName(fileName) {
      return String(fileName || '').replace(/\.[^.]+$/, '');
    },

    /**
     * Detecta si un archivo es de audio por su tipo MIME o por su extensión.
     * Útil para filtrar arrastres o archivos en carpetas.
     * @param {{name: string, type?: string}} file
     * @returns {boolean}
     */
    isAudioFile(file) {
      const byType = file.type && file.type.startsWith('audio/');
      const byExtension = /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm)$/i.test(file.name || '');
      return byType || byExtension;
    },

    /**
     * Escapa HTML básico para evitar inyección al construir textos.
     * @param {string} value
     * @returns {string}
     */
    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.utils = utils;
})(window);
