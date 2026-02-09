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
  const numberParam = searchParams.get("number")?.trim() ?? "";
  const clientParam = searchParams.get("client")?.trim() ?? "";
  const dateParam = searchParams.get("date")?.trim() ?? "";
  const amountMinParam = searchParams.get("amountMin")?.trim() ?? "";
  const amountMaxParam = searchParams.get("amountMax")?.trim() ?? "";
  const take = Number(searchParams.get("take") ?? 10);
  const skip = Number(searchParams.get("skip") ?? 0);

  const filtersActive =
    numberParam || clientParam || dateParam || amountMinParam || amountMaxParam;
  const dateRange = parseDateQuery(filtersActive ? dateParam : q);
  const amountRangeFilters = filtersActive
    ? parseAmountRange(amountMinParam, amountMaxParam)
    : null;
  const amountRangeQuery = !filtersActive ? parseAmountQuery(q) : null;

  const andFilters = [
    numberParam
      ? { number: { contains: numberParam, mode: "insensitive" as const } }
      : null,
    clientParam
      ? {
          OR: [
            { clientNombre: { contains: clientParam, mode: "insensitive" as const } },
            { clientEmpresa: { contains: clientParam, mode: "insensitive" as const } },
          ],
        }
      : null,
    dateRange
      ? {
          createdAt: {
            gte: dateRange.start,
            lt: dateRange.end,
          },
        }
      : null,
    amountRangeFilters
      ? {
          total: {
            ...(amountRangeFilters.min !== null
              ? { gte: amountRangeFilters.min }
              : {}),
            ...(amountRangeFilters.max !== null
              ? { lte: amountRangeFilters.max }
              : {}),
          },
        }
      : null,
  ].filter((value): value is NonNullable<typeof value> => value !== null);

  const where = {
    userId: session.user.id,
    ...(filtersActive
      ? {
          AND: andFilters,
        }
      : q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" as const } },
              { clientNombre: { contains: q, mode: "insensitive" as const } },
              { clientEmpresa: { contains: q, mode: "insensitive" as const } },
              ...(dateRange
                ? [
                    {
                      createdAt: {
                        gte: dateRange.start,
                        lt: dateRange.end,
                      },
                    },
                  ]
                : []),
              ...(amountRangeQuery
                ? [
                    {
                      total: {
                        gte: amountRangeQuery.min,
                        lt: amountRangeQuery.max,
                      },
                    },
                  ]
                : []),
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

function parseDateQuery(value: string) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, "");

  const isoMatch = normalized.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (!Number.isNaN(date.getTime())) {
      const start = new Date(date);
      const end = new Date(date);
      end.setUTCDate(end.getUTCDate() + 1);
      return { start, end };
    }
  }

  const isoMonthMatch = normalized.match(/^(\d{4})[-/](\d{2})$/);
  if (isoMonthMatch) {
    const [_, year, month] = isoMonthMatch;
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(Date.UTC(Number(year), Number(month), 1));
      return { start, end };
    }
  }

  const latamMatch = normalized.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (latamMatch) {
    const [_, day, month, year] = latamMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (!Number.isNaN(date.getTime())) {
      const start = new Date(date);
      const end = new Date(date);
      end.setUTCDate(end.getUTCDate() + 1);
      return { start, end };
    }
  }

  const latamMonthMatch = normalized.match(/^(\d{2})[/-](\d{4})$/);
  if (latamMonthMatch) {
    const [_, month, year] = latamMonthMatch;
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(Date.UTC(Number(year), Number(month), 1));
      return { start, end };
    }
  }

  return null;
}

function parseAmountQuery(value: string) {
  if (!value) return null;
  const normalized = value
    .toLowerCase()
    .replace(/[₡$,]/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  const min = amount - 0.005;
  const max = amount + 0.005;
  return { min, max };
}

function parseAmountValue(value: string) {
  if (!value) return null;
  const normalized = value
    .toLowerCase()
    .replace(/[₡$,]/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function parseAmountRange(minValue: string, maxValue: string) {
  const min = parseAmountValue(minValue);
  const max = parseAmountValue(maxValue);
  if (min === null && max === null) return null;
  return { min, max };
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
        clientEmpresa: parsed.data.clientEmpresa ?? "",
        clientCedulaJuridica: parsed.data.clientCedulaJuridica ?? "",
        showUnitPrice: parsed.data.showUnitPrice ?? true,
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
