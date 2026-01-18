import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
            { nombre: { contains: q, mode: "insensitive" as const } },
            { empresa: { contains: q, mode: "insensitive" as const } },
            { cedulaJuridica: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear el cliente." },
      { status: 400 }
    );
  }
}
