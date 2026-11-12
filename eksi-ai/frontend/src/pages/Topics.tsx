import { Fragment, useState } from "react";
import { api, STATUS_TR } from "../api";
import { Err, Score, Status, useLoad } from "../ui";

const STATUSES = ["", "scored", "processing", "drafted", "skipped", "duplicate", "discovered"];
const CRIT: [string, string][] = [
  ["guncellik", "Güncellik"], ["tartisma", "Tartışma potansiyeli"], ["arastirilabilirlik", "Araştırılabilirlik"],
  ["ozgunluk", "Özgün perspektif imkânı"], ["cesitlilik", "Mevcut içerik çeşitliliği"], ["bilgi_degeri", "Bilgi ve analiz değeri"],
];

export default function Topics({ settings, openDraft }: { settings: any; openDraft: (id: number) => void }) {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const params = new URLSearchParams(Object.entries({ status, category, q }).filter(([, v]) => v));
  const { data, error, reload } = useLoad<any[]>(() => api(`/topics?${params}`), [status, category, q], 15000);

  const add = async () => {
    const titles = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!titles.length) return;
    try {
      const r = await api("/topics", { body: { titles } });
      setMsg(`${r.created} yeni başlık eklendi; bir sonraki çalışmada puanlanacak.`);
      setBulk(""); reload();
    } catch (e: any) { setMsg(e.message); }
  };
  const act = (p: Promise<unknown>, ok: string) => p.then(() => { setMsg(ok); reload(); }).catch((e) => setMsg(e.message));

  return (
    <>
      <h2>Başlık Havuzu</h2>
      <p className="sub">Haber akışları ve trendlerden bulunan adaylar ile elle eklediğiniz başlıklar</p>
      <Err e={error} />
      {msg && <div className="notice">{msg}</div>}
      <details className="card" style={{ marginBottom: 16 }}>
        <summary>Başlık ekle (Ekşi Sözlük gündeminden elle aktarın, her satıra bir başlık)</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <textarea rows={5} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"örnek başlık bir\nörnek başlık iki"} />
          <div><button className="btn primary" onClick={add}>Havuza ekle</button></div>
        </div>
      </details>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Durum">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? STATUS_TR[s] : "tüm durumlar"}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategori">
          <option value="">tüm kategoriler</option>
          {(settings?.categories ?? []).map((c: string) => <option key={c}>{c}</option>)}
        </select>
        <input type="text" placeholder="başlık ara" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted">{data?.length ?? 0} başlık</span>
      </div>
      <div className="card tablewrap">
        <table>
          <thead><tr><th>Başlık</th><th>Kategori</th><th className="num">Öncelik</th><th>Analiz / üretim durumu</th><th>Kaynak</th></tr></thead>
          <tbody>
            {data?.map((t) => (
              <Fragment key={t.id}>
                <tr className="click" onClick={() => setOpen(open === t.id ? null : t.id)}>
                  <td>{t.title}{t.existing_entries && <span className="pill info" style={{ marginLeft: 6 }}>entry aktarıldı</span>}</td>
                  <td>{t.category}</td>
                  <td className="num"><Score v={t.priority_score} /></td>
                  <td><Status s={t.status} /> <span className="muted small">{t.skip_reason}</span></td>
                  <td className="muted">{t.source}</td>
                </tr>
                {open === t.id && (
                  <tr><td colSpan={5}><TopicDetail t={t} act={act} openDraft={openDraft} /></td></tr>
                )}
              </Fragment>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="muted">Bu filtreyle başlık yok.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TopicDetail({ t, act, openDraft }: { t: any; act: (p: Promise<unknown>, ok: string) => void; openDraft: (id: number) => void }) {
  const [entries, setEntries] = useState<string>(t.existing_entries ?? "");
  return (
    <div className="editor">
      <div className="stack">
        {t.source_title && t.source_title !== t.title && <div className="muted">Kaynak başlık: {t.source_title}</div>}
        {t.scores && (
          <div>
            {CRIT.map(([k, l]) => (
              <div className="hbar" key={k}><span className="small">{l}</span>
                <div className="bar"><i style={{ width: `${t.scores[k]}%` }} /></div><span className="num small">{t.scores[k]}</span></div>
            ))}
            <div className="muted small">{t.score_rationale}</div>
          </div>
        )}
        <div className="row">
          <a className="btn" href={t.eksi_url} target="_blank" rel="noreferrer">Başlığı Ekşi'de aç</a>
          <button className="btn primary" onClick={() => act(api(`/topics/${t.id}/generate`, { method: "POST" }), "Üretim başlatıldı; birkaç dakika sürebilir.")}>Bu başlığa entry üret</button>
          {t.status !== "skipped"
            ? <button className="btn danger" onClick={() => act(api(`/topics/${t.id}`, { method: "PATCH", body: { status: "skipped" } }), "Başlık havuzdan çıkarıldı.")}>Havuzdan çıkar</button>
            : <button className="btn" onClick={() => act(api(`/topics/${t.id}`, { method: "PATCH", body: { status: "scored" } }), "Başlık havuza geri alındı.")}>Havuza geri al</button>}
          {t.draft_ids.map((id: number) => <button key={id} className="btn" onClick={() => openDraft(id)}>Taslak #{id}</button>)}
        </div>
      </div>
      <div className="stack">
        <label className="small muted" htmlFor={`ee-${t.id}`}>
          Başlıktaki mevcut entry'ler (isteğe bağlı). Sistem Ekşi Sözlük'ü otomatik okumaz; okuduğunuz entry'leri
          buraya yapıştırırsanız görüş analizi ve tekrar denetimi bunlara göre yapılır.
        </label>
        <textarea id={`ee-${t.id}`} rows={7} value={entries} onChange={(e) => setEntries(e.target.value)} />
        <div><button className="btn" onClick={() => act(api(`/topics/${t.id}`, { method: "PATCH", body: { existing_entries: entries } }), "Mevcut entry'ler kaydedildi.")}>Kaydet</button></div>
      </div>
    </div>
  );
}
