import { useState } from "react";
import { api, fmtDate } from "../api";
import { Err, Score, Status, useLoad } from "../ui";

const TABS: [string, string][] = [
  ["pending", "Onay bekleyenler"], ["approved", "Onaylananlar"], ["rejected", "Reddedilenler"],
  ["published", "Yayınlanmış içerikler"], ["failed_quality", "Kalite eşiğini geçemeyenler"],
];

export default function Queue({ openDraft }: { openDraft: (id: number) => void }) {
  const [tab, setTab] = useState("pending");
  const { data, error, reload } = useLoad<any[]>(() => api(`/drafts?status=${tab}&limit=300`), [tab], 15000);
  const [msg, setMsg] = useState<string | null>(null);
  const act = (e: React.MouseEvent, p: Promise<unknown>) => {
    e.stopPropagation();
    p.then(() => { setMsg(null); reload(); }).catch((x) => setMsg(x.message));
  };

  return (
    <>
      <h2>Yayın Kuyruğu</h2>
      <p className="sub">Hiçbir entry siz onaylamadan ve kendiniz yayımlamadan Ekşi Sözlük'e gitmez</p>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <Err e={error ?? msg} />
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Başlık</th><th>Kategori</th><th className="num">Kelime</th><th className="num">Kalite</th><th>Durum</th>
            <th>{tab === "published" ? "Yayın tarihi" : "Üretim"}</th><th>{tab === "published" ? "Yayın bağlantısı" : ""}</th></tr></thead>
          <tbody>
            {data?.map((d) => (
              <tr key={d.id} className="click" onClick={() => openDraft(d.id)}>
                <td>{d.title}{d.user_edited && <span className="pill" style={{ marginLeft: 6 }}>düzenlendi</span>}</td>
                <td>{d.category}</td><td className="num">{d.word_count}</td><td className="num"><Score v={d.quality_score} /></td>
                <td><Status s={d.status} /></td>
                <td className="muted">{fmtDate(tab === "published" ? d.published_at : d.created_at)}</td>
                <td>
                  {tab === "pending" && (
                    <span className="row">
                      <button className="btn primary" onClick={(e) => act(e, api(`/drafts/${d.id}/approve`, { method: "POST" }))}>Onayla</button>
                      <button className="btn danger" onClick={(e) => act(e, api(`/drafts/${d.id}/reject`, { body: {} }))}>Reddet</button>
                    </span>
                  )}
                  {tab === "published" && <a href={d.published_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{d.published_url}</a>}
                  {tab === "rejected" && <span className="muted small">{d.reject_reason}</span>}
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={7} className="muted">Bu listede içerik yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
