import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 1,
  backUrl: "index.html",
  nextUrl: "calc-2-human.html",
  readInputs(state, { toNumberOrBlank }){
    const i = state.inputs;
    i.outcomeName = document.getElementById("outcomeName").value;
    i.totalLeads = toNumberOrBlank(document.getElementById("totalLeads").value);
    i.inputMethod = document.getElementById("inputMethod").value;
  },
  writeInputs(state){
    const i = state.inputs;
    document.getElementById("outcomeName").value = i.outcomeName;
    document.getElementById("totalLeads").value = i.totalLeads;
    document.getElementById("inputMethod").value = i.inputMethod;
  },
  render(){ /* No outputs on this page */ }
});
