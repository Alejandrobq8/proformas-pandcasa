import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ClientesPage } from "@/components/clientes/ClientesPage";

export default async function Clientes() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <ClientesPage />
    </PageShell>
  );
}
