"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { ClientInput } from "@/features/clientes/schema";
import {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from "@/features/clientes/api";

const clientesKey = (query: string) => ["clientes", query] as const;

export function useClientesQuery(query: string) {
  return useQuery({
    queryKey: clientesKey(query),
    queryFn: () => listClientes(query),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) => createCliente(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientInput }) =>
      updateCliente(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
