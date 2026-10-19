import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw Error("DEMO_ADMIN_PASSWORD en az 12 karakter olmalı");
  await db.user.upsert({
    where: { email: "admin@ceramica.local" },
    update: {},
    create: {
      email: "admin@ceramica.local",
      name: "CERAMICA Yönetici",
      role: "ADMIN",
      passwordHash: await hash(password, 12),
    },
  });
  const warehouse = await db.warehouse.upsert({
    where: { name: "DEMO • Ana depo" },
    update: {},
    create: { name: "DEMO • Ana depo" },
  });
  for (const [i, name] of ["Graniser", "Duratiles"].entries()) {
    const brand = await db.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    for (let j = 0; j < 3; j++) {
      const sku = `DEMO-${i + 1}-${j + 1}`;
      const product = await db.product.upsert({
        where: { sku },
        update: {},
        create: {
          sku,
          name:
            ["Traverten Bej", "Mermer Beyaz", "Beton Antrasit"][j] + " • Demo",
          brandId: brand.id,
          collection: "Örnek koleksiyon",
          size: ["60×120", "60×60", "120×120"][j],
          color: ["Bej", "Beyaz", "Antrasit"][j],
          surface: ["Mat", "Parlak", "Mat"][j],
          boxArea: "1.44",
          price: ["500", "650", "800"][j],
          vatRate: "20",
          demo: true,
        },
      });
      await db.inventoryLot.upsert({
        where: {
          productId_warehouseId_batch: {
            productId: product.id,
            warehouseId: warehouse.id,
            batch: "DEMO-001",
          },
        },
        update: {},
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          batch: "DEMO-001",
          tone: "A",
          caliber: "1",
          physical: 200,
        },
      });
    }
  }
  console.log("Demo kayıtları hazır. Gerçek üretici kataloğu değildir.");
}
main().finally(() => db.$disconnect());
