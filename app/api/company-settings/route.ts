import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/server/auth";
import { prisma } from "@/shared/lib/prisma";
import { companySettingsSchema } from "@/features/settings/schema";
import { handleApiError } from "@/shared/lib/apiError";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.companySettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const normalized = {
    ...body,
    contactName: body.contactName?.trim() || null,
    cedula: body.cedula?.trim() || null,
    address: body.address?.trim() || null,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    logoUrl: body.logoUrl?.trim() || null,
  };
  const parsed = companySettingsSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const settings = await prisma.companySettings.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, "company-settings:update", "No se pudo guardar la configuracion.");
  }
}


