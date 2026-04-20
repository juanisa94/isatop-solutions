const GOOGLE_SHEETS_ENDPOINT = "";

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-status");
const leadStatusTitle = document.getElementById("lead-status-title");
const leadStatusMessage = document.getElementById("lead-status-message");
const leadSubmitButton = document.getElementById("lead-submit");
const chatWidget = document.querySelector(".chat-widget");
const chatToggle = document.getElementById("isa-chat-btn");
const chatPanel = document.getElementById("isa-chat-panel");
const chatClose = document.getElementById("isa-chat-close");

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
