import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { menuItemSchema } from "@/features/menu/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { handleApiError } from "@/shared/lib/apiError";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.menuItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
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
  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.menuItem.updateMany({
      where: { id, userId: session.user.id },
      data: {
        category: parsed.data.category,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: parsed.data.price,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.menuItem.findUnique({ where: { id } });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error, "menu-items:update", "No se pudo actualizar el item de menu.");
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

  const item = await prisma.menuItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "menu-items:delete", "No se pudo eliminar el item de menu.");
  }
}


