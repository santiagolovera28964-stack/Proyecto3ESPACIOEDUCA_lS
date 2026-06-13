# SkyBeat - Reproductor musical local

Reproductor de música web con diseño celeste inspirado en servicios de streaming.
El usuario selecciona archivos de audio desde su navegador y el reproductor aparece
en una barra fija inferior con botón para mostrar/ocultar.

## Estructura

```
/
├── index.html            ← Página principal (ábrelo directamente)
├── styles.css            ← Estilos visuales
├── js/
│   ├── utils.js          ← Auxiliares (formatear tiempo, sanitizar, etc.)
│   ├── playlist.js       ← Estado de la cola de reproducción
│   ├── player.js         ← Control del <audio> + atajos de teclado
│   ├── ui.js             ← Renderizado del DOM y barra inferior
│   └── app.js            ← Inicialización y conexión de módulos
├── server.js             ← (vacío, no se usa)
└── js/api.js             ← (vacío, no se usa)
```

## Uso

1. Abre `index.html` directamente en tu navegador.
2. Navega a la sección **Reproductor**.
3. Haz clic en **"🎵 Haz clic para seleccionar tus canciones"**.
4. Selecciona uno o varios archivos de audio (MP3, WAV, OGG, M4A, FLAC).
5. Las canciones aparecen en la lista y la barra del reproductor se muestra abajo.
6. Usa el botón flotante **"Reproductor"** (esquina inferior derecha) para mostrar/ocultar la barra.

## Atajos de teclado

- `←` → Retrocede 10 segundos
- `→` → Adelanta 10 segundos
- `Espacio` → Pausa / Reproduce
