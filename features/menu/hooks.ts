"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { MenuCategory, MenuItemInput } from "@/features/menu/schema";
import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "@/features/menu/api";

const menuItemsKey = (query: string, category: MenuCategory) =>
  ["menu-items", query, category] as const;

export function useMenuItemsQuery(query: string, category: MenuCategory) {
  return useQuery({
    queryKey: menuItemsKey(query, category),
    queryFn: () => listMenuItems(query, category),
    placeholderData: keepPreviousData,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MenuItemInput) => createMenuItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MenuItemInput }) =>
      updateMenuItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}
