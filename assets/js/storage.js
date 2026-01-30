
import { STORAGE_KEYS, nowISO } from "./app.js";

export function loadSaved(){
  const raw = localStorage.getItem(STORAGE_KEYS.SAVED);
  if (!raw) return [];
  try{
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

export function saveSaved(arr){
  localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(arr));
}

export function upsertSaved(item){
  const all = loadSaved();
  const idx = all.findIndex(x => x.id === item.id);
  if (idx >= 0) all[idx] = item;
  else all.unshift(item);
  saveSaved(all);
}

export function deleteSaved(id){
  const all = loadSaved().filter(x => x.id !== id);
  saveSaved(all);
}

export function getSaved(id){
  return loadSaved().find(x => x.id === id) || null;
}

export function newId(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

export function loadDraft(){
  const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
  if (!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
export function saveDraft(state){
  localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(state));
}
export function clearDraft(){
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
}
