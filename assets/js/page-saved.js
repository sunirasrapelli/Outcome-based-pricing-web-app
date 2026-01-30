
import { initTheme, nav, fmtINR2 } from "./app.js";
import { loadSaved, deleteSaved } from "./storage.js";
import { openModal, closeModal, wireModalClose, showToast } from "./ui.js";
import { compute } from "./calc.js";

initTheme();
wireModalClose();

let pendingDeleteId = null;

function render(){
  const items = loadSaved();
  document.getElementById("countLabel").textContent = items.length ? `${items.length} saved` : "";
  document.getElementById("emptyState").style.display = items.length ? "none" : "block";
  document.getElementById("savedTable").style.display = items.length ? "table" : "none";

  const tbody = document.getElementById("savedBody");
  tbody.innerHTML = "";

  items.forEach(item=>{
    const s = item.state || null;
    let breakeven = "—";
    if (s){
      const { outputs } = compute(s);
      breakeven = fmtINR2(outputs.breakevenOutcomePrice);
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="overview.html?id=${encodeURIComponent(item.id)}" class="mono" style="text-decoration:underline; text-underline-offset:3px;">${item.name || "Untitled"}</a></td>
      <td class="mono">${new Date(item.timestamp).toLocaleString()}</td>
      <td class="mono">${breakeven}</td>
      <td>
        <button class="btn small" data-open="${item.id}" type="button">Open</button>
        <button class="btn small danger" data-del="${item.id}" type="button">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Wire buttons
  tbody.querySelectorAll("[data-open]").forEach(b=>{
    b.addEventListener("click", ()=> nav(`overview.html?id=${encodeURIComponent(b.getAttribute("data-open"))}`));
  });
  tbody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      pendingDeleteId = b.getAttribute("data-del");
      openModal("deleteModal");
    });
  });
}

document.getElementById("backBtn").addEventListener("click", ()=> nav("index.html"));
document.getElementById("newBtn").addEventListener("click", ()=> nav("calc-1-setup.html"));

document.getElementById("confirmDeleteBtn").addEventListener("click", ()=>{
  if (!pendingDeleteId) return;
  deleteSaved(pendingDeleteId);
  pendingDeleteId = null;
  closeModal("deleteModal");
  showToast("Deleted.");
  render();
});

render();
