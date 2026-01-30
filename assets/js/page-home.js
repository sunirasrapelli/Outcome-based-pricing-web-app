
import { initTheme, nav } from "./app.js";

initTheme();

// Multi-step wizard begins at step 1.
document.getElementById("startBtn").addEventListener("click", ()=> nav("calc-1-setup.html"));
document.getElementById("savedBtn").addEventListener("click", ()=> nav("saved.html"));
