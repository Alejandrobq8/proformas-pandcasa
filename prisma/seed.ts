import { prisma } from "../shared/lib/prisma";
import bcrypt from "bcryptjs";

async function seedSampleData(userId: string) {
  const client = await prisma.client.upsert({
    where: { id: "seed-sample-client" },
    update: {},
    create: {
      id: "seed-sample-client",
      userId,
      nombre: "Hotel Las Brumas S.A.",
      empresa: "Hotel Las Brumas",
      cedulaJuridica: "3-101-456789",
    },
  });

  const items = [
    { description: "Canasta navidena surtida", quantity: 10, unitPrice: 18500 },
    { description: "Pan dulce navideno, caja x6", quantity: 20, unitPrice: 6200 },
    { description: "Torta de frutas con licor", quantity: 3, unitPrice: 32000 },
  ];
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  await prisma.proforma.upsert({
    where: { userId_number: { userId, number: "SEED-0001" } },
    update: {},
    create: {
      userId,
      clientId: client.id,
      number: "SEED-0001",
      year: new Date().getFullYear(),
      sequence: 1,
      clientNombre: client.nombre,
      clientEmpresa: client.empresa,
      clientCedulaJuridica: client.cedulaJuridica,
      notes: "Entrega 23 de diciembre, 9:00am, Escazu",
      subtotal,
      total: subtotal,
      items: {
        create: items.map((item, index) => ({
          sortOrder: index,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });
}

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "admin@pandcasa.local";
  const password = process.env.SEED_USER_PASSWORD ?? "Admin123!";
  const name = process.env.SEED_USER_NAME ?? "Administrador";

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
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

  if (process.env.SEED_SAMPLE_DATA === "1") {
    await seedSampleData(user.id);
  }
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

