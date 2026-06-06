import { useRegisterSW } from "virtual:pwa-register/react";

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

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:bottom-8 md:left-auto md:right-8 md:w-96">
      <div className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl outline outline-1 outline-white/10 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-bold">Update Available ✨</h3>
          <p className="mt-1 text-xs text-slate-300">
            A new version of NearMyColleges is available. Update now to get the latest features.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-900 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Update Now
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
