import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/features/auth/server/session";
import { PageShell } from "@/shared/components/layout/PageShell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return <PageShell>{children}</PageShell>;
}
