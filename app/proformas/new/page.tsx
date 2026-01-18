import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProformaForm } from "@/components/proformas/ProformaForm";

export default async function ProformaNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Nueva proforma
        </p>
        <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
          Crear proforma
        </h2>
      </div>
      <ProformaForm />
    </PageShell>
  );
}
