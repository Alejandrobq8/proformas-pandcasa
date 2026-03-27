import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function requireSourceUrl() {
  const url =
    process.env.SOURCE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.DIRECT_URL;

  if (!url) {
    throw new Error(
      "No source database URL found. Set SOURCE_DATABASE_URL, DIRECT_URL, or DATABASE_URL."
    );
  }

  return url;
}

function timestampForFilename(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const exportedAt = new Date();
  const sourceUrl = requireSourceUrl();
  const prisma = new PrismaClient({
    datasourceUrl: sourceUrl,
    log: ["error", "warn"],
  });

  try {
    const [users, clients, companySettings, menuItems, proformas, proformaItems] =
      await Promise.all([
        prisma.user.findMany({ orderBy: { id: "asc" } }),
        prisma.client.findMany({ orderBy: { id: "asc" } }),
        prisma.companySettings.findMany({ orderBy: { id: "asc" } }),
        prisma.menuItem.findMany({ orderBy: { id: "asc" } }),
        prisma.proforma.findMany({ orderBy: { id: "asc" } }),
        prisma.proformaItem.findMany({
          orderBy: [{ proformaId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
        }),
      ]);

    const backup = {
      exportedAt: exportedAt.toISOString(),
      counts: {
        users: users.length,
        clients: clients.length,
        companySettings: companySettings.length,
        menuItems: menuItems.length,
        proformas: proformas.length,
        proformaItems: proformaItems.length,
      },
      data: {
        users,
        clients,
        companySettings,
        menuItems,
        proformas,
        proformaItems,
      },
    };

    const requestedOutput = process.argv[2];
    const outputPath =
      requestedOutput && requestedOutput.trim().length > 0
        ? path.resolve(process.cwd(), requestedOutput)
        : path.resolve(
            process.cwd(),
            "db-backups",
            `backup-${timestampForFilename(exportedAt)}.json`
          );

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(backup, null, 2), "utf8");

    console.log(`Backup written to ${outputPath}`);
    console.log(JSON.stringify(backup.counts, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
