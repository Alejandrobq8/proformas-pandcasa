import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { menuCategorySchema, menuItemSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryParam = searchParams.get("category")?.trim() ?? "";
  const parsedCategory = menuCategorySchema.safeParse(categoryParam);
  const category = parsedCategory.success ? parsedCategory.data : null;
  const take = Number(searchParams.get("take") ?? 30);
  const skip = Number(searchParams.get("skip") ?? 0);

  const where = {
    userId: session.user.id,
    ...(category ? { category } : {}),
    ...(q
      ? {
          name: { contains: q, mode: "insensitive" as const },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.menuItem.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
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

  const item = await prisma.menuItem.create({
    data: {
      userId: session.user.id,
      category: parsed.data.category,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
