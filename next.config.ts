import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // força a raiz correta do projeto para o Turbopack
  turbopack: {
    root: __dirname,
  },

  /**
   * Permite carregar imagens externas do Cloudinary
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  /**
   * Fallback GARANTIDO:
   * Mesmo se o .env.local não for lido, isso injeta as variáveis no build.
   * (Você pode depois remover quando o .env.local estiver ok.)
   */
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyDBlseMWpk1dYp103kcmTAYj6-jptgomIs",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "login-site-adv.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "login-site-adv",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "login-site-adv.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "745232344729",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:745232344729:web:a85fc8ec72d970f8263a08",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-70XRHDL7SR",
  },
};

export default nextConfig;