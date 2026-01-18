import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProformaTemplateShortcut() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const latest = await prisma.proforma.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!latest) {
    redirect("/proformas");
  }

  redirect(`/proformas/${latest.id}/print-template`);
}
