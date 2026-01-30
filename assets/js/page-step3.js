import { fmtNum, fmtPct, fmtINR2 } from "./app.js";
import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 3,
  backUrl: "calc-2-human.html",
  nextUrl: "calc-4-pricing.html",
  readInputs(state, { toNumberOrBlank }){
    const i = state.inputs;
    i.aiVsHuman = toNumberOrBlank(document.getElementById("aiVsHumanPct").value) / 100;
    i.ahtMins = toNumberOrBlank(document.getElementById("ahtMins").value);
    i.aiPricePerMin = toNumberOrBlank(document.getElementById("aiPricePerMin").value);
  },
  writeInputs(state){
    const i = state.inputs;
    document.getElementById("aiVsHumanPct").value = (i.aiVsHuman === "" ? "" : i.aiVsHuman * 100);
    document.getElementById("ahtMins").value = i.ahtMins;
    document.getElementById("aiPricePerMin").value = i.aiPricePerMin;
  },
  render(state, computed){
    const { outputs } = computed;
    // Simple side-by-side
    document.getElementById("humanRateOut").textContent = fmtPct(outputs.humanOutcomeRateAuto, 2);
    document.getElementById("aiRateOut").textContent = fmtPct(outputs.aiOutcomeRateAuto, 2);
    document.getElementById("humanOutOut").textContent = fmtNum(outputs.humanOutcomeCount, 0);
    document.getElementById("aiOutOut").textContent = fmtNum(outputs.aiOutcomeCount, 0);
    document.getElementById("connectedOut").textContent = fmtNum(outputs.connectedLeads, 0);

    // Small “cost” preview without conclusions
    document.getElementById("aiSpendPreview").textContent = fmtINR2(outputs.aiSpend);
  }
});
