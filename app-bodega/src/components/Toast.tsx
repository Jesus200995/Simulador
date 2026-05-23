import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastCtx {
  toast:   (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastCtx | null>(null);
let _n = 0;

/* ─── Icon & accent per type ─── */
const CFG: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string }> = {
  success: {
    icon: <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />,
    bar:  'bg-emerald-400',
    bg:   'bg-white',
  },
  error: {
    icon: <XCircle size={20} className="text-red-500 shrink-0" />,
    bar:  'bg-red-400',
    bg:   'bg-white',
  },
  info: {
    icon: <Info size={20} className="text-blue-500 shrink-0" />,
    bar:  'bg-blue-400',
    bg:   'bg-white',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts]   = useState<ToastItem[]>([]);
  const [dialog, setDialog]   = useState<{ msg: string } | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const remove = useCallback((id: number) =>
    setToasts(p => p.filter(t => t.id !== id)), []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_n;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const confirm = useCallback((msg: string): Promise<boolean> =>
    new Promise(res => { resolveRef.current = res; setDialog({ msg }); }), []);

  function closeDialog(val: boolean) {
    resolveRef.current?.(val);
    setDialog(null);
  }

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ── Toast stack (top-center) ── */}
      <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[9999] flex flex-col items-center gap-2 pt-4 px-4 pointer-events-none">
        {toasts.map(t => {
          const c = CFG[t.type];
          return (
            <div key={t.id}
              className={`animate-toast-in pointer-events-auto w-full max-w-[380px] ${c.bg}
                rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden
                flex items-stretch`}>
              {/* left accent bar */}
              <div className={`w-1 shrink-0 ${c.bar}`} />
              <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                {c.icon}
                <p className="flex-1 text-[14px] font-medium text-gray-800 leading-snug">{t.message}</p>
                <button onClick={() => remove(t.id)}
                  className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 ml-1">
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Confirm dialog (always centered, strong blur) ── */}
      {dialog && (
        <div
          className="animate-backdrop-in fixed inset-0 z-[9998] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <div className="animate-modal-in w-full max-w-[320px] bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-7 pb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle size={26} className="text-red-400" />
              </div>
              <p className="text-[16px] font-semibold text-gray-900 leading-snug">{dialog.msg}</p>
              <p className="text-[13px] text-gray-400 mt-1.5">Esta acción no se puede deshacer.</p>
            </div>
            {/* Buttons */}
            <div className="flex divide-x divide-gray-100 border-t border-gray-100">
              <button onClick={() => closeDialog(false)}
                className="flex-1 py-4 text-[16px] font-medium text-gray-500 active:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => closeDialog(true)}
                className="flex-1 py-4 text-[16px] font-bold text-red-500 active:bg-red-50 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
