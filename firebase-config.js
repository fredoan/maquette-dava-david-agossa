// ============================================================
// FIREBASE CONFIG — DAVA DAVID AGOSSA
// Projet : dava-david-agossa
// Version : sans Storage (Option 1 — hébergeurs externes)
// Cache persistant Firestore activé (multi-onglets)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQYA9dreQmIgRqsysk3K_ctyNGTaeAPA4",
  authDomain: "dava-david-agossa.firebaseapp.com",
  projectId: "dava-david-agossa",
  storageBucket: "dava-david-agossa.firebasestorage.app",
  messagingSenderId: "410030285009",
  appId: "1:410030285009:web:318819647379b6f74fa5f0"
};

const app = initializeApp(firebaseConfig);

// --- Auth (inchangé) ---
export const auth = getAuth(app);

// --- Firestore avec cache persistant multi-onglets ---
// Le cache persistant permet de continuer à lire les contenus
// même sans réseau, et de ne rien perdre en cas de coupure.
// Aucun changement d'API : "db" s'utilise exactement comme avant.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Logs de confirmation (visibles dans la console F12)
console.log('✅ Firebase initialisé — projet :', firebaseConfig.projectId);
console.log('   · Auth       : OK');
console.log('   · Firestore  : OK (cache persistant multi-onglets)');
console.log('   · Storage    : non utilisé (images via hébergeurs externes)');
