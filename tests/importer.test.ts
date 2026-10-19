import { test } from "node:test";
import assert from "node:assert/strict";
import {
  previewImport,
  GraniserAdapter,
  DuratilesAdapter,
} from "../apps/api/src/importer";
import ExcelJS from "exceljs";
const csv = "sku,name,boxArea,price,vatRate\nT-1,Test,1.44,500,20";
test("üretici adaptörleri CSV verisini doğrular", async () => {
  for (const adapter of [new GraniserAdapter(), new DuratilesAdapter()]) {
    const rows = await adapter.preview("csv", csv);
    assert.equal(rows[0].boxArea, "1.44");
    assert.equal(rows[0].price, "500");
  }
});
test("bilinmeyen fiyat ve mükerrer SKU reddedilir", async () => {
  await assert.rejects(
    previewImport("Graniser", "csv", csv.replace(",500,", ",,")),
  );
  await assert.rejects(
    previewImport("Graniser", "csv", csv + "\nT-1,Test,1.44,500,20"),
  );
});
test("XLSX dosyası gerçek çalışma kitabından okunur", async () => {
  const w = new ExcelJS.Workbook();
  const s = w.addWorksheet("Ürünler");
  s.addRow(["sku", "name", "boxArea", "price", "vatRate"]);
  s.addRow(["XLS-1", "Test", 1.44, 500, 20]);
  const b = await w.xlsx.writeBuffer();
  const rows = await previewImport(
    "Duratiles",
    "xlsx",
    Buffer.from(b).toString("base64"),
  );
  assert.equal(rows[0].sku, "XLS-1");
});
