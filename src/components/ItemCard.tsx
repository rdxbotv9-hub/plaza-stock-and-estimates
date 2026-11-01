import { bill } from "@/lib/estimate-store";
import { SHOP_WHATSAPP_DIGITS, formatPKR, waLink, type PublicItem } from "@/lib/stock-types";

export function ItemCard({
  item,
  showQty = false,
  showBuyNow = false,
  index = 0,
}: {
  item: PublicItem;
  showQty?: boolean;
  showBuyNow?: boolean;
  index?: number;
}) {
  const stockLabel = item.qty > 0 ? `${formatPKR(item.qty)} in stock` : "Out of stock";

  return (
    <article
      className="card-3d rise-in surface-panel flex flex-col gap-3 p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base leading-snug tracking-wide text-foreground">
          {item.name}
        </h3>
        {item.code ? (
          <span className="shrink-0 rounded-md border border-border/70 bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground">
            {item.code}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full bg-accent px-2 py-0.5">{item.category}</span>
        {item.brand ? <span className="rounded-full bg-accent px-2 py-0.5">{item.brand}</span> : null}
        {showQty ? (
          <span
            className={
              item.qty > 0
                ? "rounded-full bg-success/15 px-2 py-0.5 text-success"
                : "rounded-full bg-destructive/15 px-2 py-0.5 text-destructive"
            }
          >
            {stockLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="font-display text-2xl tracking-wide text-brand-gradient">
          Rs {formatPKR(item.rate)}
        </p>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            onClick={() => bill.add(item)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            + Bill
          </button>
          {showBuyNow ? (
            <a
              href={waLink(
                SHOP_WHATSAPP_DIGITS,
                `Buy Now: ${item.name}${item.code ? ` (${item.code})` : ""} — Rs ${formatPKR(item.rate)}`,
              )}
              target="_blank"
              rel="noreferrer"
              className="btn-hero rounded-full px-3 py-1.5 text-xs font-bold"
            >
              Buy Now
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
