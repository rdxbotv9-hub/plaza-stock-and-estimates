import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ItemCard } from "@/components/ItemCard";
import { getPublicCatalogue } from "@/lib/stock.functions";
import { formatPKR } from "@/lib/stock-types";

const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: () => getPublicCatalogue(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/westpoint")({
  head: () => ({
    meta: [
      { title: "West Point Stock & Rates — Plaza Steel & Crockery" },
      {
        name: "description",
        content:
          "Search West Point (WP) appliances at Plaza Steel & Crockery with live rates and available quantity, then buy on WhatsApp.",
      },
      { property: "og:title", content: "West Point Stock & Rates — Plaza" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "West Point appliance rates with available quantity and instant WhatsApp ordering.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQuery),
  component: WestPointPage,
});

function WestPointPage() {
  const { data } = useSuspenseQuery(catalogueQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [limit, setLimit] = useState(48);

  const wpItems = useMemo(() => data.items.filter((item) => item.isWestPoint), [data.items]);
  const categories = useMemo(
    () => [...new Set(wpItems.map((item) => item.category))].sort(),
    [wpItems],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return wpItems.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (inStockOnly && item.qty <= 0) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    });
  }, [wpItems, search, category, inStockOnly]);

  const visible = results.slice(0, limit);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="surface-panel shine-sweep px-5 py-8 text-center sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-gold">Authorised dealer</p>
        <h1 className="mt-2 font-display text-3xl tracking-wide sm:text-4xl">
          <span className="text-chrome">WEST POINT</span>{" "}
          <span className="text-brand-gradient">STOCK</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {formatPKR(wpItems.length)} West Point items with live rate and available quantity. Tap
          Buy Now to order on WhatsApp.
        </p>
      </section>

      <section className="surface-panel mt-6 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_auto]">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(48);
          }}
          placeholder="Search WP code or item (e.g. WP-04, kettle)"
          maxLength={60}
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setLimit(48);
          }}
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        >
          <option value="ALL">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="accent-primary"
          />
          In stock only
        </label>
      </section>

      <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
        {formatPKR(results.length)} items found
      </p>

      {results.length === 0 ? (
        <p className="surface-panel mt-4 p-8 text-center text-sm text-muted-foreground">
          No West Point item matched this search.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} showQty showBuyNow />
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
