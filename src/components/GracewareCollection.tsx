import { useMemo, useState } from "react";
import { Search, ShoppingCart, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { filterGraceware, gracewareCategories, type GracewareProduct } from "@/lib/graceware";
import { SHOP_WHATSAPP_DIGITS, waLink } from "@/lib/stock-types";

function buyLink(product: GracewareProduct): string {
  return waLink(SHOP_WHATSAPP_DIGITS, `Assalam o Alaikum! Mujhe "${product.name}" chahiye — Plaza Steel & Crockery`);
}

export function GracewareCollection({ products }: { products: GracewareProduct[] }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GracewareProduct | null>(null);
  const results = useMemo(() => filterGraceware(products, category, search), [products, category, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase text-gold">PLAZA STEEL &amp; CROCKERY</p>
        <h1 className="font-display text-4xl tracking-normal text-foreground sm:text-5xl">Graceware Collection</h1>
        <p className="mt-3 text-muted-foreground">Dinner Sets · Gift Sets · Tray Sets · Bath Sets · Hot Pots · Household</p>
      </header>

      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Graceware categories" className="flex flex-wrap gap-2">
          {["All", ...gracewareCategories].map((option) => (
            <Button key={option} variant={category === option ? "default" : "outline"}
              aria-pressed={category === option} onClick={() => setCategory(option)}>
              {option}
              <span className="text-xs opacity-70">{option === "All" ? products.length : products.filter((p) => p.categories.some((value) => value === option)).length}</span>
            </Button>
          ))}
        </nav>
        <label className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input aria-label="Search Graceware products" placeholder="Search collection…" value={search}
            onChange={(event) => setSearch(event.target.value)} maxLength={100}
            className="h-10 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring" />
        </label>
      </div>
      <p role="status" className="mb-4 text-sm text-muted-foreground">{results.length} products</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {results.map((product, index) => (
          <article key={product.id} className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-ring">
            <Button variant="ghost" onClick={() => setSelected(product)} aria-label={`View ${product.name}`}
              className="relative block aspect-square h-auto w-full overflow-hidden rounded-none bg-product-stage p-0 hover:bg-product-stage">
              <img src={product.image} alt={product.name} loading={index < 6 ? "eager" : "lazy"}
                width={800} height={800} className="h-full w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-105" />
              <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground">
                <ZoomIn aria-hidden="true" />
              </span>
            </Button>
            <div className="p-3 sm:p-4">
              <p className="mb-1 text-xs text-gold">{product.category}</p>
              <h2 className="break-words font-display text-base leading-snug tracking-normal text-card-foreground sm:text-lg">{product.name}</h2>
              <a
                href={buyLink(product)}
                target="_blank"
                rel="noreferrer"
                className="btn-hero mt-3 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide"
              >
                <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                Buy on WhatsApp
              </a>
            </div>
          </article>
        ))}
      </div>
      {results.length === 0 && <p className="py-12 text-center text-muted-foreground">No products found.</p>}

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-lg p-4 sm:p-6">
          <DialogTitle className="pr-8 font-display text-xl tracking-normal">{selected?.name}</DialogTitle>
          <DialogDescription>{selected?.category}</DialogDescription>
          {selected && <img src={selected.image} alt={selected.name} width={1000} height={1000}
            className="max-h-[65dvh] w-full rounded-md bg-product-stage object-contain" />}
          {selected && (
            <a
              href={buyLink(selected)}
              target="_blank"
              rel="noreferrer"
              className="btn-hero mt-3 flex items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm tracking-wide"
            >
              <ShoppingCart aria-hidden="true" className="h-4 w-4" />
              Buy on WhatsApp
            </a>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}