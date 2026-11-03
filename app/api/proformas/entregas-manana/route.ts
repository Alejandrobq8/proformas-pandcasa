import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { textMentionsTomorrow } from "@/shared/lib/deliveryDateParser";

// Costa Rica is fixed UTC-6 (no DST). Computing "tomorrow" from the server's
// own clock/timezone would be wrong once deployed (Vercel runs in UTC), so
// we shift to CR wall-clock time first before taking the calendar date.
const CR_OFFSET_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowCR = new Date(Date.now() - CR_OFFSET_MS);
  const tomorrow = new Date(
    Date.UTC(nowCR.getUTCFullYear(), nowCR.getUTCMonth(), nowCR.getUTCDate() + 1)
  );
  const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

  // Proformas with a structured delivery date tomorrow (any status, per
  // "siempre mostrar aun si esta en DRAFT").
  const withDate = await prisma.proforma.findMany({
    where: {
      userId: session.user.id,
      cancelado: false,
      deliveryDates: { some: { date: { gte: tomorrow, lt: tomorrowEnd } } },
    },
    select: {
      id: true,
      number: true,
      clientNombre: true,
      clientEmpresa: true,
      notes: true,
      deliveryDates: {
        where: { date: { gte: tomorrow, lt: tomorrowEnd } },
        select: { note: true },
      },
    },
  });

  const confirmed = withDate.map((p) => ({
    id: p.id,
    number: p.number,
    clientNombre: p.clientNombre,
    clientEmpresa: p.clientEmpresa,
    note: p.deliveryDates.map((d) => d.note).filter(Boolean).join(" · ") || p.notes,
    source: "fecha" as const,
  }));

  // Fechas de entrega a veces se escriben a mano en notes o en la
  // descripcion de un item, en vez de usar el campo estructurado. Buscamos
  // esos dos lugares (solo esos dos) por menciones de "mañana" para no
  // perder pedidos que todavia no se formalizaron.
  const confirmedIds = new Set(withDate.map((p) => p.id));
  const candidates = await prisma.proforma.findMany({
    where: {
      userId: session.user.id,
      cancelado: false,
      id: { notIn: Array.from(confirmedIds) },
    },
    select: {
      id: true,
      number: true,
      clientNombre: true,
      clientEmpresa: true,
      notes: true,
      items: { select: { description: true } },
    },
  });

  const detected = candidates
    .filter((p) => {
      const notesMatch = p.notes ? textMentionsTomorrow(p.notes, tomorrow) : false;
      const itemMatch = p.items.some((item) => textMentionsTomorrow(item.description, tomorrow));
      return notesMatch || itemMatch;
    })
    .map((p) => ({
      id: p.id,
      number: p.number,
      clientNombre: p.clientNombre,
      clientEmpresa: p.clientEmpresa,
      note: p.notes,
      source: "texto" as const,
    }));

  return NextResponse.json({ data: [...confirmed, ...detected] });
}
