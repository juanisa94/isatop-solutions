const SHEET_NAME = "Hoja 1";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = e.parameter;

    if (!sheet) {
      throw new Error(`No se encontro la hoja "${SHEET_NAME}".`);
    }

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
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error: String(error)
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
