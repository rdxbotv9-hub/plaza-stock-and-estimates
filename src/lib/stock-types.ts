export type StockItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  vendor: string;
  rate: number;
  cost: number;
  qty: number;
  isWestPoint: boolean;
};

export type PublicItem = Omit<StockItem, "cost" | "vendor">;

export const SHOP_WHATSAPP = "+92546501637";
export const SHOP_WHATSAPP_DIGITS = "92546501637";
export const DEV_WHATSAPP_DIGITS = "923301068874";

export function formatPKR(value: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function waLink(digits: string, message: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
