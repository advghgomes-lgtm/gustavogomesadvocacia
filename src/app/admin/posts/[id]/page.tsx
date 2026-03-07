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
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlkkgxv8f";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function sanitizeEditorHtml(html: string) {
  if (!html) return "";

  return html
    .replace(/<font\b[^>]*>/gi, "")
    .replace(/<\/font>/gi, "")
    .replace(/ style="[^"]*"/gi, "")
    .replace(/ class="[^"]*"/gi, "")
    .replace(/ color="[^"]*"/gi, "")
    .replace(/ align="[^"]*"/gi, "");
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
  const [uploadingCover, setUploadingCover] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
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
      setCoverImage(String(data.coverImage ?? ""));
      setStatus((data.status ?? "draft") as "draft" | "published");
      setPublishedAt(pub ? pub.toDate() : null);

      const html = String(data.content ?? "");
      const cleanHtml = sanitizeEditorHtml(html);

      setContentHtml(cleanHtml);

      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = cleanHtml || "";
      });

      setLoading(false);
    }

    if (!authLoading && isAdmin) load();
  }, [authLoading, isAdmin, id, router]);

  function syncEditorHtml() {
    if (!editorRef.current) return;
    setContentHtml(sanitizeEditorHtml(editorRef.current.innerHTML));
  }

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    syncEditorHtml();
  }

  function insertLink() {
    const url = prompt("Cole o link (https://...):");
    if (!url) return;
    exec("createLink", url);
  }

  async function uploadCoverToCloudinary(file: File) {
    if (!UPLOAD_PRESET) {
      alert("Defina NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET no ambiente.");
      return;
    }

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "blog-covers");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Falha no upload da imagem.");
      }

      setCoverImage(String(data.secure_url));
      alert("Imagem enviada com sucesso ✅");
    } catch (e: any) {
      alert(e?.message || "Não foi possível enviar a imagem.");
    } finally {
      setUploadingCover(false);
    }
  }

  function normalizeContentBeforeSave(html: string) {
    return sanitizeEditorHtml(html).trim();
  }

  async function saveBase(nextStatus?: "draft" | "published") {
    if (!id) return;
    setSaving(true);

    try {
      const ref = doc(db, "posts", id);
      const finalSlug = slug.trim() ? slugify(slug.trim()) : slugify(title);
      const finalStatus = nextStatus ?? status;
      const normalizedContent = normalizeContentBeforeSave(contentHtml);

      const payload: any = {
        title: title.trim() || "Sem título",
        slug: finalSlug,
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim(),
        content: normalizedContent,
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
      setContentHtml(normalizedContent);

      if (editorRef.current) {
        editorRef.current.innerHTML = normalizedContent;
      }

      if (finalStatus === "draft") {
        setPublishedAt(null);
      } else if (!publishedAt) {
        setPublishedAt(new Date());
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

                <label className="mt-5 block text-xs text-white/60">
                  Imagem de capa
                </label>

                <div className="mt-2 flex flex-col gap-3">
                  <input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-sm outline-none focus:border-white/25"
                    placeholder="https://..."
                  />

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 hover:bg-white/10 transition">
                    {uploadingCover ? "Enviando imagem..." : "Upload para Cloudinary"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                      const input = e.currentTarget;
                      const file = input.files?.[0];
                      if (!file) return;

                      try {
                        await uploadCoverToCloudinary(file);
                     } finally {
                       input.value = "";
                      }
                    }}
                    />
                  </label>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F1A]">
                  {coverImage.trim() ? (
                    <img
                      src={coverImage}
                      alt="Prévia da capa"
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-white/40">
                      Pré-visualização da imagem de capa
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold">Dica rápida</p>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Use títulos, parágrafos, listas e negrito para facilitar a leitura.
                  A imagem de capa aparecerá na página pública do artigo.
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
                  <button
                    onClick={() => exec("removeFormat")}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    type="button"
                  >
                    Limpar formatação
                  </button>
                </div>

                <div className="p-6">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => syncEditorHtml()}
                    className="min-h-[420px] rounded-xl border border-white/10 bg-[#0B0F1A] p-4 text-white/90 outline-none focus:border-white/25"
                  />

                  <p className="mt-3 text-xs text-white/45">
                    *Conteúdo salvo como HTML.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-semibold">Pré-visualização</h2>

                {coverImage.trim() ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={coverImage}
                      alt="Prévia da capa"
                      className="h-64 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div
                  className="mt-4 prose prose-invert max-w-none [&_*]:text-white [&_a]:text-[#D7B06A]"
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