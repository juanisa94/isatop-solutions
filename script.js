const steps = [
  {
    title: "Que tipo de proyecto necesitas realizar?",
    help: "Selecciona la tipologia que mas se acerque para orientar la metodologia de trabajo.",
    summaryLabel: "Tipo de proyecto",
    inputLabel: "Proyecto",
    placeholder: "Describe el tipo de proyecto",
    options: [
      "Catastro",
      "Obra civil",
      "Agricultura de precision",
      "Fotogrametria con drones",
      "Escaneo laser 3D",
      "Otro proyecto tecnico"
    ]
  },
  {
    title: "Cual es la ubicacion del terreno o de la actuacion?",
    help: "Puedes indicar direccion, municipio, referencia geografica o coordenadas si las conoces.",
    summaryLabel: "Ubicacion",
    inputLabel: "Ubicacion o coordenadas",
    placeholder: "Ejemplo: Poligono 3, parcela 41, Jaen"
  },
  {
    title: "Que superficie aproximada tiene la zona de trabajo?",
    help: "Indica la extension en hectareas o metros cuadrados para dimensionar la captura de datos.",
    summaryLabel: "Superficie",
    inputLabel: "Superficie aproximada",
    placeholder: "Ejemplo: 12.500 m2 o 3,2 ha"
  },
  {
    title: "Que nivel de detalle necesitas?",
    help: "Senala si requieres curvas de nivel, MDT, MDE, nube de puntos, ortofoto u otro entregable.",
    summaryLabel: "Nivel de detalle",
    inputLabel: "Entregables requeridos",
    placeholder: "Ejemplo: curvas de nivel cada 0,5 m y MDT"
  }
];

const questionTitle = document.getElementById("question-title");
const questionHelp = document.getElementById("question-help");
const optionsGrid = document.getElementById("options-grid");
const customAnswerForm = document.getElementById("custom-answer-form");
const customAnswerInput = document.getElementById("custom-answer");
const customAnswerLabel = document.getElementById("custom-answer-label");
const stepIndex = document.getElementById("step-index");
const progressFill = document.getElementById("progress-fill");
const summaryBox = document.getElementById("summary-box");
const summaryList = document.getElementById("summary-list");
const recommendationText = document.getElementById("recommendation-text");
const restartButton = document.getElementById("restart-button");
const chatWidget = document.querySelector(".chat-widget");
const chatToggle = document.getElementById("isa-chat-btn");
const chatPanel = document.getElementById("isa-chat-panel");
const chatClose = document.getElementById("isa-chat-close");

let currentStep = 0;
const answers = [];

function renderStep() {
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  stepIndex.textContent = String(currentStep + 1);
  progressFill.style.width = `${progress}%`;
  questionTitle.textContent = step.title;
  questionHelp.textContent = step.help;
  customAnswerLabel.textContent = step.inputLabel;
  customAnswerInput.placeholder = step.placeholder;
  customAnswerInput.value = "";

  optionsGrid.innerHTML = "";

  if (step.options) {
    step.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.textContent = option;
      button.addEventListener("click", () => {
        saveAnswer(option);
      });
      optionsGrid.appendChild(button);
    });
  }

  summaryBox.hidden = true;
  optionsGrid.hidden = false;
  customAnswerForm.hidden = false;
}

function saveAnswer(value) {
  answers[currentStep] = value.trim();

  if (currentStep < steps.length - 1) {
    currentStep += 1;
    renderStep();
    customAnswerInput.focus();
  } else {
    renderSummary();
  }
}

function renderSummary() {
  summaryList.innerHTML = "";

  steps.forEach((step, index) => {
    const item = document.createElement("li");
    item.textContent = `${step.summaryLabel}: ${answers[index] || "Pendiente"}`;
    summaryList.appendChild(item);
  });

  recommendationText.textContent = buildRecommendation();
  progressFill.style.width = "100%";
  optionsGrid.hidden = true;
  customAnswerForm.hidden = true;
  summaryBox.hidden = false;
  questionTitle.textContent = "Consulta registrada";
  questionHelp.textContent =
    "Con estos datos ya es posible orientar la tecnica recomendada y preparar una propuesta tecnica inicial.";
  stepIndex.textContent = String(steps.length);
}

function buildRecommendation() {
  const project = (answers[0] || "").toLowerCase();
  const detail = answers[3] || "el nivel de detalle indicado";

  if (project.includes("drone") || project.includes("fotogrametr")) {
    return `Para este caso, la fotogrametria con drones puede ser adecuada si buscas cobertura rapida y modelos de elevacion sobre superficies amplias. La recomendacion preliminar se basaria en ${detail}.`;
  }

  if (project.includes("laser") || project.includes("3d")) {
    return `Por la naturaleza del proyecto, el escaneo laser 3D puede aportar mayor densidad de informacion y un registro detallado del entorno. La documentacion solicitada seria ${detail}.`;
  }

  if (project.includes("obra")) {
    return `En proyectos de obra civil suele ser clave combinar levantamiento topografico clasico con productos digitales precisos para replanteo y control. Como referencia preliminar, se tendra en cuenta ${detail}.`;
  }

  if (project.includes("catastro")) {
    return `Para actuaciones catastrales conviene partir de una definicion precisa de la parcela y de sus elementos fisicos, sin entrar en valoraciones legales sobre linderos. El alcance tecnico indicado es ${detail}.`;
  }

  return `Con la informacion aportada, el siguiente paso seria validar accesos, condiciones de captura y entregables tecnicos. Como base preliminar, se trabajaria con ${detail}.`;
}

customAnswerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!customAnswerInput.value.trim()) {
    customAnswerInput.focus();
    return;
  }

  saveAnswer(customAnswerInput.value);
});

restartButton.addEventListener("click", () => {
  currentStep = 0;
  answers.length = 0;
  renderStep();
});

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

renderStep();
