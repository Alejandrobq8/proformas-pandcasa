import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProformasPage } from "@/components/proformas/ProformasPage";

export default async function Proformas() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <ProformasPage />
    </PageShell>
  );
}
