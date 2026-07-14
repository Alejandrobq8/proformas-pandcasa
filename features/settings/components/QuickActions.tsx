"use client";

import { signOut } from "next-auth/react";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";

export function QuickActions() {
  return (
    <Card variant="plain">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
            Sesion
          </p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
            Acciones rapidas
          </h3>
        </div>
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
          Salir
        </Button>
      </div>
    </Card>
  );
}
