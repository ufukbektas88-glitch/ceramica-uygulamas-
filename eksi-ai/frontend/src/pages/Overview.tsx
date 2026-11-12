import { useState } from "react";
import { api, STATUS_TR } from "../api";
import { Err, Score, useLoad } from "../ui";

export default function Overview({ openDraft }: { openDraft: (id: number) => void }) {
  const ov = useLoad(() => api("/overview"), [], 10000);
  const rep = useLoad(() => api("/reports/daily"), [], 30000);
  const [msg, setMsg] = useState<string | null>(null);
  const o = ov.data;

  const trigger = () => api("/runs/trigger", { method: "POST" })
    .then(() => { setMsg("Günlük çalışma başlatıldı."); ov.reload(); })
    .catch((e) => setMsg(e.message));

  return (
    <>
      <div className="row spread">
        <div><h2>Genel Bakış</h2><p className="sub">Bugünkü üretim ve kuyruğun durumu</p></div>
        <button className="btn primary" onClick={trigger} disabled={o?.run_status === "running"}>
          {o?.run_status === "running" ? "Çalışıyor…" : "Günlük çalışmayı şimdi başlat"}
        </button>
      </div>
      <Err e={ov.error} />
      {msg && <div className="notice">{msg}</div>}
      {o?.run_error && <div className="notice bad">Son çalışma hatası: {o.run_error}</div>}
      {o && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row spread" style={{ marginBottom: 8 }}>
              <strong>Günlük hedef: {o.today_produced} / {o.target}</strong>
              <span className="muted">%{o.target_pct} · çalışma: {STATUS_TR[o.run_status] ?? o.run_status}</span>
            </div>
            <div className="bar"><i style={{ width: `${Math.min(100, o.target_pct)}%` }} /></div>
          </div>
          <div className="grid">
            {[
              [o.today_produced, "Bugün üretilen entry"], [o.total_produced, "Toplam üretilen entry"],
              [o.researching, "Araştırması süren başlık"], [o.pending, "Onay bekleyen"],
              [o.approved, "Onaylanan (yayın bekliyor)"], [o.published, "Yayınlanmış içerik"],
              [o.avg_quality ?? "–", "Ortalama kalite puanı"],
            ].map(([n, l]) => (
              <div className="card stat" key={l as string}><div className="n">{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
        </>
      )}
      {rep.data && (
        <div className="editor">
          <div className="card"><h3>Günlük rapor</h3><pre className="report">{rep.data.text}</pre></div>
          <div className="card">
            <h3>Günün en iyi 5 entry'si</h3>
            {rep.data.top5.length === 0 && <p className="muted">Bugün kuyruğa giren entry yok.</p>}
            <table><tbody>
              {rep.data.top5.map((t: any) => (
                <tr key={t.id} className="click" onClick={() => openDraft(t.id)}>
                  <td>{t.title}</td><td className="num">{t.word_count} kelime</td><td className="num"><Score v={t.quality_score} /></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>
      )}
    </>
  );
}
