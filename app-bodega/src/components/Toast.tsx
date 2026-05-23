import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_counter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({ message, resolve });
    });
  }, []);

  function closeDialog(value: boolean) {
    resolveRef.current?.(value);
    setDialog(null);
  }

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} className="shrink-0 text-emerald-500" />,
    error:   <XCircle    size={18} className="shrink-0 text-red-500" />,
    info:    <AlertCircle size={18} className="shrink-0 text-blue-500" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-l-4 border-emerald-400',
    error:   'border-l-4 border-red-400',
    info:    'border-l-4 border-blue-400',
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100vw-32px)] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] px-4 py-3.5 ${borders[t.type]} animate-slide-down`}>
            {icons[t.type]}
            <p className="flex-1 text-[14px] leading-snug text-gray-800 font-medium">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-gray-300 hover:text-gray-500 mt-0.5">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <p className="text-[16px] font-semibold text-gray-800 leading-snug text-center">{dialog.message}</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => closeDialog(false)}
                className="flex-1 py-4 text-[16px] text-gray-500 font-medium border-r border-gray-100 active:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => closeDialog(true)}
                className="flex-1 py-4 text-[16px] text-red-500 font-semibold active:bg-red-50">
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
