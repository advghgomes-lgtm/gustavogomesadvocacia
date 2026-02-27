"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";

const ADMIN_EMAIL = "adv.ghgomes@gmail.com";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export default function AdminPostEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const whatsapp = useMemo(() => "https://wa.me/5516997434946", []);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState<Date | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [contentHtml, setContentHtml] = useState("");

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;

      setLoading(true);
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setLoading(false);
        alert("Post não encontrado.");
        router.push("/admin");
        return;
      }

      const data = snap.data() as any;
      const pub: Timestamp | null = data.publishedAt ?? null;

      setTitle(String(data.title ?? ""));
      setSlug(String(data.slug ?? ""));
      setExcerpt(String(data.excerpt ?? ""));
      setStatus((data.status ?? "draft") as "draft" | "published");
      setPublishedAt(pub ? pub.toDate() : null);

      const html = String(data.content ?? "");
      setContentHtml(html);

      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = html || "";
      });

      setLoading(false);
    }

    if (!authLoading && isAdmin) load();
  }, [authLoading, isAdmin, id, router]);

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setContentHtml(editorRef.current.innerHTML);
  }

  function insertLink() {
    const url = prompt("Cole o link (https://...):");
    if (!url) return;
    exec("createLink", url);
  }

  async function saveBase(nextStatus?: "draft" | "published") {
    if (!id) return;
    setSaving(true);

    try {
      const ref = doc(db, "posts", id);
      const finalSlug = slug.trim() ? slugify(slug.trim()) : slugify(title);

      const finalStatus = nextStatus ?? status;

      const payload: any = {
        title: title.trim() || "Sem título",
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: contentHtml,
        status: finalStatus,
        updatedAt: serverTimestamp(),
        authorEmail: ADMIN_EMAIL,
      };

      if (finalStatus === "published") {
        if (!publishedAt) payload.publishedAt = serverTimestamp();
      } else {
        payload.publishedAt = null;
      }

      await updateDoc(ref, payload);

      setSlug(finalSlug);
      setStatus(finalStatus);

      if (finalStatus === "draft") {
        setPublishedAt(null);
      } else {
        if (!publishedAt) setPublishedAt(new Date()); // UI friendly
      }

      alert("Salvo ✅");
      router.refresh();
    } catch (e) {
      alert("Erro ao salvar. Verifique regras do Firestore.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!id) return;

    const ok = confirm(
      "Tem certeza que deseja EXCLUIR este post?\n\nEssa ação é permanente e o conteúdo será removido do Firestore."
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", id));
      alert("Post excluído ✅");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      alert("Não foi possível excluir. Verifique as regras do Firestore.");
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white p-10">
        Carregando...
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white p-10">
        <p className="text-red-200 font-semibold">Acesso negado.</p>
        <p className="mt-2 text-white/70">Somente o admin pode editar posts.</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl border border-white/20 bg-white/5 px-5 py-3 hover:bg-white/10 transition"
        >
          Voltar
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
          <a
            href="/admin"
            className="relative h-10 w-[200px]"
            aria-label="Voltar para Admin"
          >
            <Image
              src="/brand/logo-horizontal.png"
              alt="Gustavo Gomes Advocacia"
              fill
              className="object-contain"
              priority
            />
          </a>

          <div className="flex items-center gap-3">
            <a
              href={whatsapp}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
            >
              WhatsApp
            </a>

            <a
              href="/blog"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
            >
              Ver blog
            </a>

            <a
              href="/admin"
              className="rounded-xl bg-white text-[#0B0F1A] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
            >
              Voltar ao painel
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Editor do Post</h1>
            <p className="mt-2 text-sm text-white/60">
              Status atual: <span className="text-white/80">{status}</span>
              {publishedAt ? (
                <>
                  {" "}
                  • Publicado em{" "}
                  <span className="text-white/80">
                    {publishedAt.toLocaleDateString("pt-BR")}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={saving || deleting}
              onClick={() => saveBase("published")}
              className="rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Publicar"}
            </button>

            <button
              disabled={saving || deleting}
              onClick={() => saveBase("draft")}
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10 transition disabled:opacity-60"
              title="Despublica e volta para rascunho"
            >
              {saving ? "Salvando..." : "Despublicar"}
            </button>

            <button
              disabled={saving || deleting}
              onClick={deletePost}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-200 hover:bg-red-500/15 transition disabled:opacity-60"
              title="Exclui permanentemente do Firestore"
            >
              {deleting ? "Excluindo..." : "Excluir post"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            Carregando post...
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="text-xs text-white/60">Título</label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                  placeholder="Título do post"
                />

                <label className="mt-5 block text-xs text-white/60">
                  Slug (URL)
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                  placeholder="ex: fraude-consignado"
                />
                <p className="mt-2 text-xs text-white/45">
                  URL ficará:{" "}
                  <span className="text-white/70">
                    /blog/{slugify(slug || title)}
                  </span>
                </p>

                <label className="mt-5 block text-xs text-white/60">
                  Resumo (excerpt)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="mt-2 w-full min-h-[120px] rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                  placeholder="Resumo curto para aparecer na home e na lista do blog"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Dica rápida</p>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Use títulos, listas e negrito para facilitar a leitura. Esse
                  editor salva em HTML.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-3 border-b border-white/10 flex flex-wrap gap-2">
                  <button
                    onClick={() => exec("bold")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Negrito
                  </button>
                  <button
                    onClick={() => exec("italic")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Itálico
                  </button>
                  <button
                    onClick={() => exec("underline")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Sublinhado
                  </button>
                  <button
                    onClick={() => insertLink()}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Link
                  </button>

                  <div className="mx-2 w-px bg-white/10" />

                  <button
                    onClick={() => exec("formatBlock", "h2")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Título H2
                  </button>
                  <button
                    onClick={() => exec("formatBlock", "h3")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Título H3
                  </button>
                  <button
                    onClick={() => exec("formatBlock", "p")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Parágrafo
                  </button>

                  <div className="mx-2 w-px bg-white/10" />

                  <button
                    onClick={() => exec("insertUnorderedList")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => exec("insertOrderedList")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    1,2,3
                  </button>
                </div>

                <div className="p-6">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      if (editorRef.current)
                        setContentHtml(editorRef.current.innerHTML);
                    }}
                    className="min-h-[420px] rounded-xl border border-white/10 bg-[#0B0F1A] p-4 text-white/90 outline-none focus:border-white/25"
                  />

                  <p className="mt-3 text-xs text-white/45">
                    *Conteúdo salvo como HTML.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-semibold">Pré-visualização</h2>
                <div
                  className="prose prose-invert mt-4 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml || "<p>(sem conteúdo)</p>",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}