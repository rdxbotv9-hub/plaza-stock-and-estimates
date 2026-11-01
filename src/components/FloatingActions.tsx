import { DEV_WHATSAPP_DIGITS, SHOP_WHATSAPP_DIGITS, waLink } from "@/lib/stock-types";

export function FloatingActions() {
  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <a
        href={waLink(DEV_WHATSAPP_DIGITS, "Hello SARDAR RDX, I need a website.")}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
        Sardar RDX
      </a>

      <a
        href={waLink(
          SHOP_WHATSAPP_DIGITS,
          "Assalam o Alaikum Plaza Steel & Crockery, mujhe rate chahiye.",
        )}
        target="_blank"
        rel="noreferrer"
        className="pulse-ring flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 font-display text-sm tracking-wide text-whatsapp-foreground shadow-xl transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.42 1.28 4.86L2 22l5.3-1.34a9.9 9.9 0 0 0 4.74 1.2c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.32-1.94 1.38-.54.06-1.02.1-1.94-.24-.92-.34-3.1-1.2-4.8-3.5-1.7-2.3-1.44-3.2-1.3-3.62.14-.42.72-1.1 1.02-1.24.3-.14.6-.1.84-.06.24.04.44.06.68.6.24.54.72 1.86.78 2 .06.14.1.3.02.48-.08.18-.36.6-.6.82-.14.14-.3.28-.12.58.18.3.62.98 1.3 1.6.86.8 1.6 1.1 1.9 1.22.3.12.48.1.66-.06.18-.16.72-.72.92-.98.2-.26.38-.2.62-.12.24.08 1.5.72 1.76.86.26.14.42.2.48.32.06.12.06.7-.18 1.38Z" />
        </svg>
        WhatsApp Order
      </a>
    </div>
  );
}
