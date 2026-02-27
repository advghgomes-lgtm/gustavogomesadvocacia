"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

const ADMIN_EMAIL = "adv.ghgomes@gmail.com";

export default function AdminPage() {
  const router = useRouter();
  const whatsapp = useMemo(() => "https://wa.me/5516997434946", []);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function loginWithGoogle() {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      setError("Não foi possível entrar com Google. Tente novamente.");
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function loadPosts() {
    setError(null);
    setLoadingPosts(true);
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);

      const rows: PostRow[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const publishedAt: Timestamp | undefined = data.publishedAt;
        const updatedAt: Timestamp | undefined = data.updatedAt;

        return {
          id: d.id,
          title: String(data.title ?? "(Sem título)"),
          slug: String(data.slug ?? ""),
          status: (data.status ?? "draft") as "draft" | "published",
          publishedAt: publishedAt ? publishedAt.toDate() : null,
          updatedAt: updatedAt ? updatedAt.toDate() : null,
        };
      });

      setPosts(rows);
    } catch {
      setError(
        "Erro ao carregar posts. Verifique se o Firestore está criado e as regras estão publicadas."
      );
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAdmin) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAdmin]);

  async function createDraftPostAndOpen() {
    setError(null);
    try {
      const now = Date.now();
      const slug = `novo-post-${now}`;

      const docRef = await addDoc(collection(db, "posts"), {
        title: "Novo post",
        slug,
        excerpt: "",
        content: "",
        status: "draft",
        authorEmail: ADMIN_EMAIL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      });

      router.push(`/admin/posts/${docRef.id}`);
    } catch {
      setError("Não foi possível criar o rascunho. Verifique as regras do Firestore.");
    }
  }

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

          <div className="flex items-center gap-3">
            <a
              href={whatsapp}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
            >
              WhatsApp
            </a>

            {user ? (
              <button
                onClick={logout}
                className="rounded-xl bg-white text-[#0B0F1A] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
              >
                Sair
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="rounded-xl bg-white text-[#0B0F1A] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
              >
                Entrar com Google
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Painel Admin</h1>
        <p className="mt-2 text-sm text-white/60">Gerenciar posts do blog.</p>

        {authLoading ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            Carregando autenticação...
          </div>
        ) : !user ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/80">Você precisa entrar para acessar o painel.</p>
            <button
              onClick={loginWithGoogle}
              className="mt-4 rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition"
            >
              Entrar com Google
            </button>
          </div>
        ) : !isAdmin ? (
          <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-red-200 font-semibold">Acesso negado.</p>
            <p className="mt-2 text-sm text-red-200/80">
              Este usuário não é administrador.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Logado como: <span className="text-white/80">{user.email}</span>
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={logout}
                className="rounded-xl bg-white text-[#0B0F1A] px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
              >
                Sair
              </button>
              <a
                href="/"
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
              >
                Voltar para Home
              </a>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={createDraftPostAndOpen}
                className="rounded-xl bg-[#C8A15A] text-[#0B0F1A] px-5 py-3 font-semibold hover:opacity-95 transition"
              >
                Criar novo post
              </button>

              <button
                onClick={loadPosts}
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10 transition"
              >
                Atualizar lista
              </button>

              <a
                href="/blog"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10 transition text-center"
              >
                Ver Blog público
              </a>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="font-semibold">Posts</h2>
                <p className="mt-1 text-sm text-white/60">
                  Clique em um post para editar.
                </p>
              </div>

              {loadingPosts ? (
                <div className="p-6 text-white/70">Carregando posts...</div>
              ) : posts.length === 0 ? (
                <div className="p-6 text-white/70">Nenhum post encontrado.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {posts.map((p) => (
                    <a
                      key={p.id}
                      href={`/admin/posts/${p.id}`}
                      className="block p-6 hover:bg-white/5 transition"
                    >
                      <p className="text-xs text-white/55">
                        Status: <span className="text-white/80">{p.status}</span>
                        {p.publishedAt ? (
                          <>
                            {" "}
                            • Publicado em{" "}
                            <span className="text-white/80">
                              {p.publishedAt.toLocaleDateString("pt-BR")}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <h3 className="mt-1 font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-white/70">
                        Slug: <span className="text-white/80">{p.slug}</span>
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}