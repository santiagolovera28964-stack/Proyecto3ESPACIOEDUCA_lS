/**
 * ui.js
 * -------------------------------------------------------------
 * Renderiza la interfaz: lista de canciones, estado en la barra
 * inferior, tiempos, progreso con relleno azul celeste, botón
 * toggle para mostrar/ocultar el reproductor y animaciones.
 *
 * Expone todo a través del objeto global SkyBeat.ui.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const elements = {};
  const ids = [
    'playlist', 'playlistEmpty', 'playlistCount',
    'trackTitle', 'trackInfo',
    'currentTime', 'remainingTime', 'totalTime', 'progressBar',
    'playPauseBtn', 'playPauseIcon',
    'prevBtn', 'nextBtn', 'back10Btn', 'forward10Btn',
    'musicInput', 'playerBar', 'playerToggle', 'statusDot', 'statusLabel'
  ];

  const ui = {
    cacheElements() {
      ids.forEach((id) => {
        elements[id] = document.getElementById(id);
      });
    },

    get(id) {
      return elements[id] || null;
    },

    renderPlaylist(tracks) {
      const { playlist, playlistEmpty, playlistCount } = elements;

      playlist.innerHTML = '';

      if (!tracks.length) {
        playlist.hidden = true;
        playlistEmpty.hidden = false;
        playlistCount.textContent = '0 temas';
        return;
      }

      playlist.hidden = false;
      playlistEmpty.hidden = true;
      playlistCount.textContent = `${tracks.length} tema${tracks.length === 1 ? '' : 's'}`;

      tracks.forEach((track, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'track-item';
        button.dataset.index = String(index);
        button.setAttribute('aria-label', `Reproducir ${track.displayName}`);

        const meta = document.createElement('span');
        meta.className = 'track-meta';

        const title = document.createElement('span');
        title.className = 'track-title';
        title.textContent = track.displayName;

        const subtitle = document.createElement('span');
        subtitle.className = 'track-subtitle';
        subtitle.textContent = 'Archivo local';

        const duration = document.createElement('span');
        duration.className = 'track-duration';
        duration.dataset.duration = String(index);
        duration.textContent = track.durationText || '--:--';

        meta.appendChild(title);
        meta.appendChild(subtitle);
        button.appendChild(meta);
        button.appendChild(duration);

        button.addEventListener('click', () => {
          root.SkyBeat.app.loadAndPlay(index);
        });

        playlist.appendChild(button);
      });
    },

    setActiveTrack(index) {
      document.querySelectorAll('.track-item').forEach((item) => {
        item.classList.toggle('active', Number(item.dataset.index) === index);
      });
    },

    updateNowPlaying(track, index, total, isPlaying) {
      const { trackTitle, trackInfo, statusLabel } = elements;

      if (!track) {
        trackTitle.textContent = 'Sin canción cargada';
        trackInfo.textContent = 'Selecciona archivos de audio para comenzar.';
        if (statusLabel) statusLabel.textContent = 'Reproducción local';
        return;
      }

      trackTitle.textContent = track.displayName;
      trackInfo.textContent = `${index + 1} de ${total}` + (isPlaying ? ' · Reproduciendo' : ' · En pausa');
      if (statusLabel) {
        statusLabel.textContent = isPlaying ? 'Reproduciendo' : 'En pausa';
      }
    },

    updateTimes(current, duration) {
      const { currentTime, totalTime, remainingTime } = elements;
      const remaining = Math.max(duration - current, 0);
      currentTime.textContent = root.SkyBeat.utils.formatTime(current);
      totalTime.textContent = root.SkyBeat.utils.formatTime(duration);
      remainingTime.textContent = `-${root.SkyBeat.utils.formatTime(remaining)}`;
    },

    updateProgress(current, duration) {
      const { progressBar } = elements;
      if (Number.isFinite(duration) && duration > 0) {
        progressBar.max = duration;
        progressBar.value = current;
      }
      const percent = duration ? (current / duration) * 100 : 0;
      progressBar.style.background =
        `linear-gradient(90deg, #5dc4ff 0%, #5dc4ff ${percent}%, rgba(18, 52, 82, 0.14) ${percent}%, rgba(18, 52, 82, 0.14) 100%)`;
    },

    updatePlayIcon(isPlaying) {
      const { playPauseBtn, playPauseIcon } = elements;
      playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
      playPauseIcon.innerHTML = isPlaying ? root.SkyBeat.utils.ICON_PAUSE : root.SkyBeat.utils.ICON_PLAY;
    },

    setControlsEnabled(enabled) {
      ['playPauseBtn', 'prevBtn', 'nextBtn', 'back10Btn', 'forward10Btn', 'progressBar']
        .forEach((id) => {
          elements[id].disabled = !enabled;
        });
    },

    updateTrackDuration(index, durationText) {
      const badge = document.querySelector(`.track-item[data-index="${index}"] .track-duration`);
      if (badge) {
        badge.textContent = durationText;
      }
    },

    /**
     * Muestra la barra del reproductor.
     */
    showBar() {
      const { playerBar, playerToggle } = elements;
      playerBar.classList.remove('hidden');
      playerToggle.classList.remove('bar-hidden');
      playerToggle.classList.add('bar-visible');
      playerToggle.setAttribute('aria-label', 'Ocultar reproductor');
      playerToggle.classList.add('showing');
    },

    /**
     * Oculta la barra del reproductor.
     */
    hideBar() {
      const { playerBar, playerToggle } = elements;
      playerBar.classList.add('hidden');
      playerToggle.classList.remove('bar-visible');
      playerToggle.classList.add('bar-hidden');
      playerToggle.setAttribute('aria-label', 'Mostrar reproductor');
      playerToggle.classList.remove('showing');
    },

    /**
     * Alterna entre mostrar/ocultar la barra.
     */
    toggleBar() {
      const { playerBar } = elements;
      if (playerBar.classList.contains('hidden')) {
        this.showBar();
      } else {
        this.hideBar();
      }
    },

    /**
     * Muestra u oculta el indicador luminoso del botón toggle.
     * @param {boolean} isPlaying
     */
    setToggleGlimmer(isPlaying) {
      const glimmer = elements.playerToggle.querySelector('.toggle-glimmer');
      if (glimmer) {
        glimmer.classList.toggle('active', isPlaying);
      }
    },

    setupAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, { threshold: 0.18 });

      document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    }
  };

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.ui = ui;
})(window);
