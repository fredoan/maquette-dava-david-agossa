// ============================================================
// FIREBASE CONFIG — DAVA DAVID AGOSSA
// Projet : dava-david-agossa
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQYA9dreQmIgRqsysk3K_ctyNGTaeAPA4",
  authDomain: "dava-david-agossa.firebaseapp.com",
  projectId: "dava-david-agossa",
  storageBucket: "dava-david-agossa.firebasestorage.app",
  messagingSenderId: "410030285009",
  appId: "1:410030285009:web:318819647379b6f74fa5f0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Log de confirmation (visible dans la console F12)
console.log('✅ Firebase initialisé — projet :', firebaseConfig.projectId);
