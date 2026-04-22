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
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error: String(error)
        })
      )
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
