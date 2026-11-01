/**
 * Server-only stock loader.
 *
 * Reads every JSON file in the project-root `list/` folder. Drop a new file in
 * that folder (same shape as ALL_STOCK.json) and the whole site updates.
 *
 * The source files are tolerated in "loose" form:
 *  - missing outer [ ] brackets
 *  - trailing commas
 *  - a repeated "description" key, where the 2nd occurrence is the vendor name
 */

import type { PublicItem, StockItem } from "./stock-types";

export type { PublicItem, StockItem };


const rawFiles = import.meta.glob("/list/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Keeps the first `description` as the product name and the second as vendor. */
function reviveObject(pairs: [string, unknown][]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    if (key === "description" && "description" in out) {
      if (!("vendor" in out)) out["vendor"] = value;
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** JSON.parse with duplicate-key handling, since JSON.parse drops duplicates. */
function parseLoose(source: string): Record<string, unknown>[] {
  const trimmed = source.trim().replace(/,\s*$/, "");
  const wrapped = trimmed.startsWith("[") ? trimmed : `[${trimmed}]`;

  // Rename repeated "description" keys before parsing so both survive.
  const objects: Record<string, unknown>[] = [];
  const parsed = JSON.parse(wrapped, function (this: unknown, key, value) {
    return key === "" ? value : value;
  }) as unknown;

  if (!Array.isArray(parsed)) return objects;

  // Re-scan the raw text to recover duplicate description values.
  const rawChunks = wrapped
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(/\}\s*,\s*\{/g);

  parsed.forEach((row, index) => {
    if (!row || typeof row !== "object") return;
    const record = { ...(row as Record<string, unknown>) };
    const chunk = rawChunks[index];
    if (chunk) {
      const matches = [...chunk.matchAll(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
      if (matches.length > 1) {
        record["description"] = matches[0]![1];
        record["vendor"] = record["vendor"] ?? matches[matches.length - 1]![1];
      }
    }
    objects.push(record);
  });

  return objects;
}

function normalize(row: Record<string, unknown>, fallbackId: number): StockItem | null {
  const name = clean(row["description"] ?? row["name"] ?? row["item"]);
  if (!name) return null;

  const code = clean(row["code"] ?? row["item_code"]);
  const brand = clean(row["fld_brand"] ?? row["brand"]).toUpperCase();
  const category = (clean(row["catagory"] ?? row["category"]) || "OTHER").toUpperCase();
  const rate = toNumber(row["rate"] ?? row["sale"] ?? row["price"]);
  const cost = toNumber(row["cost"]);
  const qty = toNumber(row["qty_inhand"] ?? row["qty"]);
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, "");

  return {
    id: code ? `c-${normalizedCode}` : `n-${fallbackId}`,
    code,
    name,
    category,
    brand,
    vendor: clean(row["vendor"]),
    rate,
    cost,
    qty,
    isWestPoint: normalizedCode.startsWith("WP") || brand.includes("WEST POINT"),
  };
}

let cache: StockItem[] | null = null;

export function getAllStock(): StockItem[] {
  if (cache) return cache;

  const byId = new Map<string, StockItem>();
  let counter = 0;

  // Sort by filename so a newer file (e.g. list/2026-STOCK.json) wins by code.
  for (const path of Object.keys(rawFiles).sort()) {
    const source = rawFiles[path];
    if (!source) continue;
    let rows: Record<string, unknown>[] = [];
    try {
      rows = parseLoose(source);
    } catch (error) {
      console.error(`[stock] could not read ${path}:`, error);
      continue;
    }
    for (const row of rows) {
      const item = normalize(row, counter++);
      if (item) byId.set(item.id, item);
    }
  }

  cache = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function toPublic(item: StockItem): PublicItem {
  const { cost: _cost, vendor: _vendor, ...rest } = item;
  return rest;
}

export function getPublicStock(): PublicItem[] {
  return getAllStock()
    .filter((item) => item.rate > 0)
    .map(toPublic);
}

export function getCategories(): string[] {
  return [...new Set(getPublicStock().map((item) => item.category))].sort();
}
