-- CreateEnum
CREATE TYPE "ProformaStatus" AS ENUM ('DRAFT', 'SENT', 'PAID');

-- AlterTable
ALTER TABLE "Proforma" ADD COLUMN     "status" "ProformaStatus" NOT NULL DEFAULT 'DRAFT';
