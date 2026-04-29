import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const cobroSchema = z.object({
  ordenCompra: z.string().nullable().optional(),
  migo: z.number().int().nullable().optional(),
  numeroFactura: z.string().nullable().optional(),
  fechaPago: z.string().nullable().optional(),
  verificacionPago: z.boolean().optional(),
  sinpeTransf: z.boolean().optional(),
  cancelado: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = cobroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.proforma.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Prisma.ProformaUpdateInput = {
    ...("ordenCompra" in parsed.data && { ordenCompra: parsed.data.ordenCompra ?? null }),
    ...("migo" in parsed.data && { migo: parsed.data.migo ?? null }),
    ...("numeroFactura" in parsed.data && { numeroFactura: parsed.data.numeroFactura ?? null }),
    ...("fechaPago" in parsed.data && {
      fechaPago: parsed.data.fechaPago ? new Date(parsed.data.fechaPago) : null,
    }),
    ...("verificacionPago" in parsed.data && {
      verificacionPago: parsed.data.verificacionPago,
    }),
    ...("sinpeTransf" in parsed.data && {
      sinpeTransf: parsed.data.sinpeTransf,
    }),
    ...("cancelado" in parsed.data && {
      cancelado: parsed.data.cancelado,
    }),
  };

  const proforma = await prisma.proforma.update({
    where: { id },
    data,
  });

  return NextResponse.json(proforma);
}
