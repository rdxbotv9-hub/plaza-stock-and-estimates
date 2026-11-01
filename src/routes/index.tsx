import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ItemCard } from "@/components/ItemCard";
import { getPublicCatalogue } from "@/lib/stock.functions";
import { SHOP_WHATSAPP, SHOP_WHATSAPP_DIGITS, formatPKR, waLink } from "@/lib/stock-types";

const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: () => getPublicCatalogue(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plaza Steel & Crockery — Rate List & Prices" },
      {
        name: "description",
        content:
          "Search live rates for steel, crockery and home appliances at Plaza Steel & Crockery. Filter by category and budget, then order on WhatsApp.",
      },
      { property: "og:title", content: "Plaza Steel & Crockery — Rate List" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "Search steel, crockery and appliance rates by category and budget.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQuery),
  component: PublicRateList,
});

function PublicRateList() {
  const { data } = useSuspenseQuery(catalogueQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState("");
  const [limit, setLimit] = useState(48);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cap = Number(maxPrice.replace(/[^0-9.]/g, ""));
    return data.items.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (cap > 0 && item.rate > cap) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term)
      );
    });
  }, [data.items, search, category, maxPrice]);

  const visible = results.slice(0, limit);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="surface-panel shine-sweep relative overflow-hidden px-5 py-10 text-center sm:px-10">
        <img
          src="/logo-plaza.png"
          alt="Plaza Steel & Crockery"
          className="glow-logo float-slow mx-auto h-28 w-28 rounded-full bg-chrome object-contain p-2 sm:h-36 sm:w-36"
          width={144}
          height={144}
        />
        <h1 className="mt-5 font-display text-3xl tracking-wide sm:text-5xl">
          <span className="text-brand-gradient">PLAZA</span>{" "}
          <span className="text-chrome">STEEL &amp; CROCKERY</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Live rate list of {formatPKR(data.items.length)} items — steel, crockery, cookware and
          home appliances. Search an item to see its price instantly.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a
            href={waLink(SHOP_WHATSAPP_DIGITS, "Assalam o Alaikum, mujhe rate list chahiye.")}
            target="_blank"
            rel="noreferrer"
            className="btn-hero rounded-full px-6 py-3 font-display text-sm tracking-wide sm:text-base"
          >
            WhatsApp {SHOP_WHATSAPP}
          </a>
          <Link
            to="/westpoint"
            className="rounded-full border border-border px-6 py-3 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:text-base"
          >
            West Point Stock
          </Link>
          <Link
            to="/graceware"
            className="rounded-full border border-border px-6 py-3 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:text-base"
          >
            Graceware Collection
          </Link>
          <Link
            to="/estimate"
            className="rounded-full border border-border px-6 py-3 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:text-base"
          >
            Make Estimate Bill
          </Link>
        </div>
      </section>

      <section className="surface-panel mt-6 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Search item / code
          </span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(48);
            }}
            placeholder="e.g. diner set, cooker, WP-04"
            maxLength={60}
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Category
          </span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setLimit(48);
            }}
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
          >
            <option value="ALL">All categories</option>
            {data.categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Budget up to (Rs)
          </span>
          <input
            value={maxPrice}
            onChange={(event) => {
              setMaxPrice(event.target.value.replace(/[^0-9]/g, ""));
              setLimit(48);
            }}
            inputMode="numeric"
            placeholder="10000"
            maxLength={9}
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
          />
        </label>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span>{formatPKR(results.length)} items found</span>
        {search || category !== "ALL" || maxPrice ? (
          <button
            onClick={() => {
              setSearch("");
              setCategory("ALL");
              setMaxPrice("");
            }}
            className="rounded-full border border-border px-3 py-1 transition-colors hover:text-foreground"
          >
            Reset filters
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <p className="surface-panel mt-4 p-8 text-center text-sm text-muted-foreground">
          No item matched. Try a shorter word or raise the budget.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} showQty={item.isWestPoint} />
            ))}
          </div>
          {visible.length < results.length ? (
            <div className="mt-6 text-center">
              <button
                onClick={() => setLimit((value) => value + 48)}
                className="btn-hero rounded-full px-6 py-3 font-display text-sm tracking-wide"
              >
                Show more items
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
