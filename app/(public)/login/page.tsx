import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { authOptions } from "@/features/auth/server/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
        <div className="ambient-grid" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hero-panel rounded-[2rem] px-7 py-8 sm:px-10 sm:py-10">
          <span className="soft-badge border-white/20 bg-white/10 text-white">
            Acceso al sistema
          </span>
          <h1 className="mt-5 font-[var(--font-cormorant)] text-4xl font-semibold leading-tight sm:text-5xl">
            Proformas Pan d&apos; Casa con una entrada mas actual y clara.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/82 sm:text-base">
            Inicia sesion para administrar clientes, menu y documentos desde el
            panel renovado.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                Visual
              </p>
              <p className="mt-2 text-sm font-semibold">Capas y profundidad</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                Flujo
              </p>
              <p className="mt-2 text-sm font-semibold">Navegacion suave</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                Orden
              </p>
              <p className="mt-2 text-sm font-semibold">Contenido mas legible</p>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Bienvenido
          </p>
          <h2 className="mt-3 font-[var(--font-cormorant)] text-3xl font-semibold">
            Inicia sesion
          </h2>
          <p className="mt-2 text-sm text-[var(--cocoa)]">
            Usa el usuario creado en el seed de Prisma para entrar al panel.
          </p>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}
