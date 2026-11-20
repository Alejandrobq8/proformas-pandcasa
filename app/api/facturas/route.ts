import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { prisma } from "@/shared/lib/prisma";
import { handleApiError } from "@/shared/lib/apiError";
import {
  calculateFacturaTotals,
  facturaSchema,
} from "@/features/facturas/schema";

function formatNumber(year: number, sequence: number) {
  return `FD-${year}-${String(sequence).padStart(4, "0")}`;
}

// Stored at noon UTC so the calendar day never shifts across time zones.
function parseIssueDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateQuery(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const day = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (day) {
    const start = new Date(Date.UTC(+day[1], +day[2] - 1, +day[3]));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return Number.isNaN(start.getTime()) ? null : { start, end };
  }
  const month = normalized.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const start = new Date(Date.UTC(+month[1], +month[2] - 1, 1));
    const end = new Date(Date.UTC(+month[1], +month[2], 1));
    return Number.isNaN(start.getTime()) ? null : { start, end };
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const number = searchParams.get("number")?.trim() ?? "";
  const client = searchParams.get("client")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 20) || 20, 1), 200);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0) || 0, 0);
  const range = date ? parseDateQuery(date) : null;

  const where = {
    userId: session.user.id,
    ...(number
      ? { number: { contains: number, mode: "insensitive" as const } }
      : {}),
    ...(client
      ? {
          OR: [
            { clientNombre: { contains: client, mode: "insensitive" as const } },
            { clientCedula: { contains: client, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(range ? { issueDate: { gte: range.start, lt: range.end } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
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

  const { subtotal, total } = calculateFacturaTotals(parsed.data);
  const year = issueDate.getUTCFullYear();

  try {
    const factura = await prisma.$transaction(async (tx) => {
      const last = await tx.invoice.findFirst({
        where: { userId: session.user.id, year },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const sequence = (last?.sequence ?? 0) + 1;

      return tx.invoice.create({
        data: {
          userId: session.user.id,
          clientId: parsed.data.clientId ?? null,
          clientNombre: parsed.data.clientNombre,
          clientCedula: parsed.data.clientCedula ?? "",
          issueDate,
          showUnitPrice: parsed.data.showUnitPrice ?? true,
          discount: parsed.data.discount ?? null,
          notes: parsed.data.notes ?? null,
          subtotal,
          total,
          year,
          sequence,
          number: formatNumber(year, sequence),
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
    return NextResponse.json(factura, { status: 201 });
  } catch (error) {
    return handleApiError(error, "facturas:create", "No se pudo crear la factura.");
  }
}
