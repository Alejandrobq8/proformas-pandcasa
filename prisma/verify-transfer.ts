import "dotenv/config";
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

function requireTargetUrl() {
  const url = process.env.TARGET_DATABASE_URL;
  if (!url) {
    throw new Error("TARGET_DATABASE_URL is required.");
  }
  return url;
}

async function fetchIds(prisma: PrismaClient) {
  const [users, clients, companySettings, menuItems, proformas, proformaItems] =
    await Promise.all([
      prisma.user.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
      prisma.client.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
      prisma.companySettings.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.menuItem.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
      prisma.proforma.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
      prisma.proformaItem.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
      }),
    ]);

  return {
    users: users.map((row) => row.id),
    clients: clients.map((row) => row.id),
    companySettings: companySettings.map((row) => row.id),
    menuItems: menuItems.map((row) => row.id),
    proformas: proformas.map((row) => row.id),
    proformaItems: proformaItems.map((row) => row.id),
  };
}

function diffIds(sourceIds: string[], targetIds: string[]) {
  const sourceSet = new Set(sourceIds);
  const targetSet = new Set(targetIds);

  return {
    missingInTarget: sourceIds.filter((id) => !targetSet.has(id)),
    extraInTarget: targetIds.filter((id) => !sourceSet.has(id)),
  };
}

async function main() {
  const source = new PrismaClient({
    datasourceUrl: requireSourceUrl(),
    log: ["error", "warn"],
  });
  const target = new PrismaClient({
    datasourceUrl: requireTargetUrl(),
    log: ["error", "warn"],
  });

  try {
    const [sourceIds, targetIds] = await Promise.all([
      fetchIds(source),
      fetchIds(target),
    ]);

    const tables = Object.keys(sourceIds) as Array<keyof typeof sourceIds>;
    const report = Object.fromEntries(
      tables.map((table) => [
        table,
        {
          sourceCount: sourceIds[table].length,
          targetCount: targetIds[table].length,
          ...diffIds(sourceIds[table], targetIds[table]),
        },
      ])
    );

    console.log(JSON.stringify(report, null, 2));

    const mismatches = tables.filter((table) => {
      const tableReport = report[table];
      return (
        tableReport.sourceCount !== tableReport.targetCount ||
        tableReport.missingInTarget.length > 0 ||
        tableReport.extraInTarget.length > 0
      );
    });

    if (mismatches.length > 0) {
      process.exit(1);
    }
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
