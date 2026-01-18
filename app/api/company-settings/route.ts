import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companySettingsSchema } from "@/lib/validation";

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

  const settings = await prisma.companySettings.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json(settings);
}
