"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Firestore (Portal Home)
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where, Timestamp } from "firebase/firestore";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** ---------- Ícones (SVG) - sem dependências ---------- */
function IconInstagram(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M16.5 7.5h.01" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function IconLinkedIn(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 10v10" />
      <path d="M7 7.5a1 1 0 0 0 0 2" />
      <path d="M11 10v10" />
      <path d="M11 14.5c0-2.5 1.5-4.5 4-4.5s4 2 4 5v5" />
      <path d="M3.5 4.5h17v15h-17z" opacity="0" />
    </svg>
  );
}

function IconWhatsApp(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-12.9 6.2L4 18l.3-3.3A8 8 0 1 1 20 11.5z" />
      <path d="M9.3 9.2c.2-.4.4-.5.7-.5h.6c.2 0 .5.1.6.4l.7 1.6c.1.3.1.6-.1.8l-.5.5c.5 1 1.5 1.9 2.5 2.4l.5-.5c.2-.2.5-.2.8-.1l1.6.7c.3.1.4.4.4.6v.6c0 .3-.1.5-.5.7-.5.3-1.6.5-3.3-.2-2-.8-4.1-2.9-5-5-.7-1.7-.5-2.8-.2-3.3z" />
    </svg>
  );
}

function IconMenu(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function IconX(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

/** ---------- Tipos Portal ---------- */
type ContentPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: Date | null;
};

type DetailModalState =
  | { open: false }
  | {
      open: true;
      kind: "area" | "service";
      title: string;
      subtitle?: string;
      bullets: string[];
      note?: string;
    };

/** ===== Menu Mobile ===== */
function MobileMenu({
  items,
}: {
  items: { label: string; id: string }[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function go(id: string) {
    setOpen(false);
    setTimeout(() => scrollToId(id), 50);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition"
        aria-label="Abrir menu"
        title="Menu"
      >
        <IconMenu className="h-5 w-5 text-white/85" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] bg-[#0B0F1A] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <p className="text-sm font-semibold text-white/90">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition"
                aria-label="Fechar"
              >
                <IconX className="h-5 w-5 text-white/85" />
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => go(it.id)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/85 hover:bg-white/10 transition"
                  >
                    {it.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-white/60">
                  Dica: toque em uma seção para navegar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/** ===== Trabalhe Conosco (Footer) ===== */
function FooterCareersForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus(null);
    setLoading(true);

    const form = e.currentTarget;

    try {
      const fd = new FormData(form);

      const res = await fetch("/api/careers", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus({
          ok: false,
          message: data?.error || "Não foi possível enviar agora. Tente novamente em instantes.",
        });
        setLoading(false);
        return;
      }

      setStatus({ ok: true, message: "Currículo enviado com sucesso. Obrigado!" });
      form.reset();
    } catch {
      setStatus({ ok: false, message: "Falha ao enviar. Tente novamente." });
    }

    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/60">Nome</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="text-xs text-white/60">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
            placeholder="seuemail@exemplo.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/60">Telefone</label>
          <input
            name="phone"
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
            placeholder="(16) 9xxxx-xxxx"
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Área de interesse</label>
          <select
            name="area"
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
            defaultValue=""
            required
          >
            <option value="" disabled className="bg-[#0B0F1A]">
              Selecione
            </option>
            <option value="Estágio" className="bg-[#0B0F1A]">
              Estágio
            </option>
            <option value="Advocacia" className="bg-[#0B0F1A]">
              Advocacia
            </option>
            <option value="Administrativo" className="bg-[#0B0F1A]">
              Administrativo
            </option>
            <option value="Outros" className="bg-[#0B0F1A]">
              Outros
            </option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-white/60">Mensagem (opcional)</label>
        <textarea
          name="message"
          rows={3}
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
          placeholder="Conte rapidamente sua experiência e disponibilidade."
        />
      </div>

      <div>
        <label className="text-xs text-white/60">Currículo (PDF/DOC/DOCX)</label>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-[#0B0F1A] file:font-semibold hover:file:bg-white/90"
        />
        <p className="mt-2 text-[11px] text-white/45">
          Ao enviar, você concorda com nossa{" "}
          <Link href="/privacidade" className="underline underline-offset-4 hover:text-white">
            Política de Privacidade
          </Link>{" "}
          e{" "}
          <Link href="/cookies" className="underline underline-offset-4 hover:text-white">
            Aviso de Cookies
          </Link>
          .
        </p>
      </div>

      <button
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar currículo"}
      </button>

      {status ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            status.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {status.message}
        </div>
      ) : null}
    </form>
  );
}

function FooterCareersModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const form = e.currentTarget;

    try {
      const fd = new FormData(form);

      const res = await fetch("/api/careers", {
        method: "POST",
        body: fd,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus({
          ok: false,
          message: data?.error || "Não foi possível enviar agora. Tente novamente em instantes.",
        });
        setLoading(false);
        return;
      }

      setStatus({ ok: true, message: "Currículo enviado com sucesso. Obrigado!" });
      form.reset();
      setLoading(false);
      setTimeout(() => setOpen(false), 600);
    } catch {
      setStatus({ ok: false, message: "Falha ao enviar. Tente novamente." });
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
      >
        Trabalhe conosco
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            type="button"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">Trabalhe conosco</h3>
                <p className="mt-1 text-sm text-white/60">Envie seu currículo (PDF/DOC/DOCX).</p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60">Nome</label>
                    <input
                      name="name"
                      required
                      placeholder="Seu nome"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60">E-mail</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60">Telefone</label>
                    <input
                      name="phone"
                      placeholder="(16) 9xxxx-xxxx"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60">Área de interesse</label>
                    <select
                      name="area"
                      required
                      defaultValue=""
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
                    >
                      <option value="" disabled className="bg-[#0B0F1A]">
                        Selecione
                      </option>
                      <option value="Estágio" className="bg-[#0B0F1A]">
                        Estágio
                      </option>
                      <option value="Advocacia" className="bg-[#0B0F1A]">
                        Advocacia
                      </option>
                      <option value="Administrativo" className="bg-[#0B0F1A]">
                        Administrativo
                      </option>
                      <option value="Outros" className="bg-[#0B0F1A]">
                        Outros
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/60">Mensagem (opcional)</label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Conte rapidamente sua experiência e disponibilidade."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Currículo (PDF/DOC/DOCX)</label>
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-[#0B0F1A] file:font-semibold hover:file:bg-white/90"
                  />
                </div>

                <button
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar currículo"}
                </button>

                {status ? (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      status.ok
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-red-400/20 bg-red-400/10 text-red-200"
                    }`}
                  >
                    {status.message}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BancarioLeadModal({ whatsappNumber }: { whatsappNumber: string }) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [benefit, setBenefit] = useState("");
  const [discounts, setDiscounts] = useState<string[]>([]);
  const [govAccess, setGovAccess] = useState<"" | "Sim" | "Não">("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleDiscount(value: string) {
    setDiscounts((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  function buildWhatsAppLink(number: string, text: string) {
    const n = number.replace(/\D/g, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  function resetForm() {
    setName("");
    setBenefit("");
    setDiscounts([]);
    setGovAccess("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !benefit.trim() || discounts.length === 0 || !govAccess) {
      alert("Por favor, preencha seu nome, benefício, tipo(s) de desconto e acesso ao gov.br/Meu INSS.");
      return;
    }

    const message =
      `Olá, Dr. Gustavo! Quero solucionar meu caso de descontos indevidos.\n\n` +
      `📌 Nome: ${name.trim()}\n` +
      `📌 Benefício com desconto: ${benefit.trim()}\n` +
      `📌 Tipo(s) de desconto: ${discounts.join(", ")}\n` +
      `📌 Tenho acesso ao gov.br / Meu INSS: ${govAccess}\n\n` +
      `Se necessário, posso enviar prints do extrato/consignações.`;

    const link = buildWhatsAppLink(whatsappNumber, message);
    window.open(link, "_blank", "noopener,noreferrer");
    resetForm();
    setOpen(false);
  }

  const discountOptions = ["Empréstimo consignado", "Cartão RMC", "Cartão RCC", "Outros"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition"
      >
        Estou sofrendo descontos indevidos
      </button>

      {open && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-5">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            type="button"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">Conte rapidamente seu caso</h3>
                <p className="mt-1 text-sm text-white/60">
                  Responda 4 perguntas e abra o WhatsApp com a mensagem pronta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-white/60">Qual seu nome?</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                    placeholder="Ex.: Maria Silva"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">
                    Qual o benefício que está tendo o desconto?
                  </label>
                  <input
                    value={benefit}
                    onChange={(e) => setBenefit(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                    placeholder="Ex.: Aposentadoria, Pensão por morte"
                  />
                </div>

                <div>
                  <p className="text-xs text-white/60">Qual desconto está sofrendo?</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {discountOptions.map((opt) => {
                      const checked = discounts.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                            checked
                              ? "border-[#C8A15A]/40 bg-[#C8A15A]/10 text-white"
                              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/7"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-[#C8A15A]"
                            checked={checked}
                            onChange={() => toggleDiscount(opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-white/45">
                    Você pode marcar mais de uma opção.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-white/60">
                    Você tem acesso à sua gov.br, especialmente ao app Meu INSS?
                  </label>
                  <select
                    value={govAccess}
                    onChange={(e) => setGovAccess(e.target.value as any)}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
                  >
                    <option value="" disabled className="bg-[#0B0F1A]">
                      Selecione
                    </option>
                    <option value="Sim" className="bg-[#0B0F1A]">
                      Sim
                    </option>
                    <option value="Não" className="bg-[#0B0F1A]">
                      Não
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition"
                >
                  Solucionar o meu caso
                </button>

                <p className="text-[11px] text-white/50 leading-relaxed">
                  Ao clicar, você será direcionado ao WhatsApp com uma mensagem pronta para atendimento.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const whatsapp = "https://wa.me/5516997434946";
  const instagram = "https://instagram.com/gustavohgomes";
  const linkedin = "https://www.linkedin.com/in/gustavo-henrique-gomes-643893133/";

  const navItems = [
    { label: "Início", id: "inicio" },
    { label: "O escritório", id: "escritorio" },
    { label: "Áreas de atuação", id: "areas" },
    { label: "Bancário", id: "bancario" },
    { label: "Serviços", id: "servicos" },
    { label: "Portal de conteúdo", id: "portal" },
    { label: "Contato", id: "contato" },
  ];

  const [detailModal, setDetailModal] = useState<DetailModalState>({ open: false });
  const [founderOpen, setFounderOpen] = useState(false);

  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  /** ---------- Dados: Áreas e Serviços ---------- */
  const areas = useMemo(
    () => [
      {
        title: "Direito Civil",
        image: "/media/direito_civil.png",
        short: "Responsabilidade civil, obrigações, indenizações e demandas em geral.",
        bullets: ["Ações indenizatórias", "Cobranças e execuções", "Responsabilidade civil", "Tutelas de urgência"],
      },
      {
        title: "Direito Empresarial",
        image: "/media/direito_empresarial.png",
        short: "Estrutura societária, contratos empresariais e suporte estratégico.",
        bullets: [
          "Constituição e reorganização societária",
          "Acordo de sócios",
          "Assessoria empresarial contínua",
          "Prevenção e resolução de conflitos",
        ],
      },
      {
        title: "Direito Trabalhista",
        image: "/media/direito_trabalhista.png",
        short: "Atuação preventiva e contenciosa nas relações de trabalho.",
        bullets: ["Defesa em reclamações trabalhistas", "Rescisões e acordos", "Consultoria preventiva empresarial"],
      },
      {
        title: "Direito Administrativo",
        image: "/media/direito_administrativo.png",
        short: "Atuação perante órgãos públicos e processos administrativos.",
        bullets: ["Processos administrativos", "Licitações e contratos públicos", "Defesas e recursos"],
      },
      {
        title: "Direito Bancário",
        image: "/media/direito_bancário.png",
        short: "Fraudes, consignados, RMC/RCC e abusividades bancárias.",
        bullets: ["Fraudes em empréstimos", "Descontos indevidos", "Cartão RMC/RCC", "Danos morais contra instituições financeiras"],
      },
      {
        title: "Direito Imobiliário",
        image: "/media/direito_imobiliário.png",
        short: "Compra e venda, locações, regularizações e disputas imobiliárias.",
        bullets: ["Contratos imobiliários", "Ações possessórias", "Distratos e rescisões"],
      },
      {
        title: "Direito Contratual",
        image: "/media/direito_contratual.png",
        short: "Elaboração e revisão estratégica de contratos.",
        bullets: ["Contratos civis e empresariais", "Aditivos e distratos", "Análise de riscos contratuais"],
      },
      {
        title: "Direito Penal (Criminal)",
        image: "/media/direito_penal.png",
        short: "Defesa técnica e acompanhamento estratégico em investigações e processos.",
        bullets: ["Defesa em processos criminais", "Acompanhamento em delegacia", "Atuação em audiências e recursos"],
      },
      {
        title: "Direito Tributário",
        image: "/media/direito_tributário.png",
        short: "Planejamento e defesa em cobranças fiscais.",
        bullets: ["Defesas administrativas", "Execuções fiscais", "Planejamento tributário"],
      },
      {
        title: "Direito de Família",
        image: "/media/direito_família.png",
        short: "Divórcio, guarda, alimentos e reorganização familiar.",
        bullets: ["Divórcio consensual e litigioso", "Pensão alimentícia", "Guarda e visitas"],
      },
      {
        title: "Direito de Sucessões",
        image: "/media/direito_sucessões.png",
        short: "Inventário, partilha e planejamento sucessório.",
        bullets: ["Inventário judicial e extrajudicial", "Partilha de bens", "Alvarás e regularizações"],
      },
      {
        title: "Direito Eleitoral",
        image: "/media/direito_eleitoral.png",
        short: "Assessoria e defesa em questões eleitorais.",
        bullets: ["Defesas eleitorais", "Consultoria preventiva"],
      },
      {
        title: "Recuperação Judicial, Extrajudicial e Falências",
        image: "/media/direito_público.png",
        short: "Reestruturação empresarial e gestão de crises.",
        bullets: ["Recuperação judicial", "Recuperação extrajudicial", "Falência e reorganização financeira"],
      },
      {
        title: "Direito Público",
        image: "/media/direito_público.png",
        short: "Atuação estratégica em demandas envolvendo o Poder Público.",
        bullets: ["Ações contra o Estado", "Mandados de segurança", "Responsabilidade do ente público"],
      },
    ],
    []
  );

  const services = useMemo(
    () => [
      {
        title: "Demandas Judiciais (prioridade)",
        icon: "📌",
        short: "Atuação em processos judiciais com estratégia, urgência e foco em resultado.",
        bullets: [
          "Ações bancárias (fraudes, consignado, RMC/RCC, liminares)",
          "Ações cíveis em geral (família, sucessões, indenizações, cobranças)",
          "Defesas, recursos, cumprimento de sentença e execuções",
          "Medidas urgentes (plantões, liminares e tutela de urgência)",
        ],
        note: "Esse é o serviço mais importante do escritório: condução completa do caso do início ao resultado.",
      },
      {
        title: "Assessoria Jurídica (Consultivo)",
        icon: "🤝",
        short: "Apoio preventivo para decisões seguras (pessoas e empresas).",
        bullets: [
          "Consultoria contínua para empresas (full service)",
          "Análise de riscos e estratégias preventivas",
          "Pareceres e orientação objetiva para tomada de decisão",
        ],
      },
      {
        title: "Revisão e Elaboração de Contratos",
        icon: "📝",
        short: "Contratos claros, robustos e alinhados ao seu objetivo (pessoal/empresarial).",
        bullets: [
          "Revisão de cláusulas e riscos",
          "Elaboração de contratos sob medida",
          "Aditivos, rescisões e negociações",
          "Contratos empresariais e civis",
        ],
      },
      {
        title: "Contencioso Estratégico",
        icon: "⚔️",
        short: "Atuação processual com foco em prova, tese, riscos e resultado.",
        bullets: ["Estratégia de tese e linha probatória", "Audiências, sustentações e condução do litígio", "Negociação e acordos inteligentes quando viável"],
      },
      {
        title: "Processos Administrativos",
        icon: "🏛️",
        short: "Defesa e acompanhamento em procedimentos administrativos e autuações.",
        bullets: ["Defesas e recursos em processos administrativos", "Protocolos, prazos e estratégias documentais", "Atuação em demandas perante órgãos/entidades"],
      },
      {
        title: "Due Diligence Jurídica",
        icon: "🔎",
        short: "Mapeamento de riscos e conformidade antes de negócios e contratos.",
        bullets: ["Levantamento de passivos e riscos", "Análise documental e recomendações", "Relatório de viabilidade e mitigação"],
      },
      {
        title: "Reestruturação Societária",
        icon: "🧱",
        short: "Organização da empresa para eficiência, segurança e crescimento.",
        bullets: ["Alterações contratuais e acordos entre sócios", "Organização de governança e regras internas", "Prevenção de conflitos societários"],
      },
      {
        title: "Consultas e Plantões (cível e criminal)",
        icon: "🕒",
        short: "Atendimento especial em finais de semana, feriados e período noturno para urgências.",
        bullets: ["Atendimento emergencial e orientações urgentes", "Plantão em finais de semana e feriados", "Atuação em situações que exigem resposta imediata"],
        note: "Plantão sujeito à disponibilidade e natureza do caso. Atendimento sob agendamento.",
      },
    ],
    []
  );

  /** ---------- Carregar posts do Firestore (home) ---------- */
  useEffect(() => {
    let alive = true;

    async function loadPosts() {
      try {
        setPostsLoading(true);

        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("status", "==", "published"), limit(50));
        const snap = await getDocs(q);

        const parsed: ContentPost[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const ts: Timestamp | undefined = data.publishedAt;

          return {
            id: d.id,
            title: String(data.title ?? ""),
            slug: String(data.slug ?? ""),
            excerpt: data.excerpt ? String(data.excerpt) : "",
            publishedAt: ts ? ts.toDate() : null,
          };
        });

        parsed.sort((a, b) => {
          const at = a.publishedAt ? a.publishedAt.getTime() : 0;
          const bt = b.publishedAt ? b.publishedAt.getTime() : 0;
          return bt - at;
        });

        if (alive) setPosts(parsed.slice(0, 3));
      } catch {
        if (alive) setPosts([]);
      } finally {
        if (alive) setPostsLoading(false);
      }
    }

    loadPosts();
    return () => {
      alive = false;
    };
  }, []);

  // Fecha modais com ESC e trava scroll
  useEffect(() => {
    const anyOpen = founderOpen || detailModal.open;
    if (!anyOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (founderOpen) setFounderOpen(false);
        if (detailModal.open) setDetailModal({ open: false });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [founderOpen, detailModal.open]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0B0F1A] text-white">
      {/* Header (sticky) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F1A]/90 backdrop-blur">
  <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
    <button
      onClick={() => scrollToId("inicio")}
      className="relative h-10 w-[150px] shrink-0 sm:h-12 sm:w-[190px] md:h-14 md:w-[260px]"
      aria-label="Ir para o início"
    >
      <Image
        src="/brand/logo-horizontal.png"
        alt="Gustavo Gomes Advocacia"
        fill
        className="object-contain object-left"
        priority
      />
    </button>

    <nav className="hidden md:flex items-center gap-4 text-[13px] text-white/80">
      {navItems.map((it) => (
        <button
          key={it.id}
          onClick={() => scrollToId(it.id)}
          className="whitespace-nowrap hover:text-white transition"
        >
          {it.label}
        </button>
      ))}
    </nav>

    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <a
        href={instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
        aria-label="Instagram"
        title="Instagram"
      >
        <IconInstagram className="h-4 w-4 sm:h-5 sm:w-5 text-white/85" />
      </a>

      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
        aria-label="LinkedIn"
        title="LinkedIn"
      >
        <IconLinkedIn className="h-5 w-5 text-white/85" />
      </a>

      <a
        href={whatsapp}
        className="rounded-xl border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        <IconWhatsApp className="h-4 w-4 sm:h-5 sm:w-5 text-white/85" />
      </a>

      <MobileMenu items={navItems} />

      <a
        href={whatsapp}
        className="hidden md:inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B0F1A] transition hover:bg-white/90"
      >
        Entre em contato
      </a>
    </div>
  </div>
</header>

      {/* Anchor */}
      <div id="inicio" className="scroll-mt-24" />


{/* ===== BANNER RESPONSIVO CLOUDINARY (SEM OVERLAY) ===== */}
<section className="relative w-full overflow-hidden bg-[#0B0F1A]">
  <div className="relative h-[55svh] sm:h-[60svh] md:h-[85vh]">
    {/* VIDEO MOBILE */}
    <video
      key="mobile-video"
      className="absolute inset-0 h-full w-full object-contain md:hidden"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source
        src="https://res.cloudinary.com/dlkkgxv8f/video/upload/v1772239521/home-mobile_jycldt.mp4"
        type="video/mp4"
      />
    </video>

    {/* VIDEO DESKTOP */}
    <video
      key="desktop-video"
      className="absolute inset-0 hidden h-full w-full object-cover md:block"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source
        src="https://res.cloudinary.com/dlkkgxv8f/video/upload/v1772222795/homepage-video_d7wdsl.mp4"
        type="video/mp4"
      />
    </video>
  </div>

    {/* VIDEO DESKTOP */}
    <video
      key="desktop-video"
      className="absolute inset-0 hidden h-full w-full object-cover md:block"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source
        src="https://res.cloudinary.com/dlkkgxv8f/video/upload/v1772222795/homepage-video_d7wdsl.mp4"
        type="video/mp4"
      />
    </video>
  </div>
</section>

      {/* ===== O ESCRITÓRIO ===== */}
      <section
        id="escritorio"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20"
      >
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src="/media/handshake.png"
                alt="Atendimento jurídico com foco em negociação e confiança"
                width={1100}
                height={800}
                className="h-[220px] sm:h-[280px] md:h-[320px] w-full object-cover"
                priority
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#C8A15A]" />
              Advocacia estratégica • Clareza • Resultados
            </p>

            <h2 className="mt-6 text-3xl md:text-4xl font-semibold leading-tight">
              O escritório
            </h2>

            <p className="mt-4 text-white/70 leading-relaxed text-justify">
              No escritório acreditamos que o Direito deve ser claro, acessível e estratégico.
              Atuamos de forma full service, oferecendo suporte completo em diversas áreas, com forte
              presença no Direito Cível, Empresarial, Tributário, Bancário e Consumidor.
            </p>

            <p className="mt-4 text-white/70 leading-relaxed text-justify">
              Aqui, cada cliente é ouvido, cada caso é analisado com profundidade e cada estratégia é
              construída com responsabilidade e comprometimento.
            </p>

            <p className="mt-4 text-white/70 leading-relaxed text-justify">
              Advocacia com técnica. Estratégia com propósito. Atendimento com humanidade.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={whatsapp}
                className="inline-flex items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-6 py-3 font-semibold hover:opacity-95 transition"
              >
                Falar no WhatsApp
              </a>
              <button
                type="button"
                onClick={() => scrollToId("areas")}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10 transition"
              >
                Ver áreas de atuação
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FUNDADOR ===== */}
      <section className="bg-black/20 border-y border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image
                  src="/media/perfil.home.jpg"
                  alt="Dr. Gustavo Gomes"
                  width={900}
                  height={1000}
                  className="h-[260px] sm:h-[320px] md:h-[380px] w-full object-cover object-top"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <h3 className="text-2xl md:text-3xl font-semibold leading-tight">
                Dr. Gustavo Gomes
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Advogado e Administrador • Responsável pelo escritório
              </p>

              <p className="mt-4 text-white/90 text-justify">
                Administrador e Advogado com sólida experiência no ambiente empresarial, o Dr.
                Gustavo Gomes atua com foco em desafios jurídicos e estratégicos de alta complexidade,
                buscando a excelência em cada caso. Sua trajetória na área empresarial lhe confere uma
                visão prática e diferenciada do mercado e da realidade de seus clientes.
              </p>

              <p className="mt-4 text-white/90 text-justify">
                Atualmente, o escritório vive uma intensa atuação em processos bancários, especialmente
                em casos de{" "}
                <span className="text-white/90 font-semibold">
                  fraudes, consignados, Cartões RMC/RCC e descontos indevidos
                </span>
                , com estratégias objetivas para cessar cobranças, recuperar valores e responsabilizar
                instituições financeiras.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setFounderOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10 transition"
                >
                  Saiba mais
                </button>

                <a
                  href={whatsapp}
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#0B0F1A] px-6 py-3 font-semibold hover:bg-white/90 transition"
                >
                  Falar com o Dr. Gustavo
                </a>
              </div>

              <p className="mt-4 text-xs text-white/50">Atendimento sob agendamento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ÁREAS DE ATUAÇÃO ===== */}
      <section
        id="areas"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold">
              Atuação full service <span className="text-[#C8A15A]">(360º)</span>
            </h2>

            <p className="mt-3 text-sm text-white/60 max-w-2xl">
              O escritório atua de forma completa e estratégica, oferecendo suporte jurídico integral
              para pessoas físicas e jurídicas em demandas consultivas e contenciosas.
            </p>
          </div>

          <p className="hidden md:block text-sm text-white/60 max-w-md">
            Clique em <span className="text-white/80">Saiba +</span> para ver exemplos e como atuamos
            em cada área.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {areas.map((a) => (
            <div
              key={a.title}
              className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/7 transition"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/40 to-transparent" />
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-lg">{a.title}</h3>

                <p className="mt-3 text-sm text-white/70 leading-relaxed">{a.short}</p>

                <button
                  onClick={() =>
                    setDetailModal({
                      open: true,
                      kind: "area",
                      title: a.title,
                      subtitle: "Exemplos de atuação",
                      bullets: a.bullets,
                    })
                  }
                  className="mt-5 text-sm text-white/70 hover:text-white transition underline underline-offset-4"
                >
                  Saiba +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BLOCO BANCÁRIO ===== */}
      <section id="bancario" className="scroll-mt-24 bg-black/20 border-y border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#C8A15A]" />
              Atuação intensa em Direito Bancário • Fraudes e descontos indevidos
            </p>

            <h2 className="mt-5 text-3xl md:text-4xl font-semibold leading-tight">
              Sofreu fraude em empréstimo consignado ou{" "}
              <span className="text-[#C8A15A]">descontos indevidos</span>?
            </h2>

            <p className="mt-4 text-white/70 leading-relaxed text-justify">
              Se você está com descontos que não reconhece (consignado, cartão RMC/RCC ou cobranças
              abusivas), nossa atuação é voltada a cessar a cobrança, recuperar valores e responsabilizar
              a instituição financeira. Para agilizar, clique no botão e envie seu caso pronto para atendimento.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Situações comuns</h3>
                <p className="mt-2 text-sm text-white/60">Veja se alguma delas parece com o seu caso:</p>

                <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-white/80">
                  {[
                    "Empréstimo consignado não reconhecido",
                    "Cartão RMC (Reserva de Margem Consignável)",
                    "Cartão RCC",
                    "Descontos indevidos em aposentadoria/pensão",
                    "Vazamento de dados bancários",
                    "Contratação fraudulenta / cobranças abusivas",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/3 p-6">
                <h3 className="text-lg font-semibold">O que buscamos no seu caso</h3>

                <div className="mt-5 space-y-3 text-sm text-white/75">
                  {[
                    "Suspensão imediata dos descontos (quando cabível, via medida urgente)",
                    "Devolução dos valores (inclusive em dobro, quando aplicável)",
                    "Indenização por danos morais, conforme o caso",
                    "Responsabilização da instituição financeira e correção do cadastro",
                  ].map((t) => (
                    <div key={t} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#C8A15A]" />
                      <span className="text-justify">{t}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-white/50 text-justify">
                  Cada caso exige análise individual. A estratégia depende do tipo de desconto,
                  documentos disponíveis e histórico do benefício.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:sticky md:top-24">
                <h3 className="text-lg font-semibold">Agilize seu atendimento</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed text-justify">
                  Clique no botão abaixo e preencha 4 perguntas. Em seguida, o WhatsApp abre com a mensagem pronta para análise inicial.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    { n: "1", t: "Preencha seu nome e benefício" },
                    { n: "2", t: "Marque o tipo de desconto (RMC/RCC/consignado)" },
                    { n: "3", t: "Informe se tem acesso ao gov.br / Meu INSS" },
                    { n: "4", t: "Clique e envie no WhatsApp (mensagem pronta)" },
                  ].map((s) => (
                    <div
                      key={s.n}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="h-7 w-7 rounded-lg bg-[#C8A15A] text-[#0B0F1A] flex items-center justify-center text-sm font-semibold">
                        {s.n}
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{s.t}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <BancarioLeadModal whatsappNumber="5516997434946" />
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white/85">Dica rápida</p>
                  <p className="mt-2 text-xs text-white/55 leading-relaxed text-justify">
                    Se você tiver, já separe: print do extrato do benefício, tela de empréstimos/consignações no Meu INSS e período aproximado em que começou o desconto. Isso acelera muito a análise.
                  </p>
                </div>

                <p className="mt-4 text-[11px] text-white/45 leading-relaxed text-justify">
                  Atendimento sob agendamento e conforme disponibilidade. Em urgências, avaliaremos medidas imediatas quando juridicamente cabíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVIÇOS ===== */}
      <section id="servicos" className="scroll-mt-24 bg-black/20 border-y border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl font-semibold">Serviços</h2>
            <p className="hidden md:block text-sm text-white/60 max-w-md">
              Clique em <span className="text-white/80">Saiba +</span> para ver detalhes, exemplos e quando faz sentido contratar.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/7 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center text-lg">
                      {s.icon}
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white/70 leading-relaxed">{s.short}</p>

                <button
                  onClick={() =>
                    setDetailModal({
                      open: true,
                      kind: "service",
                      title: s.title,
                      subtitle: "O que inclui",
                      bullets: s.bullets,
                      note: s.note,
                    })
                  }
                  className="mt-6 text-sm text-white/70 hover:text-white transition underline underline-offset-4"
                >
                  Saiba +
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTAL ===== */}
      <section id="portal" className="scroll-mt-24 bg-black/20 border-y border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold">Portal de conteúdo</h2>
              <p className="mt-2 text-sm text-white/60">
                Artigos, guias e atualizações publicados pelo escritório.
              </p>
            </div>

            <a
              href="/blog"
              className="text-sm text-white/70 hover:text-white transition underline underline-offset-4"
            >
              Ver todos
            </a>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {postsLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse"
                  >
                    <div className="h-5 w-3/4 bg-white/10 rounded" />
                    <div className="mt-4 h-3 w-full bg-white/10 rounded" />
                    <div className="mt-2 h-3 w-5/6 bg-white/10 rounded" />
                    <div className="mt-6 h-4 w-24 bg-white/10 rounded" />
                  </div>
                ))}
              </>
            ) : posts.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-white/70">
                  Ainda não há conteúdos publicados. Em breve, novidades aparecerão aqui.
                </p>
              </div>
            ) : (
              posts.map((p) => (
                <a
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/7 transition block"
                >
                  <p className="text-xs text-white/55">
                    {p.publishedAt ? p.publishedAt.toLocaleDateString("pt-BR") : "Publicado"}
                  </p>
                  <h3 className="mt-2 font-semibold leading-snug">{p.title}</h3>

                  {p.excerpt ? (
                    <p className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-4">
                      {p.excerpt}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-white/60 leading-relaxed">
                      Clique para ler o conteúdo completo.
                    </p>
                  )}

                  <span className="mt-6 inline-flex text-sm text-white/70 hover:text-white transition underline underline-offset-4">
                    Ler mais
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== CONTATO ===== */}
      <section
        id="contato"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20"
      >
        <h2 className="text-3xl font-semibold mb-6">Contato</h2>
        <p className="text-white/70 mb-8 max-w-2xl">
          Entre em contato para agendar uma consulta ou enviar informações do seu caso. Atendimento sob agendamento.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={whatsapp}
            className="rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-6 py-3 font-semibold hover:opacity-95 transition text-center"
          >
            Falar no WhatsApp
          </a>

          <a
            href="mailto:contato@seudominio.com"
            className="rounded-xl border border-white/30 px-6 py-3 font-semibold hover:bg-white/10 transition text-center"
          >
            Enviar e-mail
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="text-base font-semibold">
                Gustavo Gomes Advocacia e Consultoria Jurídica
              </p>
              <p className="mt-3 text-sm text-white/70 max-w-md">
                “Cada desafio, uma oportunidade para inovar e vencer.”
              </p>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 max-w-sm">
                <p className="text-white/85 font-semibold">Plantão Jurídico 24h</p>
                <p className="mt-1 text-sm text-white/70">
                  Após 18h, finais de semana e feriados
                </p>
                <a
                  href="tel:+5516997434946"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-4 py-2 font-semibold hover:opacity-95 transition"
                >
                  Ligue agora: (16) 99743-4946
                </a>
              </div>
            </div>

            <div className="md:col-span-4">
              <p className="text-sm font-semibold">Contato</p>
              <div className="mt-4 space-y-2 text-sm text-white/70 leading-relaxed">
                <p>
                  Avenida sete de setembro nº 1175 - Fundos - Centro - Araraquara/SP – CEP 14800-390
                </p>
                <p>+55 16 99743-4946</p>
                <p>ghgomes@adv.oabsp.org.br</p>
                <p>Segunda–Sexta: 9:00 – 20:00</p>
              </div>
            </div>

            <div className="md:col-span-3">
              <p className="text-sm font-semibold">Links rápidos</p>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {navItems.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => scrollToId(x.id)}
                    className="text-left text-white/70 hover:text-white transition"
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <FooterCareersModal />
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/55 flex flex-col md:flex-row items-center justify-between gap-3">
            <p>© 2026 Gustavo Gomes Advocacia e Consultoria Jurídica. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacidade" className="hover:text-white transition">
                Privacidade
              </Link>
              <Link href="/termos" className="hover:text-white transition">
                Termos
              </Link>
              <Link href="/cookies" className="hover:text-white transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MODAL: Fundador (Saiba mais) ===== */}
      {founderOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-5">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setFounderOpen(false)}
            aria-label="Fechar"
            type="button"
          />
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">Dr. Gustavo Gomes</h3>
                <p className="mt-1 text-sm text-white/60">Trajetória profissional</p>
              </div>

              <button
                type="button"
                onClick={() => setFounderOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-white/75 leading-relaxed">
              <p>
                Administrador e Advogado com sólida experiência no ambiente empresarial, o Dr. Gustavo Gomes atua
                com foco em desafios jurídicos e estratégicos de alta complexidade, sempre buscando a excelência em cada caso.
              </p>

              <p>
                Graduado em Administração Pública pela UNESP e em Direito pela Universidade de Araraquara (UNIARA),
                Dr. Gustavo construiu sua formação acadêmica voltada especialmente ao ambiente empresarial e tributário.
              </p>

              <p>
                Especialista em solucionar problemas complexos e em conduzir negociações inteligentes, atua fortemente
                na área Cível, com ênfase em Direito Bancário, Direito do Consumidor, Direito Empresarial e Tributário.
              </p>

              <p>
                Dedicação, responsabilidade, empenho e comprometimento são marcas registradas de sua atuação.
              </p>

              <p className="text-white/85 font-semibold">
                Dr. Gustavo Gomes está pronto para transformar obstáculos em oportunidades, impulsionando segurança jurídica e resultados.
              </p>

              <div className="pt-3">
                <a
                  href={whatsapp}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Áreas/Serviços ===== */}
      {detailModal.open && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-5">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setDetailModal({ open: false })}
            aria-label="Fechar"
            type="button"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1A] shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">{detailModal.title}</h3>
                {detailModal.subtitle ? (
                  <p className="mt-1 text-sm text-white/60">{detailModal.subtitle}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setDetailModal({ open: false })}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <ul className="space-y-2 text-sm text-white/75">
                {detailModal.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#C8A15A]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {detailModal.note ? (
                <p className="mt-5 text-xs text-white/55">{detailModal.note}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}