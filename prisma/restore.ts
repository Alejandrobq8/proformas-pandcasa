import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type BackupPayload = {
  exportedAt: string;
  counts: Record<string, number>;
  data: {
    users: Array<{
      id: string;
      name: string | null;
      email: string;
      passwordHash: string;
      createdAt: string;
      updatedAt: string;
    }>;
    clients: Array<{
      id: string;
      userId: string;
      nombre: string;
      empresa: string | null;
      cedulaJuridica: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    companySettings: Array<{
      id: string;
      userId: string;
      name: string;
      contactName: string | null;
      cedula: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      logoUrl: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    menuItems: Array<{
      id: string;
      userId: string;
      category: "BOCADILLOS" | "POSTRES" | "QUEQUES";
      name: string;
      description: string | null;
      price: string;
      createdAt: string;
      updatedAt: string;
    }>;
    proformas: Array<{
      id: string;
      userId: string;
      clientId: string | null;
      status: "DRAFT" | "SENT" | "PAID";
      number: string;
      year: number;
      sequence: number;
      clientNombre: string;
      clientEmpresa: string | null;
      clientCedulaJuridica: string | null;
      showUnitPrice: boolean;
      discount: string | null;
      subtotal: string;
      total: string;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    proformaItems: Array<{
      id: string;
      proformaId: string;
      sortOrder: number;
      description: string;
      quantity: number;
      unitPrice: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
};

function requireTargetUrl() {
  const url = process.env.TARGET_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TARGET_DATABASE_URL is required to restore data into Supabase or another Postgres database."
    );
  }
  return url;
}

function requireBackupPath() {
  const input = process.argv[2];
  if (!input) {
    throw new Error(
      "Backup file path is required. Example: npm run db:restore -- db-backups/backup-2026-03-27T06-00-00-000Z.json"
    );
  }
  return path.resolve(process.cwd(), input);
}

async function getCounts(prisma: PrismaClient) {
  const [users, clients, companySettings, menuItems, proformas, proformaItems] =
    await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.companySettings.count(),
      prisma.menuItem.count(),
      prisma.proforma.count(),
      prisma.proformaItem.count(),
    ]);

  return {
    users,
    clients,
    companySettings,
    menuItems,
    proformas,
    proformaItems,
  };
}

function hasAnyData(counts: Record<string, number>) {
  return Object.values(counts).some((count) => count > 0);
}

async function main() {
  const targetUrl = requireTargetUrl();
  const backupPath = requireBackupPath();
  const backup = JSON.parse(
    await readFile(backupPath, "utf8")
  ) as BackupPayload;

  const prisma = new PrismaClient({
    datasourceUrl: targetUrl,
    log: ["error", "warn"],
  });

  try {
    const beforeCounts = await getCounts(prisma);
    if (hasAnyData(beforeCounts)) {
      throw new Error(
        `Target database is not empty: ${JSON.stringify(beforeCounts)}`
      );
    }

    await prisma.$transaction(async (tx) => {
      if (backup.data.users.length > 0) {
        await tx.user.createMany({
          data: backup.data.users.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }

      if (backup.data.clients.length > 0) {
        await tx.client.createMany({
          data: backup.data.clients.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }

      if (backup.data.companySettings.length > 0) {
        await tx.companySettings.createMany({
          data: backup.data.companySettings.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }

      if (backup.data.menuItems.length > 0) {
        await tx.menuItem.createMany({
          data: backup.data.menuItems.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }

      if (backup.data.proformas.length > 0) {
        await tx.proforma.createMany({
          data: backup.data.proformas.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }

      if (backup.data.proformaItems.length > 0) {
        await tx.proformaItem.createMany({
          data: backup.data.proformaItems.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          })),
        });
      }
    });

    const afterCounts = await getCounts(prisma);
    console.log("Restore completed.");
    console.log(JSON.stringify(afterCounts, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
