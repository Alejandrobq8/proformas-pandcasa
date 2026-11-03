import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";

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
  const tomorrowStart = new Date(
    Date.UTC(nowCR.getUTCFullYear(), nowCR.getUTCMonth(), nowCR.getUTCDate() + 1)
  );
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

  const data = await prisma.proforma.findMany({
    where: {
      userId: session.user.id,
      cancelado: false,
      fechaEntrega: { gte: tomorrowStart, lt: tomorrowEnd },
    },
    orderBy: { fechaEntrega: "asc" },
    select: {
      id: true,
      number: true,
      clientNombre: true,
      clientEmpresa: true,
      notes: true,
    },
  });

  return NextResponse.json({ data });
}
