"use client";

import { useCallback, useEffect, useState } from "react";
import type { Proforma } from "@/features/cobros/types";

export function useCobrosData(buildParams: () => URLSearchParams) {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProformas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proformas?${buildParams()}`);
      if (!res.ok) throw new Error("error");
      const json = await res.json();
      setProformas(json.data ?? []);
    } catch {
      setError("No se pudieron cargar las proformas.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const timer = setTimeout(fetchProformas, 300);
    return () => clearTimeout(timer);
  }, [fetchProformas]);

  return { proformas, setProformas, loading, error };
}
