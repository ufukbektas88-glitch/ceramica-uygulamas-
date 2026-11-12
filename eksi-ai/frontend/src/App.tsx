import { useCallback, useEffect, useState } from "react";
import { api, ApiError, getToken, setToken } from "./api";
import Editor from "./pages/Editor";
import Overview from "./pages/Overview";
import Queue from "./pages/Queue";
import Reports from "./pages/Reports";
import Topics from "./pages/Topics";
import Logs from "./pages/Logs";

type Page = "overview" | "topics" | "editor" | "queue" | "reports" | "logs";
const NAV: [Page, string][] = [
  ["overview", "Genel Bakış"], ["topics", "Başlık Havuzu"], ["editor", "Entry Editörü"],
  ["queue", "Yayın Kuyruğu"], ["reports", "Raporlama"], ["logs", "İşlem Kayıtları"],
];

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const load = useCallback(() => {
    api("/settings").then((s) => { setSettings(s); setNeedLogin(false); })
      .catch((e) => { if (e instanceof ApiError && e.status === 401) setNeedLogin(true); });
    api("/overview").then((o) => setPending(o.pending)).catch(() => {});
  }, []);
  useEffect(load, [load, page]);

  const openDraft = (id: number) => { setDraftId(id); setPage("editor"); };

  if (needLogin) return <Login onDone={load} />;
  return (
    <div className="layout">
      <nav>
        <h1><span>ekşi</span> ai</h1>
        {NAV.map(([k, label]) => (
          <button key={k} className={page === k ? "on" : ""} onClick={() => setPage(k)}>
            {label}
            {k === "queue" && pending ? <span className="pill warn">{pending}</span> : null}
          </button>
        ))}
        {settings && (
          <div className="foot">
            Günlük çalışma {settings.run_time}<br />Yayın: elle, onayla
          </div>
        )}
      </nav>
      <main>
        {settings && !settings.claude_configured && (
          <div className="notice bad">
            ANTHROPIC_API_KEY tanımlı değil. Panel çalışır, ancak araştırma ve entry üretimi yapılamaz.
          </div>
        )}
        {page === "overview" && <Overview openDraft={openDraft} />}
        {page === "topics" && <Topics settings={settings} openDraft={openDraft} />}
        {page === "editor" && <Editor draftId={draftId} setDraftId={setDraftId} />}
        {page === "queue" && <Queue openDraft={openDraft} />}
        {page === "reports" && <Reports openDraft={openDraft} />}
        {page === "logs" && <Logs />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState(getToken());
  return (
    <form className="card login stack" onSubmit={(e) => { e.preventDefault(); setToken(v.trim()); onDone(); }}>
      <h2>Ekşi AI paneli</h2>
      <label className="muted" htmlFor="tok">Panel anahtarı (PANEL_TOKEN)</label>
      <input id="tok" type="password" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      <button className="btn primary">Giriş</button>
    </form>
  );
}
