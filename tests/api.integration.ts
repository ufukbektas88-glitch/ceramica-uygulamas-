import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const base = "http://127.0.0.1:4000/api/v1";
async function call(path: string, method = "GET", body?: any, token?: string) {
  const res = await fetch(base + "/" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: (await res.json()) as any };
}
test("Gerçek PostgreSQL üzerinde yetki, hesaplama, stok ve sipariş akışları", async (t) => {
  for (let n = 0; n < 40; n++) {
    try {
      if ((await call("health")).status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  const suffix = randomUUID(),
    password = "Test-only-" + randomUUID();
  const userIds: string[] = [];
  let productId = "",
    brandId = "",
    warehouseId = "";
  try {
    const admin = await call("auth/login", "POST", {
      email: "admin@ceramica.local",
      password: process.env.DEMO_ADMIN_PASSWORD,
    });
    assert.equal(admin.status, 201);
    const adminToken = admin.data.token;
    const tokens: string[] = [];
    for (let i = 0; i < 2; i++) {
      const user = await db.user.create({
        data: {
          email: `test-${suffix}-${i}@example.local`,
          name: "Integration Test",
          passwordHash: await hash(password, 10),
          role: "CUSTOMER",
        },
      });
      userIds.push(user.id);
      const login = await call("auth/login", "POST", {
        email: user.email,
        password,
      });
      assert.equal(login.status, 201);
      tokens.push(login.data.token);
    }
    const brand = await db.brand.create({ data: { name: "TEST-" + suffix } });
    brandId = brand.id;
    const warehouse = await db.warehouse.create({
      data: { name: "TEST-" + suffix },
    });
    warehouseId = warehouse.id;
    const product = await db.product.create({
      data: {
        sku: "TEST-" + suffix,
        name: "Integration Test Tile",
        brandId,
        boxArea: "1.44",
        price: "500",
        vatRate: "20",
        demo: true,
      },
    });
    productId = product.id;
    const lot = await db.inventoryLot.create({
      data: { productId, warehouseId, batch: "TEST", physical: 10 },
    });
    await t.test(
      "yetkisiz erişim ve finans verisinin müşteriye kapatılması",
      async () => {
        assert.equal((await call("orders")).status, 401);
        assert.equal(
          (await call("inventory", "GET", undefined, tokens[0])).status,
          403,
        );
        assert.equal(
          (await call("dashboard", "GET", undefined, tokens[0])).status,
          403,
        );
      },
    );
    await t.test("hatalı parola ve beklenmeyen alan reddedilir", async () => {
      assert.equal(
        (
          await call("auth/login", "POST", {
            email: "admin@ceramica.local",
            password: "incorrect-password",
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await call("calculator", "POST", {
            productId,
            area: 47,
            waste: 10,
            total: 0,
          })
        ).status,
        400,
      );
    });
    await t.test("hesaplama 36 koli ve 31104 TL döndürür", async () => {
      const r = await call("calculator", "POST", {
        productId,
        area: 47,
        waste: 10,
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.boxes, 36);
      assert.equal(r.data.total, "31104.00");
    });
    const payload = {
      items: [{ productId, boxes: 6 }],
      deliveryAddress: "Entegrasyon test teslimat adresi",
      idempotencyKey: randomUUID(),
    };
    let orderId = "";
    await t.test(
      "aynı sipariş isteği tekrarlandığında tek kayıt ve tek rezervasyon",
      async () => {
        const results = await Promise.all([
          call("orders", "POST", payload, tokens[0]),
          call("orders", "POST", payload, tokens[0]),
        ]);
        assert.ok(results.every((r) => r.status === 201));
        assert.equal(results[0].data.id, results[1].data.id);
        assert.equal(results[0].data.total, "5184");
        orderId = results[0].data.id;
        assert.equal(
          (await db.inventoryLot.findUniqueOrThrow({ where: { id: lot.id } }))
            .reserved,
          6,
        );
      },
    );
    await t.test(
      "sunucu fiyatı değiştirme girişimini ve stok aşımını reddeder",
      async () => {
        assert.equal(
          (
            await call(
              "orders",
              "POST",
              { ...payload, idempotencyKey: randomUUID(), total: "0" },
              tokens[0],
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await call(
              "orders",
              "POST",
              { ...payload, idempotencyKey: randomUUID() },
              tokens[1],
            )
          ).status,
          409,
        );
      },
    );
    await t.test(
      "müşteri diğer müşterinin siparişini göremez veya durumunu değiştiremez",
      async () => {
        assert.equal(
          (await call("orders", "GET", undefined, tokens[1])).data.length,
          0,
        );
        assert.equal(
          (
            await call(
              "orders/" + orderId + "/status",
              "PATCH",
              { status: "CONFIRMED" },
              tokens[0],
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "geçersiz durum geçişi reddedilir; iptal rezervasyonu serbest bırakır",
      async () => {
        assert.equal(
          (
            await call(
              "orders/" + orderId + "/status",
              "PATCH",
              { status: "DELIVERED" },
              adminToken,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await call(
              "orders/" + orderId + "/status",
              "PATCH",
              { status: "CANCELLED" },
              adminToken,
            )
          ).status,
          200,
        );
        assert.equal(
          (await db.inventoryLot.findUniqueOrThrow({ where: { id: lot.id } }))
            .reserved,
          0,
        );
      },
    );
    await t.test(
      "eşzamanlı farklı siparişler eldeki stoku aşamaz",
      async () => {
        const results = await Promise.all(
          tokens.map((token) =>
            call(
              "orders",
              "POST",
              { ...payload, idempotencyKey: randomUUID() },
              token,
            ),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
        const winning = results.find((r) => r.status === 201)!.data;
        for (const status of ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"])
          assert.equal(
            (
              await call(
                "orders/" + winning.id + "/status",
                "PATCH",
                { status },
                adminToken,
              )
            ).status,
            200,
          );
        const current = await db.inventoryLot.findUniqueOrThrow({
          where: { id: lot.id },
        });
        assert.equal(current.physical, 4);
        assert.equal(current.reserved, 0);
        assert.equal(
          await db.orderStatusHistory.count({ where: { orderId: winning.id } }),
          5,
        );
        assert.ok(
          (await db.auditLog.count({ where: { entityId: winning.id } })) >= 5,
        );
      },
    );
    await t.test(
      "dosya aktarımı önizlemede kataloğu değiştirmez, onayda kalıcı kaydeder",
      async () => {
        const sku = "IMPORT-" + suffix;
        const input = {
          brand: "Graniser",
          format: "csv",
          content:
            "sku,name,boxArea,price,vatRate\n" +
            sku +
            ",Test Import,1.44,500,20",
          source: "Integration Test " + suffix,
        };
        assert.equal(
          (await call("imports/preview", "POST", input, tokens[1])).status,
          403,
        );
        const preview = await call(
          "imports/preview",
          "POST",
          input,
          adminToken,
        );
        assert.equal(preview.status, 201);
        assert.equal(await db.product.findUnique({ where: { sku } }), null);
        const applied = await call(
          "imports/" + preview.data.id + "/approve",
          "POST",
          {},
          adminToken,
        );
        assert.equal(applied.status, 201);
        assert.equal(applied.data.status, "APPROVED");
        assert.equal(
          (await db.product.findUniqueOrThrow({ where: { sku } })).demo,
          false,
        );
        assert.equal(
          (
            await call(
              "imports/" + preview.data.id + "/approve",
              "POST",
              {},
              adminToken,
            )
          ).data.id,
          preview.data.id,
        );
      },
    );
    await t.test("oturum kapatılınca aynı token kullanılamaz", async () => {
      assert.equal(
        (await call("auth/logout", "POST", {}, tokens[0])).status,
        201,
      );
      assert.equal(
        (await call("orders", "GET", undefined, tokens[0])).status,
        401,
      );
    });
  } finally {
    await db.importJob.deleteMany({
      where: { source: "Integration Test " + suffix },
    });
    await db.auditLog.deleteMany({ where: { entityId: "IMPORT-" + suffix } });
    await db.product.deleteMany({ where: { sku: "IMPORT-" + suffix } });
    const orders = await db.order.findMany({
      where: { userId: { in: userIds } },
    });
    const ids = orders.map((o) => o.id);
    await db.auditLog.deleteMany({
      where: { OR: [{ actorId: { in: userIds } }, { entityId: { in: ids } }] },
    });
    await db.orderStatusHistory.deleteMany({ where: { orderId: { in: ids } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await db.order.deleteMany({ where: { id: { in: ids } } });
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    if (productId) {
      await db.inventoryLot.deleteMany({ where: { productId } });
      await db.product.delete({ where: { id: productId } });
    }
    if (warehouseId) await db.warehouse.delete({ where: { id: warehouseId } });
    if (brandId) await db.brand.delete({ where: { id: brandId } });
    await db.$disconnect();
  }
});
