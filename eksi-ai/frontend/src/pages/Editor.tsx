import { useEffect, useState } from "react";
import { api, fmtDate } from "../api";
import { CopyButton, Err, Score, Status, useLoad } from "../ui";

const CRIT: Record<string, string> = {
  ozgunluk: "Özgünlük", derinlik: "Analitik derinlik", dogruluk: "Kaynak doğruluğu", dil: "Dil ve anlatım",
  ilgi: "Başlıkla ilgi", yogunluk: "Yoğunluk", hukuk: "Hukuki uygunluk",
};
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export default function Editor({ draftId, setDraftId }: { draftId: number | null; setDraftId: (id: number | null) => void }) {
  const list = useLoad<any[]>(() => api("/drafts?limit=60"), []);
  if (draftId == null) {
    return (
      <>
        <h2>Entry Editörü</h2>
        <p className="sub">Düzenlemek için bir taslak seçin</p>
        <Err e={list.error} />
        <div className="card tablewrap">
          <table><tbody>
            {list.data?.map((d) => (
              <tr key={d.id} className="click" onClick={() => setDraftId(d.id)}>
                <td>{d.title}</td><td className="num">{d.word_count} kelime</td>
                <td className="num"><Score v={d.quality_score} /></td><td><Status s={d.status} /></td>
                <td className="muted">{fmtDate(d.created_at)}</td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td className="muted">Henüz taslak üretilmedi.</td></tr>}
          </tbody></table>
        </div>
      </>
    );
  }
  return <DraftEditor key={draftId} id={draftId} back={() => setDraftId(null)} />;
}

function DraftEditor({ id, back }: { id: number; back: () => void }) {
  const [busy, setBusy] = useState(false);
  const { data: d, error, reload } = useLoad<any>(() => api(`/drafts/${id}`), [id], busy ? 4000 : undefined);
  const [text, setText] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [url, setUrl] = useState("");

  // Arka plan işi bittiğinde sunucudaki yeni metni al.
  useEffect(() => { if (d && busy && !d.busy) { setBusy(false); setText(null); setMsg("İşlem tamamlandı."); } }, [d, busy]);
  if (!d) return <Err e={error} />;

  const content = text ?? d.content;
  const dirty = text != null && text !== d.content;
  const locked = d.status === "published";
  const q = d.quality_report;
  const a = d.analysis;
  const run = (p: Promise<unknown>, ok: string | null, bg = false) =>
    p.then(() => { setMsg(ok); if (bg) setBusy(true); return reload(); }).catch((e) => setMsg(e.message));
  const save = () => run(api(`/drafts/${id}`, { method: "PATCH", body: { content } }).then(() => setText(null)), "Kaydedildi. Kalite puanı eski metne aittir; yeniden denetleyebilirsiniz.");

  return (
    <>
      <div className="row spread">
        <div>
          <button className="btn" onClick={back}>← Taslaklar</button>
          <h2 style={{ marginTop: 10 }}>{d.title}</h2>
          <p className="sub"><Status s={d.status} /> · {d.category} · {fmtDate(d.created_at)} · {d.rewrite_count} yeniden yazım</p>
        </div>
        <div className="row">
          <span className="muted">{words(content)} kelime</span><Score v={d.quality_score} />
        </div>
      </div>
      <Err e={error} />
      {msg && <div className="notice">{msg}</div>}
      {busy && <div className="notice">Model çalışıyor; bu birkaç dakika sürebilir…</div>}
      {q?.engeller?.length > 0 && <div className="notice bad">Kuyruğa girmesini engelleyenler: {q.engeller.join(" ")}</div>}

      <div className="editor">
        <div className="stack">
          <div className="card stack">
            <textarea className="entry" value={content} disabled={locked || busy} onChange={(e) => setText(e.target.value)} aria-label="Entry metni" />
            <div className="row">
              <button className="btn primary" onClick={save} disabled={!dirty || locked}>Kaydet</button>
              <CopyButton text={content} label="Entry'yi kopyala" />
              <CopyButton text={d.copy_text_with_sources} label="Kaynaklarla kopyala" />
              <a className="btn" href={d.eksi_url} target="_blank" rel="noreferrer">Başlığı Ekşi'de aç</a>
              <button className="btn" disabled={busy || dirty} onClick={() => run(api(`/drafts/${id}/recheck`, { method: "POST" }), null, true)}>Kaliteyi yeniden denetle</button>
            </div>
          </div>

          <div className="card stack">
            <h3>Karar</h3>
            <div className="row">
              {["pending", "rejected", "failed_quality"].includes(d.status) && <button className="btn primary" disabled={dirty} onClick={() => run(api(`/drafts/${id}/approve`, { method: "POST" }), "Onaylandı.")}>Onayla</button>}
              {!locked && d.status !== "rejected" && <button className="btn danger" onClick={() => run(api(`/drafts/${id}/reject`, { body: {} }), "Reddedildi.")}>Reddet</button>}
            </div>
            {d.status === "approved" && (
              <form className="row" onSubmit={(e) => { e.preventDefault(); run(api(`/drafts/${id}/publish`, { body: { url } }), "Yayınlandı olarak kaydedildi."); }}>
                <input type="url" style={{ flex: 1, minWidth: 220 }} required placeholder="https://eksisozluk.com/entry/…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Yayın bağlantısı" />
                <button className="btn primary">Elle yayımladım, bağlantıyı kaydet</button>
              </form>
            )}
            {locked && <div>Yayın: <a href={d.published_url} target="_blank" rel="noreferrer">{d.published_url}</a> · {fmtDate(d.published_at)}</div>}
            {!locked && (
              <div className="row">
                <input type="text" style={{ flex: 1, minWidth: 220 }} placeholder="Yeniden üretim için ek talimat (isteğe bağlı)" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
                <button className="btn" disabled={busy} onClick={() => run(api(`/drafts/${id}/regenerate`, { body: { instruction: instruction || null } }), null, true)}>Yeniden üret</button>
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h3>Geliştirilen farklı perspektif</h3>
            <p style={{ margin: 0 }}>{d.perspective ?? "–"}</p>
            {a?.bakis_acisi_dayanagi && <p className="muted small" style={{ marginBottom: 0 }}>Dayanak: {a.bakis_acisi_dayanagi}</p>}
          </div>
          {a && (
            <div className="card stack">
              <h3>Analiz edilen mevcut görüşler</h3>
              <ul className="plain">{a.gorusler?.map((g: any, i: number) => <li key={i}><span className="pill">{g.yayginlik}</span> {g.gorus}</li>)}</ul>
              <List title="En çok tekrarlanan fikirler" items={a.tekrar_eden_fikirler} />
              <List title="Ortaklaşılan noktalar" items={a.ortak_noktalar} />
              <List title="Zıt görüşler" items={a.zit_gorusler} />
              <List title="Eksik bırakılan konular" items={a.eksik_konular} />
              <List title="Doğrulanmış bilgiler" items={a.dogrulanmis_bilgiler} />
              <List title="Varsayımlar" items={a.varsayimlar} />
              <List title="Yanlış bilgiler" items={a.yanlis_bilgiler} />
              {!d.existing_entries && <p className="muted small" style={{ margin: 0 }}>Bu başlık için Ekşi entry'si aktarılmadı; görüş haritası açık kaynaklardaki tartışmadan çıkarıldı.</p>}
            </div>
          )}
          {q && (
            <div className="card stack">
              <h3>Kalite raporu</h3>
              {Object.entries(q.olcutler ?? {}).map(([k, v]) => (
                <div className="hbar" key={k}><span className="small">{CRIT[k] ?? k}</span>
                  <div className="bar"><i style={{ width: `${(100 * (v as number)) / q.olcut_tavanlari[k]}%` }} /></div>
                  <span className="num small">{v as number}/{q.olcut_tavanlari[k]}</span></div>
              ))}
              <div className="small muted">Hukuki risk: {q.hukuki_risk} · önceki taslaklarla en yüksek benzerlik: {q.benzerlik} ({q.benzerlik_yontemi}) · kural cezası: −{q.ceza}</div>
              <List title="Sorunlar" items={q.sorunlar} />
              <List title="Dayanaksız iddialar" items={q.dayanaksiz_iddialar} />
              <List title="Güçlü yanlar" items={q.guclu_yanlar} />
            </div>
          )}
          <div className="card">
            <h3>Araştırma kaynakları ({d.sources.length})</h3>
            <ul className="plain">
              {d.sources.map((s: any) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a>
                  {s.cited && <span className="pill ok" style={{ marginLeft: 6 }}>alıntılandı</span>}
                  {s.page_age && <span className="muted small"> · {s.page_age}</span>}</li>
              ))}
            </ul>
            {d.research_dossier && <details style={{ marginTop: 10 }}><summary>Araştırma dosyası</summary><pre className="report">{d.research_dossier}</pre></details>}
          </div>
        </div>
      </div>
    </>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div><div className="small muted">{title}</div><ul className="plain">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}
