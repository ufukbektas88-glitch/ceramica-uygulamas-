// Transactional SQL runner: no external binary, checksums protect applied migrations.
const { Client } = require("pg");
const fs = require("node:fs");
const { createHash } = require("node:crypto");
(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(724653221)");
    await db.query(
      'CREATE TABLE IF NOT EXISTS "_CeramicaMigration" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    for (const name of fs
      .readdirSync("prisma/migrations")
      .filter((n) => fs.statSync("prisma/migrations/" + n).isDirectory())
      .sort()) {
      const sql = fs.readFileSync(
        `prisma/migrations/${name}/migration.sql`,
        "utf8",
      );
      const checksum = createHash("sha256").update(sql).digest("hex");
      const result = await db.query(
        'SELECT checksum FROM "_CeramicaMigration" WHERE name=$1',
        [name],
      );
      if (result.rows.length) {
        if (result.rows[0].checksum !== checksum)
          throw Error("Applied migration modified: " + name);
        continue;
      }
      await db.query(sql);
      await db.query(
        'INSERT INTO "_CeramicaMigration" (name,checksum) VALUES ($1,$2)',
        [name, checksum],
      );
      console.log("Applied", name);
    }
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    await db.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
