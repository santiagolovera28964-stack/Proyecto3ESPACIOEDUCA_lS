/**
 * db.js
 * -------------------------------------------------------------
 * Gestión de persistencia local usando IndexedDB.
 * Permite guardar archivos de audio (Blobs) de forma permanente
 * en el navegador del usuario.
 * -------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const DB_NAME = 'SkyBeatDB';
  const STORE_NAME = 'tracks';
  let db = null;

  const dbModule = {
    init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'fileName' });
          }
        };
        request.onsuccess = (e) => {
          db = e.target.result;
          resolve();
        };
        request.onerror = (e) => reject(e.target.error);
      });
    },

    async saveTracks(tracks) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // Limpiamos lo anterior para evitar duplicados si el usuario sube una nueva tanda
      store.clear();
      for (const track of tracks) {
        // Guardamos el archivo real (Blob/File)
        store.put({
          fileName: track.fileName,
          displayName: track.displayName,
          file: track.file
        });
      }
      return new Promise((res) => tx.oncomplete = res);
    },

    async getAllTracks() {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      return new Promise((res) => request.onsuccess = () => res(request.result));
    }
  };

  root.SkyBeat = root.SkyBeat || {};
  root.SkyBeat.db = dbModule;
})(window);
