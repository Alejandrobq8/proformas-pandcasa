-- AlterTable
ALTER TABLE "Proforma" ADD COLUMN "ordenCompra" TEXT,
ADD COLUMN "migo" TEXT,
ADD COLUMN "numeroFactura" TEXT,
ADD COLUMN "fechaPago" TIMESTAMP(3),
ADD COLUMN "verificacionPago" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sinpeTransf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancelado" BOOLEAN NOT NULL DEFAULT false;
