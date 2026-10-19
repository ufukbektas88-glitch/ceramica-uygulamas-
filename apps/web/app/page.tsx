"use client";
import ImportPanel from "./import-panel";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Boxes,
  LogOut,
  Search,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Minus,
  Check,
  Sun,
  Moon,
  Calculator,
  Menu,
  X,
} from "lucide-react";
type Product = {
  id: string;
  sku: string;
  name: string;
  brand: { name: string };
  size: string;
  color: string;
  surface: string;
  boxArea: string;
  price: string;
  vatRate: string;
  demo: boolean;
  availableBoxes: number;
};
type Order = {
  id: string;
  number: string;
  status: string;
  total: string;
  subtotal: string;
  tax: string;
  createdAt: string;
  items: { name: string; boxes: number; area: string }[];
};
const money = (s: string | number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(s));
const states: Record<string, string> = {
  RECEIVED: "Sipariş alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Sevk edildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};
const nextStates: Record<string, string[]> = {
  RECEIVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch("/api/v1/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (!res.ok)
    throw Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "İşlem başarısız",
    );
  return data;
}
export default function Home() {
  const [tab, setTab] = useState("Genel bakış"),
    [user, setUser] = useState<{ name: string; role: string } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [inventory, setInventory] = useState<any[]>([]),
    [stats, setStats] = useState<any>(null),
    [q, setQ] = useState(""),
    [brand, setBrand] = useState(""),
    [dark, setDark] = useState(false),
    [cart, setCart] = useState<Record<string, number>>({}),
    [selected, setSelected] = useState<Product | null>(null),
    [area, setArea] = useState(47),
    [waste, setWaste] = useState(10),
    [calc, setCalc] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(""),
    [key, setKey] = useState(""),
    [mobile, setMobile] = useState(false);
  const staff = !!user && user.role !== "CUSTOMER";
  const refresh = useCallback(async () => {
    try {
      const p = await api(
        "products?q=" +
          encodeURIComponent(q) +
          "&brand=" +
          encodeURIComponent(brand),
      );
      setProducts(p.items);
      if (user) {
        setOrders(await api("orders"));
        if (["ADMIN", "SALES", "FINANCE"].includes(user.role))
          setStats(await api("dashboard"));
        if (["ADMIN", "SALES", "WAREHOUSE"].includes(user.role))
          setInventory(await api("inventory"));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q, brand, user]);
  useEffect(() => {
    api("auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    api("calculator", {
      method: "POST",
      body: JSON.stringify({ area, waste, productId: selected.id }),
    })
      .then((d) => {
        if (active) setCalc(d);
      })
      .catch((e) => {
        if (active) {
          setCalc(null);
          setError(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [selected, area, waste]);
  function add(p: Product, boxes = 1) {
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + boxes }));
    setKey("");
    setNotice("Ürün sepete eklendi");
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const d = await api("auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      setUser(d.user);
      setNotice("Oturum açıldı");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const k = key || crypto.randomUUID();
      setKey(k);
      await api("orders", {
        method: "POST",
        body: JSON.stringify({
          items: Object.entries(cart).map(([productId, boxes]) => ({
            productId,
            boxes,
          })),
          deliveryAddress: address,
          idempotencyKey: k,
        }),
      });
      setCart({});
      setKey("");
      setAddress("");
      setTab("Siparişler");
      setNotice("Sipariş kaydedildi ve stok ayrıldı. Ödeme alınmadı.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function transition(o: Order, status: string) {
    setBusy(true);
    try {
      await api("orders/" + o.id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
      setNotice("Sipariş durumu güncellendi");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const nav = [
    { name: "Genel bakış", icon: LayoutDashboard },
    { name: "Ürün kataloğu", icon: Layers },
    { name: "Siparişler", icon: ShoppingBag },
    ...(staff ? [{ name: "Stok & depolar", icon: Boxes }] : []),
    { name: "Sepet", icon: ShoppingBag },
    ...(user?.role === "ADMIN"
      ? [{ name: "Ürün aktarımı", icon: Layers }]
      : []),
  ];
  return (
    <div className="shell">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="logo" href="/">
          CERAMICA<span>YAŞAM ALANLARINA DEĞER.</span>
        </a>
        <div className="workspace">
          <div className="avatar">C</div>
          <div>
            <b>CERAMICA</b>
            <small>Ticaret platformu · Geliştirme</small>
          </div>
          <span className="live" />
        </div>
        <p className="nav-label">ÇALIŞMA ALANI</p>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={tab === n.name ? "active" : ""}
              onClick={() => {
                setTab(n.name);
                setMobile(false);
              }}
            >
              <n.icon size={18} />
              {n.name}
              {n.name === "Sepet" && cartCount > 0 && <em>{cartCount}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="note">
            <Layers size={22} />
            <b>Birlikte, daha güçlü.</b>
            <p>
              Graniser ve Duratiles koleksiyonları, tek CERAMICA deneyiminde.
            </p>
            <span>
              GRANISER <i /> duratiles
            </span>
          </div>
          <div className="profile">
            <div className="avatar">{user ? "CY" : "M"}</div>
            <div>
              <b>{user?.name || "Misafir"}</b>
              <small>{user?.role || "Katalog erişimi"}</small>
            </div>
            {user && (
              <button
                aria-label="Çıkış"
                onClick={async () => {
                  await api("auth/logout", { method: "POST" });
                  setUser(null);
                  setStats(null);
                  setInventory([]);
                  setOrders([]);
                }}
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="crumb">
            <button
              className="mobile-menu"
              aria-label="Menü"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            Çalışma alanı <span>/</span> <b>{tab}</b>
          </div>
          <div className="header-actions">
            <span className="demo-dot" /> Demo ortamı
            <button aria-label="Tema değiştir" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="avatar small">C</div>
          </div>
        </header>
        <div className="content">
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button onClick={() => setError("")} aria-label="Kapat">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert">
              <Check size={16} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Kapat">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-title">
            <div>
              <p className="eyebrow">
                CERAMICA /{" "}
                {tab === "Genel bakış" ? "YÖNETİM MERKEZİ" : "TİCARET"}
              </p>
              <h1>
                {tab === "Genel bakış" ? "İşinizin büyük resmini görün." : tab}
              </h1>
              <p>
                {tab === "Genel bakış"
                  ? "Koleksiyonlardan siparişlere, tüm operasyonunuz tek bir yerde."
                  : "Doğru ürün, güvenilir hesaplama, kontrollü satış."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() =>
                setTab(tab === "Ürün kataloğu" ? "Sepet" : "Ürün kataloğu")
              }
            >
              {tab === "Ürün kataloğu" ? "Sepeti görüntüle" : "Kataloğu keşfet"}
              <ArrowUpRight size={16} />
            </button>
          </div>
          {tab === "Genel bakış" && (
            <>
              <section className="hero">
                <div>
                  <span className="hero-label">
                    MALZEMENİN ÖTESİNDE, BİR YAŞAM BİÇİMİ.
                  </span>
                  <h2>
                    İlham veren mekânlar.
                    <br />
                    <em>Güçlü bir ticaret.</em>
                  </h2>
                  <p>
                    Doğal dokular, zamansız tasarımlar.
                    <br />
                    CERAMICA dünyasını keşfedin.
                  </p>
                  <button onClick={() => setTab("Ürün kataloğu")}>
                    Koleksiyonları incele <ArrowRight size={18} />
                  </button>
                </div>
                <div
                  className="architectural"
                  aria-label="Dekoratif seramik yüzey kompozisyonu"
                >
                  <div className="arch" />
                  <div className="slab slab1" />
                  <div className="slab slab2" />
                  <div className="vase" />
                  <span>
                    CERAMICA
                    <br />
                    MATERIAL STORIES / 01
                  </span>
                </div>
              </section>
              <div className="section-heading">
                <h2>Operasyon özeti</h2>
                <span>Kaydedilmiş siparişler · Demo veriler</span>
              </div>
              <section className="metrics">
                {[
                  {
                    label: "Toplam sipariş tutarı",
                    value: stats ? money(stats.revenue) : "—",
                    hint: "KDV dahil · İptaller hariç",
                  },
                  {
                    label: "Net sipariş tutarı",
                    value: stats ? money(stats.netRevenue) : "—",
                    hint: "KDV hariç · Tahsilat değildir",
                  },
                  {
                    label: "Toplam sipariş",
                    value: stats?.orderCount ?? "—",
                    hint: "İptaller hariç",
                  },
                  {
                    label: "Açık siparişler",
                    value: stats?.openCount ?? "—",
                    hint: "Teslimatı tamamlanmamış",
                  },
                ].map((s, i) => (
                  <article className="metric" key={s.label}>
                    <div>
                      {s.label}
                      <span>{["₺", "↗", "▤", "◷"][i]}</span>
                    </div>
                    <strong>{s.value}</strong>
                    <small>{s.hint}</small>
                  </article>
                ))}
              </section>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="section-heading">
                    <h2>Son siparişler</h2>
                    <button
                      className="text-button"
                      onClick={() => setTab("Siparişler")}
                    >
                      Tümünü gör <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <OrderTable orders={orders.slice(0, 5)} />
                </section>
                <section className="panel discovery">
                  <span className="eyebrow">METRAJI DOĞRU PLANLAYIN</span>
                  <Calculator size={32} />
                  <h2>
                    Her metrekare
                    <br />
                    hesaplı olsun.
                  </h2>
                  <p>
                    Fire payı, tam koli ve KDV dahil tutarı birlikte hesaplayın.
                  </p>
                  <button
                    onClick={() => {
                      setTab("Ürün kataloğu");
                      if (products[0]) setSelected(products[0]);
                    }}
                  >
                    Metraj hesapla <ArrowRight size={16} />
                  </button>
                </section>
              </div>
            </>
          )}
          {tab === "Ürün kataloğu" && (
            <>
              <div className="catalog-tools">
                <div className="search">
                  <Search size={18} />
                  <input
                    aria-label="Ürün ara"
                    placeholder="Ürün adı veya SKU ile ara…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Marka filtresi"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">Tüm markalar</option>
                  <option>Graniser</option>
                  <option>Duratiles</option>
                </select>
                <span>{products.length} ürün</span>
              </div>
              <div className="demo-info">
                DEMO etiketi taşıyan ürünler, fiyatlar ve stoklar örnektir.
                Aktarılan ürünlerin kaynak doğrulaması yönetici
                sorumluluğundadır.
              </div>
              <div className="product-grid">
                {products.map((p, i) => (
                  <article className="product" key={p.id}>
                    <button
                      className={"swatch swatch-" + (i % 3)}
                      onClick={() => {
                        setSelected(p);
                        setCalc(null);
                      }}
                      aria-label={p.name + " detay ve metraj"}
                    >
                      <span>
                        {p.demo
                          ? "DEMO KOLEKSİYON"
                          : p.brand.name.toUpperCase()}
                      </span>
                      <ArrowUpRight size={19} />
                    </button>
                    <div className="product-body">
                      <small>
                        {p.brand.name.toUpperCase()} <span>{p.sku}</span>
                      </small>
                      <h3>{p.name}</h3>
                      <p>
                        {p.size} cm · {p.surface} · {p.color}
                      </p>
                      <div className="product-price">
                        <strong>
                          {money(p.price)}
                          <small> / m² + KDV</small>
                        </strong>
                        <button
                          aria-label={p.name + " sepete ekle"}
                          onClick={() => add(p)}
                        >
                          <Plus size={19} />
                        </button>
                      </div>
                      <div className="stock">
                        <span /> {p.availableBoxes} koli satılabilir ·{" "}
                        {p.boxArea} m²/koli
                      </div>
                      <button
                        className="calc-button"
                        onClick={() => setSelected(p)}
                      >
                        <Calculator size={15} /> Metraj ve fiyat hesapla
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {products.length === 0 && (
                <div className="empty">Aramanıza uygun ürün bulunamadı.</div>
              )}
            </>
          )}
          {tab === "Ürün aktarımı" && user?.role === "ADMIN" && <ImportPanel />}
          {tab === "Siparişler" && (
            <section className="panel">
              <OrderTable orders={orders} />
              {orders.map((o) => (
                <div className="order-detail" key={o.id}>
                  <div>
                    <b>{o.number}</b>
                    <p>
                      {o.items
                        .map((i) => `${i.name}: ${i.boxes} koli / ${i.area} m²`)
                        .join(" · ")}
                    </p>
                    <small>
                      KDV hariç {money(o.subtotal)} + KDV {money(o.tax)}
                    </small>
                  </div>
                  {staff && (
                    <div className="status-actions">
                      {(nextStates[o.status] || [])
                        .filter(
                          (s) =>
                            user?.role !== "WAREHOUSE" ||
                            ["PREPARING", "SHIPPED", "DELIVERED"].includes(s),
                        )
                        .map((s) => (
                          <button
                            disabled={busy}
                            key={s}
                            onClick={() => transition(o, s)}
                          >
                            {states[s]}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
          {tab === "Stok & depolar" && (
            <section className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Depo / Parti</th>
                    <th>Ton / Kalibre</th>
                    <th>Fiziki</th>
                    <th>Rezerve</th>
                    <th>Satılabilir</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <b>{l.product.name}</b>
                        <small>{l.product.sku}</small>
                      </td>
                      <td>
                        {l.warehouse.name}
                        <small>{l.batch}</small>
                      </td>
                      <td>
                        {l.tone || "—"} / {l.caliber || "—"}
                      </td>
                      <td>{l.physical}</td>
                      <td>{l.reserved}</td>
                      <td>{l.physical - l.reserved} koli</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventory.length === 0 && (
                <div className="empty">
                  Bu alan için yetkili hesapla oturum açın.
                </div>
              )}
            </section>
          )}
          {tab === "Sepet" && (
            <section className="panel">
              <div className="section-heading">
                <h2>Siparişinizi hazırlayın</h2>
                <span>Ödeme alınmaz · Stok sunucuda kontrol edilir</span>
              </div>
              {Object.entries(cart).map(([id, n]) => {
                const p = products.find((p) => p.id === id);
                return (
                  <div className="cart-row" key={id}>
                    <div>
                      <b>{p?.name || id}</b>
                      <p>
                        {p
                          ? money(Number(p.price) * Number(p.boxArea) * n)
                          : ""}{" "}
                        + KDV
                      </p>
                    </div>
                    <div className="quantity">
                      <button
                        aria-label="Koli azalt"
                        onClick={() => {
                          setKey("");
                          setCart((c) => {
                            const d = { ...c };
                            if (n === 1) delete d[id];
                            else d[id]--;
                            return d;
                          });
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      {n} koli
                      <button
                        aria-label="Koli artır"
                        onClick={() => {
                          setKey("");
                          setCart((c) => ({ ...c, [id]: n + 1 }));
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cartCount === 0 ? (
                <div className="empty">
                  Sepetiniz boş. Katalogdan ürün ekleyin.
                </div>
              ) : (
                <>
                  <label className="field">
                    Teslimat adresi
                    <textarea
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setKey("");
                      }}
                      placeholder="Açık teslimat adresi (en az 10 karakter)"
                    />
                  </label>
                  <p className="muted">
                    Nihai fiyat ve vergi sunucuda yeniden hesaplanır. Sipariş
                    tek parti stoktan ayrılır.
                  </p>
                  <button
                    className="primary"
                    disabled={!user || busy || address.trim().length < 10}
                    onClick={checkout}
                  >
                    {busy ? "Kaydediliyor…" : "Siparişi kaydet"}
                    <ArrowRight size={16} />
                  </button>
                  {!user && <p>Devam etmek için aşağıdan oturum açın.</p>}
                </>
              )}
            </section>
          )}
          {!user && !loading && (
            <section className="login panel">
              <div>
                <span className="eyebrow">YETKİLİ ERİŞİM</span>
                <h2>İşinize kaldığınız yerden devam edin.</h2>
                <p>
                  Yönetim ve sipariş işlemleri için oturum açın.
                  <br />
                  Demo hesabı kurulum sırasında oluşturulur.
                </p>
              </div>
              <form onSubmit={login}>
                <label>
                  E-posta
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="admin@ceramica.local"
                  />
                </label>
                <label>
                  Parola
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    autoComplete="current-password"
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {busy ? "Kontrol ediliyor…" : "Oturum aç"}
                  <ArrowRight size={16} />
                </button>
              </form>
            </section>
          )}
          <footer>
            <span>© {new Date().getFullYear()} CERAMICA</span>
            <span>Doğal malzemeler. Kalıcı değerler.</span>
            <span>Geliştirme sürümü · Gerçek ödeme kapalı</span>
          </footer>
        </div>
      </main>
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Metraj hesaplayıcı"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Kapat"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <span className="eyebrow">CERAMICA / METRAJ HESAPLAMA</span>
            <h2>{selected.name}</h2>
            <p>
              {selected.brand.name} · {selected.size} · {selected.boxArea}{" "}
              m²/koli
            </p>
            <div className="calc-fields">
              <label>
                Net alan (m²)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                />
              </label>
              <label>
                Fire payı (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={waste}
                  onChange={(e) => setWaste(Number(e.target.value))}
                />
              </label>
            </div>
            {calc && (
              <>
                <div className="calc-results">
                  <div>
                    Fireli ihtiyaç <b>{calc.required} m²</b>
                  </div>
                  <div>
                    Tam koli <b>{calc.boxes} koli</b>
                  </div>
                  <div>
                    Gerçek sipariş alanı <b>{calc.area} m²</b>
                  </div>
                  <div>
                    KDV hariç <b>{money(calc.subtotal)}</b>
                  </div>
                  <div>
                    KDV ({selected.vatRate}%) <b>{money(calc.tax)}</b>
                  </div>
                  <div className="total">
                    Genel toplam <b>{money(calc.total)}</b>
                  </div>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    add(selected, calc.boxes);
                    setSelected(null);
                  }}
                >
                  Hesaplanan miktarı sepete ekle <Plus size={16} />
                </button>
              </>
            )}
            <small className="muted">
              Demo fiyatıdır. Stok ve fiyat sipariş sırasında doğrulanır.
            </small>
          </section>
        </div>
      )}
    </div>
  );
}
function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sipariş</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>Tutar · KDV dahil</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.number.slice(0, 17)}…</b>
              </td>
              <td>{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
              <td>
                <span className={"badge " + o.status.toLowerCase()}>
                  {states[o.status]}
                </span>
              </td>
              <td>
                <b>{money(o.total)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="empty">
          <ShoppingBag size={25} />
          <b>Henüz sipariş yok.</b>
          <span>Siparişleriniz kaydedildiğinde burada listelenir.</span>
        </div>
      )}
    </div>
  );
}
