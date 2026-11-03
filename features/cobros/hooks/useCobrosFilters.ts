"use client";

import { useCallback, useReducer } from "react";

export type CobrosFiltersState = {
  number: string;
  client: string;
  amountMin: string;
  amountMax: string;
  oc: string;
  migo: string;
  factura: string;
  entrega: string;
  ocStatus: "" | "con" | "sin";
  pagoStatus: "" | "pagada" | "pendiente";
  pagoDesde: string;
  pagoHasta: string;
  entregaFecha: string;
  showCancelled: boolean;
};

const initialState: CobrosFiltersState = {
  number: "",
  client: "",
  amountMin: "",
  amountMax: "",
  oc: "",
  migo: "",
  factura: "",
  entrega: "",
  ocStatus: "",
  pagoStatus: "",
  pagoDesde: "",
  pagoHasta: "",
  entregaFecha: "",
  showCancelled: true,
};

type Action =
  | { type: "set"; field: keyof CobrosFiltersState; value: string | boolean }
  | { type: "clear" };

function reducer(state: CobrosFiltersState, action: Action): CobrosFiltersState {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "clear":
      return initialState;
    default:
      return state;
  }
}

export function useCobrosFilters() {
  const [filters, dispatch] = useReducer(reducer, initialState);

  const setField = useCallback(
    <K extends keyof CobrosFiltersState>(field: K, value: CobrosFiltersState[K]) => {
      dispatch({ type: "set", field, value });
    },
    []
  );

  const clearFilters = useCallback(() => dispatch({ type: "clear" }), []);

  const filtersActive = Boolean(
    filters.number ||
      filters.client ||
      filters.amountMin ||
      filters.amountMax ||
      filters.migo ||
      filters.oc ||
      filters.factura ||
      filters.entrega ||
      filters.ocStatus ||
      filters.pagoStatus ||
      filters.pagoDesde ||
      filters.pagoHasta ||
      filters.entregaFecha ||
      !filters.showCancelled
  );

  const moreFiltersActive = Boolean(
    filters.amountMin ||
      filters.amountMax ||
      filters.migo ||
      filters.oc ||
      filters.factura ||
      filters.ocStatus ||
      filters.pagoStatus ||
      filters.pagoDesde ||
      filters.pagoHasta ||
      filters.entregaFecha
  );

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ take: "9999", skip: "0" });
    if (filters.number) params.set("number", filters.number);
    if (filters.client) params.set("client", filters.client);
    if (filters.amountMin) params.set("amountMin", filters.amountMin);
    if (filters.amountMax) params.set("amountMax", filters.amountMax);
    if (filters.oc) params.set("oc", filters.oc);
    if (filters.migo) params.set("migo", filters.migo);
    if (filters.factura) params.set("factura", filters.factura);
    if (filters.entrega) params.set("entrega", filters.entrega);
    if (filters.ocStatus) params.set("ocEstado", filters.ocStatus);
    if (filters.pagoStatus) params.set("pagoEstado", filters.pagoStatus);
    if (filters.pagoDesde) params.set("pagoDesde", filters.pagoDesde);
    if (filters.pagoHasta) params.set("pagoHasta", filters.pagoHasta);
    if (filters.entregaFecha) params.set("entregaFecha", filters.entregaFecha);
    if (!filters.showCancelled) params.set("incluirCanceladas", "0");
    return params;
  }, [filters]);

  return { filters, setField, clearFilters, filtersActive, moreFiltersActive, buildParams };
}
