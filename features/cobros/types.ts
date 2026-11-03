export type Proforma = {
  id: string;
  number: string;
  createdAt: string;
  total: string | number;
  notes: string | null;
  clientNombre: string;
  clientEmpresa: string | null;
  ordenCompra: string | null;
  migo: string | null;
  numeroFactura: string | null;
  fechaPago: string | null;
  verificacionPago: boolean;
  sinpeTransf: boolean;
  cancelado: boolean;
};
