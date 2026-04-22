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
const HEADERS = [
  "Fecha de consulta",
  "Nombre del cliente",
  "Telefono",
  "Email",
  "Tipo de proyecto",
  "Ubicacion",
  "Extension",
  "Plazo y fechas",
  "Documentacion disponible",
  "Observaciones del cliente"
];

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = e.parameter || {};

    if (!sheet) {
      throw new Error(`No se encontro la hoja "${SHEET_NAME}".`);
    }

    ensureHeaders_(sheet);

    const nextRow = Math.max(sheet.getLastRow(), 1) + 1;
    const row = [
      data.fechaConsulta || "",
      data.nombre || "",
      normalizePhone_(data.telefono),
      data.email || "",
      data.tipoProyecto || "",
      data.ubicacion || "",
      data.extension || "",
      data.plazoFechas || "",
      data.documentacion || "",
      data.observaciones || ""
    ];

    sheet.getRange(nextRow, 3).setNumberFormat("@");
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders_(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function normalizePhone_(value) {
  const phone = String(value || "").trim();
  return phone ? `'${phone}` : "";
}
```

Despues despliegalo como `Web app` con acceso para `Cualquiera` o `Cualquiera con el enlace`, segun te permita tu cuenta.

Esta web envia los datos como formulario simple para evitar problemas tipicos de `CORS` desde `GitHub Pages`.

El telefono se guarda como texto para que Google Sheets no interprete valores como `+34...` como una formula y muestre `#ERROR!`.

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

## IA conversacional con backend serverless

La web ya esta preparada para usar una IA real en el widget flotante, manteniendo la landing estatica en GitHub Pages y moviendo el cerebro del agente a un backend serverless.

### Arquitectura recomendada

- GitHub Pages sigue publicando `index.html`, `styles.css`, `script.js` y `config.js`
- `Vercel` publica dos endpoints serverless:
  - `POST /api/chat`: conversacion con la IA
  - `POST /api/lead`: guardado estructurado del lead
- El backend usa `OpenAI` mediante `OPENAI_API_KEY`
- El backend reenvia los leads a Google Sheets con `GOOGLE_SHEETS_ENDPOINT`

### Archivos nuevos para la IA

- `config.js`: configuracion publica del frontend
- `api/chat.js`: cerebro conversacional de Isa
- `api/lead.js`: envio seguro de leads al Apps Script
- `vercel.json`: configuracion minima del backend serverless
- `package.json`: script de desarrollo para Vercel

### 1. Configurar el frontend

Edita `config.js` y define la URL publica del backend:

```javascript
window.ISA_CONFIG = window.ISA_CONFIG || {
  chatApiUrl: "https://tu-backend.vercel.app/api/chat",
  googleSheetsEndpoint:
    "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec"
};
```

Notas:

- `chatApiUrl` es la nueva URL del backend conversacional
- `googleSheetsEndpoint` se mantiene como respaldo y tambien sirve para el formulario tradicional

### 2. Desplegar el backend en Vercel

1. Importa este mismo repositorio en `Vercel`
2. Configura estas variables de entorno:

```text
OPENAI_API_KEY=tu_clave_privada
OPENAI_MODEL=gpt-4o-mini
GOOGLE_SHEETS_ENDPOINT=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

3. Despliega el proyecto
4. Copia la URL publica y colócala en `config.js` como `chatApiUrl`

### 3. Como funciona Isa

La IA recibe:

- historial corto de mensajes,
- lead parcial detectado hasta el momento,
- instrucciones comerciales-tecnicas,
- conocimiento base del contenido de la web.

La API responde con este formato:

```json
{
  "reply": "texto visible para el usuario",
  "lead": {
    "nombre": "",
    "telefono": "",
    "email": "",
    "tipoProyecto": "",
    "ubicacion": "",
    "extension": "",
    "plazoFechas": "",
    "documentacion": "",
    "observaciones": ""
  },
  "missingFields": ["nombre", "telefono"],
  "readyToSave": false
}
```

Cuando la IA ya tiene datos minimos suficientes, el frontend llama a `/api/lead` y deja la consulta registrada en Google Sheets.

### 4. Desarrollo local

Para probar el backend localmente:

```bash
npm install
npx vercel dev
```

Luego puedes apuntar `chatApiUrl` a algo como:

```javascript
chatApiUrl: "http://127.0.0.1:3000/api/chat"
```

### 5. Limites de esta V1

- La IA conoce el contenido de la pagina y el posicionamiento comercial-tecnico base.
- No busca en internet en esta primera version.
- No sustituye una revision tecnica real ni una valoracion economica definitiva.
