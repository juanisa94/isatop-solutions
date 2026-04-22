const runtimeConfig = window.ISA_CONFIG || {};
const GOOGLE_SHEETS_ENDPOINT = runtimeConfig.googleSheetsEndpoint || "";
const CHAT_API_URL = runtimeConfig.chatApiUrl || "";
const LEAD_API_URL = CHAT_API_URL
  ? CHAT_API_URL.replace(/\/chat$/, "/lead")
  : "";

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

const leadFieldOrder = [
  { key: "nombre", label: "Nombre del cliente" },
  { key: "telefono", label: "Telefono" },
  { key: "email", label: "Email" },
  { key: "tipoProyecto", label: "Tipo de proyecto" },
  { key: "ubicacion", label: "Ubicacion" },
  { key: "extension", label: "Extension" },
  { key: "plazoFechas", label: "Plazo y fechas" },
  { key: "documentacion", label: "Documentacion disponible" },
  { key: "observaciones", label: "Observaciones del cliente" }
];

const chatState = {
  messages: [
    {
      role: "assistant",
      content:
        "Hola, soy Isa. Estoy aqui para entender tu proyecto, orientarte con criterio tecnico y dejar la consulta registrada para revision en oficina. Empezamos por lo basico: cual es tu nombre?"
    }
  ],
  lead: {
    nombre: "",
    telefono: "",
    email: "",
    tipoProyecto: "",
    ubicacion: "",
    extension: "",
    plazoFechas: "",
    documentacion: "",
    observaciones: ""
  },
  missingFields: ["nombre", "telefono", "email", "tipoProyecto", "ubicacion", "extension"],
  readyToSave: false,
  leadSaved: false
};

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

  leadFieldOrder.forEach((field) => {
    if (!chatState.lead[field.key]) {
      return;
    }

    const item = document.createElement("li");
    item.textContent = `${field.label}: ${chatState.lead[field.key]}`;
    chatSummaryList.appendChild(item);
  });

  chatSummary.hidden = !chatSummaryList.children.length;
}

function updateChatPlaceholder() {
  if (!chatInput) {
    return;
  }

  chatInput.placeholder = "Escribe tu respuesta";
}

function syncLead(nextLead) {
  leadFieldOrder.forEach((field) => {
    const value = String(nextLead?.[field.key] || "").trim();
    if (value) {
      chatState.lead[field.key] = value;
    }
  });
}

async function requestChatReply() {
  if (!CHAT_API_URL) {
    const fallbackReply = chatState.lead.nombre
      ? `Gracias, ${chatState.lead.nombre}. Ya puedo seguir ayudandote, pero el motor de IA aun no esta conectado.`
      : "Puedo orientarte, pero el motor de IA aun no esta conectado.";

    return {
      reply: fallbackReply,
      lead: chatState.lead,
      missingFields: [],
      readyToSave: false,
      fallback: true
    };
  }

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: chatState.messages,
      lead: chatState.lead
    })
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  return response.json();
}

async function saveChatLead() {
  if (chatState.leadSaved) {
    return true;
  }

  if (LEAD_API_URL) {
    const response = await fetch(LEAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lead: {
          fechaConsulta: new Date().toISOString(),
          ...chatState.lead
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Lead API error: ${response.status}`);
    }

    chatState.leadSaved = true;
    return true;
  }

  if (!GOOGLE_SHEETS_ENDPOINT) {
    return false;
  }

  const params = buildLeadParams({
    fechaConsulta: new Date().toISOString(),
    ...chatState.lead
  });

  await fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: params.toString()
  });

  chatState.leadSaved = true;
  return true;
}

async function submitLeadPayload(payload) {
  if (LEAD_API_URL) {
    const response = await fetch(LEAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ lead: payload })
    });

    if (!response.ok) {
      throw new Error(`Lead API error: ${response.status}`);
    }

    return true;
  }

  if (!GOOGLE_SHEETS_ENDPOINT) {
    return false;
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

  return true;
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

  appendChatMessage("user", value);
  chatState.messages.push({
    role: "user",
    content: value
  });
  chatInput.value = "";

  if (chatSend) {
    chatSend.disabled = true;
    chatSend.textContent = "Pensando...";
  }

  try {
    const reply = await requestChatReply();

    syncLead(reply.lead);
    chatState.missingFields = Array.isArray(reply.missingFields) ? reply.missingFields : [];
    chatState.readyToSave = Boolean(reply.readyToSave);
    chatState.messages.push({
      role: "assistant",
      content: reply.reply
    });
    appendChatMessage("agent", reply.reply);
    updateChatSummary();

    if (chatState.readyToSave && !chatState.leadSaved) {
      await saveChatLead();
      appendChatMessage(
        "agent",
        "Perfecto. He dejado la consulta registrada para revision tecnica en oficina. En el siguiente paso podremos contactar contigo con una orientacion mucho mas precisa."
      );
      chatState.messages.push({
        role: "assistant",
        content:
          "Perfecto. He dejado la consulta registrada para revision tecnica en oficina. En el siguiente paso podremos contactar contigo con una orientacion mucho mas precisa."
      });
    }
  } catch (error) {
    appendChatMessage(
      "agent",
      "He podido seguir la conversacion, pero ahora mismo hay un problema tecnico con el asistente. Si quieres, puedes completar el formulario de esta misma pagina y quedara registrado igualmente."
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

  if (!LEAD_API_URL && !GOOGLE_SHEETS_ENDPOINT) {
    setLeadStatus(
      "Formulario listo para conectar",
      "Los datos se han validado en la web, pero falta configurar la URL del backend de IA o del Google Apps Script en config.js para enviarlos automaticamente a Google Sheets."
    );
    return;
  }

  const originalLabel = leadSubmitButton ? leadSubmitButton.textContent : "";

  try {
    if (leadSubmitButton) {
      leadSubmitButton.disabled = true;
      leadSubmitButton.textContent = "Enviando...";
    }

    await submitLeadPayload(payload);

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
