import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        setInterval(() => { r.update(); }, 60 * 60 * 1000);
      }
    },
  });

  const [dismissed, setDismissed] = useState(false);

  function handleUpdate() {
    updateServiceWorker(true);
  }

  function handleDismiss() {
    setDismissed(true);
    setNeedRefresh(false);
  }

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1A5C38] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] px-4 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <RefreshCw size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight">Nueva versión disponible</p>
          <p className="text-[11px] text-white/70 mt-0.5">Toca actualizar para aplicar los cambios</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="bg-white text-[#1A5C38] text-[12px] font-bold px-3 py-1.5 rounded-xl hover:bg-green-50 active:scale-95 transition-all"
          >
            Actualizar
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
