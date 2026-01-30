import { fmtNum, fmtPct } from "./app.js";
import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 2,
  backUrl: "calc-1-setup.html",
  nextUrl: "calc-3-ai.html",
  readInputs(state, { toNumberOrBlank }){
    const i = state.inputs;
    // Step 1 fields still editable here
    i.totalLeads = toNumberOrBlank(document.getElementById("totalLeads").value);
    if (document.getElementById("inputMethod")) i.inputMethod = document.getElementById("inputMethod").value;

    // Human baseline
    const cr = document.getElementById("connectedRatePct");
    const ca = document.getElementById("connectedLeadsAbs");
    const hr = document.getElementById("humanOutcomeRatePct");
    const ha = document.getElementById("humanOutcomeAbs");
    if (cr) i.connectedRatePct = toNumberOrBlank(cr.value) / 100;
    if (ca) i.connectedLeadsAbs = toNumberOrBlank(ca.value);
    if (hr) i.humanOutcomeRatePct = toNumberOrBlank(hr.value) / 100;
    if (ha) i.humanOutcomeAbs = toNumberOrBlank(ha.value);
  },
  writeInputs(state){
    const i = state.inputs;
    document.getElementById("totalLeads").value = i.totalLeads;
    if (document.getElementById("inputMethod")) document.getElementById("inputMethod").value = i.inputMethod;

    const cr = document.getElementById("connectedRatePct");
    const ca = document.getElementById("connectedLeadsAbs");
    const hr = document.getElementById("humanOutcomeRatePct");
    const ha = document.getElementById("humanOutcomeAbs");
    if (cr) cr.value = (i.connectedRatePct === "" ? "" : i.connectedRatePct * 100);
    if (ca) ca.value = (i.connectedLeadsAbs === "" ? "" : i.connectedLeadsAbs);
    if (hr) hr.value = (i.humanOutcomeRatePct === "" ? "" : i.humanOutcomeRatePct * 100);
    if (ha) ha.value = (i.humanOutcomeAbs === "" ? "" : i.humanOutcomeAbs);
  },
  render(state, computed){
    const { outputs } = computed;
    document.getElementById("connectedCallsOut").textContent = fmtNum(outputs.connectedLeads, 0);
    document.getElementById("humanOutcomesOut").textContent = fmtNum(outputs.humanOutcomeCount, 0);
    document.getElementById("connectedRateOut").textContent = fmtPct(outputs.connectedRateAuto, 2);
    document.getElementById("humanRateOut").textContent = fmtPct(outputs.humanOutcomeRateAuto, 2);
  }
});
