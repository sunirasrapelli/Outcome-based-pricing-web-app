import { fmtINR2, fmtPct, fmtNum } from "./app.js";
import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 4,
  backUrl: "calc-3-ai.html",
  nextUrl: "calc-5-scenarios.html",
  skipUrl: "calc-7-summary.html",
  readInputs(state, { toNumberOrBlank }){
    const i = state.inputs;
    const p = document.getElementById("proposedOutcomePrice").value;
    i.proposedOutcomePrice = (p === "" ? "" : toNumberOrBlank(p));
  },
  writeInputs(state){
    const i = state.inputs;
    document.getElementById("proposedOutcomePrice").value = (i.proposedOutcomePrice === "" ? "" : i.proposedOutcomePrice);
  },
  render(state, computed){
    const { outputs } = computed;
    document.getElementById("breakevenPrice").textContent = fmtINR2(outputs.breakevenOutcomePrice);
    document.getElementById("aiSpend").textContent = fmtINR2(outputs.aiSpend);
    document.getElementById("aiOutcomes").textContent = fmtNum(outputs.aiOutcomeCount, 0);

    document.getElementById("aiRateNeeded").textContent = fmtPct(outputs.aiOutcomeRateNeeded, 2);
    document.getElementById("aiVsHumanNeeded").textContent = (outputs.aiVsHumanNeeded === "" ? "—" : (outputs.aiVsHumanNeeded*100).toFixed(1) + "%");
    document.getElementById("riskLabel").textContent = outputs.riskLabel || "—";

    // Make the “risk” pill visually change via data attribute
    const pill = document.getElementById("riskPill");
    if (pill){
      const label = outputs.riskLabel || "";
      pill.dataset.status = label.startsWith("OK") ? "ok" : (label.startsWith("Risky") ? "risk" : "");
    }
  }
});
