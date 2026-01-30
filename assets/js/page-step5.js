import { fmtPct, fmtNum, fmtINR2 } from "./app.js";
import { initWizardPage } from "./wizard.js";

initWizardPage({
  stepIndex: 5,
  backUrl: "calc-4-pricing.html",
  nextUrl: "calc-6-compare.html",
  skipUrl: "calc-7-summary.html",
  readInputs(){ /* no inputs */ },
  writeInputs(){ /* no inputs */ },
  render(state, computed){
    const { scenarios } = computed;
    const tbody = document.getElementById("scenarioBody");
    tbody.innerHTML = "";

    const price = state.inputs.proposedOutcomePrice;
    const note = document.getElementById("scenarioNote");
    if (note){
      note.style.display = (price === "" ? "block" : "none");
    }

    scenarios.forEach(sc=>{
      const badgeClass = sc.better === "Outcome-based" ? "good" : (sc.better === "Per-minute" ? "warn" : "");
      const better = sc.better ? `<span class="badge ${badgeClass}">${sc.better}</span>` : "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono">${(sc.factor*100).toFixed(0)}%</td>
        <td>${fmtPct(sc.aiRate, 2)}</td>
        <td>${fmtNum(sc.aiCount, 0)}</td>
        <td>${fmtINR2(sc.outcomeRevenue)}</td>
        <td>${fmtINR2(sc.perMinRevenue)}</td>
        <td>${better}</td>
      `;
      tbody.appendChild(tr);
    });

    // Collapsible behavior
    const btn = document.getElementById("toggleScenario");
    const panel = document.getElementById("scenarioPanel");
    if (btn && panel && !btn.dataset.wired){
      btn.dataset.wired = "1";
      btn.addEventListener("click", ()=>{
        const open = panel.classList.toggle("open");
        btn.textContent = open ? "Hide table" : "Show table";
      });
    }
  }
});
