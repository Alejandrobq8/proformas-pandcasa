import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function formatNumber(year: number, sequence: number) {
  return `PF-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = await prisma.proforma.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const year = new Date().getFullYear();

  const proforma = await prisma.$transaction(async (tx) => {
    const last = await tx.proforma.findFirst({
      where: { userId: session.user.id, year },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const sequence = (last?.sequence ?? 0) + 1;
    const number = formatNumber(year, sequence);

    return tx.proforma.create({
      data: {
        userId: session.user.id,
        clientId: source.clientId,
        clientNombre: source.clientNombre,
        clientEmpresa: source.clientEmpresa,
        clientCedulaJuridica: source.clientCedulaJuridica,
        discount: source.discount,
        notes: source.notes,
        subtotal: source.subtotal,
        total: source.total,
        year,
        sequence,
        number,
        items: {
          create: source.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  });

  return NextResponse.json(proforma, { status: 201 });
}
