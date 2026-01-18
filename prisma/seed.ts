import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "admin@pandcasa.local";
  const password = process.env.SEED_USER_PASSWORD ?? "Admin123!";
  const name = process.env.SEED_USER_NAME ?? "Administrador";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      companySetting: {
        create: {
          name: "P&C Casa",
          contactName: "P&C Casa",
          cedula: "1-0000-0000",
          address: "San Jose, Costa Rica",
          phone: "+506 0000-0000",
          email,
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
