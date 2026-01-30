import { fmtINR2, fmtNum } from "./app.js";
import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 6,
  backUrl: "calc-5-scenarios.html",
  nextUrl: "calc-7-summary.html",
  skipUrl: "calc-7-summary.html",
  readInputs(state, { toNumberOrBlank }){
    const i = state.inputs;
    i.salaryPerAgent = toNumberOrBlank(document.getElementById("salaryPerAgent").value);
    i.numAgents = toNumberOrBlank(document.getElementById("numAgents").value);
    i.humanOutcomePerMonth = toNumberOrBlank(document.getElementById("humanOutcomePerMonth").value);
    i.targetOutcome = toNumberOrBlank(document.getElementById("targetOutcome").value);
    i.aiMinutesAvailable = toNumberOrBlank(document.getElementById("aiMinutesAvailable").value);
  },
  writeInputs(state){
    const i = state.inputs;
    document.getElementById("salaryPerAgent").value = i.salaryPerAgent;
    document.getElementById("numAgents").value = i.numAgents;
    document.getElementById("humanOutcomePerMonth").value = i.humanOutcomePerMonth;
    document.getElementById("targetOutcome").value = i.targetOutcome;
    document.getElementById("aiMinutesAvailable").value = i.aiMinutesAvailable;
  },
  render(state, computed){
    const { outputs } = computed;
    document.getElementById("monthsHuman").textContent = (outputs.monthsForHuman === "" ? "—" : outputs.monthsForHuman.toFixed(2));
    document.getElementById("monthsAI").textContent = (outputs.monthsForAI === "" ? "—" : outputs.monthsForAI.toFixed(2));
    document.getElementById("humanCost").textContent = fmtINR2(outputs.totalHumanCost);
    document.getElementById("aiSpendTarget").textContent = fmtINR2(outputs.aiSpendToHitTarget);
    document.getElementById("callsNeeded").textContent = fmtNum(outputs.callsNeededToHitTarget, 0);
  }
});
