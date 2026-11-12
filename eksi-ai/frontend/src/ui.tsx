import { useCallback, useEffect, useState } from "react";
import { STATUS_TR } from "./api";

const TONE: Record<string, string> = {
  pending: "warn", approved: "info", published: "ok", rejected: "bad", failed_quality: "bad",
  drafted: "ok", processing: "info", skipped: "", duplicate: "", scored: "info", discovered: "",
  running: "info", completed: "ok", failed: "bad",
};

export const Status = ({ s }: { s: string }) => <span className={`pill ${TONE[s] ?? ""}`}>{STATUS_TR[s] ?? s}</span>;

export const Score = ({ v }: { v: number | null | undefined }) =>
  v == null ? <span className="muted">–</span> : <span className={`pill ${v >= 80 ? "ok" : v >= 60 ? "warn" : "bad"}`}>{v}</span>;

/** Veriyi yükler; `every` verilirse o aralıkla yeniler. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[], every?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => fn().then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)), deps);
  useEffect(() => {
    reload();
    if (!every) return;
    const t = setInterval(reload, every);
    return () => clearInterval(t);
  }, [reload, every]);
  return { data, error, reload };
}

export const Err = ({ e }: { e: string | null }) => (e ? <div className="notice bad">{e}</div> : null);

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn" onClick={async () => {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }}>{done ? "Kopyalandı" : label}</button>
  );
}
