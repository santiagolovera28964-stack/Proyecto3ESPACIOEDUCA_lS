/**
 * app.js
 * -------------------------------------------------------------
 * Módulo inicial: conecta los demás módulos, gestiona la carga
 * de archivos de audio desde el input, registra el botón toggle
 * para mostrar/ocultar la barra y orquesta toda la aplicación.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const { playlist, player, ui, utils, db } = root.SkyBeat;

  let seeking = false;
  let barVisible = false;

  /**
   * Carga las canciones guardadas en IndexedDB al iniciar.
   */
  async function loadPersistedTracks() {
    const savedTracks = await db.getAllTracks();
    if (savedTracks && savedTracks.length > 0) {
      const tracks = savedTracks.map(t => ({
        ...t,
        url: URL.createObjectURL(t.file),
        durationText: '--:--'
      }));
      playlist.replace(tracks);
      playlist.load(0);
      player.load(tracks[0].url, false);
      ui.showBar();
      barVisible = true;
      syncView('replace');
    }
  }

  /**
   * Sincroniza la vista con el estado actual del playlist.
   * @param {string} [reason]
   */
  function syncView(reason) {
    const { tracks, currentIndex } = playlist.getState();
    const current = tracks[currentIndex] || null;

    ui.setControlsEnabled(tracks.length > 0);
    ui.renderPlaylist(tracks);
    ui.setActiveTrack(currentIndex);
    ui.updateNowPlaying(current, currentIndex, tracks.length, player.isPlaying());
    ui.updatePlayIcon(player.isPlaying());

    if (reason === 'load' || reason === 'next' || reason === 'previous' || reason === 'replace') {
      player.audio.pause();
      if (current) {
        player.load(current.url, false);
      } else {
        player.audio.removeAttribute('src');
        ui.updateTimes(0, 0);
        ui.updateProgress(0, 0);
      }
    }
  }

  /**
   * Carga y reproduce la pista indicada por su índice.
   * @param {number} index
   */
  function loadAndPlay(index) {
    const { tracks } = playlist.getState();
    if (!tracks.length) return;
    playlist.load(index);
    const current = tracks[index];
    if (current) {
      player.load(current.url, true);
    }
  }

  /**
   * Procesa los archivos seleccionados por el usuario.
   * @param {FileList|File[]} fileList
   */
  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter(utils.isAudioFile);
    if (!files.length) return;

    playlist.getState().tracks.forEach((track) => {
      if (track.url && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    });

    const tracks = files.map((file) => ({
      file,
      fileName: file.name,
      displayName: utils.cleanName(file.name),
      url: URL.createObjectURL(file),
      durationText: '--:--'
    }));

    // Guardar en base de datos local para persistencia
    await db.saveTracks(tracks);

    playlist.replace(tracks);
    player.audio.pause();

    if (tracks.length) {
      playlist.load(0);
      player.load(tracks[0].url, false);
    }

    ui.showBar();
    barVisible = true;
    syncView('replace');
  }

  /**
   * Configura los eventos del DOM.
   */
  function bindDomEvents() {
    const musicInput = ui.get('musicInput');
    const playerToggle = ui.get('playerToggle');

    // Input de archivos de audio (multiple)
    if (musicInput) {
      musicInput.addEventListener('change', (event) => {
        if (event.target.files && event.target.files.length > 0) {
          handleFiles(event.target.files);
        }
        musicInput.value = '';
      });
    }

    // Botón toggle
    if (playerToggle) {
      playerToggle.addEventListener('click', () => {
        ui.toggleBar();
        barVisible = !barVisible;
      });
    }

    // Play / Pause
    ui.get('playPauseBtn').addEventListener('click', () => {
      const { tracks, currentIndex } = playlist.getState();
      if (!tracks.length) return;

      if (currentIndex < 0) {
        loadAndPlay(0);
        return;
      }

      if (!player.audio.src) {
        player.load(tracks[currentIndex].url, true);
        return;
      }

      player.togglePlay();
    });

    // Anterior
    ui.get('prevBtn').addEventListener('click', () => {
      if (!playlist.getState().tracks.length) return;

      if (player.getCurrentTime() > 3) {
        player.seekTo(0);
        return;
      }

      playlist.previous();
      const current = playlist.getCurrentTrack();
      if (current) {
        player.load(current.url, !player.audio.paused);
      }
      syncView('previous');
    });

    // Siguiente
    ui.get('nextBtn').addEventListener('click', () => {
      if (!playlist.getState().tracks.length) return;
      playlist.next();
      const current = playlist.getCurrentTrack();
      if (current) {
        player.load(current.url, !player.audio.paused);
      }
      syncView('next');
    });

    ui.get('back10Btn').addEventListener('click', () => player.back10());
    ui.get('forward10Btn').addEventListener('click', () => player.forward10());

    const progressBar = ui.get('progressBar');

    progressBar.addEventListener('input', () => {
      seeking = true;
      const value = Number(progressBar.value);
      player.seekTo(value);
      ui.updateTimes(value, player.getDuration());
      ui.updateProgress(value, player.getDuration());
    });

    progressBar.addEventListener('change', () => {
      seeking = false;
      player.seekTo(Number(progressBar.value));
      ui.updateTimes(player.getCurrentTime(), player.getDuration());
      ui.updateProgress(player.getCurrentTime(), player.getDuration());
    });

    playlist.onChange(syncView);
  }

  /**
   * Conecta los eventos del reproductor con la UI.
   */
  function bindPlayerEvents() {
    player.bindAudioEvents();
    player.bindKeyboardShortcuts();

    player.on('timeupdate', () => {
      if (seeking) return;
      ui.updateTimes(player.getCurrentTime(), player.getDuration());
      ui.updateProgress(player.getCurrentTime(), player.getDuration());
    });

    player.on('play', () => {
      ui.updatePlayIcon(true);
      ui.setToggleGlimmer(true);
      const { tracks, currentIndex } = playlist.getState();
      ui.updateNowPlaying(tracks[currentIndex] || null, currentIndex, tracks.length, true);
    });

    player.on('pause', () => {
      ui.updatePlayIcon(false);
      ui.setToggleGlimmer(false);
      const { tracks, currentIndex } = playlist.getState();
      ui.updateNowPlaying(tracks[currentIndex] || null, currentIndex, tracks.length, false);
    });

    player.on('ended', () => {
      playlist.next();
      const current = playlist.getCurrentTrack();
      if (current) {
        player.load(current.url, true);
      }
      syncView('next');
    });

    player.on('error', () => {
      ui.updatePlayIcon(false);
      ui.setToggleGlimmer(false);
      const infoEl = ui.get('trackInfo');
      if (infoEl) {
        infoEl.textContent = 'No se pudo reproducir este archivo. Prueba con otro formato.';
      }
    });

    player.on('metadata', () => {
      const { currentIndex } = playlist.getState();
      if (currentIndex < 0) return;
      const durationText = utils.formatTime(player.getDuration());
      ui.updateTrackDuration(currentIndex, durationText);
      ui.updateTimes(player.getCurrentTime(), player.getDuration());
      ui.updateProgress(player.getCurrentTime(), player.getDuration());
    });
  }

  async function init() {
    ui.cacheElements();
    ui.setControlsEnabled(false);
    ui.updateTimes(0, 0);
    ui.updateProgress(0, 0);
    ui.updatePlayIcon(false);
    ui.setupAnimations();

    ui.hideBar();
    barVisible = false;

    try {
      await db.init();
      await loadPersistedTracks();
    } catch (e) {
      console.warn("Error al cargar persistencia:", e);
    }

    bindDomEvents();
    bindPlayerEvents();

    window.addEventListener('beforeunload', () => {
      playlist.getState().tracks.forEach((track) => {
        if (track.url && track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url);
        }
      });
    });
  }

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.app = {
    init,
    loadAndPlay,
    handleFiles
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
