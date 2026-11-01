import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

const DISMISS_KEY = "plaza-install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos) {
      setShowIos(true);
      setHidden(false);
    }

    const onInstalled = () => {
      window.localStorage.setItem(DISMISS_KEY, "1");
      setHidden(true);
      setEvent(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  return (
    <div className="no-print fixed bottom-4 left-4 z-50 max-w-xs rise-in surface-panel p-4">
      <div className="flex items-start gap-3">
        <img
          src="/icon-192.png"
          alt=""
          className="h-10 w-10 rounded-lg bg-chrome/90 object-contain p-0.5"
          width={40}
          height={40}
        />
        <div className="text-sm">
          <p className="font-display tracking-wide">Install Plaza App</p>
          {showIos ? (
            <p className="mt-1 text-xs text-muted-foreground">
              iPhone/iPad: tap <strong>Share</strong> then{" "}
              <strong>Add to Home Screen</strong> to install.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Add the rate list to your home screen for one-tap access.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {event ? (
              <button
                onClick={() => {
                  void event.prompt();
                  dismiss();
                }}
                className="btn-hero rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                Install
              </button>
            ) : null}
            <button
              onClick={dismiss}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
