import Link from "next/link";

const quickLinks = [
  {
    href: "/proformas",
    label: "Proformas",
    description: "Crea y descarga proformas en PDF.",
  },
  {
    href: "/clientes",
    label: "Clientes",
    description: "Registra empresas y contactos.",
  },
  {
    href: "/menu",
    label: "Menu",
    description: "Administra productos y precios.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero-panel rounded-[2rem] px-7 py-8 sm:px-10 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <span className="soft-badge border-white/20 bg-white/10 text-white">
              Pan d&apos; Casa
            </span>
            <h1 className="mt-5 max-w-3xl font-[var(--font-cormorant)] text-4xl font-semibold leading-tight sm:text-5xl">
              Panel de ventas
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
              Desde aqui podes crear proformas, gestionar clientes y actualizar
              el menu.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="btn-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                href="/proformas"
              >
                Ir a proformas
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/18"
                href="/clientes"
              >
                Abrir clientes
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.6rem] border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                Proformas
              </p>
              <p className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
                PDF directo
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                Clientes
              </p>
              <p className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
                Autocompletado
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                Cobros
              </p>
              <p className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
                Seguimiento
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel rounded-[2rem] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Acceso rapido
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                className="interactive-card rounded-[1.6rem] border border-[var(--border)] bg-white/35 p-5"
                href={link.href}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                  Modulo
                </p>
                <h2 className="mt-3 font-[var(--font-cormorant)] text-2xl font-semibold">
                  {link.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--cocoa)]">
                  {link.description}
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[var(--amber-strong)]">
                  Entrar
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-panel rounded-[2rem] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Flujo recomendado
          </p>
          <div className="mt-5 space-y-4">
            <div className="interactive-card rounded-[1.5rem] border border-[var(--border)] bg-white/30 p-5">
              <p className="text-sm font-semibold">1. Registra al cliente</p>
              <p className="mt-2 text-sm leading-6 text-[var(--cocoa)]">
                Guarda nombre, empresa y cedula para usarlos en proformas.
              </p>
            </div>
            <div className="interactive-card rounded-[1.5rem] border border-[var(--border)] bg-white/30 p-5">
              <p className="text-sm font-semibold">2. Arma la proforma</p>
              <p className="mt-2 text-sm leading-6 text-[var(--cocoa)]">
                Agrega items, cantidades y precios.
              </p>
            </div>
            <div className="interactive-card rounded-[1.5rem] border border-[var(--border)] bg-white/30 p-5">
              <p className="text-sm font-semibold">3. Exporta y comparte</p>
              <p className="mt-2 text-sm leading-6 text-[var(--cocoa)]">
                Descarga el PDF y revisa el historial en Cobros.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
