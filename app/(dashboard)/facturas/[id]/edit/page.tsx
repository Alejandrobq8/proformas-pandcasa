import { notFound } from "next/navigation";
import { getServerUser } from "@/features/auth/server/session";
import { FacturaForm } from "@/features/facturas/components/FacturaForm";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { prisma } from "@/shared/lib/prisma";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export default async function FacturaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getServerUser();

  const factura = await prisma.invoice.findFirst({
    where: { id, userId: user!.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!factura) {
    notFound();
  }

  const initial = {
    id: factura.id,
    clientId: factura.clientId,
    clientNombre: factura.clientNombre,
    clientCedula: factura.clientCedula,
    issueDate: factura.issueDate.toISOString().slice(0, 10),
    showUnitPrice: factura.showUnitPrice,
    discount: toNumber(factura.discount ?? 0),
    notes: factura.notes ?? "",
    items: factura.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
    })),
  };

  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Editar factura" title={factura.number} />
      <FacturaForm initial={initial} />
    </div>
  );
}
