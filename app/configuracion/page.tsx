import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { QuickActions } from "@/components/settings/QuickActions";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <section className="hero-panel mb-6 rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/72">
          Ajustes
        </p>
        <h2 className="mt-3 font-[var(--font-cormorant)] text-3xl font-semibold sm:text-4xl">
          Ajustes generales
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
          Personaliza la empresa, preferencias visuales y acciones de sesion en
          una interfaz con mayor profundidad y orden.
        </p>
      </section>
      <div className="grid gap-8">
        <QuickActions />
        <CompanySettingsForm />
      </div>
    </PageShell>
  );
}
