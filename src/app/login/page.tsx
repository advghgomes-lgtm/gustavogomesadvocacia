"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function friendlyError(msg: string) {
  const m = msg.toLowerCase();

  if (m.includes("auth/invalid-credential") || m.includes("wrong-password"))
    return "E-mail ou senha inválidos.";
  if (m.includes("auth/user-not-found"))
    return "Usuário não encontrado. Verifique o e-mail.";
  if (m.includes("auth/too-many-requests"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("auth/popup-closed-by-user"))
    return "Login cancelado (popup fechado).";
  if (m.includes("auth/email-already-in-use"))
    return "Esse e-mail já está em uso. Tente entrar com a senha.";
  if (m.includes("auth/weak-password"))
    return "Senha fraca. Use pelo menos 6 caracteres.";
  if (m.includes("auth/invalid-email"))
    return "E-mail inválido.";

  return "Não foi possível entrar agora. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      router.push("/admin");
    } catch (err: any) {
      setError(friendlyError(String(err?.code || err?.message || err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/admin");
    } catch (err: any) {
      setError(friendlyError(String(err?.code || err?.message || err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header simples */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="relative h-10 w-[200px]" aria-label="Ir para Home">
            <Image
              src="/brand/logo-horizontal.png"
              alt="Gustavo Gomes Advocacia"
              fill
              className="object-contain"
              priority
            />
          </a>

          <a
            href="https://wa.me/5516997434946"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Suporte 24 horas
          </a>
        </div>
      </header>

      {/* Card */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="text-xs text-white/60">Área do advogado</p>
          <h1 className="mt-2 text-2xl font-semibold">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {mode === "login"
              ? "Acesse para publicar no blog e gerenciar o site."
              : "Crie uma conta para acessar o painel administrativo."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition disabled:opacity-60"
          >
            {loading ? "Aguarde..." : "Entrar com Google"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">ou</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="text-xs text-white/60">E-mail</label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs text-white/60">Senha</label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
              />
              {mode === "register" && (
                <p className="mt-2 text-xs text-white/50">
                  Mínimo de 6 caracteres.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#C8A15A] px-4 py-3 text-sm font-semibold text-[#0B0F1A] hover:opacity-95 transition disabled:opacity-60"
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/70">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setMode("register");
                  }}
                  className="text-white underline underline-offset-4 hover:opacity-90"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="text-white underline underline-offset-4 hover:opacity-90"
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-white/45">
            Ao continuar, você confirma que está acessando uma área restrita do site.
          </p>
        </div>
      </section>
    </main>
  );
}