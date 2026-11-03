import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { handleApiError } from "@/shared/lib/apiError";
import { z } from "zod";

const bodySchema = z.object({
  date: z.string().min(1),
  note: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
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

  try {
    const deliveryDate = await prisma.proformaDeliveryDate.create({
      data: {
        proformaId: id,
        date: new Date(parsed.data.date),
        note: parsed.data.note || null,
      },
    });
    return NextResponse.json(deliveryDate, { status: 201 });
  } catch (error) {
    return handleApiError(
      error,
      "proformas:delivery-date-create",
      "No se pudo confirmar la fecha de entrega."
    );
  }
}
