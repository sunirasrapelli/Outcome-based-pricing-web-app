
import { initTheme, nav, qs, fmtINR2, fmtNum, fmtPct } from "./app.js";
import { getSaved } from "./storage.js";
import { compute } from "./calc.js";

initTheme();

const id = qs("id");
if (!id){
  nav("saved.html");
}

const saved = getSaved(id);
if (!saved || !saved.state){
  nav("saved.html");
}

const state = saved.state;
const outcome = state.inputs.outcomeName;

// Always recompute to ensure outputs consistent
const { outputs, scenarios } = compute(state);

document.getElementById("title").textContent = saved.name || "Overview";
document.getElementById("subtitle").textContent = `Outcome: ${outcome} • Last saved: ${new Date(saved.timestamp).toLocaleString()}`;

document.getElementById("breakeven").textContent = fmtINR2(outputs.breakevenOutcomePrice);
document.getElementById("connected").textContent = fmtNum(outputs.connectedLeads, 0);
document.getElementById("aiOutcomes").textContent = fmtNum(outputs.aiOutcomeCount, 0);
document.getElementById("aiRate").textContent = fmtPct(outputs.aiOutcomeRateAuto, 2);
document.getElementById("outcomeKpiLabel").textContent = `AI ${outcome}`;
document.getElementById("outcomeRateLabel").textContent = `AI ${outcome} rate`;

const eff = outputs.aiVsHumanNeeded;
document.getElementById("effNeeded").textContent = (eff === "" ? "—" : (eff*100).toFixed(1) + "%");
document.getElementById("effHint").textContent = (outputs.riskLabel ? `Risk check: ${outputs.riskLabel}` : "Risk check: —");

// Human-readable summary
const clientPrice = state.inputs.proposedOutcomePrice;
const breakeven = outputs.breakevenOutcomePrice;
let summary = `At ${fmtINR2(breakeven)} per ${outcome}, outcome-based pricing matches the per-minute spend for the current assumptions.`;

if (clientPrice !== "" && clientPrice !== null && clientPrice !== undefined){
  const needed = outputs.aiVsHumanNeeded;
  const neededTxt = (needed === "" ? "—" : (needed*100).toFixed(1) + "%");
  summary += ` If the client suggests ${fmtINR2(clientPrice)} per ${outcome}, the AI would need to perform at about ${neededTxt} of the human outcome rate (${outputs.riskLabel || "check assumptions"}).`;
}

if (outputs.monthsForHuman !== "" && outputs.monthsForAI !== "" && outputs.monthsForAI > 0){
  const speed = outputs.monthsForHuman / outputs.monthsForAI;
  if (Number.isFinite(speed)){
    summary += ` Based on the optional target comparison, AI completes the target in ~${outputs.monthsForAI.toFixed(2)} months vs humans in ~${outputs.monthsForHuman.toFixed(2)} months (≈${speed.toFixed(1)}× faster).`;
  }
}

document.getElementById("summaryText").textContent = summary;

// Pitch lines
document.getElementById("pitchLine1").innerHTML =
  `<b>Breakeven anchor</b> “At ${fmtINR2(breakeven)} per ${outcome}, outcome-based pricing is equivalent to per-minute for this program.”`;

if (clientPrice !== "" && clientPrice !== null && clientPrice !== undefined){
  const needed = outputs.aiVsHumanNeeded;
  const neededTxt = (needed === "" ? "—" : (needed*100).toFixed(1) + "%");
  document.getElementById("pitchLine2").innerHTML =
    `<b>Client price check</b> “At ${fmtINR2(clientPrice)} per ${outcome}, we’d need ~${neededTxt} of human performance (${outputs.riskLabel || "check"}).”`;
}else{
  document.getElementById("pitchLine2").innerHTML =
    `<b>Client price check</b> “If you propose a price per ${outcome}, we can show the AI performance needed to justify it.”`;
}

if (outputs.totalHumanCost !== "" && outputs.aiSpendToHitTarget !== ""){
  document.getElementById("pitchLine3").innerHTML =
    `<b>Time & cost story</b> “To hit the target, the human team costs ${fmtINR2(outputs.totalHumanCost)} vs AI spend of ${fmtINR2(outputs.aiSpendToHitTarget)} (with capacity set to ${fmtNum(state.inputs.aiMinutesAvailable)} minutes/month).”`;
}else{
  document.getElementById("pitchLine3").innerHTML =
    `<b>Time & cost story</b> “Use the optional section to compare months-to-target and cost vs a human team.”`;
}

// Inputs table (friendly)
const i = state.inputs;
const rows = [
  ["Input method", i.inputMethod],
  ["Total leads", fmtNum(i.totalLeads, 0)],
  ["Connected rate (auto)", fmtPct(outputs.connectedRateAuto, 2)],
  ["Connected calls (auto)", fmtNum(outputs.connectedLeads, 0)],
  [`Human ${outcome} rate (auto)`, fmtPct(outputs.humanOutcomeRateAuto, 2)],
  ["AI vs Human", (i.aiVsHuman*100).toFixed(0) + "%"],
  [`AI ${outcome} rate (auto)`, fmtPct(outputs.aiOutcomeRateAuto, 2)],
  ["Avg handle time", `${i.ahtMins} mins`],
  ["AI price per minute", fmtINR2(i.aiPricePerMin)],
  ["Client outcome price", (i.proposedOutcomePrice === "" ? "—" : fmtINR2(i.proposedOutcomePrice))],
];
document.getElementById("inputsTable").innerHTML =
  rows.map(([k,v])=> `<tr><td>${k}</td><td class="mono">${v}</td></tr>`).join("");

// Scenario snapshot (reuse full scenarios)
document.getElementById("sRateHead").textContent = `AI ${outcome} rate`;
document.getElementById("sCountHead").textContent = `AI ${outcome}`;
document.getElementById("scenarioMini").innerHTML = scenarios.map(sc=>{
  const badgeClass = sc.better === "Outcome-based" ? "good" : (sc.better === "Per-minute" ? "warn" : "");
  const better = sc.better ? `<span class="badge ${badgeClass}">${sc.better}</span>` : "—";
  return `
    <tr>
      <td class="mono">${(sc.factor*100).toFixed(0)}%</td>
      <td>${fmtPct(sc.aiRate, 2)}</td>
      <td>${fmtNum(sc.aiCount, 0)}</td>
      <td>${fmtINR2(sc.outcomeRevenue)}</td>
      <td>${fmtINR2(sc.perMinRevenue)}</td>
      <td>${better}</td>
    </tr>
  `;
}).join("");

// Buttons
document.getElementById("backBtn").addEventListener("click", ()=> nav("saved.html"));
document.getElementById("homeBtn").addEventListener("click", ()=> nav("index.html"));
document.getElementById("editBtn").addEventListener("click", ()=> nav(`calc-1-setup.html?id=${encodeURIComponent(id)}`));
