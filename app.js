const issuers = [
  {
    id: "agro-sur",
    name: "Agro Sur S.A.",
    sector: "Agroindustria",
    history: [71, 73, 76, 74],
    incomeGrowth: 12,
    debtGrowth: 8,
    marketRisk: 18,
    maxHistoricDeleveraging: 10,
  },
  {
    id: "metal-pampa",
    name: "Metalurgica Pampa",
    sector: "Industria",
    history: [69, 65, 61, 58],
    incomeGrowth: 5,
    debtGrowth: 17,
    marketRisk: 28,
    maxHistoricDeleveraging: 7,
  },
  {
    id: "nova-retail",
    name: "Nova Retail",
    sector: "Consumo",
    history: [62, 67, 70, 72],
    incomeGrowth: 14,
    debtGrowth: 5,
    marketRisk: 22,
    maxHistoricDeleveraging: 12,
  },
];

const weights = {
  incomeGrowth: 0.4,
  debtGrowth: 0.4,
  marketRisk: 0.2,
};

const state = {
  issuer: issuers[0],
  incomeGrowth: issuers[0].incomeGrowth,
  debtGrowth: issuers[0].debtGrowth,
  marketRisk: issuers[0].marketRisk,
};

const els = {
  issuerSelect: document.querySelector("#issuerSelect"),
  currentScore: document.querySelector("#currentScore"),
  currentScoreLabel: document.querySelector("#currentScoreLabel"),
  projectedScore: document.querySelector("#projectedScore"),
  projectedScoreLabel: document.querySelector("#projectedScoreLabel"),
  expectedDrift: document.querySelector("#expectedDrift"),
  feasibilityScore: document.querySelector("#feasibilityScore"),
  feasibilityLabel: document.querySelector("#feasibilityLabel"),
  riskStatus: document.querySelector("#riskStatus"),
  riskBadge: document.querySelector("#riskBadge"),
  riskTitle: document.querySelector("#riskTitle"),
  riskText: document.querySelector("#riskText"),
  prescriptionList: document.querySelector("#prescriptionList"),
  validationText: document.querySelector("#validationText"),
  confidenceFill: document.querySelector("#confidenceFill"),
  incomeGrowth: document.querySelector("#incomeGrowth"),
  debtGrowth: document.querySelector("#debtGrowth"),
  marketRisk: document.querySelector("#marketRisk"),
  incomeGrowthValue: document.querySelector("#incomeGrowthValue"),
  debtGrowthValue: document.querySelector("#debtGrowthValue"),
  marketRiskValue: document.querySelector("#marketRiskValue"),
  engineTable: document.querySelector("#engineTable"),
  timeline: document.querySelector("#timeline"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  chart: document.querySelector("#projectionChart"),
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scoreLabel(score) {
  if (score >= 68) return "Flujo seguro";
  if (score >= 55) return "Observacion";
  return "Riesgo elevado";
}

function calculateProjection() {
  const current = state.issuer.history.at(-1);
  const incomeImpact = (state.incomeGrowth - 8) * 0.78 * weights.incomeGrowth;
  const debtImpact = (10 - state.debtGrowth) * 0.86 * weights.debtGrowth;
  const marketImpact = (22 - state.marketRisk) * 0.65 * weights.marketRisk;
  const annualDelta = incomeImpact + debtImpact + marketImpact;
  const values = [current];

  for (let year = 1; year <= 3; year += 1) {
    const inertia = (state.issuer.history.at(-1) - state.issuer.history[0]) * 0.08;
    values.push(clamp(values.at(-1) + annualDelta + inertia - year * 0.45, 20, 95));
  }

  return values.map((value) => Math.round(value));
}

function getDiagnosis(values) {
  const finalScore = values.at(-1);
  const minimum = Math.min(...values);
  if (minimum < 55) {
    return {
      tone: "danger",
      badge: "Alerta temprana",
      title: "La curva sale del andarivel seguro",
      text: "El modelo detecta presion de deuda y mercado suficiente para comprometer la aptitud crediticia proyectada.",
    };
  }
  if (finalScore < 68) {
    return {
      tone: "watch",
      badge: "En observacion",
      title: "La solvencia queda cerca del piso",
      text: "La linea podria sostenerse con seguimiento mensual y gatillos de correccion preaprobados.",
    };
  }
  return {
    tone: "safe",
    badge: "Apto",
    title: "La curva permanece dentro de flujo seguro",
    text: "La trayectoria proyectada respalda la continuidad de la linea bajo las condiciones simuladas.",
  };
}

function getPrescriptions(values) {
  const finalScore = values.at(-1);
  const gap = Math.max(0, 68 - finalScore);

  if (gap === 0) {
    return [
      ["Mantener limite operativo", "Sin correcciones obligatorias para el escenario base."],
      ["Revisar MAV trimestralmente", "Activar alerta si el riesgo de mercado supera 30 puntos."],
    ];
  }

  const debtReduction = Math.ceil(gap * 1.65);
  const incomeLift = Math.ceil(gap * 1.15);
  const marketLimit = Math.max(12, state.marketRisk - Math.ceil(gap * 0.9));

  return [
    [`Reducir deuda en ${debtReduction}%`, "Prioridad alta por ponderacion del 40% sobre el score."],
    [`Aumentar ingresos en ${incomeLift}%`, "Necesario para compensar deterioro del flujo proyectado."],
    [`Limitar riesgo MAV a ${marketLimit}`, "Recalibrar cupos si las tasas operadas superan el umbral."],
  ];
}

function getFeasibility(values) {
  const finalScore = values.at(-1);
  const gap = Math.max(0, 68 - finalScore);
  const debtNeed = Math.ceil(gap * 1.65);
  const historicalCapacity = state.issuer.maxHistoricDeleveraging;
  const feasible = gap === 0 ? 92 : clamp(100 - Math.max(0, debtNeed - historicalCapacity) * 7 - gap * 2.5, 18, 86);

  return Math.round(feasible);
}

function drawChart(values) {
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 56, right: 24, top: 26, bottom: 54 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (chartW / 3) * index;
  const yFor = (score) => pad.top + (100 - score) * (chartH / 70);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#dff3ea";
  ctx.fillRect(pad.left, yFor(100), chartW, yFor(68) - yFor(100));
  ctx.fillStyle = "#fbecd1";
  ctx.fillRect(pad.left, yFor(68), chartW, yFor(55) - yFor(68));
  ctx.fillStyle = "#f7dede";
  ctx.fillRect(pad.left, yFor(55), chartW, yFor(30) - yFor(55));

  ctx.strokeStyle = "#d5dfdb";
  ctx.lineWidth = 1;
  [30, 45, 55, 68, 85, 100].forEach((score) => {
    const y = yFor(score);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "#66716f";
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillText(score, 18, y + 4);
  });

  ctx.strokeStyle = "#2f6b9f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  values.forEach((score, index) => {
    const x = xFor(index);
    const y = yFor(score);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((score, index) => {
    const x = xFor(index);
    const y = yFor(score);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2f6b9f";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#13211f";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.fillText(score, x - 9, y - 16);
  });

  ["Actual", "Ano 1", "Ano 2", "Ano 3"].forEach((label, index) => {
    ctx.fillStyle = "#66716f";
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillText(label, xFor(index) - 18, height - 24);
  });
}

function renderEngineTable(values) {
  const readings = [
    ["Crecimiento de Ingresos", "40%", `${state.incomeGrowth}% anual proyectado`],
    ["Evolucion de Deuda", "40%", `${state.debtGrowth}% de variacion de pasivos`],
    ["Riesgo de Mercado", "20%", `${state.marketRisk} puntos MAV`],
  ];

  els.engineTable.innerHTML = readings
    .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
    .join("");

  els.timeline.innerHTML = values
    .map((score, index) => {
      const label = index === 0 ? "Actual" : `Ano ${index}`;
      return `<div class="timeline-item"><strong>${label}</strong><span>${score} puntos · ${scoreLabel(score)}</span></div>`;
    })
    .join("");
}

function render() {
  const values = calculateProjection();
  const current = values[0];
  const projected = values.at(-1);
  const drift = projected - current;
  const diagnosis = getDiagnosis(values);
  const feasibility = getFeasibility(values);

  els.currentScore.textContent = current;
  els.currentScoreLabel.textContent = scoreLabel(current);
  els.projectedScore.textContent = projected;
  els.projectedScoreLabel.textContent = scoreLabel(projected);
  els.expectedDrift.textContent = `${drift > 0 ? "+" : ""}${drift}`;
  els.feasibilityScore.textContent = `${feasibility}%`;
  els.feasibilityLabel.textContent = feasibility >= 70 ? "Correccion realista" : "Requiere validacion";

  els.riskStatus.className = `risk-status ${diagnosis.tone === "safe" ? "" : diagnosis.tone}`;
  els.riskBadge.textContent = diagnosis.badge;
  els.riskTitle.textContent = diagnosis.title;
  els.riskText.textContent = diagnosis.text;

  els.prescriptionList.innerHTML = getPrescriptions(values)
    .map(([title, detail]) => `<div class="prescription-item"><strong>${title}</strong><span>${detail}</span></div>`)
    .join("");

  els.validationText.textContent =
    feasibility >= 70
      ? "El historial del emisor muestra capacidad suficiente para ejecutar las correcciones sugeridas."
      : "La correccion requerida supera la capacidad historica observada; conviene reducir cupo o pedir garantias adicionales.";
  els.confidenceFill.style.width = `${feasibility}%`;

  els.incomeGrowthValue.textContent = `${state.incomeGrowth}%`;
  els.debtGrowthValue.textContent = `${state.debtGrowth}%`;
  els.marketRiskValue.textContent = `${state.marketRisk}`;

  drawChart(values);
  renderEngineTable(values);
}

function setIssuer(issuerId) {
  state.issuer = issuers.find((issuer) => issuer.id === issuerId) || issuers[0];
  state.incomeGrowth = state.issuer.incomeGrowth;
  state.debtGrowth = state.issuer.debtGrowth;
  state.marketRisk = state.issuer.marketRisk;
  syncControls();
  render();
}

function syncControls() {
  els.incomeGrowth.value = state.incomeGrowth;
  els.debtGrowth.value = state.debtGrowth;
  els.marketRisk.value = state.marketRisk;
}

function init() {
  els.issuerSelect.innerHTML = issuers
    .map((issuer) => `<option value="${issuer.id}">${issuer.name} · ${issuer.sector}</option>`)
    .join("");

  els.issuerSelect.addEventListener("change", (event) => setIssuer(event.target.value));
  els.incomeGrowth.addEventListener("input", (event) => {
    state.incomeGrowth = Number(event.target.value);
    render();
  });
  els.debtGrowth.addEventListener("input", (event) => {
    state.debtGrowth = Number(event.target.value);
    render();
  });
  els.marketRisk.addEventListener("input", (event) => {
    state.marketRisk = Number(event.target.value);
    render();
  });
  els.resetBtn.addEventListener("click", () => setIssuer(state.issuer.id));
  els.exportBtn.addEventListener("click", () => window.print());

  syncControls();
  render();
}

init();
