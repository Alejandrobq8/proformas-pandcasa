-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "empresa" DROP NOT NULL,
ALTER COLUMN "cedulaJuridica" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Proforma" ALTER COLUMN "clientEmpresa" DROP NOT NULL,
ALTER COLUMN "clientCedulaJuridica" DROP NOT NULL;
