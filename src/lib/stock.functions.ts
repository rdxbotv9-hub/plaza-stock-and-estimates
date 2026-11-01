import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

import type { PublicItem, StockItem } from "./stock-types";

type AdminSession = { admin?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "plaza-admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Public catalogue: sale rate only, cost and vendor never leave the server. */
export const getPublicCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicStock, getCategories } = await import("./stock.server");
  return {
    items: getPublicStock() as PublicItem[],
    categories: getCategories(),
  };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => ({
    username: String(data?.username ?? "").trim(),
    password: String(data?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = process.env["ADMIN_USERNAME"];
    const pass = process.env["ADMIN_PASSWORD"];
    if (!user || !pass) return { ok: false as const };

    if (!matches(data.username.toLowerCase(), user.toLowerCase()) || !matches(data.password, pass)) {
      return { ok: false as const };
    }

    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { admin: session.data.admin === true };
});

/** Full stock with cost — only returned to a logged-in admin. */
export const getAdminStock = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  if (session.data.admin !== true) {
    return { authorized: false as const, items: [] as StockItem[] };
  }
  const { getAllStock } = await import("./stock.server");
  return { authorized: true as const, items: getAllStock() as StockItem[] };
});
