import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Para Firebase Web, as chaves não são segredo absoluto.
 * A segurança real vem das Regras do Firestore/Auth.
 *
 * Aqui fazemos:
 * - usa .env.local se estiver disponível
 * - se não estiver, usa fallback (para o projeto rodar SEM quebrar)
 */

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyDBlseMWpk1dYp103kcmTAYj6-jptgomIs",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "login-site-adv.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "login-site-adv",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "login-site-adv.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "745232344729",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:745232344729:web:a85fc8ec72d970f8263a08",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-70XRHDL7SR",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);