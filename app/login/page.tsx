import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Acceso
        </p>
        <h1 className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
          Proformas Pan d' Casa
        </h1>
        <p className="mt-2 text-sm text-[var(--cocoa)]">
          Inicia sesion con el usuario creado en el seed de Prisma.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
