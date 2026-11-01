import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

import {
  bill,
  computeTotals,
  useBill,
  useBillMeta,
  useSavedBills,
  type SavedBill,
} from "@/lib/estimate-store";
import { getPublicCatalogue } from "@/lib/stock.functions";
import { SHOP_WHATSAPP_DIGITS, formatPKR, waLink, type PublicItem } from "@/lib/stock-types";

const catalogueQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: () => getPublicCatalogue(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "Estimate Bill Maker — Plaza Steel & Crockery" },
      {
        name: "description",
        content:
          "Proper estimate bill maker: add rate-list or custom items, edit quantity and rate, customer name and number, discount, B5 print and WhatsApp.",
      },
      { property: "og:title", content: "Estimate Bill Maker — Plaza Steel & Crockery" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "Build a proper estimate bill — quantity, rate, discount, customer details — then print on B5 or send on WhatsApp.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogueQuery),
  component: EstimatePage,
});

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-ring";

function EstimatePage() {
  const { data } = useSuspenseQuery(catalogueQuery);
  const lines = useBill();
  const meta = useBillMeta();
  const savedBills = useSavedBills();

  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customRate, setCustomRate] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 1) return [];
    return data.items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term),
      )
      .slice(0, 10);
  }, [data.items, search]);

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const discountNumber = Number(discountValue.replace(/[^0-9.]/g, "")) || 0;
  const { discount, total } = computeTotals(subtotal, discountMode, discountNumber);
  const received = Math.max(meta.received || 0, 0);
  const balance = Math.max(total - received, 0);

  const addSuggestion = (item: PublicItem) => {
    bill.add(item);
    setSearch("");
    setHighlight(0);
    searchRef.current?.focus();
  };

  const addCustom = () => {
    const name = customName.trim();
    const rate = Number(customRate.replace(/[^0-9.]/g, "")) || 0;
    const qty = Math.max(1, Number(customQty.replace(/[^0-9]/g, "")) || 1);
    if (!name || rate <= 0) return;
    bill.addCustom(name, rate, qty);
    setCustomName("");
    setCustomQty("1");
    setCustomRate("");
  };

  const customerBits = [
    meta.customerName ? `Customer: ${meta.customerName}` : null,
    meta.customerPhone ? `Number: ${meta.customerPhone}` : null,
    meta.customerAddress ? `Address: ${meta.customerAddress}` : null,
  ].filter(Boolean);

  const billText = [
    "*PLAZA STEEL & CROCKERY — ESTIMATE BILL*",
    `Bill No: ${meta.billNo}`,
    `Date: ${meta.date}`,
    ...customerBits,
    "",
    ...lines.map(
      (line, index) =>
        `${index + 1}. ${line.name}${line.code ? ` (${line.code})` : ""} — ${line.qty} x Rs ${formatPKR(
          line.unitPrice,
        )} = Rs ${formatPKR(line.unitPrice * line.qty)}`,
    ),
    "",
    `Subtotal: Rs ${formatPKR(subtotal)}`,
    discount > 0
      ? `Discount${discountMode === "percent" ? ` (${discountNumber}%)` : ""}: -Rs ${formatPKR(discount)}`
      : null,
    `*Total: Rs ${formatPKR(total)}*`,
    received > 0 ? `Received: Rs ${formatPKR(received)}` : null,
    received > 0 ? `Balance: Rs ${formatPKR(balance)}` : null,
    meta.notes ? `Note: ${meta.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="surface-panel no-print p-5">
        <h1 className="font-display text-2xl tracking-wide sm:text-3xl">
          <span className="text-brand-gradient">ESTIMATE</span>{" "}
          <span className="text-chrome">BILL MAKER</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rate list ya apni marzi ki item add karein — quantity aur rate badal sakein, customer
          details bharein, discount lagayein, phir B5 print ya WhatsApp par bhejein.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* -------- Add items -------- */}
        <section className="surface-panel no-print p-5">
          <h2 className="font-display text-lg tracking-wide text-chrome">1 — ITEMS ADD KAREIN</h2>

          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Rate list se search (↑ ↓ Enter)
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setHighlight(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlight((index) => Math.min(index + 1, suggestions.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlight((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const picked = suggestions[highlight];
                  if (picked) addSuggestion(picked);
                } else if (event.key === "Escape") {
                  setSearch("");
                  setHighlight(0);
                }
              }}
              placeholder="Item ka naam ya code likhein…"
              maxLength={60}
              className={fieldClass}
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="estimate-suggestions"
            />
            {suggestions.length > 0 ? (
              <ul
                id="estimate-suggestions"
                role="listbox"
                className="absolute z-20 mt-1 max-h-72 w-full max-w-lg overflow-auto rounded-lg border border-border bg-popover shadow-xl"
              >
                {suggestions.map((item, index) => (
                  <li key={item.id} role="option" aria-selected={index === highlight}>
                    <button
                      type="button"
                      onClick={() => addSuggestion(item)}
                      onMouseEnter={() => setHighlight(index)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                        index === highlight ? "bg-accent" : ""
                      }`}
                    >
                      <span>
                        {item.name}
                        {item.code ? (
                          <span className="ml-1 text-muted-foreground">({item.code})</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-semibold text-gold">
                        Rs {formatPKR(item.rate)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </label>

          <div className="chrome-divider my-4" />

          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Apni item add karein (rate khud likhein)
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_5rem_7rem_auto]">
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addCustom();
              }}
              placeholder="Item ka naam"
              maxLength={80}
              className={fieldClass}
            />
            <input
              value={customQty}
              onChange={(event) => setCustomQty(event.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") addCustom();
              }}
              inputMode="numeric"
              placeholder="Qty"
              aria-label="Custom item quantity"
              className={fieldClass}
            />
            <input
              value={customRate}
              onChange={(event) => setCustomRate(event.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") addCustom();
              }}
              inputMode="decimal"
              placeholder="Rate"
              aria-label="Custom item rate"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={addCustom}
              className="btn-hero rounded-lg px-4 py-2 text-sm font-bold"
            >
              + Add
            </button>
          </div>
        </section>

        {/* -------- Bill details -------- */}
        <section className="surface-panel no-print p-5">
          <h2 className="font-display text-lg tracking-wide text-chrome">2 — BILL DETAILS</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Bill No
              </span>
              <input
                value={meta.billNo}
                onChange={(event) => bill.setMeta({ billNo: event.target.value })}
                maxLength={24}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Date
              </span>
              <input
                type="date"
                value={meta.date}
                onChange={(event) => bill.setMeta({ date: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Customer name
              </span>
              <input
                value={meta.customerName}
                onChange={(event) => bill.setMeta({ customerName: event.target.value })}
                placeholder="Naam"
                maxLength={60}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Customer number
              </span>
              <input
                value={meta.customerPhone}
                onChange={(event) =>
                  bill.setMeta({ customerPhone: event.target.value.replace(/[^0-9+ ]/g, "") })
                }
                placeholder="03xx-xxxxxxx"
                inputMode="tel"
                maxLength={20}
                className={fieldClass}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Address (optional)
              </span>
              <input
                value={meta.customerAddress}
                onChange={(event) => bill.setMeta({ customerAddress: event.target.value })}
                maxLength={120}
                className={fieldClass}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Note (optional)
              </span>
              <input
                value={meta.notes}
                onChange={(event) => bill.setMeta({ notes: event.target.value })}
                maxLength={160}
                className={fieldClass}
              />
            </label>
          </div>
        </section>
      </div>

      {/* -------- Bill lines -------- */}
      <section className="surface-panel mt-6 p-5">
        <div className="no-print">
          <h2 className="font-display text-lg tracking-wide text-chrome">3 — BILL</h2>

          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Koi item add nahi hui. Upar search karein, “+ Add” se apni item likhein, ya rate list
              par “+ Bill” dabayein.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="pb-2">Item</th>
                    <th className="w-32 pb-2">Qty</th>
                    <th className="w-28 pb-2">Rate</th>
                    <th className="w-28 pb-2 text-right">Amount</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-t border-border/60">
                      <td className="py-2 pr-2">
                        {line.name}
                        {line.code ? (
                          <span className="ml-1 text-xs text-muted-foreground">({line.code})</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${line.name}`}
                            onClick={() =>
                              bill.update(line.id, { qty: Math.max(1, line.qty - 1) })
                            }
                            className="h-7 w-7 rounded-md border border-border text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                          >
                            −
                          </button>
                          <input
                            value={line.qty}
                            onChange={(event) =>
                              bill.update(line.id, {
                                qty: Math.max(1, Number(event.target.value.replace(/[^0-9]/g, "")) || 1),
                              })
                            }
                            inputMode="numeric"
                            aria-label={`Quantity of ${line.name}`}
                            className="w-12 rounded-md border border-border bg-input px-1 py-1 text-center text-sm outline-none focus:border-ring"
                          />
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${line.name}`}
                            onClick={() => bill.update(line.id, { qty: line.qty + 1 })}
                            className="h-7 w-7 rounded-md border border-border text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          value={line.unitPrice}
                          onChange={(event) =>
                            bill.update(line.id, {
                              unitPrice: Number(event.target.value.replace(/[^0-9.]/g, "")) || 0,
                            })
                          }
                          inputMode="decimal"
                          aria-label={`Rate of ${line.name}`}
                          className="w-20 rounded-md border border-border bg-input px-2 py-1 text-sm outline-none focus:border-ring"
                        />
                      </td>
                      <td className="py-2 text-right font-semibold">
                        Rs {formatPKR(line.unitPrice * line.qty)}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => bill.remove(line.id)}
                          aria-label={`Remove ${line.name}`}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lines.length > 0 ? (
            <>
              <div className="chrome-divider my-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                      Discount
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={discountMode}
                        onChange={(event) =>
                          setDiscountMode(event.target.value === "amount" ? "amount" : "percent")
                        }
                        className="rounded-lg border border-border bg-input px-2 py-2 text-sm outline-none focus:border-ring"
                      >
                        <option value="percent">Percent %</option>
                        <option value="amount">Amount Rs</option>
                      </select>
                      <input
                        value={discountValue}
                        onChange={(event) =>
                          setDiscountValue(event.target.value.replace(/[^0-9.]/g, ""))
                        }
                        inputMode="decimal"
                        placeholder={discountMode === "percent" ? "10" : "500"}
                        aria-label="Discount value"
                        className="w-28 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-ring"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                      Received / Advance (Rs)
                    </span>
                    <input
                      value={meta.received ? String(meta.received) : ""}
                      onChange={(event) =>
                        bill.setMeta({
                          received: Number(event.target.value.replace(/[^0-9.]/g, "")) || 0,
                        })
                      }
                      inputMode="decimal"
                      placeholder="0"
                      aria-label="Received or advance amount"
                      className={`${fieldClass} max-w-40`}
                    />
                  </div>
                </div>

                <dl className="space-y-1 text-sm sm:text-right">
                  <div className="flex justify-between gap-4 sm:justify-end">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="w-32 sm:text-right">Rs {formatPKR(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:justify-end">
                    <dt className="text-muted-foreground">
                      Discount{discountMode === "percent" && discountNumber ? ` (${discountNumber}%)` : ""}
                    </dt>
                    <dd className="w-32 text-destructive sm:text-right">- Rs {formatPKR(discount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 pt-1 font-display text-xl sm:justify-end">
                    <dt>Total</dt>
                    <dd className="w-32 text-brand-gradient sm:text-right">Rs {formatPKR(total)}</dd>
                  </div>
                  {received > 0 ? (
                    <>
                      <div className="flex justify-between gap-4 text-sm sm:justify-end">
                        <dt className="text-muted-foreground">Received</dt>
                        <dd className="w-32 text-success sm:text-right">Rs {formatPKR(received)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 text-sm sm:justify-end">
                        <dt className="text-muted-foreground">Balance</dt>
                        <dd className="w-32 sm:text-right">Rs {formatPKR(balance)}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={waLink(SHOP_WHATSAPP_DIGITS, billText)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-hero rounded-full px-5 py-2.5 font-display text-sm tracking-wide"
                >
                  Send on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-border px-5 py-2.5 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  Print / Save PDF (B5)
                </button>
                <button
                  type="button"
                  onClick={() => bill.saveCurrent()}
                  disabled={lines.length === 0}
                  className="rounded-full border border-border px-5 py-2.5 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-50"
                >
                  Save bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bill.clear();
                    setDiscountValue("");
                    setDiscountMode("percent");
                  }}
                  className="rounded-full border border-border px-5 py-2.5 font-display text-sm tracking-wide text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  New bill (clear)
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* -------- Print sheet (B5) -------- */}
        <div className="print-sheet" aria-hidden="true">
          <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
            <div className="flex items-center gap-3">
              <img src="/logo-plaza.png" alt="" className="h-14 w-14 object-contain" />
              <div>
                <p className="text-lg font-bold">PLAZA STEEL &amp; CROCKERY</p>
                <p className="text-xs">WhatsApp: +92 546501637</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="text-base font-bold">ESTIMATE BILL</p>
              <p>Bill No: {meta.billNo}</p>
              <p>Date: {meta.date}</p>
            </div>
          </header>

          {(meta.customerName || meta.customerPhone || meta.customerAddress) && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <p>
                <span className="font-semibold">Customer: </span>
                {meta.customerName || "—"}
              </p>
              <p>
                <span className="font-semibold">Number: </span>
                {meta.customerPhone || "—"}
              </p>
              {meta.customerAddress ? (
                <p className="col-span-2">
                  <span className="font-semibold">Address: </span>
                  {meta.customerAddress}
                </p>
              ) : null}
            </div>
          )}

          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr className="border border-black bg-black/5 text-left">
                <th className="border border-black px-2 py-1">#</th>
                <th className="border border-black px-2 py-1">Item</th>
                <th className="border border-black px-2 py-1 text-center">Qty</th>
                <th className="border border-black px-2 py-1 text-right">Rate</th>
                <th className="border border-black px-2 py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="border border-black px-2 py-1">{index + 1}</td>
                  <td className="border border-black px-2 py-1">
                    {line.name}
                    {line.code ? ` (${line.code})` : ""}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">{line.qty}</td>
                  <td className="border border-black px-2 py-1 text-right">
                    {formatPKR(line.unitPrice)}
                  </td>
                  <td className="border border-black px-2 py-1 text-right">
                    {formatPKR(line.unitPrice * line.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 ml-auto w-56 text-xs">
            <div className="flex justify-between border-t border-black py-1">
              <span>Subtotal</span>
              <span>Rs {formatPKR(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between py-1">
                <span>
                  Discount{discountMode === "percent" && discountNumber ? ` (${discountNumber}%)` : ""}
                </span>
                <span>- Rs {formatPKR(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t-2 border-black py-1 text-sm font-bold">
              <span>Total</span>
              <span>Rs {formatPKR(total)}</span>
            </div>
            {received > 0 ? (
              <>
                <div className="flex justify-between py-1">
                  <span>Received</span>
                  <span>Rs {formatPKR(received)}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold">
                  <span>Balance</span>
                  <span>Rs {formatPKR(balance)}</span>
                </div>
              </>
            ) : null}
          </div>

          {meta.notes ? <p className="mt-3 text-xs">Note: {meta.notes}</p> : null}

          <p className="mt-6 border-t border-black pt-2 text-center text-[10px]">
            Shukriya! Plaza Steel &amp; Crockery — WhatsApp +92 546501637
          </p>
        </div>
      </section>

      {/* -------- Saved bills -------- */}
      <SavedBills savedBills={savedBills} />
    </div>
  );
}

function SavedBills({ savedBills }: { savedBills: SavedBill[] }) {
  if (savedBills.length === 0) return null;
  return (
    <section className="surface-panel no-print mt-6 p-5">
      <h2 className="font-display text-lg tracking-wide text-chrome">SAVED BILLS</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Purane bills yahan save rehte hain — load karke dobara print ya edit kar sakein.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {savedBills.map((entry) => {
          const lineTotal = entry.lines.reduce(
            (sum, line) => sum + line.unitPrice * line.qty,
            0,
          );
          return (
            <li key={entry.id} className="rise-in rounded-xl border border-border bg-card/60 p-3">
              <p className="font-display text-sm tracking-wide">{entry.meta.billNo || "Bill"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {entry.meta.date || entry.savedAt.slice(0, 10)}
                {entry.meta.customerName ? ` — ${entry.meta.customerName}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.lines.length} items — Rs {formatPKR(lineTotal)}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => bill.loadSaved(entry.id)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => bill.deleteSaved(entry.id)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
