/**
 * playlist.js
 * -------------------------------------------------------------
 * Gestiona la cola de reproducción: estado, carga de canciones,
 * saltos entre pistas y notificaciones a otros módulos.
 *
 * Expone todo a través del objeto global SkyBeat.playlist.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const state = {
    tracks: [],
    currentIndex: -1
  };

  const listeners = [];

  const playlist = {
    getState() {
      return {
        tracks: state.tracks.slice(),
        currentIndex: state.currentIndex
      };
    },

    getCurrentTrack() {
      return state.tracks[state.currentIndex] || null;
    },

    /**
     * Reemplaza la cola completa con un nuevo arreglo de pistas.
     * @param {Array<{fileName:string, displayName:string, url:string, file?:File}>} tracks
     */
    replace(tracks) {
      state.tracks = Array.isArray(tracks) ? tracks.slice() : [];
      state.currentIndex = -1;
      this._notify('replace');
    },

    load(index) {
      if (!state.tracks.length) return;
      state.currentIndex = Math.max(0, Math.min(state.tracks.length - 1, index));
      this._notify('load');
    },

    next() {
      if (!state.tracks.length) return null;
      state.currentIndex = (state.currentIndex + 1) % state.tracks.length;
      this._notify('next');
      return state.tracks[state.currentIndex];
    },

    previous() {
      if (!state.tracks.length) return null;
      state.currentIndex = (state.currentIndex - 1 + state.tracks.length) % state.tracks.length;
      this._notify('previous');
      return state.tracks[state.currentIndex];
    },

    onChange(fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },

    _notify(reason) {
      listeners.forEach((fn) => {
        try { fn(reason); } catch (err) { console.error(err); }
      });
    }
  };

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.playlist = playlist;
})(window);
