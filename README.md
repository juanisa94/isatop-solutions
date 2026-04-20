# IsaTop Solutions

Landing page estatica para una consultoria topografica, preparada para publicarse en GitHub Pages.

## Contenido

- `index.html`: estructura principal de la web
- `styles.css`: estilos visuales
- `script.js`: interaccion de la consulta guiada y widget del chat
- `imag/`: imagenes del sitio
- `iconos/`: iconos de contacto y redes
- `favicon.png`: icono principal del sitio

## Publicacion en GitHub Pages

Esta web esta preparada para desplegarse automaticamente con GitHub Pages usando GitHub Actions.

### Pasos

1. Sube este proyecto a un repositorio en GitHub.
2. En GitHub, entra en `Settings > Pages`.
3. En `Build and deployment`, selecciona `GitHub Actions`.
4. Haz push a la rama principal (`main` o `master`).
5. GitHub publicara automaticamente la web.

## Datos provisionales

Actualmente el proyecto incluye:

- dominio de ejemplo,
- datos de contacto ficticios,
- enlaces sociales ficticios,
- textos legales provisionales.

Antes de publicarlo como version final conviene sustituir esos valores por los reales.

## Captacion de leads y Google Sheets

La seccion `#consulta` ya esta preparada para recoger consultas reales con estos campos:

- Fecha de consulta
- Nombre del cliente
- Telefono
- Email
- Tipo de proyecto
- Ubicacion
- Extension
- Plazo y fechas
- Documentacion disponible
- Observaciones del cliente

### 1. Crear la hoja

Crea una hoja de Google Sheets con una primera fila que contenga exactamente estas columnas:

```text
Fecha de consulta | Nombre del cliente | Telefono | Email | Tipo de proyecto | Ubicacion | Extension | Plazo y fechas | Documentacion disponible | Observaciones del cliente
```

### 2. Publicar un Google Apps Script

Crea un proyecto de `Google Apps Script` vinculado a tu cuenta y pega este codigo en `Code.gs`:

```javascript
const SHEET_NAME = "Hoja 1";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = e.parameter;

    sheet.appendRow([
      data.fechaConsulta || "",
      data.nombre || "",
      data.telefono || "",
      data.email || "",
      data.tipoProyecto || "",
      data.ubicacion || "",
      data.extension || "",
      data.plazoFechas || "",
      data.documentacion || "",
      data.observaciones || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Despues despliegalo como `Web app` con acceso para `Cualquiera` o `Cualquiera con el enlace`, segun te permita tu cuenta.

Esta web envia los datos como formulario simple para evitar problemas tipicos de `CORS` desde `GitHub Pages`.

### 3. Conectar la web

En `script.js`, sustituye el valor de esta constante por la URL del despliegue:

```javascript
const GOOGLE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec";
```

El envio se realiza con `POST` y `mode: "no-cors"`, asi que la web no puede leer una respuesta detallada del servidor. A cambio, el envio es mucho mas estable para una web estatica publicada en GitHub Pages.

### 4. Prompt base del agente

Puedes usar este prompt como base para el agente comercial-tecnico:

```text
Actua como Isa, asesora comercial-tecnica de una consultora topografica de alto nivel.

Tu objetivo es conversar con amabilidad, transmitir confianza y recoger los datos necesarios para estudiar el trabajo y continuar el proceso comercial.

Debes solicitar de forma natural:
- nombre del cliente
- telefono
- email
- tipo de proyecto
- ubicacion
- extension aproximada
- plazo y fechas
- documentacion disponible de las tierras
- cualquier observacion adicional

Comportamiento:
- se cordial, clara y profesional
- demuestra gran dominio de topografia, catastro, obra civil, levantamientos, drones y escaneo 3D
- vende el valor del servicio con argumentos tecnicos simples
- si faltan datos, recuperalos con preguntas breves y ordenadas
- resume la necesidad del cliente al final
- indica que la consulta quedara registrada para revision tecnica posterior

No debes:
- dar precios finales sin revision tecnica
- dar asesoramiento legal sobre linderos o propiedad
- inventar datos que el cliente no haya facilitado
```
