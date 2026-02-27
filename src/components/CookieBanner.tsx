"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentValue = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const COOKIE_NAME = "gg_cookie_consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  // Se quiser, pode trocar SameSite=Lax por SameSite=None; Secure (em HTTPS) caso use em iframes/terceiros
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

function parseConsent(raw: string | null): ConsentValue | null {
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (obj.necessary !== true) return null;

    return {
      necessary: true,
      analytics: !!obj.analytics,
      marketing: !!obj.marketing,
      updatedAt: String(obj.updatedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // ✅ Lê cookie só depois do mount (evita hydration mismatch e garante document.cookie disponível)
  useEffect(() => {
    setMounted(true);

    const existing = parseConsent(getCookie(COOKIE_NAME));

    if (!existing) {
      setOpen(true);
      return;
    }

    setAnalytics(existing.analytics);
    setMarketing(existing.marketing);
    setOpen(false);
  }, []);

  function save(consent: Omit<ConsentValue, "updatedAt">) {
    const payload: ConsentValue = {
      ...consent,
      updatedAt: new Date().toISOString(),
    };

    setCookie(COOKIE_NAME, JSON.stringify(payload), ONE_YEAR);
    setOpen(false);
    setPrefsOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cookie-consent-updated"));
    }
  }

  function acceptAll() {
    save({ necessary: true, analytics: true, marketing: true });
  }

  function rejectAll() {
    save({ necessary: true, analytics: false, marketing: false });
  }

  function savePrefs() {
    save({ necessary: true, analytics, marketing });
  }

  // ✅ Trava scroll e ESC fecha o modal de preferências
  useEffect(() => {
    if (!prefsOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPrefsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [prefsOpen]);

  if (!mounted) return null;
  if (!open) return null;

  return (
    <>
      {/* ===== Barra fixa inferior ===== */}
      <div className="fixed inset-x-0 bottom-0 z-[200] p-4 sm:p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#0B0F1A]/95 backdrop-blur shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Aviso de Cookies</p>
              <p className="mt-1 text-xs sm:text-sm text-white/70 leading-relaxed">
                Utilizamos cookies para melhorar sua experiência e, se você permitir,
                para análises e marketing. Você pode gerenciar preferências a qualquer
                momento em{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Aviso de cookies
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Recusar
              </button>

              <button
                type="button"
                onClick={() => setPrefsOpen(true)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Preferências
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className="rounded-xl bg-[#C8A15A] px-4 py-2 text-sm font-semibold text-[#0B0F1A] hover:opacity-95 transition"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal Preferências ===== */}
      {prefsOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-5">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setPrefsOpen(false)}
            aria-label="Fechar"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">Preferências de cookies</h3>
                <p className="mt-1 text-sm text-white/60">
                  Controle quais cookies podem ser usados. Os essenciais são sempre
                  necessários.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Essenciais */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">Essenciais</p>
                    <p className="mt-1 text-sm text-white/70">
                      Necessários para funcionamento do site.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-white/70 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                    Sempre ativo
                  </span>
                </div>
              </div>

              {/* Analíticos */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">Analíticos</p>
                    <p className="mt-1 text-sm text-white/70">
                      Ajudam a melhorar conteúdo e performance.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A15A]"
                    aria-label="Ativar cookies analíticos"
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">Marketing</p>
                    <p className="mt-1 text-sm text-white/70">
                      Personaliza anúncios e mede campanhas.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A15A]"
                    aria-label="Ativar cookies de marketing"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  Recusar tudo
                </button>

                <button
                  type="button"
                  onClick={savePrefs}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] px-5 py-3 font-semibold text-[#0B0F1A] hover:opacity-95 transition"
                >
                  Salvar preferências
                </button>
              </div>

              <p className="text-xs text-white/50">
                Consulte também nossa{" "}
                <Link
                  href="/privacidade"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Política de Privacidade
                </Link>{" "}
                e{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Aviso de cookies
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}