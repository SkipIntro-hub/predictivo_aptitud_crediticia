const issuers = [
  {
    id: "agro-sur",
    name: "Agro Sur S.A.",
    sector: "Agroindustria",
    history: [71, 73, 76, 74],
    incomeGrowth: 12,
    debtGrowth: 8,
    marketRisk: 18,
    incomeVolatility: 4,
    debtVolatility: 5,
    marketVolatility: 6,
    analystBias: 1,
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
    incomeVolatility: 6,
    debtVolatility: 8,
    marketVolatility: 10,
    analystBias: -3,
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
    incomeVolatility: 5,
    debtVolatility: 4,
    marketVolatility: 7,
    analystBias: 2,
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
  incomeVolatility: issuers[0].incomeVolatility,
  debtVolatility: issuers[0].debtVolatility,
  marketVolatility: issuers[0].marketVolatility,
  analystBias: issuers[0].analystBias,
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
  breachProbability: document.querySelector("#breachProbability"),
  confidenceRange: document.querySelector("#confidenceRange"),
  riskStatus: document.querySelector("#riskStatus"),
  riskBadge: document.querySelector("#riskBadge"),
  riskTitle: document.querySelector("#riskTitle"),
  riskText: document.querySelector("#riskText"),
  prescriptionList: document.querySelector("#prescriptionList"),
  validationText: document.querySelector("#validationText"),
  biasText: document.querySelector("#biasText"),
  confidenceFill: document.querySelector("#confidenceFill"),
  incomeGrowth: document.querySelector("#incomeGrowth"),
  debtGrowth: document.querySelector("#debtGrowth"),
  marketRisk: document.querySelector("#marketRisk"),
  incomeVolatility: document.querySelector("#incomeVolatility"),
  debtVolatility: document.querySelector("#debtVolatility"),
  marketVolatility: document.querySelector("#marketVolatility"),
  analystBias: document.querySelector("#analystBias"),
  incomeGrowthValue: document.querySelector("#incomeGrowthValue"),
  debtGrowthValue: document.querySelector("#debtGrowthValue"),
  marketRiskValue: document.querySelector("#marketRiskValue"),
  incomeVolatilityValue: document.querySelector("#incomeVolatilityValue"),
  debtVolatilityValue: document.querySelector("#debtVolatilityValue"),
  marketVolatilityValue: document.querySelector("#marketVolatilityValue"),
  analystBiasValue: document.querySelector("#analystBiasValue"),
  engineTable: document.querySelector("#engineTable"),
  timeline: document.querySelector("#timeline"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  chart: document.querySelector("#projectionChart"),
  gaussChart: document.querySelector("#gaussChart"),
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

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function normalSample(mean, deviation, seed) {
  const u1 = Math.max(seededRandom(seed), 0.0001);
  const u2 = Math.max(seededRandom(seed + 1.37), 0.0001);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * deviation;
}

function percentile(values, percent) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * percent);
  return sorted[index];
}

function calculateScenario(values, incomeGrowth, debtGrowth, marketRisk) {
  const current = state.issuer.history.at(-1);
  const incomeImpact = (incomeGrowth - 8) * 0.78 * weights.incomeGrowth;
  const debtImpact = (10 - debtGrowth) * 0.86 * weights.debtGrowth;
  const marketImpact = (22 - marketRisk) * 0.65 * weights.marketRisk;
  const annualDelta = incomeImpact + debtImpact + marketImpact + state.analystBias * 0.18;
  const inertia = (state.issuer.history.at(-1) - state.issuer.history[0]) * 0.08;
  const result = [current];

  for (let year = 1; year <= 3; year += 1) {
    result.push(clamp(result.at(-1) + annualDelta + inertia - year * 0.45, 20, 95));
  }

  return result;
}

function calculateProbabilisticModel() {
  const runs = 5000;
  const yearly = [[], [], [], []];
  const finalScores = [];
  let breaches = 0;

  for (let run = 0; run < runs; run += 1) {
    const seed = run * 9.91 + state.issuer.id.length * 17;
    const income = normalSample(state.incomeGrowth, state.incomeVolatility, seed);
    const debt = normalSample(state.debtGrowth, state.debtVolatility, seed + 11);
    const market = normalSample(state.marketRisk, state.marketVolatility, seed + 23);
    const scenario = calculateScenario(yearly, income, debt, market);

    scenario.forEach((score, index) => yearly[index].push(score));
    const finalScore = scenario.at(-1);
    finalScores.push(finalScore);
    if (finalScore < 68) breaches += 1;
  }

  const expected = yearly.map((scores) => Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length));
  const p10 = yearly.map((scores) => Math.round(percentile(scores, 0.1)));
  const p90 = yearly.map((scores) => Math.round(percentile(scores, 0.9)));

  return {
    expected,
    p10,
    p90,
    finalScores,
    breachProbability: Math.round((breaches / runs) * 100),
    finalMean: expected.at(-1),
    finalP10: p10.at(-1),
    finalP90: p90.at(-1),
  };
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

function drawChart(model) {
  const values = model.expected;
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

  ctx.fillStyle = "rgba(47, 107, 159, 0.15)";
  ctx.beginPath();
  model.p90.forEach((score, index) => {
    const x = xFor(index);
    const y = yFor(score);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  [...model.p10].reverse().forEach((score, reverseIndex) => {
    const index = model.p10.length - 1 - reverseIndex;
    ctx.lineTo(xFor(index), yFor(score));
  });
  ctx.closePath();
  ctx.fill();

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

function drawGaussChart(model) {
  const canvas = els.gaussChart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 38, right: 30, top: 22, bottom: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const scores = model.finalScores;
  const mean = model.finalMean;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  const deviation = Math.max(3, Math.sqrt(variance));
  const min = Math.max(30, Math.floor(mean - deviation * 3));
  const max = Math.min(100, Math.ceil(mean + deviation * 3));
  const yBase = height - pad.bottom;
  const normalY = (score) => {
    const exponent = -0.5 * ((score - mean) / deviation) ** 2;
    return Math.exp(exponent);
  };
  const xFor = (score) => pad.left + ((score - min) / (max - min)) * chartW;
  const yFor = (value) => yBase - value * chartH * 0.92;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(179, 58, 58, 0.12)";
  ctx.fillRect(pad.left, pad.top, Math.max(0, xFor(68) - pad.left), chartH);

  ctx.strokeStyle = "#2f6b9f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let step = 0; step <= 120; step += 1) {
    const score = min + ((max - min) / 120) * step;
    const x = xFor(score);
    const y = yFor(normalY(score));
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#b33a3a";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xFor(68), pad.top);
  ctx.lineTo(xFor(68), yBase);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#13211f";
  ctx.font = "700 14px Inter, system-ui, sans-serif";
  ctx.fillText(`Esperado ${mean}`, xFor(mean) - 38, pad.top + 18);
  ctx.fillStyle = "#66716f";
  ctx.font = "13px Inter, system-ui, sans-serif";
  ctx.fillText(`P10 ${model.finalP10}`, pad.left, height - 14);
  ctx.fillText(`P90 ${model.finalP90}`, width - pad.right - 56, height - 14);
  ctx.fillText("Piso seguro 68", xFor(68) - 42, yBase - 8);
}

function renderEngineTable(values) {
  const readings = [
    ["Crecimiento de Ingresos", "40%", `N(${state.incomeGrowth}%, ${state.incomeVolatility}) con sesgo ${state.analystBias}`],
    ["Evolucion de Deuda", "40%", `N(${state.debtGrowth}%, ${state.debtVolatility}) de variacion de pasivos`],
    ["Riesgo de Mercado", "20%", `N(${state.marketRisk}, ${state.marketVolatility}) puntos MAV`],
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
  const model = calculateProbabilisticModel();
  const values = model.expected;
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
  els.breachProbability.textContent = `${model.breachProbability}%`;
  els.confidenceRange.textContent = `${model.finalP10}-${model.finalP90}`;

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
  els.biasText.textContent =
    state.analystBias > 0
      ? "El escenario incorpora sesgo optimista: la expectativa mejora, pero la confianza depende de la dispersion observada."
      : state.analystBias < 0
        ? "El escenario incorpora sesgo conservador: penaliza la expectativa para reducir sobreestimacion del flujo futuro."
        : "El escenario no incorpora sesgo direccional: la curva se explica por expectativa y dispersion de las variables.";

  els.incomeGrowthValue.textContent = `${state.incomeGrowth}%`;
  els.debtGrowthValue.textContent = `${state.debtGrowth}%`;
  els.marketRiskValue.textContent = `${state.marketRisk}`;
  els.incomeVolatilityValue.textContent = `${state.incomeVolatility}`;
  els.debtVolatilityValue.textContent = `${state.debtVolatility}`;
  els.marketVolatilityValue.textContent = `${state.marketVolatility}`;
  els.analystBiasValue.textContent = `${state.analystBias > 0 ? "+" : ""}${state.analystBias}`;

  drawChart(model);
  drawGaussChart(model);
  renderEngineTable(values);
}

function setIssuer(issuerId) {
  state.issuer = issuers.find((issuer) => issuer.id === issuerId) || issuers[0];
  state.incomeGrowth = state.issuer.incomeGrowth;
  state.debtGrowth = state.issuer.debtGrowth;
  state.marketRisk = state.issuer.marketRisk;
  state.incomeVolatility = state.issuer.incomeVolatility;
  state.debtVolatility = state.issuer.debtVolatility;
  state.marketVolatility = state.issuer.marketVolatility;
  state.analystBias = state.issuer.analystBias;
  syncControls();
  render();
}

function syncControls() {
  els.incomeGrowth.value = state.incomeGrowth;
  els.debtGrowth.value = state.debtGrowth;
  els.marketRisk.value = state.marketRisk;
  els.incomeVolatility.value = state.incomeVolatility;
  els.debtVolatility.value = state.debtVolatility;
  els.marketVolatility.value = state.marketVolatility;
  els.analystBias.value = state.analystBias;
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
  els.incomeVolatility.addEventListener("input", (event) => {
    state.incomeVolatility = Number(event.target.value);
    render();
  });
  els.debtVolatility.addEventListener("input", (event) => {
    state.debtVolatility = Number(event.target.value);
    render();
  });
  els.marketVolatility.addEventListener("input", (event) => {
    state.marketVolatility = Number(event.target.value);
    render();
  });
  els.analystBias.addEventListener("input", (event) => {
    state.analystBias = Number(event.target.value);
    render();
  });
  els.resetBtn.addEventListener("click", () => setIssuer(state.issuer.id));
  els.exportBtn.addEventListener("click", () => window.print());

  syncControls();
  render();
}

init();
