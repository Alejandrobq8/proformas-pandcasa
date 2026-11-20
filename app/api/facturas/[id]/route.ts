import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { prisma } from "@/shared/lib/prisma";
import { handleApiError } from "@/shared/lib/apiError";
import {
  calculateFacturaTotals,
  facturaSchema,
} from "@/features/facturas/schema";

function parseIssueDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const factura = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!factura) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(factura);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = facturaSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const issueDate = parseIssueDate(parsed.data.issueDate);
  if (!issueDate) {
    return NextResponse.json({ error: "Fecha no valida." }, { status: 400 });
  }

  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, userId: session.user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "Cliente no valido." }, { status: 400 });
    }
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { subtotal, total } = calculateFacturaTotals(parsed.data);

  try {
    const factura = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          clientId: parsed.data.clientId ?? null,
          clientNombre: parsed.data.clientNombre,
          clientCedula: parsed.data.clientCedula ?? "",
          issueDate,
          showUnitPrice: parsed.data.showUnitPrice ?? true,
          discount: parsed.data.discount ?? null,
          notes: parsed.data.notes ?? null,
          subtotal,
          total,
          items: {
            create: parsed.data.items.map((item, index) => ({
              sortOrder: index,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      });
    });
    return NextResponse.json(factura);
  } catch (error) {
    return handleApiError(error, "facturas:update", "No se pudo actualizar la factura.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "facturas:delete", "No se pudo eliminar la factura.");
  }
}
