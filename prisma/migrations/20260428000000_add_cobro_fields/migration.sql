-- AlterTable
ALTER TABLE "Proforma" ADD COLUMN "ordenCompra" TEXT,
ADD COLUMN "migo" INTEGER,
ADD COLUMN "numeroFactura" TEXT,
ADD COLUMN "fechaPago" TIMESTAMP(3),
ADD COLUMN "verificacionPago" BOOLEAN NOT NULL DEFAULT false;
