"use client";
import { useState } from "react";
export default function ImportPanel() {
  const [brand, setBrand] = useState("Graniser"),
    [source, setSource] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [job, setJob] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function request(path: string, body: any) {
    const response = await fetch("/api/v1/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.message);
    return data;
  }
  async function preview() {
    if (!file) return;
    setBusy(true);
    setError("");
    setJob(null);
    try {
      if (file.size > 500000) throw Error("Dosya en fazla 500 KB olabilir");
      const format = file.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
      let content = await file.text();
      if (format === "xlsx") {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let text = "";
        for (const byte of bytes) text += String.fromCharCode(byte);
        content = btoa(text);
      }
      setJob(
        await request("imports/preview", { brand, source, format, content }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    setBusy(true);
    setError("");
    try {
      setJob(await request("imports/" + job.id + "/approve", {}));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Yetkili ürün dosyasını içe aktarın</h2>
      <p className="muted">
        API anahtarı gerektirmeyen dosya aktarımı. Önizleme ürün kataloğunu
        değiştirmez; açık onayınızla uygulanır. Görseller içe aktarılmaz, stok
        tahmin edilmez.
      </p>
      <p className="muted">
        Sütunlar: sku, name, boxArea, price, vatRate. İsteğe bağlı: size, color,
        surface, collection. Ondalık ayırıcı nokta, CSV ayırıcı virgül. En çok
        1000 ürün / 500 KB.
      </p>
      <div className="calc-fields">
        <label>
          Üretici
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setJob(null);
            }}
          >
            <option>Graniser</option>
            <option>Duratiles</option>
          </select>
        </label>
        <label>
          Kaynak / yetkili dosya referansı
          <input
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setJob(null);
            }}
            placeholder="Bayi fiyat listesi / tarih"
          />
        </label>
      </div>
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
          setJob(null);
        }}
      />
      <p>
        <button
          className="primary"
          disabled={!file || source.length < 5 || busy}
          onClick={preview}
        >
          Doğrula ve önizle
        </button>
      </p>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {job && (
        <>
          <p className="alert">
            {job.status === "APPROVED"
              ? "Aktarım onaylandı ve kataloğa kaydedildi."
              : "Doğrulama başarılı. Katalog henüz değişmedi."}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Ürün</th>
                  <th>m²/koli</th>
                  <th>Fiyat · KDV hariç</th>
                  <th>KDV %</th>
                </tr>
              </thead>
              <tbody>
                {job.data.map((r: any) => (
                  <tr key={r.sku}>
                    <td>{r.sku}</td>
                    <td>{r.name}</td>
                    <td>{r.boxArea}</td>
                    <td>{r.price}</td>
                    <td>{r.vatRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {job.status === "PENDING" && (
            <p>
              <button className="primary" disabled={busy} onClick={approve}>
                Kaynağı kontrol ettim, kataloğa uygula
              </button>
            </p>
          )}
        </>
      )}
    </section>
  );
}
