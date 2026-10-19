const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { hash } = require("bcryptjs");
(async () => {
  const password = process.env.NEW_ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw Error("NEW_ADMIN_PASSWORD en az 12 karakter olmalı");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    await db.user.update({
      where: { email: "admin@ceramica.local" },
      data: { passwordHash: await hash(password, 12) },
    });
    console.log("Yönetici parolası güncellendi.");
  } finally {
    await db.$disconnect();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
