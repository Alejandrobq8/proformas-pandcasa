-- CreateTable
CREATE TABLE "ProformaDeliveryDate" (
    "id" TEXT NOT NULL,
    "proformaId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaDeliveryDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProformaDeliveryDate_proformaId_idx" ON "ProformaDeliveryDate"("proformaId");

-- CreateIndex
CREATE INDEX "ProformaDeliveryDate_date_idx" ON "ProformaDeliveryDate"("date");

-- AddForeignKey
ALTER TABLE "ProformaDeliveryDate" ADD CONSTRAINT "ProformaDeliveryDate_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "Proforma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: move each proforma's existing single fechaEntrega into the new
-- one-to-many table before the column is dropped, so no data is lost.
INSERT INTO "ProformaDeliveryDate" ("id", "proformaId", "date", "createdAt")
SELECT gen_random_uuid()::text, "id", "fechaEntrega", CURRENT_TIMESTAMP
FROM "Proforma"
WHERE "fechaEntrega" IS NOT NULL;

-- AlterTable
ALTER TABLE "Proforma" DROP COLUMN "fechaEntrega";
