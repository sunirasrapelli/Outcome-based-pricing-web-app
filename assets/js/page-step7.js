import { fmtINR2, fmtNum, fmtPct, nav } from "./app.js";
import { initWizardPage, STEPS } from "./wizard.js";

initWizardPage({
  stepIndex: 7,
  backUrl: "calc-6-compare.html",
  readInputs(){ /* no direct inputs */ },
  writeInputs(){ /* none */ },
  render(state, computed){
    const { outputs } = computed;
    const outcome = state.inputs.outcomeName;

    document.getElementById("breakevenPrice").textContent = fmtINR2(outputs.breakevenOutcomePrice);
    document.getElementById("aiSpend").textContent = fmtINR2(outputs.aiSpend);
    document.getElementById("aiOutcomes").textContent = fmtNum(outputs.aiOutcomeCount, 0);
    document.getElementById("outcomeLbl").textContent = outcome;

    const eff = outputs.aiVsHumanNeeded;
    const effTxt = (eff === "" ? "—" : (eff*100).toFixed(1) + "%");
    document.getElementById("effNeeded").textContent = effTxt;
    document.getElementById("riskLabel").textContent = outputs.riskLabel || "—";

    // Sales-friendly narrative
    const clientPrice = state.inputs.proposedOutcomePrice;
    let line1 = `Breakeven anchor: At ${fmtINR2(outputs.breakevenOutcomePrice)} per ${outcome}, outcome-based pricing matches the per-minute spend under these assumptions.`;
    let line2 = `Volume + performance: AI delivers ~${fmtNum(outputs.aiOutcomeCount,0)} ${outcome} from ~${fmtNum(outputs.connectedLeads,0)} connected calls at an effective ${fmtPct(outputs.aiOutcomeRateAuto,2)} outcome rate.`;
    let line3 = "";
    if (clientPrice !== "" && clientPrice !== null && clientPrice !== undefined){
      line3 = `Client price check: At ${fmtINR2(clientPrice)} per ${outcome}, the AI would need to perform at ~${effTxt} of the human outcome rate (${outputs.riskLabel || "check"}).`;
    }else{
      line3 = `Client price check: Enter a proposed price to see the AI performance needed to justify it.`;
    }

    if (outputs.monthsForHuman !== "" && outputs.monthsForAI !== "" && outputs.monthsForAI > 0){
      const speed = outputs.monthsForHuman / outputs.monthsForAI;
      if (Number.isFinite(speed)){
        const line4 = `Optional speed story: AI reaches the target in ~${outputs.monthsForAI.toFixed(2)} months vs humans in ~${outputs.monthsForHuman.toFixed(2)} months (≈${speed.toFixed(1)}× faster).`;
        document.getElementById("optionalLine").textContent = line4;
        document.getElementById("optionalLineWrap").style.display = "block";
      }else{
        document.getElementById("optionalLineWrap").style.display = "none";
      }
    }else{
      document.getElementById("optionalLineWrap").style.display = "none";
    }

    document.getElementById("summary1").textContent = line1;
    document.getElementById("summary2").textContent = line2;
    document.getElementById("summary3").textContent = line3;

    // View overview button enabled only after save
    const viewBtn = document.getElementById("viewOverviewBtn");
    if (viewBtn){
      const hasId = !!state.meta?.id;
      viewBtn.disabled = !hasId;
      viewBtn.title = hasId ? "Open the saved overview" : "Save first to generate an overview";
      if (!viewBtn.dataset.wired){
        viewBtn.dataset.wired = "1";
        viewBtn.addEventListener("click", ()=>{
          if (!state.meta?.id) return;
          nav(`overview.html?id=${encodeURIComponent(state.meta.id)}`, { internal:true });
        });
      }
    }
  }
});
