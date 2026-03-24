import { redirect } from "next/navigation";
import { getServerUser } from "@/features/auth/server/session";
import { prisma } from "@/shared/lib/prisma";

export default async function ProformaTemplateShortcut() {
  const user = await getServerUser();

  const latest = await prisma.proforma.findFirst({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!latest) {
    redirect("/proformas");
  }

  redirect(`/proformas/${latest.id}/print-template`);
}
