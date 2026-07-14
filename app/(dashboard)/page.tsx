import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Card, StatCard } from "@/shared/components/ui/Card";

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

const flujo = [
  {
    step: "1. Registra al cliente",
    description: "Guarda nombre, empresa y cedula para usarlos en proformas.",
  },
  {
    step: "2. Arma la proforma",
    description: "Agrega items, cantidades y precios.",
  },
  {
    step: "3. Exporta y comparte",
    description: "Descarga el PDF y revisa el historial en Cobros.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="grid gap-10 py-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
            Panaderia artesanal · Costa Rica
          </p>
          <h1 className="mt-3.5 font-serif text-4xl font-semibold leading-[1.05] text-rc-ink sm:text-5xl">
            Cada proforma,
            <br />
            lista en minutos.
          </h1>
          <p className="mt-4 max-w-[38ch] text-sm leading-6 text-rc-ink/70 sm:text-base">
            Arma la cotizacion, agrega los productos del menu y descarga el
            PDF listo para enviar. Sin vueltas.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/proformas/new">Nueva proforma</Button>
            <Button href="/clientes" variant="ghost">
              Ver clientes
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Badge tone="neutral">Borrador</Badge>
            <Badge tone="gold">Enviada</Badge>
            <Badge tone="success">Pagada</Badge>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rc-receipt w-[280px] rotate-3 shadow-[6px_8px_0_var(--rc-kraft-dark)]">
            <div className="rc-stamp -right-3.5 top-4 h-16 w-16 -rotate-[14deg] text-[10px]">
              Pagada
            </div>
            <h3 className="font-serif text-base tracking-[0.02em]">
              PF-2026-0142
            </h3>
            <p className="mb-3.5 text-[10px] text-[#8a7f6c]">
              Panaderia El Roble S.A.
            </p>
            <div className="flex justify-between text-[11px] text-[#4a4030]">
              <span>Pan artesanal x12</span>
              <span>18 400</span>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#4a4030]">
              <span>Queque de naranja</span>
              <span>9 500</span>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#4a4030]">
              <span>Bocadillos surtidos</span>
              <span>22 000</span>
            </div>
            <div className="my-3 border-t border-dashed border-rc-line" />
            <div className="flex justify-between text-[13px] font-bold">
              <span>Total</span>
              <span>₡49 900</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Proformas" value="PDF directo" />
        <StatCard label="Clientes" value="Autocompletado" />
        <StatCard label="Cobros" value="Seguimiento" />
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-xl font-semibold text-rc-ink">
          Acceso rapido
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {quickLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <Card variant="module">
                <div className="font-mono text-xs text-rc-gold-dark">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 mb-1.5 font-serif text-xl text-rc-ink">
                  {link.label}
                </h3>
                <p className="text-sm leading-6 text-rc-ink/70">
                  {link.description}
                </p>
                <span className="mt-3.5 inline-flex text-xs font-semibold text-rc-ink">
                  Entrar →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold text-rc-ink">
          Flujo recomendado
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {flujo.map((item) => (
            <Card key={item.step} variant="plain">
              <p className="text-sm font-semibold text-rc-ink">{item.step}</p>
              <p className="mt-2 text-sm leading-6 text-rc-ink/70">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
