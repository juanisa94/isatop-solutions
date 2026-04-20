const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxtDVOXxcqIyeg9x2rQQLrzDghTJxllG5oxuIXvllbj6fWjzbofF9bT3PiiPVUxJF_S2w/exec";

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-status");
const leadStatusTitle = document.getElementById("lead-status-title");
const leadStatusMessage = document.getElementById("lead-status-message");
const leadSubmitButton = document.getElementById("lead-submit");
const chatWidget = document.querySelector(".chat-widget");
const chatToggle = document.getElementById("isa-chat-btn");
const chatPanel = document.getElementById("isa-chat-panel");
const chatClose = document.getElementById("isa-chat-close");
const chatMessages = document.getElementById("isa-chat-messages");
const chatSummary = document.getElementById("isa-chat-summary");
const chatSummaryList = document.getElementById("isa-chat-summary-list");
const chatForm = document.getElementById("isa-chat-form");
const chatInput = document.getElementById("isa-chat-input");
const chatSend = document.getElementById("isa-chat-send");

const chatSteps = [
  {
    key: "nombre",
    label: "Nombre del cliente",
    question: "Perfecto. Para poder dirigirme a ti correctamente, cual es tu nombre completo?",
    placeholder: "Nombre y apellidos"
  },
  {
    key: "telefono",
    label: "Telefono",
    question: "Gracias. Cual es tu telefono de contacto por si necesitamos aclarar algun detalle tecnico?",
    placeholder: "+34 600 000 000"
  },
  {
    key: "email",
    label: "Email",
    question: "Y que email prefieres para enviarte la informacion y la propuesta tecnica cuando proceda?",
    placeholder: "cliente@correo.com"
  },
  {
    key: "tipoProyecto",
    label: "Tipo de proyecto",
    question: "Ahora cuentame el tipo de proyecto: catastro, obra civil, levantamiento, dron, escaneo 3D u otro parecido.",
    placeholder: "Ejemplo: Catastro"
  },
  {
    key: "ubicacion",
    label: "Ubicacion",
    question: "Donde esta la finca, parcela o zona de actuacion? Puedes indicar municipio, direccion, poligono, parcela o coordenadas.",
    placeholder: "Ubicacion del trabajo"
  },
  {
    key: "extension",
    label: "Extension",
    question: "Que extension aproximada tiene la zona de trabajo? Me sirve en hectareas o metros cuadrados.",
    placeholder: "Ejemplo: 2,5 ha"
  },
  {
    key: "plazoFechas",
    label: "Plazo y fechas",
    question: "Que plazo manejas o para que fecha te interesa tener el trabajo avanzado?",
    placeholder: "Ejemplo: antes del 30 de abril"
  },
  {
    key: "documentacion",
    label: "Documentacion disponible",
    question: "Tienes alguna documentacion de las tierras o del proyecto, como referencia catastral, escrituras, planos o mediciones previas?",
    placeholder: "Documentacion disponible"
  },
  {
    key: "observaciones",
    label: "Observaciones del cliente",
    question: "Hay algun detalle adicional que quieras dejar indicado, como accesos, urgencia, dudas o necesidades especiales?",
    placeholder: "Observaciones adicionales"
  }
];

let currentChatStep = 0;
const chatAnswers = {};

function getConsultationPayload(form) {
  const formData = new FormData(form);

  return {
    fechaConsulta: new Date().toISOString(),
    nombre: String(formData.get("nombre") || "").trim(),
    telefono: String(formData.get("telefono") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    tipoProyecto: String(formData.get("tipoProyecto") || "").trim(),
    ubicacion: String(formData.get("ubicacion") || "").trim(),
    extension: String(formData.get("extension") || "").trim(),
    plazoFechas: String(formData.get("plazoFechas") || "").trim(),
    documentacion: String(formData.get("documentacion") || "").trim(),
    observaciones: String(formData.get("observaciones") || "").trim()
  };
}

function buildLeadParams(payload) {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, value);
  });

  return params;
}

function appendChatMessage(role, text) {
  if (!chatMessages) {
    return;
  }

  const article = document.createElement("article");
  article.className = `chat-message chat-message-${role}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  article.appendChild(paragraph);
  chatMessages.appendChild(article);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateChatSummary() {
  if (!chatSummary || !chatSummaryList) {
    return;
  }

  chatSummaryList.innerHTML = "";

  chatSteps.forEach((step) => {
    if (!chatAnswers[step.key]) {
      return;
    }

    const item = document.createElement("li");
    item.textContent = `${step.label}: ${chatAnswers[step.key]}`;
    chatSummaryList.appendChild(item);
  });

  chatSummary.hidden = !chatSummaryList.children.length;
}

function updateChatPlaceholder() {
  if (!chatInput) {
    return;
  }

  const step = chatSteps[currentChatStep];
  chatInput.placeholder = step ? step.placeholder : "Escribe tu respuesta";
}

function buildChatPayload() {
  return {
    fechaConsulta: new Date().toISOString(),
    nombre: chatAnswers.nombre || "",
    telefono: chatAnswers.telefono || "",
    email: chatAnswers.email || "",
    tipoProyecto: chatAnswers.tipoProyecto || "",
    ubicacion: chatAnswers.ubicacion || "",
    extension: chatAnswers.extension || "",
    plazoFechas: chatAnswers.plazoFechas || "",
    documentacion: chatAnswers.documentacion || "",
    observaciones: chatAnswers.observaciones || ""
  };
}

async function sendChatLead() {
  const payload = buildChatPayload();

  if (!GOOGLE_SHEETS_ENDPOINT) {
    appendChatMessage(
      "agent",
      "Ya tengo todos los datos, pero el sistema de registro aun no esta conectado al almacenamiento externo."
    );
    return;
  }

  const params = buildLeadParams(payload);

  await fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: params.toString()
  });
}

async function handleChatSubmit(event) {
  event.preventDefault();

  if (!chatInput) {
    return;
  }

  const value = chatInput.value.trim();

  if (!value) {
    chatInput.focus();
    return;
  }

  const step = chatSteps[currentChatStep];

  if (!step) {
    return;
  }

  chatAnswers[step.key] = value;
  appendChatMessage("user", value);
  chatInput.value = "";
  updateChatSummary();

  currentChatStep += 1;

  if (currentChatStep < chatSteps.length) {
    appendChatMessage("agent", chatSteps[currentChatStep].question);
    updateChatPlaceholder();
    chatInput.focus();
    return;
  }

  if (chatSend) {
    chatSend.disabled = true;
    chatSend.textContent = "Guardando...";
  }

  try {
    appendChatMessage(
      "agent",
      "Perfecto. Ya tengo una vision clara de tu necesidad. Voy a dejar esta consulta registrada para que podamos revisarla con detalle en oficina."
    );
    await sendChatLead();
    appendChatMessage(
      "agent",
      "Consulta registrada correctamente. En el siguiente paso podremos contactar contigo con una orientacion tecnica mas precisa, sin improvisar precios ni valoraciones legales."
    );
  } catch (error) {
    appendChatMessage(
      "agent",
      "He recogido los datos, pero ha fallado el registro automatico. Aun asi, ya tenemos la conversacion estructurada para revisarla manualmente."
    );
  } finally {
    updateChatPlaceholder();

    if (chatSend) {
      chatSend.disabled = false;
      chatSend.textContent = "Enviar";
    }
  }
}

function setLeadStatus(title, message) {
  if (!leadStatus || !leadStatusTitle || !leadStatusMessage) {
    return;
  }

  leadStatusTitle.textContent = title;
  leadStatusMessage.textContent = message;
  leadStatus.hidden = false;
}

async function submitLead(event) {
  event.preventDefault();

  if (!leadForm) {
    return;
  }

  if (!leadForm.reportValidity()) {
    return;
  }

  const payload = getConsultationPayload(leadForm);

  if (!GOOGLE_SHEETS_ENDPOINT) {
    setLeadStatus(
      "Formulario listo para conectar",
      "Los datos se han validado en la web, pero falta configurar la URL del Google Apps Script en script.js para enviarlos automaticamente a Google Sheets."
    );
    return;
  }

  const originalLabel = leadSubmitButton ? leadSubmitButton.textContent : "";

  try {
    if (leadSubmitButton) {
      leadSubmitButton.disabled = true;
      leadSubmitButton.textContent = "Enviando...";
    }

    const params = buildLeadParams(payload);

    await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: params.toString()
    });

    leadForm.reset();
    setLeadStatus(
      "Consulta enviada correctamente",
      "La oportunidad se ha enviado al registro de oficina. Si el endpoint de Google Apps Script esta bien configurado, la consulta quedara almacenada en Google Sheets con todos los datos principales."
    );
  } catch (error) {
    setLeadStatus(
      "No se pudo enviar la consulta",
      "La web ha recogido los datos, pero el envio al almacenamiento externo ha fallado. Revisa la URL del endpoint y la configuracion de Google Apps Script."
    );
  } finally {
    if (leadSubmitButton) {
      leadSubmitButton.disabled = false;
      leadSubmitButton.textContent = originalLabel || "Enviar consulta";
    }
  }
}

if (leadForm) {
  leadForm.addEventListener("submit", submitLead);
}

if (chatForm) {
  chatForm.addEventListener("submit", handleChatSubmit);
  updateChatPlaceholder();
}

function setChatOpenState(isOpen) {
  if (!chatWidget || !chatToggle || !chatPanel) {
    return;
  }

  chatWidget.dataset.chatOpen = String(isOpen);
  chatToggle.setAttribute("aria-expanded", String(isOpen));
  chatPanel.hidden = !isOpen;
}

if (chatToggle && chatPanel) {
  chatToggle.addEventListener("click", () => {
    const isOpen = chatWidget?.dataset.chatOpen === "true";
    setChatOpenState(!isOpen);

    if (!isOpen) {
      chatInput?.focus();
    }
  });
}

if (chatClose) {
  chatClose.addEventListener("click", () => {
    setChatOpenState(false);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setChatOpenState(false);
  }
});
