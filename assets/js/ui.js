
import { $, $all } from "./app.js";

export function showToast(msg, ms=2200){
  let t = $(".toast");
  if (!t){
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), ms);
}

export function openModal(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("show");
  const focus = el.querySelector("[data-autofocus]");
  if (focus) setTimeout(()=>focus.focus(), 30);
}
export function closeModal(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
}

export function wireModalClose(){
  $all(".modal-backdrop").forEach(b=>{
    b.addEventListener("click",(e)=>{
      if (e.target === b) b.classList.remove("show");
    });
  });
  $all("[data-modal-close]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-modal-close");
      closeModal(id);
    });
  });
}

export function setInvalid(fieldEl, message){
  if (!fieldEl) return;
  fieldEl.classList.add("invalid");
  const err = fieldEl.querySelector(".err");
  if (err) err.textContent = message || "Check this value.";
}
export function clearInvalid(fieldEl){
  if (!fieldEl) return;
  fieldEl.classList.remove("invalid");
}
