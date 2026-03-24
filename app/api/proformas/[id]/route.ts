import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { proformaSchema } from "@/features/proformas/schema";
import { calculateTotals } from "@/features/proformas/utils/calculateTotals";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const proforma = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!proforma) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(proforma);
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

  const body = await request.json();
  const parsed = proformaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, userId: session.user.id },
    });
    if (!client) {
      return NextResponse.json(
        { error: "Cliente no valido." },
        { status: 400 }
      );
    }
  }

  const existing = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = parsed.data.status ?? "DRAFT";
  const { subtotal, total } = calculateTotals(parsed.data);

  const proforma = await prisma.$transaction(async (tx) => {
    await tx.proformaItem.deleteMany({
      where: { proformaId: id },
    });

    return tx.proforma.update({
      where: { id },
      data: {
        clientId: parsed.data.clientId ?? null,
        clientNombre: parsed.data.clientNombre,
        clientEmpresa: parsed.data.clientEmpresa ?? "",
        clientCedulaJuridica: parsed.data.clientCedulaJuridica ?? "",
        showUnitPrice: parsed.data.showUnitPrice ?? true,
        status,
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
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  });

  return NextResponse.json(proforma);
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

  const existing = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.proforma.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


