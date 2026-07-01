import { useState, useEffect, useCallback } from 'react';
import { Bell, X, BellRing, Loader2, Smartphone } from 'lucide-react';

const BASE      = import.meta.env.VITE_API_URL || '/api';
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';
const STORAGE_KEY = 'simac_push_dismissed_until';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...window.atob(base64)].map(c => c.charCodeAt(0)));
}

function esPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||           // iOS Safari
    document.referrer.startsWith('android-app://')      // TWA Android
  );
}

function pushSoportado(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_KEY;
}

interface Props {
  rol: 'bodeguero' | 'productor';
}

export default function PushPrompt({ rol }: Props) {
  const [visible, setVisible]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito]       = useState(false);

  // Decide si mostrar el banner
  useEffect(() => {
    if (!pushSoportado()) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;     // ya activado
    if (Notification.permission === 'denied') return;      // usuario bloqueó — no molestar

    // Si ya lo descartó recientemente, esperar
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

    // Mostrar inmediatamente si está en PWA instalada, si no esperar 8 seg
    const delay = esPWA() ? 1200 : 8000;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, []);

  // Detectar instalación de PWA (Android/Desktop) — pedir permiso automáticamente
  useEffect(() => {
    if (!pushSoportado()) return;
    const onInstall = () => {
      // Pequeño delay para que el OS procese la instalación
      setTimeout(() => {
        if (Notification.permission === 'default') setVisible(true);
      }, 2000);
    };
    window.addEventListener('appinstalled', onInstall);
    return () => window.removeEventListener('appinstalled', onInstall);
  }, []);

  const activar = useCallback(async () => {
    if (!pushSoportado()) return;
    setCargando(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setVisible(false);
        return;
      }
      const sw  = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });
      const { endpoint, keys } = sub.toJSON() as any;
      const token = localStorage.getItem('simac_token');
      await fetch(`${BASE}/productor/push/suscribir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      });
      setExito(true);
      setTimeout(() => setVisible(false), 2800);
    } catch (e) {
      console.warn('Push error:', e);
      setVisible(false);
    } finally {
      setCargando(false);
    }
  }, []);

  const descartar = () => {
    // Ocultar por 3 días
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  if (!visible) return null;

  const textos = {
    bodeguero: {
      titulo: 'Activa alertas instantáneas',
      desc: 'Entérate de nuevos requerimientos, intereses de productores y transacciones aunque no tengas la app abierta.',
    },
    productor: {
      titulo: 'Activa alertas en tu celular',
      desc: 'Recibe avisos de plagas cerca de tu parcela y señales de compra de bodegas aunque cierres la app.',
    },
  };

  const txt = textos[rol];

  return (
    <>
      {/* Overlay semitransparente solo en mobile PWA para mayor impacto */}
      {esPWA() && !exito && (
        <div
          className="fixed inset-0 bg-black/30 z-[998] backdrop-blur-[2px]"
          onClick={descartar}
          style={{ animation: 'fadeIn .2s ease' }}
        />
      )}

      <div
        className="fixed z-[999] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm"
        style={{
          bottom: esPWA() ? '5.5rem' : '1.25rem',   // sobre la barra de navegación en PWA
          animation: 'slideUp .3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className={`rounded-2xl shadow-2xl overflow-hidden border ${
          exito ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'
        }`}>

          {/* Barra de color superior */}
          {!exito && (
            <div className="h-1 bg-gradient-to-r from-[#1A5C38] via-emerald-400 to-[#1A5C38]" />
          )}

          <div className="p-4">
            {exito ? (
              /* Estado éxito */
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <BellRing size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-emerald-800">¡Listo! Notificaciones activadas</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Ya recibirás alertas aunque la app esté cerrada.</p>
                </div>
              </div>
            ) : (
              /* Estado normal */
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eef8f2] flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone size={17} className="text-[#1A5C38]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-gray-900 leading-tight">{txt.titulo}</p>
                    <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">{txt.desc}</p>
                  </div>
                  <button
                    onClick={descartar}
                    className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors -mt-0.5 -mr-0.5"
                  >
                    <X size={13} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={descartar}
                    className="flex-1 py-2 text-[12px] font-semibold text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={activar}
                    disabled={cargando}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[#1A5C38] hover:bg-[#154d2f] active:scale-[0.98] text-white font-bold text-[12.5px] py-2 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-[#1A5C38]/20"
                  >
                    {cargando
                      ? <><Loader2 size={12} className="animate-spin" /> Activando…</>
                      : <><Bell size={13} /> Activar notificaciones</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
      `}</style>
    </>
  );
}
