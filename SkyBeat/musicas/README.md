# Carpeta musicas/

Coloca aquí tus archivos de audio para que SkyBeat los cargue automáticamente.

## Formatos soportados

- `.mp3`
- `.wav`
- `.ogg`
- `.m4a`
- `.aac`
- `.flac`
- `.webm`

## Cómo usarla

### Opción 1: carga automática con `index.json`

Edita el archivo `index.json` de esta carpeta y agrega los nombres de tus archivos:

```json
{
  "files": [
    { "name": "mi-cancion-1.mp3" },
    { "name": "mi-cancion-2.mp3" }
  ]
}
```

Luego abre la página con un servidor local. Por ejemplo, desde la raíz del proyecto:

```bash
python3 -m http.server 5500
```

Después visita: `http://localhost:5500`

### Opción 2: selector del navegador

Si usas Google Chrome o Microsoft Edge, haz clic en **Cargar carpeta musicas/** y elige esta carpeta. El navegador recordará la selección para futuras sesiones.

### Opción 3: carga manual

Usa el botón **Seleccionar archivos manualmente** si prefieres elegir canciones individuales o tu navegador no soporta las opciones anteriores.
