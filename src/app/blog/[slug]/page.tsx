"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where, Timestamp } from "firebase/firestore";

type Post = {
  title: string;
  content: string;
  publishedAt?: Date | null;
  coverImage?: string;
  excerpt?: string;
};

function cleanPostHtml(html: string) {
  if (!html) return "<p></p>";

  return html
    .replace(/ style="[^"]*"/gi, "")
    .replace(/ class="[^"]*"/gi, "")
    .replace(/ color="[^"]*"/gi, "")
    .replace(/ align="[^"]*"/gi, "")
    .replace(/<font\b[^>]*>/gi, "")
    .replace(/<\/font>/gi, "")
    .replace(/<span\b[^>]*>/gi, "<span>")
    .replace(/&nbsp;/gi, " ");
}

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
        const postsRef = collection(db, "posts");
        const q = query(
          postsRef,
          where("slug", "==", slug),
          where("status", "==", "published"),
          limit(1)
        );

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
              excerpt: data.excerpt ? String(data.excerpt) : "",
              coverImage: data.coverImage ? String(data.coverImage) : "",
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

  const sanitizedContent = useMemo(() => {
    return cleanPostHtml(post?.content || "");
  }, [post?.content]);

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0F1A]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a
            href="/"
            className="relative h-12 w-[190px] sm:h-14 sm:w-[260px]"
            aria-label="Voltar para home"
          >
            <Image
              src="/brand/logo-horizontal.png"
              alt="Gustavo Gomes Advocacia"
              fill
              className="object-contain object-left"
              priority
            />
          </a>

          <a
            href="/blog"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Voltar ao blog
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold">Falha ao carregar</p>
            <p className="mt-2 break-words text-sm text-red-200/80">{loadError}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            Carregando...
          </div>
        ) : !post ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            Post não encontrado (ou não publicado).
          </div>
        ) : (
          <article className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="border-b border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent px-5 py-8 sm:px-8 md:px-10 md:py-10">
              <p className="text-xs uppercase tracking-[0.22em] text-[#C8A15A]">
                Portal de conteúdo
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
                <a href="/" className="transition hover:text-white">
                  Início
                </a>
                <span>•</span>
                <a href="/blog" className="transition hover:text-white">
                  Blog
                </a>
                <span>•</span>
                <span>Artigo</span>
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/55">
                <span>
                  {post.publishedAt
                    ? post.publishedAt.toLocaleDateString("pt-BR")
                    : "Publicado"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>Gustavo Gomes Advocacia</span>
              </div>
            </div>

            <div className="px-5 pt-5 sm:px-8 md:px-10 md:pt-8">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={1600}
                    height={900}
                    className="h-[220px] w-full object-cover sm:h-[320px] md:h-[420px]"
                  />
                ) : (
                  <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 sm:h-[320px] md:h-[420px]">
                    <div className="px-6 text-center">
                      <p className="text-sm uppercase tracking-[0.22em] text-[#C8A15A]">
                        Imagem de capa
                      </p>
                      <p className="mt-3 text-sm text-white/50">
                        Espaço reservado para foto do artigo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-8 sm:px-8 md:px-10 md:py-10">
              <div
                className="article-content mx-auto max-w-3xl"
                dangerouslySetInnerHTML={{ __html: sanitizedContent || "<p></p>" }}
              />
            </div>
          </article>
        )}
      </section>

         </main>
  );
}