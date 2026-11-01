import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { adminLogin, adminLogout, getAdminStock } from "@/lib/stock.functions";
import { formatPKR, type StockItem } from "@/lib/stock-types";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Portal — Plaza Steel & Crockery" },
      { name: "description", content: "Private stock and cost portal for Plaza Steel & Crockery staff." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Portal — Plaza Steel & Crockery" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "Private staff portal." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const loadStock = useServerFn(getAdminStock);

  const [items, setItems] = useState<StockItem[] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [limit, setLimit] = useState(100);

  async function refresh() {
    const result = await loadStock();
    if (result.authorized) setItems(result.items);
    return result.authorized;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await login({ data: { username, password } });
      if (!result.ok) {
        setError("Wrong username or password.");
        return;
      }
      setPassword("");
      await refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const categories = useMemo(
    () => [...new Set((items ?? []).map((item) => item.category))].sort(),
    [items],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        item.vendor.toLowerCase().includes(term)
      );
    });
  }, [items, search, category]);

  const totals = useMemo(
    () =>
      results.reduce(
        (acc, item) => ({
          cost: acc.cost + item.cost * Math.max(item.qty, 0),
          rate: acc.rate + item.rate * Math.max(item.qty, 0),
        }),
        { cost: 0, rate: 0 },
      ),
    [results],
  );

  function exportCsv() {
    const rows = [
      ["Code", "Item", "Category", "Brand", "Vendor", "Qty", "Cost", "Rate", "Margin"],
      ...results.map((item) => [
        item.code,
        item.name,
        item.category,
        item.brand,
        item.vendor,
        item.qty,
        item.cost,
        item.rate,
        item.rate - item.cost,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plaza-stock.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!items) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
        <form onSubmit={onSubmit} className="surface-panel rise-in w-full p-6">
          <img
            src="/logo-plaza.png"
            alt="Plaza Steel & Crockery"
            className="glow-logo mx-auto h-20 w-20 rounded-full bg-chrome object-contain p-1.5"
            width={80}
            height={80}
          />
          <h1 className="mt-4 text-center font-display text-2xl tracking-wide">
            <span className="text-chrome">ADMIN</span>{" "}
            <span className="text-brand-gradient">PORTAL</span>
          </h1>
          <p className="mt-1 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Private — cost &amp; stock
          </p>

          <label className="mt-5 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Username
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              maxLength={40}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={60}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
          </label>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-hero mt-5 w-full rounded-full px-5 py-3 font-display tracking-wide disabled:opacity-60"
          >
            {busy ? "Checking…" : "Open Admin Portal"}
          </button>
        </form>
      </div>
    );
  }

  const visible = results.slice(0, limit);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="surface-panel flex flex-wrap items-center gap-3 p-5">
        <div>
          <h1 className="font-display text-2xl tracking-wide">
            <span className="text-chrome">ADMIN</span>{" "}
            <span className="text-brand-gradient">STOCK</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {formatPKR(items.length)} items loaded from list folder
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            Export CSV
          </button>
          <button
            onClick={async () => {
              await logout();
              setItems(null);
            }}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="surface-panel p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Items shown</p>
          <p className="font-display text-2xl">{formatPKR(results.length)}</p>
        </div>
        <div className="surface-panel p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Stock cost value</p>
          <p className="font-display text-2xl">Rs {formatPKR(totals.cost)}</p>
        </div>
        <div className="surface-panel p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Stock sale value</p>
          <p className="font-display text-2xl text-gold">Rs {formatPKR(totals.rate)}</p>
        </div>
        <div className="surface-panel p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Expected profit</p>
          <p className="font-display text-2xl text-success">
            Rs {formatPKR(totals.rate - totals.cost)}
          </p>
        </div>
      </section>

      <section className="surface-panel mt-4 grid gap-3 p-4 sm:grid-cols-[2fr_1fr]">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(100);
          }}
          placeholder="Search item, code, brand or vendor"
          maxLength={60}
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-ring"
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setLimit(100);
          }}
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="ALL">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </section>

      <div className="surface-panel mt-4 overflow-x-auto p-2">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="p-2">Code</th>
              <th className="p-2">Item</th>
              <th className="p-2">Category</th>
              <th className="p-2">Brand</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Cost</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id} className="border-t border-border/60 transition-colors hover:bg-accent/60">
                <td className="p-2 text-xs text-muted-foreground">{item.code || "—"}</td>
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-xs text-muted-foreground">{item.category}</td>
                <td className="p-2 text-xs text-muted-foreground">{item.brand || "—"}</td>
                <td
                  className={
                    item.qty <= 0 ? "p-2 text-right text-destructive" : "p-2 text-right text-success"
                  }
                >
                  {formatPKR(item.qty)}
                </td>
                <td className="p-2 text-right">{formatPKR(item.cost)}</td>
                <td className="p-2 text-right text-gold">{formatPKR(item.rate)}</td>
                <td className="p-2 text-right">{formatPKR(item.rate - item.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length < results.length ? (
        <div className="mt-5 text-center">
          <button
            onClick={() => setLimit((value) => value + 100)}
            className="btn-hero rounded-full px-6 py-3 font-display text-sm tracking-wide"
          >
            Show more rows
          </button>
        </div>
      ) : null}
    </div>
  );
}
