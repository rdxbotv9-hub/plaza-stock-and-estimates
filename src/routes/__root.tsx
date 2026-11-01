import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingActions } from "@/components/FloatingActions";
import { InstallPrompt } from "@/components/InstallPrompt";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-brand-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-hero inline-flex rounded-full px-5 py-2.5 text-sm font-medium">
            Go to rate list
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-hero inline-flex rounded-full px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Plaza Steel & Crockery — Rate List" },
      {
        name: "description",
        content:
          "Plaza Steel & Crockery rate list: search steel, crockery and appliance prices, West Point stock and estimate bills.",
      },
      { name: "theme-color", content: "#1b1d23" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Plaza Rates" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Plaza Steel & Crockery — Rate List" },
      {
        property: "og:description",
        content: "Search live rates, West Point stock and build estimate bills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const timer = window.setTimeout(() => {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="no-print border-t border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
          <p>
            Plaza Steel &amp; Crockery — WhatsApp +92546501637
          </p>
          <p className="mt-1">
            Website by{" "}
            <a
              href="https://wa.me/923301068874"
              target="_blank"
              rel="noreferrer"
              className="text-gold transition-colors hover:text-foreground"
            >
              SARDAR RDX — Website Creator (+92 330 1068874)
            </a>
          </p>
        </footer>
        <FloatingActions />
        <InstallPrompt />
      </div>
    </QueryClientProvider>
  );
}
