// js/file-loader.js
// Permite cargar archivos manualmente o desde la carpeta "musicas" usando la API del navegador.

import { addFiles } from './playlist.js';
import { dispatchAppEvent, isAudioFile, supportsDirectoryPicker } from './utils.js';

const folderBtn = document.getElementById('loadFolderBtn');
const manualInput = document.getElementById('musicInput');
const banner = document.getElementById('statusBanner');

let directoryHandle = null;

function showBanner(message, isError = false) {
  if (!message) {
    banner.hidden = true;
    banner.textContent = '';
    banner.className = 'status-banner';
    return;
  }

  banner.hidden = false;
  banner.textContent = message;
  banner.className = `status-banner${isError ? ' error' : ''}`;
}

export function hasDirectorySupport() {
  return supportsDirectoryPicker();
}

async function tryAutoLoadFolderHandle() {
  // Espacio reservado para recordar un directorio previamente otorgado.
  return null;
}

async function requestMusicFolder() {
  if (!supportsDirectoryPicker()) {
    showBanner('Tu navegador no permite abrir carpetas automáticamente. Usa el selector de archivos manual.', true);
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    directoryHandle = handle;
    return handle;
  } catch (error) {
    if (error?.name === 'AbortError') {
      showBanner('Selección de carpeta cancelada.');
    } else {
      showBanner('No se pudo abrir la carpeta. Intenta de nuevo o usa el selector manual.', true);
    }
    return null;
  }
}

async function readDirectory(handle) {
  const collected = [];

  for await (const entry of handle.values()) {
    if (entry.kind === 'file') {
      try {
        const file = await entry.getFile();
        if (isAudioFile(file)) {
          collected.push(file);
        }
      } catch (_) {
        // Algunos archivos pueden estar bloqueados; se omiten sin detener el proceso.
      }
    } else if (entry.kind === 'directory' && entry.name.toLowerCase() === 'musicas') {
      const nested = await readDirectory(entry);
      collected.push(...nested);
    }
  }

  return collected;
}

export async function loadFromFolder() {
  showBanner('Buscando archivos de audio en la carpeta seleccionada…');

  let handle = directoryHandle || (await tryAutoLoadFolderHandle());

  if (!handle) {
    handle = await requestMusicFolder();
  }

  if (!handle) {
    showBanner('');
    return [];
  }

  showBanner('Leyendo archivos de audio de la carpeta…');

  try {
    const files = await readDirectory(handle);
    const normalized = files.map((file, index) => {
      const syntheticFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified || Date.now()
      });
      return syntheticFile;
    });

    const sorted = normalized.sort((a, b) => a.name.localeCompare(b.name));

    if (!sorted.length) {
      showBanner('No se encontraron archivos de audio compatibles en la carpeta indicada.', true);
      return [];
    }

    const added = addFiles(sorted);
    showBanner(`Se cargaron ${added.length} canción${added.length === 1 ? '' : 'es'} desde la carpeta local.`);
    dispatchAppEvent('file:folder-loaded', { count: added.length });
    return added;
  } catch (error) {
    showBanner('Ocurrió un error al leer la carpeta. Intenta nuevamente.', true);
    return [];
  }
}

function handleManualFiles(event) {
  const files = event.target.files;
  if (!files || !files.length) return;

  const added = addFiles(files);
  showBanner(added.length
    ? `Se agregaron ${added.length} canción${added.length === 1 ? '' : 'es'} manualmente.`
    : 'Los archivos seleccionados no son compatibles con el reproductor.'
  );
  dispatchAppEvent('file:files-added', { count: added.length });
  event.target.value = '';
}

export function init() {
  folderBtn.addEventListener('click', () => {
    loadFromFolder();
  });

  manualInput.addEventListener('change', handleManualFiles);
}
