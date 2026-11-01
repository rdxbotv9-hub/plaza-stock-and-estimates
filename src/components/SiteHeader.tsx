import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { useBill } from "@/lib/estimate-store";

const links = [
  { to: "/", label: "Rate List" },
  { to: "/westpoint", label: "West Point" },
  { to: "/graceware", label: "Graceware" },
  { to: "/estimate", label: "Estimate Bill" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const lines = useBill();
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="shine-sweep">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-plaza.png"
              alt="Plaza Steel & Crockery logo"
              className="glow-logo h-12 w-12 rounded-full bg-chrome/90 object-contain p-1"
              width={48}
              height={48}
            />
            <span className="leading-tight">
              <span className="block font-display text-lg tracking-wide text-brand-gradient">
                PLAZA
              </span>
              <span className="block text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Steel &amp; Crockery
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex flex-wrap items-center gap-1.5">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{ className: "border-ring bg-accent text-accent-foreground" }}
                className="rounded-full border border-border/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:text-sm"
              >
                {link.label}
                {link.to === "/estimate" && count > 0 ? (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {count}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-border/50 bg-accent/30">
        <nav aria-label="Brand websites" className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Brand websites</span>
          <a href="https://graceware.shop/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-display text-sm text-chrome transition-colors hover:text-gold">
            Graceware <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <span className="h-4 border-l border-border" aria-hidden="true" />
          <a href="https://www.westpoint.pk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-display text-sm text-chrome transition-colors hover:text-gold">
            West Point <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
