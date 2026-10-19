import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import Decimal from "decimal.js";
export type ImportedProduct = {
  sku: string;
  name: string;
  boxArea: string;
  price: string;
  vatRate: string;
  size: string | null;
  color: string | null;
  surface: string | null;
  collection: string | null;
};
const brands = ["Graniser", "Duratiles"];
export async function previewImport(
  brand: string,
  format: string,
  content: string,
): Promise<ImportedProduct[]> {
  if (!brands.includes(brand)) throw Error("Desteklenmeyen üretici");
  let rows: Record<string, unknown>[];
  if (format === "csv")
    rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      max_record_size: 10000,
    });
  else if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(content, "base64") as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw Error("Çalışma sayfası bulunamadı");
    if (sheet.rowCount > 1001 || sheet.columnCount > 30)
      throw Error("En çok 1000 ürün ve 30 sütun");
    const headers = sheet.getRow(1).values as unknown[];
    rows = [];
    sheet.eachRow((row, n) => {
      if (n === 1) return;
      const record: Record<string, unknown> = {};
      row.eachCell((cell, i) => {
        if (typeof cell.value === "object" && cell.value !== null)
          throw Error("Formül ve zengin hücre türleri kabul edilmez");
        record[String(headers[i] || "")] = cell.value;
      });
      rows.push(record);
    });
  } else throw Error("CSV veya XLSX seçin");
  if (rows.length < 1 || rows.length > 1000)
    throw Error("1–1000 ürün içe aktarılabilir");
  const skus = new Set<string>();
  return rows.map((r, index) => {
    const text = (key: string, required = false) => {
      const s = String(r[key] ?? "").trim();
      if (s.length > 200 || (required && !s))
        throw Error(`Satır ${index + 2}: ${key} geçersiz`);
      return s || null;
    };
    const sku = text("sku", true)!;
    if (skus.has(sku)) throw Error(`Mükerrer SKU: ${sku}`);
    skus.add(sku);
    const decimal = (key: string, min: number, max: number) => {
      let d: Decimal;
      try {
        d = new Decimal(String(r[key] ?? ""));
      } catch {
        throw Error(`Satır ${index + 2}: ${key} eksik veya geçersiz`);
      }
      if (!d.isFinite() || d.lt(min) || d.gt(max))
        throw Error(`Satır ${index + 2}: ${key} sınır dışında`);
      if (d.decimalPlaces() > (key === "boxArea" ? 4 : 2))
        throw Error(`${key}: çok fazla ondalık basamak`);
      return d.toString();
    };
    return {
      sku,
      name: text("name", true)!,
      boxArea: decimal("boxArea", 0.0001, 999999),
      price: decimal("price", 0, 999999999),
      vatRate: decimal("vatRate", 0, 100),
      size: text("size"),
      color: text("color"),
      surface: text("surface"),
      collection: text("collection"),
    };
  });
}
export class GraniserAdapter {
  readonly brand = "Graniser";
  preview(format: string, content: string) {
    return previewImport(this.brand, format, content);
  }
}
export class DuratilesAdapter {
  readonly brand = "Duratiles";
  preview(format: string, content: string) {
    return previewImport(this.brand, format, content);
  }
}
