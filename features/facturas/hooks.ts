"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { FacturaFilters } from "@/features/facturas/api";
import { deleteFactura, listFacturas } from "@/features/facturas/api";

const facturasKey = (filters: FacturaFilters, take: number) =>
  ["facturas", filters, take] as const;

export function useFacturasQuery(filters: FacturaFilters, take: number) {
  return useQuery({
    queryKey: facturasKey(filters, take),
    queryFn: () => listFacturas(filters, take),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFactura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
    },
  });
}
