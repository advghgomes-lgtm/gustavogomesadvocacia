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

  let cleaned = html
    .replace(/ style="[^"]*"/gi, "")
    .replace(/ class="[^"]*"/gi, "")
    .replace(/ color="[^"]*"/gi, "")
    .replace(/ align="[^"]*"/gi, "")
    .replace(/ data-[^=]+="[^"]*"/gi, "")
    .replace(/<font\b[^>]*>/gi, "")
    .replace(/<\/font>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .trim();

  // remove divs vazias do editor antigo
  cleaned = cleaned.replace(/<div>\s*(<p>\s*<\/p>\s*)+<\/div>/gi, "");

  // caso clássico: <p><ol> ... </ol></p>  -> remove o <p> externo inválido
  cleaned = cleaned.replace(/<p>\s*(<ol[\s\S]*?<\/ol>)\s*<\/p>/gi, "$1");

  // transforma lista ordenada "falsa" (artigo inteiro salvo como <ol><li>...</li></ol>)
  // em parágrafos normais
  cleaned = cleaned.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1].trim());

    if (!items.length) return "";

    return items
      .map((item: string) => {
        let text = item.trim();

        // remove <br> isolado
        if (/^(<br\s*\/?>|\s)*$/i.test(text)) return "";

        // se já vier com bloco, mantém
        if (/^<(h1|h2|h3|h4|p|blockquote|ul|ol|img|table)\b/i.test(text)) {
          return text;
        }

        // senão vira parágrafo
        return `<p>${text}</p>`;
      })
      .filter(Boolean)
      .join("");
  });

  // remove p vazios
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, "");

  // remove spans vazios mantendo conteúdo
  cleaned = cleaned.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1");

  return cleaned.trim() || "<p></p>";
}

function getOptimizedCloudinaryImage(url?: string, width = 1600) {
  if (!url) return "";

  if (!url.includes("res.cloudinary.com")) return url;

  return url.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,w_${width},c_limit/`
  );
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
    <main className="blog-post-page min-h-screen bg-[#0B0F1A] text-white">
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
                    src={getOptimizedCloudinaryImage(post.coverImage, 1600)}
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

      <style jsx global>{`
        .blog-post-page .article-content {
          color: rgba(255, 255, 255, 0.88);
          font-size: 17px;
          line-height: 1.95;
          word-break: break-word;
        }

        .blog-post-page .article-content * {
          max-width: 100%;
          box-sizing: border-box;
        }

        .blog-post-page .article-content p,
        .blog-post-page .article-content div,
        .blog-post-page .article-content span,
        .blog-post-page .article-content li {
          color: rgba(255, 255, 255, 0.88) !important;
          font-size: 17px !important;
          line-height: 1.95 !important;
          background: transparent !important;
        }

        .blog-post-page .article-content p {
          margin: 1.25rem 0 !important;
          text-align: justify !important;
        }

        .blog-post-page .article-content h1,
        .blog-post-page .article-content h2,
        .blog-post-page .article-content h3,
        .blog-post-page .article-content h4 {
          color: #ffffff !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
          text-align: left !important;
        }

        .blog-post-page .article-content h1 {
          font-size: 2rem !important;
        }

        .blog-post-page .article-content h2 {
          font-size: 1.6rem !important;
        }

        .blog-post-page .article-content h3 {
          font-size: 1.3rem !important;
        }

        .blog-post-page .article-content a {
          color: #d7b06a !important;
          text-decoration: underline !important;
          text-underline-offset: 4px;
        }

        .blog-post-page .article-content strong,
        .blog-post-page .article-content b {
          color: #ffffff !important;
          font-weight: 700 !important;
        }

        .blog-post-page .article-content em,
        .blog-post-page .article-content i {
          font-style: italic !important;
        }

        .blog-post-page .article-content ul {
          list-style: disc !important;
          margin: 1.25rem 0 !important;
          padding-left: 1.5rem !important;
        }

        .blog-post-page .article-content ol {
          list-style: decimal !important;
          margin: 1.25rem 0 !important;
          padding-left: 1.5rem !important;
        }

        .blog-post-page .article-content li {
          margin: 0.45rem 0 !important;
          text-align: justify !important;
        }

        .blog-post-page .article-content ol li::marker,
        .blog-post-page .article-content ul li::marker {
          color: #d7b06a !important;
        }

        .blog-post-page .article-content blockquote {
          margin: 1.75rem 0 !important;
          padding: 1rem 1.25rem !important;
          border-left: 4px solid #c8a15a !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border-radius: 16px !important;
          color: rgba(255, 255, 255, 0.78) !important;
        }

        .blog-post-page .article-content img {
          display: block !important;
          width: 100% !important;
          height: auto !important;
          margin: 2rem auto !important;
          border-radius: 18px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .blog-post-page .article-content hr {
          border: 0 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin: 2rem 0 !important;
        }

        .blog-post-page .article-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1.5rem 0 !important;
          display: block;
          overflow-x: auto;
        }

        .blog-post-page .article-content th,
        .blog-post-page .article-content td {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 0.85rem 1rem !important;
          text-align: left !important;
          color: rgba(255, 255, 255, 0.88) !important;
          background: transparent !important;
        }

        .blog-post-page .article-content thead {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </main>
  );
}