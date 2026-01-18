import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proformaSchema } from "@/lib/validation";
import { calculateTotals } from "@/lib/proforma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function formatNumber(year: number, sequence: number) {
  return `PF-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const take = Number(searchParams.get("take") ?? 10);
  const skip = Number(searchParams.get("skip") ?? 0);

  const where = {
    userId: session.user.id,
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" as const } },
            { clientNombre: { contains: q, mode: "insensitive" as const } },
            { clientEmpresa: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.proforma.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { items: true },
    }),
    prisma.proforma.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
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

  const status = parsed.data.status ?? "DRAFT";
  const { subtotal, total } = calculateTotals(parsed.data);
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
        clientId: parsed.data.clientId ?? null,
        clientNombre: parsed.data.clientNombre,
        clientEmpresa: parsed.data.clientEmpresa,
        clientCedulaJuridica: parsed.data.clientCedulaJuridica,
        status,
        discount: parsed.data.discount ?? null,
        notes: parsed.data.notes ?? null,
        subtotal,
        total,
        year,
        sequence,
        number,
        items: {
          create: parsed.data.items.map((item) => ({
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
