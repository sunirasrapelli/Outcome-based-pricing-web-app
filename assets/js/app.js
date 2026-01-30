
/* Shared app utilities: theme, navigation helpers, query params */
export const STORAGE_KEYS = {
  THEME: "obpc_theme",
  DRAFT: "obpc_draft_v1",              // current unsaved draft (calculator page)
  SAVED: "obpc_saved_v1",              // array of saved calculations
};

// Used to suppress native beforeunload prompts during in-app navigation.
// Because this app is multi-page (multiple HTML files), clicking Next/Back
// normally triggers a browser unload. We suppress the *native* prompt only
// for internal navigation, while still prompting on refresh/tab close/external.
const INTERNAL_NAV_KEY = "obpc_internal_nav";

export function markInternalNav(){
  try{ sessionStorage.setItem(INTERNAL_NAV_KEY, "1"); }catch{}
}
export function clearInternalNav(){
  try{ sessionStorage.removeItem(INTERNAL_NAV_KEY); }catch{}
}
export function isInternalNav(){
  try{ return sessionStorage.getItem(INTERNAL_NAV_KEY) === "1"; }catch{ return false; }
}

export function $(sel, root=document){ return root.querySelector(sel); }
export function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

export function fmtINR(v){
  if (v === "" || v === null || v === undefined || Number.isNaN(v)) return "—";
  try{
    return new Intl.NumberFormat("en-IN",{ style:"currency", currency:"INR", maximumFractionDigits:0 }).format(v);
  }catch{
    return "₹" + Math.round(v).toLocaleString("en-IN");
  }
}
export function fmtINR2(v){
  if (v === "" || v === null || v === undefined || Number.isNaN(v)) return "—";
  try{
    return new Intl.NumberFormat("en-IN",{ style:"currency", currency:"INR", minimumFractionDigits:2, maximumFractionDigits:2 }).format(v);
  }catch{
    return "₹" + (Math.round(v*100)/100).toLocaleString("en-IN");
  }
}
export function fmtPct(v, digits=1){
  if (v === "" || v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v*100).toFixed(digits) + "%";
}
export function fmtNum(v, digits=0){
  if (v === "" || v === null || v === undefined || Number.isNaN(v)) return "—";
  const d = Math.max(0, digits);
  return Number(v).toLocaleString("en-IN",{ maximumFractionDigits:d, minimumFractionDigits:d });
}

export function getTheme(){
  return localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
}
export function setTheme(t){
  localStorage.setItem(STORAGE_KEYS.THEME, t);
  document.documentElement.setAttribute("data-theme", t);
}
export function initTheme(){
  // New page load: clear any in-app navigation suppression.
  clearInternalNav();
  setTheme(getTheme());
  const btn = document.querySelector("[data-theme-toggle]");
  if (btn){
    btn.addEventListener("click", ()=>{
      const next = getTheme()==="dark" ? "light" : "dark";
      setTheme(next);
    });
  }
}

export function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
export function setQS(name, value){
  const u = new URL(location.href);
  if (value === null || value === undefined) u.searchParams.delete(name);
  else u.searchParams.set(name, value);
  history.replaceState({}, "", u.toString());
}

export function nav(url, { internal=false } = {}){
  // Mark internal navigation so beforeunload prompts don’t fire between app pages.
  if (internal) markInternalNav();
  else clearInternalNav();
  window.location.href = url;
}

export function nowISO(){
  return new Date().toISOString();
}
