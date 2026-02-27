"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where, Timestamp } from "firebase/firestore";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: Date | null;
};

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        // ✅ Sem orderBy para evitar índice composto
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("status", "==", "published"), limit(50));
        const snap = await getDocs(q);

        const parsed: BlogPost[] = snap.docs.map((d) => {
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

        // ordena no cliente (sem exigir índice no Firestore)
        parsed.sort((a, b) => {
          const at = a.publishedAt ? a.publishedAt.getTime() : 0;
          const bt = b.publishedAt ? b.publishedAt.getTime() : 0;
          return bt - at;
        });

        if (alive) setPosts(parsed);
      } catch (e: any) {
        if (alive) {
          setPosts([]);
          setLoadError(
            e?.message
              ? String(e.message)
              : "Erro ao carregar posts do Firestore."
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

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
            href="/admin"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Admin
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Blog</h1>
        <p className="mt-2 text-white/60">Conteúdos publicados pelo escritório.</p>

        {loadError && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold">Falha ao carregar posts</p>
            <p className="mt-2 text-sm text-red-200/80 break-words">{loadError}</p>
          </div>
        )}

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse"
              >
                <div className="h-5 w-3/4 bg-white/10 rounded" />
                <div className="mt-4 h-3 w-full bg-white/10 rounded" />
                <div className="mt-2 h-3 w-5/6 bg-white/10 rounded" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2 lg:col-span-3">
              Ainda não há posts publicados.
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
                <h2 className="mt-2 font-semibold leading-snug">{p.title}</h2>
                {p.excerpt ? (
                  <p className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-4">
                    {p.excerpt}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-white/60">Clique para ler.</p>
                )}
                <span className="mt-6 inline-flex text-sm text-white/70 underline underline-offset-4">
                  Ler mais
                </span>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  );
}