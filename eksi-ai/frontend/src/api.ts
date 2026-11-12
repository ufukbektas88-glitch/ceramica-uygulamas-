const KEY = "eksi_ai_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const getToken = () => localStorage.getItem(KEY) ?? "";
export const setToken = (t: string) => localStorage.setItem(KEY, t);

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: {
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = typeof j.detail === "string" ? j.detail : "Girilen değer geçersiz";
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "–";

export const STATUS_TR: Record<string, string> = {
  pending: "onay bekliyor", approved: "onaylandı", rejected: "reddedildi", published: "yayınlandı",
  failed_quality: "kalite yetersiz", discovered: "bulundu", scored: "puanlandı", processing: "araştırılıyor",
  drafted: "entry üretildi", skipped: "atlandı", duplicate: "tekrar", running: "çalışıyor",
  completed: "tamamlandı", failed: "hata", bekliyor: "bekliyor", yok: "çalışmadı",
};
