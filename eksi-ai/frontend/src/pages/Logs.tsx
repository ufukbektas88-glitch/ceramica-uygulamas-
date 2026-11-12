import { useState } from "react";
import { api, fmtDate } from "../api";
import { Err, useLoad } from "../ui";

export default function Logs() {
  const [level, setLevel] = useState("");
  const { data, error } = useLoad<any[]>(() => api(`/logs?limit=300${level ? `&level=${level}` : ""}`), [level], 10000);
  return (
    <>
      <h2>İşlem Kayıtları</h2>
      <p className="sub">Tarama, puanlama, araştırma ve üretim adımlarının ayrıntılı kaydı</p>
      <Err e={error} />
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Seviye">
          <option value="">tüm seviyeler</option><option>ERROR</option><option>WARNING</option><option>INFO</option>
        </select>
      </div>
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Zaman</th><th>Seviye</th><th>Aşama</th><th>Mesaj</th></tr></thead>
          <tbody>
            {data?.map((l) => (
              <tr key={l.id}>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(l.ts)}</td>
                <td><span className={`pill ${l.level === "ERROR" ? "bad" : l.level === "WARNING" ? "warn" : ""}`}>{l.level}</span></td>
                <td className="muted">{l.stage}</td><td>{l.message}</td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={4} className="muted">Kayıt yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
