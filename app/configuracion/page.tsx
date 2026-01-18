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
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Ajustes
        </p>
        <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
          Ajustes generales
        </h2>
      </div>
      <div className="grid gap-8">
        <QuickActions />
        <CompanySettingsForm />
      </div>
    </PageShell>
  );
}
