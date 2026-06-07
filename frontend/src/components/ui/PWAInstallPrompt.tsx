import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// The BeforeInstallPromptEvent type isn't standard in TypeScript's DOM lib yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log("SW Registered", r);
    },
    onRegisterError(error: Error) {
      console.log("SW registration error", error);
    },
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the A2HS prompt`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!needRefresh && !showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:bottom-8 md:left-auto md:right-8 md:w-96">
      <div className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xl outline outline-1 backdrop-blur-md"
           style={{ background: "var(--glass-bg)", outlineColor: "var(--glass-border)" }}>
        
        {needRefresh ? (
          <>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>Update Available ✨</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                A new version of NearMyColleges is available. Update now to get the latest features.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 rounded-xl py-2 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                Update Now
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Close
              </button>
            </div>
          </>
        ) : showInstallPrompt ? (
          <>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>📱 Install NearMyColleges App</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Install our app to your home screen for a faster, full-screen experience without typing the URL.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-xl py-2 text-xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                Install App
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Not Now
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
