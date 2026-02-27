"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where, Timestamp } from "firebase/firestore";

type Post = {
  title: string;
  content: string; // HTML
  publishedAt?: Date | null;
};

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!slug) return;
      setLoading(true);
      setLoadError(null);

      try {
        // ✅ Só filtra por slug (sem combinar com status para evitar índice)
        // As regras do Firestore já impedem leitura de draft (status != published).
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("slug", "==", slug), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
          if (alive) setPost(null);
        } else {
          const data = snap.docs[0].data() as any;
          const ts: Timestamp | undefined = data.publishedAt;

          if (alive) {
            setPost({
              title: String(data.title ?? ""),
              content: String(data.content ?? ""),
              publishedAt: ts ? ts.toDate() : null,
            });
          }
        }
      } catch (e: any) {
        if (alive) {
          setPost(null);
          setLoadError(e?.message ? String(e.message) : "Erro ao carregar post.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
          <a href="/" className="relative h-10 w-[200px]" aria-label="Voltar para home">
            <Image
              src="/brand/logo-horizontal.png"
              alt="Gustavo Gomes Advocacia"
              fill
              className="object-contain"
              priority
            />
          </a>

          <a
            href="/blog"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Voltar ao blog
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold">Falha ao carregar</p>
            <p className="mt-2 text-sm text-red-200/80 break-words">{loadError}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Carregando...</div>
        ) : !post ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            Post não encontrado (ou não publicado).
          </div>
        ) : (
          <>
            <p className="text-xs text-white/55">
              {post.publishedAt ? post.publishedAt.toLocaleDateString("pt-BR") : "Publicado"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">{post.title}</h1>

            {/* Visual padrão (sem opções de fonte) */}
            <article className="mt-8 space-y-4 text-white/80 leading-relaxed">
              <div
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
                dangerouslySetInnerHTML={{ __html: post.content || "<p></p>" }}
              />
            </article>
          </>
        )}
      </section>
    </main>
  );
}