import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProformaForm } from "@/components/proformas/ProformaForm";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export default async function ProformaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const proforma = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!proforma) {
    notFound();
  }

  const initial = {
    id: proforma.id,
    clientId: proforma.clientId,
    clientNombre: proforma.clientNombre,
    clientEmpresa: proforma.clientEmpresa,
    clientCedulaJuridica: proforma.clientCedulaJuridica,
    discount: toNumber(proforma.discount ?? 0),
    notes: proforma.notes ?? "",
    status: proforma.status,
    items: proforma.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
    })),
  };

  return (
    <PageShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Editar proforma
        </p>
        <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
          {proforma.number}
        </h2>
      </div>
      <ProformaForm initial={initial} />
    </PageShell>
  );
}
