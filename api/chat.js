const LEAD_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "tipoProyecto",
  "ubicacion",
  "extension",
  "plazoFechas",
  "documentacion",
  "observaciones"
];

const REQUIRED_LEAD_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "tipoProyecto",
  "ubicacion",
  "extension"
];

const FIELD_LABELS = {
  nombre: "nombre completo",
  telefono: "telefono de contacto",
  email: "email",
  tipoProyecto: "tipo de proyecto",
  ubicacion: "ubicacion de la finca o zona de trabajo",
  extension: "extension aproximada",
  plazoFechas: "plazo o fechas objetivo",
  documentacion: "documentacion disponible",
  observaciones: "observaciones adicionales"
};

const SITE_KNOWLEDGE = [
  "IsaTop Solutions ofrece topografia para catastro, obra civil, agricultura de precision, fotogrametria con drones, escaneo laser 3D y modelos digitales del terreno.",
  "El objetivo comercial es comprender el proyecto del cliente, orientar la tecnica adecuada y registrar la consulta para revision tecnica posterior.",
  "No se deben dar precios finales sin una revision tecnica real.",
  "No se debe ofrecer asesoramiento legal sobre linderos o propiedad.",
  "La web transmite un tono profesional, cercano y tecnico, orientado a convertir consultas en oportunidades."
].join(" ");

const PROJECT_HINTS = [
  { pattern: /\bcatastro|catastral|segregacion|deslinde|lindero|gml\b/i, value: "Catastro" },
  { pattern: /\bobra civil|replanteo|urbanizacion|carretera|edificacion|estructura\b/i, value: "Obra civil" },
  { pattern: /\bdron|fotogrametria|ortofoto|vuelo\b/i, value: "Fotogrametria con drones" },
  { pattern: /\blaser|escaneo 3d|nube de puntos|escaner\b/i, value: "Escaneo laser 3D" },
  { pattern: /\bagricultura|riego|cultivo|finca rustica|finca rústica\b/i, value: "Agricultura de precision" },
  { pattern: /\blevantamiento|topografico|medicion\b/i, value: "Levantamiento topografico" }
];

function json(response, statusCode) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(response)
  };
}

function getMissingFields(lead) {
  return REQUIRED_LEAD_FIELDS.filter((field) => !String(lead[field] || "").trim());
}

function buildSystemPrompt() {
  return [
    "Actua como Isa, asesora comercial-tecnica senior de una consultora topografica de alto nivel.",
    "Habla siempre en espanol de Espana con tono cercano, seguro y profesional.",
    "Tu mision es entender la necesidad del cliente, vender el valor del servicio con claridad y recoger los datos minimos para que oficina pueda revisar el caso.",
    "Debes demostrar conocimiento de catastro, obra civil, levantamientos, drones, escaneo laser 3D, modelos digitales del terreno y agricultura de precision.",
    "No inventes datos ni certificaciones. No des precios finales sin revision tecnica. No des asesoramiento legal sobre linderos o propiedad.",
    "Si faltan datos, pregunta por ellos de forma natural y ordenada. Si ya los tienes, resume la necesidad y confirma que la consulta quedara registrada para revision tecnica.",
    "Debes responder con JSON valido usando exactamente estas claves: reply, lead, missingFields, readyToSave.",
    "En lead usa solo estas claves: nombre, telefono, email, tipoProyecto, ubicacion, extension, plazoFechas, documentacion, observaciones.",
    "missingFields debe ser un array de claves faltantes. readyToSave debe ser true solo cuando tengas nombre, telefono, email, tipoProyecto, ubicacion y extension.",
    `Conocimiento base del sitio: ${SITE_KNOWLEDGE}`
  ].join(" ");
}

function buildUserPrompt({ messages, lead }) {
  return JSON.stringify({
    instructions:
      "Responde como Isa y actualiza el lead solo con datos que realmente aparezcan en la conversacion.",
    currentLead: lead,
    conversation: messages
  });
}

function normalizeLead(rawLead) {
  const nextLead = {};

  LEAD_FIELDS.forEach((field) => {
    nextLead[field] = String(rawLead?.[field] || "").trim();
  });

  return nextLead;
}

function mergeLead(previousLead, nextLead) {
  const merged = { ...previousLead };

  LEAD_FIELDS.forEach((field) => {
    const value = String(nextLead?.[field] || "").trim();
    if (value) {
      merged[field] = value;
    }
  });

  return merged;
}

function buildFallbackReply(lead, missingFields) {
  if (!lead.nombre) {
    return "Hola, soy Isa. Para empezar a orientarte con criterio tecnico, dime tu nombre completo.";
  }

  if (missingFields.length) {
    const nextField = missingFields[0];
    return `Perfecto, ${lead.nombre}. Para avanzar necesito tu ${FIELD_LABELS[nextField]}.`;
  }

  return "Gracias. Ya tengo una base tecnica suficiente para registrar tu consulta y dejarla lista para revision en oficina.";
}

function extractField(pattern, text) {
  const match = text.match(pattern);
  return match?.[1] ? match[1].trim() : "";
}

function inferProjectType(text) {
  const hint = PROJECT_HINTS.find((entry) => entry.pattern.test(text));
  return hint ? hint.value : "";
}

function inferLocation(text) {
  return (
    extractField(/\b(?:en|ubicad[oa] en|zona de|finca en|parcela en)\s+([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ,\- ]{4,})/i, text) ||
    ""
  );
}

function inferExtension(text) {
  return (
    extractField(/\b(\d+[.,]?\d*\s?(?:ha|hectareas|hectáreas|m2|metros cuadrados))\b/i, text) ||
    ""
  );
}

function inferName(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const match = normalized.match(
    /\b(?:me llamo|soy)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}?)(?=[,.;]| necesito| quiero| mi telefono| mi teléfono| mi email| para | en |$)/i
  );

  return match?.[1] ? match[1].trim() : "";
}

function inferPhone(text) {
  return extractField(/\b((?:\+?\d[\d ]{7,}\d))\b/, text);
}

function inferEmail(text) {
  return extractField(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i, text);
}

function inferObservations(text, lead) {
  if (!lead.tipoProyecto && !lead.ubicacion && !lead.extension) {
    return "";
  }

  return text.length > 160 ? text.slice(0, 160) : text;
}

function inferLeadFromMessages(messages, previousLead) {
  const userText = messages
    .filter((message) => String(message?.role || "") === "user")
    .map((message) => String(message?.content || "").trim())
    .filter(Boolean)
    .join(" ");

  const inferredLead = {
    nombre: inferName(userText),
    telefono: inferPhone(userText),
    email: inferEmail(userText),
    tipoProyecto: inferProjectType(userText),
    ubicacion: inferLocation(userText),
    extension: inferExtension(userText),
    plazoFechas: extractField(/\b(?:para|antes de|plazo|fecha)\s+([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ,\/\- ]{4,})/i, userText),
    documentacion: extractField(/\b(?:tengo|dispongo de|cuento con)\s+([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ,\/\- ]{6,})/i, userText),
    observaciones: inferObservations(userText, previousLead)
  };

  return mergeLead(previousLead, inferredLead);
}

function buildDemoReply(lead, missingFields) {
  if (!lead.nombre) {
    return "Hola, soy Isa, asesora comercial-tecnica de IsaTop Solutions. Para orientarte bien desde el principio, dime tu nombre completo.";
  }

  if (!lead.tipoProyecto) {
    return `Encantada, ${lead.nombre}. Para enfocar bien la solucion, cuentame si se trata de catastro, obra civil, levantamiento topografico, fotogrametria con drones, escaneo laser 3D u otro servicio tecnico.`;
  }

  if (!lead.ubicacion) {
    return `Perfecto, ${lead.nombre}. Para valorar el alcance tecnico del trabajo necesito la ubicacion de la finca, parcela o zona de actuacion.`;
  }

  if (!lead.extension) {
    return "Muy bien. Ahora necesito la extension aproximada del terreno o zona de trabajo, por ejemplo en hectareas o metros cuadrados.";
  }

  if (!lead.telefono) {
    return "Con esos datos ya veo mejor la necesidad. Dejame tambien un telefono de contacto por si tenemos que aclarar algun detalle tecnico contigo.";
  }

  if (!lead.email) {
    return "Perfecto. Indicame tambien un email para poder enviarte la orientacion tecnica o la siguiente comunicacion cuando corresponda.";
  }

  if (!lead.plazoFechas) {
    return `Gracias, ${lead.nombre}. Ya tengo la base principal. Si quieres, dime tambien que plazo manejas o para cuando te interesa tener el trabajo avanzado.`;
  }

  if (!lead.documentacion) {
    return "Si dispones de referencia catastral, escrituras, planos, GML o mediciones previas, comentamelo tambien para agilizar la revision tecnica.";
  }

  if (!lead.observaciones) {
    return "Solo me faltaria cualquier observacion adicional que debamos tener en cuenta, como accesos, urgencia o una necesidad especial del terreno.";
  }

  return `Perfecto, ${lead.nombre}. Ya tengo una base tecnica bastante completa sobre tu ${lead.tipoProyecto.toLowerCase()}. Voy a dejar la consulta registrada para revision en oficina y asi podremos orientarte con mas precision sin improvisar precios ni valoraciones legales.`;
}

function sanitizeModelResponse(text, previousLead) {
  try {
    const parsed = JSON.parse(text);
    const normalizedLead = mergeLead(previousLead, normalizeLead(parsed.lead));
    const missingFields = getMissingFields(normalizedLead);

    return {
      reply:
        String(parsed.reply || "").trim() ||
        buildFallbackReply(normalizedLead, missingFields),
      lead: normalizedLead,
      missingFields,
      readyToSave: missingFields.length === 0
    };
  } catch (error) {
    const missingFields = getMissingFields(previousLead);

    return {
      reply: buildFallbackReply(previousLead, missingFields),
      lead: previousLead,
      missingFields,
      readyToSave: false
    };
  }
}

async function callOpenAI({ apiKey, model, messages, lead }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt({ messages, lead }) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || "";
  return sanitizeModelResponse(content, lead);
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
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lead = normalizeLead(body.lead);

  try {
    let responsePayload;

    if (apiKey) {
      responsePayload = await callOpenAI({ apiKey, model, messages, lead });
    } else {
      const inferredLead = inferLeadFromMessages(messages, lead);
      const missingFields = getMissingFields(inferredLead);
      responsePayload = {
        reply: buildDemoReply(inferredLead, missingFields),
        lead: inferredLead,
        missingFields,
        readyToSave: missingFields.length === 0
      };
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(200).json(responsePayload);
  } catch (error) {
    const inferredLead = inferLeadFromMessages(messages, lead);
    const missingFields = getMissingFields(inferredLead);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(200).json({
      reply: buildDemoReply(inferredLead, missingFields),
      lead: inferredLead,
      missingFields,
      readyToSave: missingFields.length === 0,
      fallback: true,
      error: String(error)
    });
  }
};
