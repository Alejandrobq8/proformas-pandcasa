"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { ProformaFilters } from "@/features/proformas/api";
import { deleteProforma, listProformas } from "@/features/proformas/api";

const proformasKey = (filters: ProformaFilters, take: number) =>
  ["proformas", filters, take] as const;

export function useProformasQuery(filters: ProformaFilters, take: number) {
  return useQuery({
    queryKey: proformasKey(filters, take),
    queryFn: () => listProformas(filters, take),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteProforma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProforma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proformas"] });
    },
  });
}
