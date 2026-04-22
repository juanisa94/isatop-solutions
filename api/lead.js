const REQUIRED_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "tipoProyecto",
  "ubicacion",
  "extension"
];

function buildLeadParams(payload) {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, value);
  });

  return params;
}

function normalizeLead(lead) {
  return {
    fechaConsulta: String(lead?.fechaConsulta || new Date().toISOString()).trim(),
    nombre: String(lead?.nombre || "").trim(),
    telefono: String(lead?.telefono || "").trim(),
    email: String(lead?.email || "").trim(),
    tipoProyecto: String(lead?.tipoProyecto || "").trim(),
    ubicacion: String(lead?.ubicacion || "").trim(),
    extension: String(lead?.extension || "").trim(),
    plazoFechas: String(lead?.plazoFechas || "").trim(),
    documentacion: String(lead?.documentacion || "").trim(),
    observaciones: String(lead?.observaciones || "").trim()
  };
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const endpoint = process.env.GOOGLE_SHEETS_ENDPOINT;
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const lead = normalizeLead(body.lead);
  const missingFields = REQUIRED_FIELDS.filter((field) => !lead[field]);

  if (!endpoint) {
    res.status(500).json({ ok: false, error: "Missing GOOGLE_SHEETS_ENDPOINT" });
    return;
  }

  if (missingFields.length) {
    res.status(400).json({ ok: false, error: "Missing required fields", missingFields });
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: buildLeadParams(lead).toString()
    });

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(200).json({
      ok: response.ok,
      responseText: text
    });
  } catch (error) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(500).json({
      ok: false,
      error: String(error)
    });
  }
};
