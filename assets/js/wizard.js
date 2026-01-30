// Shared wizard (multi-step) UI wiring.
// IMPORTANT: Calculator math + storage format must remain unchanged.

import { initTheme, $, $all, nav, qs, isInternalNav } from "./app.js";
import { defaultState, compute, OUTCOME_OPTIONS, INPUT_METHODS } from "./calc.js";
import { loadDraft, saveDraft, clearDraft, upsertSaved, getSaved, newId } from "./storage.js";
import { openModal, closeModal, wireModalClose, showToast, setInvalid, clearInvalid } from "./ui.js";

export const STEPS = [
  { key: "setup",      title: "Outcome & Volume" , url: "calc-1-setup.html" },
  { key: "human",      title: "Human Baseline"   , url: "calc-2-human.html" },
  { key: "ai",         title: "AI Assumptions"   , url: "calc-3-ai.html" },
  { key: "pricing",    title: "Pricing"          , url: "calc-4-pricing.html" },
  { key: "scenarios",  title: "Scenarios"        , url: "calc-5-scenarios.html", optional: true },
  { key: "compare",    title: "Human vs AI"       , url: "calc-6-compare.html", optional: true },
  { key: "summary",    title: "Summary & Save"    , url: "calc-7-summary.html" },
];

function withId(url, id){
  if (!id) return url;
  const u = new URL(url, location.href);
  u.searchParams.set("id", id);
  return u.pathname + u.search;
}

function toNumberOrBlank(v){
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function setModeVisibility(state){
  const m = state.inputs.inputMethod;
  $all("[data-mode]").forEach(el=>{
    const mode = el.getAttribute("data-mode");
    el.style.display = (mode === m) ? "grid" : "none";
  });
}

function refreshOutcomeText(state){
  const outcome = state.inputs.outcomeName;
  $all("[data-outcome-text]").forEach(el=>{
    const tmpl = el.getAttribute("data-outcome-text");
    el.textContent = tmpl.replaceAll("{outcome}", outcome);
  });
}

// Step validation (used for gating + next button)
export function validateStep(state, stepIndex){
  let ok = true;
  const i = state.inputs;

  // Helper for inline validation
  function req(fieldKey, cond, msg){
    const el = document.querySelector(`.field[data-field="${fieldKey}"]`);
    if (!el) return;
    if (!cond){ setInvalid(el, msg); ok = false; }
    else clearInvalid(el);
  }

  // Always clear validation on fields not on this page
  // (No-op if not present.)
  const stepKey = STEPS[stepIndex-1]?.key;

  if (stepKey === "setup"){
    req("outcomeName", !!i.outcomeName, "Choose an outcome.");
    req("totalLeads", i.totalLeads !== "" && i.totalLeads >= 0, "Enter total leads (0 or more)." );
    req("inputMethod", INPUT_METHODS.includes(i.inputMethod), "Choose Percentages or Absolute." );
  }

  if (stepKey === "human"){
    // Requires step 1 fields too
    req("totalLeads", i.totalLeads !== "" && i.totalLeads >= 0, "Enter total leads (0 or more)." );
    if (i.inputMethod === "Percentages"){
      req("connectedRatePct", i.connectedRatePct !== "" && i.connectedRatePct >= 0 && i.connectedRatePct <= 1, "Enter connected rate (0–100%).");
      req("humanOutcomeRatePct", i.humanOutcomeRatePct !== "" && i.humanOutcomeRatePct >= 0 && i.humanOutcomeRatePct <= 1, "Enter human outcome rate (0–100%).");
    }else{
      req("connectedLeadsAbs", i.connectedLeadsAbs !== "" && i.connectedLeadsAbs >= 0, "Enter connected calls (0 or more)." );
      req("humanOutcomeAbs", i.humanOutcomeAbs !== "" && i.humanOutcomeAbs >= 0, "Enter human outcomes (0 or more)." );
    }
  }

  if (stepKey === "ai"){
    req("aiVsHuman", i.aiVsHuman !== "" && i.aiVsHuman >= 0, "Enter AI vs Human (%)." );
    req("ahtMins", i.ahtMins !== "" && i.ahtMins >= 0, "Enter average handle time (mins)." );
    req("aiPricePerMin", i.aiPricePerMin !== "" && i.aiPricePerMin >= 0, "Enter AI price per minute." );
  }

  if (stepKey === "pricing"){
    // proposedOutcomePrice is optional, but if present should be >= 0
    if (i.proposedOutcomePrice !== ""){
      req("proposedOutcomePrice", i.proposedOutcomePrice >= 0, "Outcome price must be 0 or more." );
    }else{
      const el = document.querySelector(`.field[data-field="proposedOutcomePrice"]`);
      if (el) clearInvalid(el);
    }
  }

  if (stepKey === "compare"){
    // Optional page: validate only if fields exist and not blank
    req("salaryPerAgent", i.salaryPerAgent !== "" && i.salaryPerAgent >= 0, "Enter salary per agent." );
    req("numAgents", i.numAgents !== "" && i.numAgents >= 0, "Enter number of agents." );
    req("humanOutcomePerMonth", i.humanOutcomePerMonth !== "" && i.humanOutcomePerMonth >= 0, "Enter human outcomes / month." );
    req("targetOutcome", i.targetOutcome !== "" && i.targetOutcome >= 0, "Enter target outcomes." );
    req("aiMinutesAvailable", i.aiMinutesAvailable !== "" && i.aiMinutesAvailable >= 0, "Enter AI minutes available." );
  }

  return ok;
}

// Finds earliest required step that is invalid.
function firstIncompleteRequiredStep(state){
  // Steps 1-4 are required; 5-6 optional; 7 requires only that required steps are complete.
  const required = [1,2,3,4];
  for (const s of required){
    // validateStep uses DOM to set errors; for gating we only need boolean,
    // so run a "silent" check without DOM when not on that page.
    if (!silentValidate(state, s)) return s;
  }
  return null;
}

function silentValidate(state, stepIndex){
  const i = state.inputs;
  const stepKey = STEPS[stepIndex-1]?.key;
  if (stepKey === "setup"){
    return !!i.outcomeName && i.totalLeads !== "" && i.totalLeads >= 0 && INPUT_METHODS.includes(i.inputMethod);
  }
  if (stepKey === "human"){
    if (i.totalLeads === "" || i.totalLeads < 0) return false;
    if (i.inputMethod === "Percentages"){
      return i.connectedRatePct !== "" && i.connectedRatePct >= 0 && i.connectedRatePct <= 1 &&
             i.humanOutcomeRatePct !== "" && i.humanOutcomeRatePct >= 0 && i.humanOutcomeRatePct <= 1;
    }
    return i.connectedLeadsAbs !== "" && i.connectedLeadsAbs >= 0 && i.humanOutcomeAbs !== "" && i.humanOutcomeAbs >= 0;
  }
  if (stepKey === "ai"){
    return i.aiVsHuman !== "" && i.aiVsHuman >= 0 && i.ahtMins !== "" && i.ahtMins >= 0 && i.aiPricePerMin !== "" && i.aiPricePerMin >= 0;
  }
  if (stepKey === "pricing"){
    return (i.proposedOutcomePrice === "" || i.proposedOutcomePrice >= 0);
  }
  return true;
}

export function initWizardPage(opts){
  // opts:
  //  stepIndex (1..7)
  //  readInputs(state)
  //  writeInputs(state)
  //  render(state, computed)
  //  backUrl, nextUrl, skipUrl (optional)
  //  showSave (bool)

  initTheme();
  wireModalClose();

  let state = defaultState();
  let dirty = false;
  let pendingNavUrl = null;

  const editId = qs("id");
  if (editId){
    const saved = getSaved(editId);
    if (saved && saved.state){
      state = saved.state;
      state.meta = saved.meta || state.meta;
    }
  }else{
    const draft = loadDraft();
    if (draft && draft.inputs) state = draft;
  }

  // Gate: prevent jumping ahead of required steps
  const earliest = firstIncompleteRequiredStep(state);
  if (earliest && opts.stepIndex > earliest){
    nav(withId(STEPS[earliest-1].url, editId), { internal:true });
    return; // stop initializing this page
  }

  function markDirty(v=true){
    dirty = v;
    const badge = $("#dirtyBadge");
    if (badge) badge.style.display = dirty ? "inline-flex" : "none";
  }

  function computeAndRender(){
    setModeVisibility(state);
    refreshOutcomeText(state);
    const computed = compute(state);
    state.computed = computed;
    saveDraft(state);
    opts.render?.(state, computed);
  }

  function onAnyInput(){
    opts.readInputs?.(state, { toNumberOrBlank });
    saveDraft(state);
    markDirty(true);
    computeAndRender();
  }

  // Populate dropdowns if present
  const outcomeSel = $("#outcomeName");
  if (outcomeSel){
    outcomeSel.innerHTML = OUTCOME_OPTIONS.map(o=>`<option value="${o}">${o}</option>`).join("");
  }
  const methodSel = $("#inputMethod");
  if (methodSel){
    methodSel.innerHTML = INPUT_METHODS.map(m=>`<option value="${m}">${m}</option>`).join("");
  }

  opts.writeInputs?.(state);
  computeAndRender();

  // Bind listeners on all fields on the page
  $all("input,select").forEach(el=>{
    el.addEventListener("input", onAnyInput);
    el.addEventListener("change", onAnyInput);
  });

  // Stepper UI
  const stepIdx = opts.stepIndex;
  const total = STEPS.length;
  const stepLabel = $("#stepLabel");
  const stepTitle = $("#stepTitle");
  const stepBar = $("#stepBar");
  if (stepLabel) stepLabel.textContent = `Step ${stepIdx} of ${total}`;
  if (stepTitle) stepTitle.textContent = STEPS[stepIdx-1].title;
  if (stepBar) stepBar.style.width = `${Math.round((stepIdx/total)*100)}%`;

  // Navigation helpers
  function attemptNav(url){
    if (dirty){
      pendingNavUrl = url;
      openModal("leaveModal");
      return;
    }
    nav(url, { internal:true });
  }

  // Back/Next within wizard should not prompt; state persists as draft.
  const backBtn = $("#backBtn");
  if (backBtn && opts.backUrl){
    backBtn.addEventListener("click", ()=> nav(withId(opts.backUrl, editId), { internal:true }));
  }
  const nextBtn = $("#nextBtn");
  if (nextBtn && opts.nextUrl){
    nextBtn.addEventListener("click", ()=>{
      opts.readInputs?.(state, { toNumberOrBlank });
      // Validate current step
      const ok = validateStep(state, opts.stepIndex);
      if (!ok){
        showToast("Please fix the highlighted inputs.");
        return;
      }
      nav(withId(opts.nextUrl, editId), { internal:true });
    });
  }
  const skipBtn = $("#skipBtn");
  if (skipBtn && opts.skipUrl){
    skipBtn.addEventListener("click", ()=> nav(withId(opts.skipUrl, editId), { internal:true }));
  }

  // Topbar links (leaving the wizard)
  const homeLink = $("#homeLink");
  if (homeLink) homeLink.addEventListener("click", (e)=>{ e.preventDefault(); attemptNav("index.html"); });
  // Saved + Overview are still inside the app; drafts are preserved, so avoid disruptive warnings.
  const savedLink = $("#savedLink");
  if (savedLink) savedLink.addEventListener("click", (e)=>{ e.preventDefault(); nav("saved.html", { internal:true }); });

  // Browser-level protection
  window.addEventListener("beforeunload", (e)=>{
    // Only warn on true browser unload (refresh/tab close/external navigation).
    // Suppress the native prompt when moving between app pages.
    if (!dirty || isInternalNav()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // Leave modal buttons
  const stayBtn = $("#stayBtn");
  if (stayBtn) stayBtn.addEventListener("click", ()=>{ pendingNavUrl=null; closeModal("leaveModal"); });
  const saveFromLeaveBtn = $("#saveFromLeaveBtn");
  if (saveFromLeaveBtn) saveFromLeaveBtn.addEventListener("click", ()=>{ closeModal("leaveModal"); openSave(); });

  // SAVE FLOW (used on summary page + leave modal)
  function openSave(){
    const nameEl = $("#saveName");
    const errEl = $("#saveNameErr");
    if (errEl) errEl.textContent = "";
    if (nameEl){
      nameEl.value = state.meta?.name || `${state.inputs.outcomeName} – ${new Date().toLocaleDateString()}`;
    }
    openModal("saveModal");
  }

  const saveBtn = $("#saveBtn");
  if (saveBtn) saveBtn.addEventListener("click", openSave);

  const confirmSaveBtn = $("#confirmSaveBtn");
  if (confirmSaveBtn) confirmSaveBtn.addEventListener("click", ()=>{
    // On save, validate required steps (1-4) and the current page if it has required fields.
    opts.readInputs?.(state, { toNumberOrBlank });
    const earliest2 = firstIncompleteRequiredStep(state);
    if (earliest2){
      showToast("Please complete required steps before saving.");
      closeModal("saveModal");
      nav(withId(STEPS[earliest2-1].url, editId), { internal:true });
      return;
    }
    if (opts.stepIndex === 6){
      const ok = validateStep(state, 6);
      if (!ok){ showToast("Please fix the highlighted inputs."); return; }
    }
    const name = ($("#saveName")?.value || "").trim();
    if (!name){
      if ($("#saveNameErr")) $("#saveNameErr").textContent = "Please enter a name.";
      return;
    }
    const ts = new Date().toISOString();
    if (!state.meta.id) state.meta.id = newId();
    if (!state.meta.createdAt) state.meta.createdAt = ts;
    state.meta.updatedAt = ts;
    state.meta.name = name;

    // Ensure latest computed is stored
    computeAndRender();

    upsertSaved({
      id: state.meta.id,
      name: state.meta.name,
      timestamp: ts,
      meta: state.meta,
      state
    });

    clearDraft();
    markDirty(false);
    closeModal("saveModal");
    showToast("Saved.");

    if (pendingNavUrl){
      const url = pendingNavUrl;
      pendingNavUrl = null;
      nav(url, { internal:true });
    }
  });

  // Escape closes modals
  document.addEventListener("keydown", (e)=>{
    if (e.key !== "Escape") return;
    closeModal("saveModal");
    closeModal("leaveModal");
  });

  // Public API for the page
  return { state, markDirty, computeAndRender };
}
