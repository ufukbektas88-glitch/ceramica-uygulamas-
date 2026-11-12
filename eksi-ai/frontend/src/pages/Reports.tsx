import { useState } from "react";
import { api, STATUS_TR } from "../api";
import { Err, Score, useLoad } from "../ui";

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

export default function Reports({ openDraft }: { openDraft: (id: number) => void }) {
  const [day, setDay] = useState(today());
  const daily = useLoad<any>(() => api(`/reports/daily?day=${day}`), [day]);
  const sum = useLoad<any>(() => api("/reports/summary"), []);
  const s = sum.data;
  const maxCat = Math.max(1, ...(s?.categories ?? []).map((c: any) => c.count));

  return (
    <>
      <h2>Raporlama</h2>
      <p className="sub">Günlük üretim, haftalık performans, kategori dağılımı ve benzerlik analizi</p>
      <Err e={daily.error ?? sum.error} />
      <div className="editor" style={{ marginBottom: 16 }}>
        <div className="card stack">
          <div className="row spread"><h3 style={{ margin: 0 }}>Günlük üretim raporu</h3>
            <input type="date" value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Rapor günü" /></div>
          {daily.data && <pre className="report">{daily.data.text}</pre>}
          {daily.data?.error && <div className="notice bad">{daily.data.error}</div>}
          {daily.data && <div className="muted small">Model kullanımı: {daily.data.input_tokens.toLocaleString("tr-TR")} girdi / {daily.data.output_tokens.toLocaleString("tr-TR")} çıktı token</div>}
        </div>
        <div className="card">
          <h3>Kategori bazında içerik dağılımı</h3>
          {s?.categories.length === 0 && <p className="muted">Henüz veri yok.</p>}
          {s?.categories.map((c: any) => (
            <div className="hbar" key={c.category}><span>{c.category}</span>
              <div className="bar"><i style={{ width: `${(100 * c.count) / maxCat}%` }} /></div>
              <span className="num small">{c.count} · {c.avg_quality ?? "–"}</span></div>
          ))}
          <p className="muted small" style={{ marginBottom: 0 }}>Sağdaki değerler: entry sayısı · ortalama kalite puanı</p>
        </div>
      </div>
      <div className="card tablewrap" style={{ marginBottom: 16 }}>
        <h3>Haftalık performans</h3>
        <table>
          <thead><tr><th>Gün</th><th>Çalışma</th><th className="num">Taranan</th><th className="num">Analiz</th><th className="num">Üretilen</th>
            <th className="num">Kaliteden geçen</th><th className="num">Hedef</th><th className="num">Yayınlanan</th><th className="num">Ort. kalite</th></tr></thead>
          <tbody>
            {s?.weekly.map((w: any) => (
              <tr key={w.date} className="click" onClick={() => setDay(w.date)}>
                <td>{new Date(w.date).toLocaleDateString("tr-TR", { weekday: "short", day: "2-digit", month: "2-digit" })}</td>
                <td className="muted">{STATUS_TR[w.run_status] ?? w.run_status}</td>
                <td className="num">{w.scanned}</td><td className="num">{w.analyzed}</td><td className="num">{w.produced}</td>
                <td className="num">{w.passed_qc}</td><td className="num">%{w.target ? Math.round((100 * w.passed_qc) / w.target) : 0}</td>
                <td className="num">{w.published}</td><td className="num">{w.avg_quality ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s && (
        <div className="card tablewrap">
          <h3>Tekrar ve benzerlik analizi</h3>
          <p>Tekrar olduğu için engellenen başlık: <strong>{s.similarity.duplicate_topics_blocked}</strong> · kuyruğa giren taslaklarda ortalama en yakın benzerlik: <strong>{s.similarity.avg_similarity ?? "–"}</strong></p>
          <table>
            <thead><tr><th>Birbirine en çok benzeyen taslaklar</th><th className="num">Benzerlik</th><th>Benzediği</th><th className="num">Kalite</th></tr></thead>
            <tbody>
              {s.similarity.most_similar.filter((m: any) => m.similar_to).map((m: any) => (
                <tr key={m.id} className="click" onClick={() => openDraft(m.id)}>
                  <td>{m.title}</td><td className="num">{m.similarity}</td><td>taslak #{m.similar_to}</td><td className="num"><Score v={m.quality_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
