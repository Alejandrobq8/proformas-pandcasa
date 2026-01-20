import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Bienvenido
          </p>
          <h1 className="mt-3 font-[var(--font-cormorant)] text-3xl font-semibold">
            Gestiona proformas impecables para tus clientes.
          </h1>
          <p className="mt-4 text-sm text-[var(--cocoa)]">
            Crea, edita y exporta proformas con estilo editorial y PDF exacto.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md"
              href="/proformas"
            >
              Ver proformas
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--cocoa)] text-center transition hover:-translate-y-0.5 hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
              href="/clientes"
            >
              Gestionar clientes
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            Flujo recomendado
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--cocoa)]">
            <li>1. Crea o importa clientes con su cedula juridica.</li>
            <li>2. Genera una proforma con items y descuentos.</li>
            <li>3. Exporta el PDF listo para enviar.</li>
          </ul>
        </div>
      </section>
    </PageShell>
  );
}

