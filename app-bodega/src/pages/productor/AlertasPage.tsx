import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ShieldAlert, CloudRain, ShoppingCart, Receipt, Heart,
  MapPin, ChevronDown, ChevronUp, Check, Loader2, BellRing, X, ClipboardCheck,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Notif {
  id: number; tipo: string; mensaje: string; leida: boolean; created_at: string;
  titulo?: string; referencia_id?: number; referencia_tipo?: string; datos_extra?: any;
}

const parseExtra = (d: any) => {
  if (!d) return {};
  try { return typeof d === 'string' ? JSON.parse(d) : d; } catch { return {}; }
};

type Cfg = { Icon: any; label: string; tile: string; chip: string };
const TIPO_CFG: Record<string, Cfg> = {
  alerta_sanitaria:        { Icon: ShieldAlert, label: 'Sanitaria',       tile: 'bg-red-50 text-red-600 ring-red-100',         chip: 'bg-red-50 text-red-600' },
  alerta_climatica:        { Icon: CloudRain,   label: 'Climática',       tile: 'bg-orange-50 text-orange-600 ring-orange-100', chip: 'bg-orange-50 text-orange-600' },
  senal_compra:            { Icon: ShoppingCart,label: 'Señal de compra', tile: 'bg-emerald-50 text-emerald-600 ring-emerald-100', chip: 'bg-emerald-50 text-emerald-700' },
  interes_senal:           { Icon: Heart,       label: 'Interés',         tile: 'bg-rose-50 text-rose-600 ring-rose-100',      chip: 'bg-rose-50 text-rose-600' },
  interes_bodega_oferta:   { Icon: Heart,       label: 'Interés de bodega', tile: 'bg-rose-50 text-rose-600 ring-rose-100',   chip: 'bg-rose-50 text-rose-600' },
  confirmacion_transaccion:{ Icon: Receipt,     label: 'Transacción',     tile: 'bg-blue-50 text-blue-600 ring-blue-100',      chip: 'bg-blue-50 text-blue-600' },
  transaccion:             { Icon: Receipt,     label: 'Transacción',     tile: 'bg-blue-50 text-blue-600 ring-blue-100',      chip: 'bg-blue-50 text-blue-600' },
};
const DEFAULT_CFG: Cfg = { Icon: Bell, label: 'Aviso', tile: 'bg-[#eef8f2] text-gray-500 ring-gray-200', chip: 'bg-[#eef8f2] text-gray-500' };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

const INTERES_KEY = 'simac_senales_interes';
const loadInteres = (): Set<number> => {
  try { return new Set(JSON.parse(localStorage.getItem(INTERES_KEY) || '[]')); } catch { return new Set(); }
};

export default function AlertasPage() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [interes, setInteres] = useState<Set<number>>(loadInteres());
  const [enviando, setEnviando] = useState<number | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const cargar = () => {
      const token = localStorage.getItem('simac_token');
      fetch(`${BASE}/alertas/notificaciones/mis`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setNotifs(d.notificaciones || d || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const marcarLeida = async (id: number) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/alertas/notificaciones/${id}/leer`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const mostrarToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Abre Google Maps hacia la bodega usando datos_extra de la notificación
  const abrirMapaBodega = (n: Notif) => {
    const x = parseExtra(n.datos_extra);
    if (x.bodega_lat && x.bodega_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${x.bodega_lat},${x.bodega_lng}`, '_blank');
    } else if (x.bodega_municipio) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${x.bodega_municipio}, ${x.bodega_estado || ''}`)}`, '_blank');
    } else {
      navigate('/productor/mapa');
    }
  };

  // "Me interesa": registra interés, marca leída y abre el mapa de la bodega
  const marcarInteres = async (n: Notif) => {
    const senalId = n.referencia_id!;
    setEnviando(senalId);
    try {
      const token = localStorage.getItem('simac_token');
      const r = await fetch(`${BASE}/senales-compra/${senalId}/interes`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const next = new Set(interes); next.add(senalId); setInteres(next);
      localStorage.setItem(INTERES_KEY, JSON.stringify([...next]));
      if (!n.leida) marcarLeida(n.id);
      mostrarToast(true, '¡Interés enviado! La bodega fue notificada.');
      abrirMapaBodega(n);
    } catch {
      mostrarToast(false, 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setEnviando(null);
    }
  };

  // "No me interesa": solo marca la notificación como leída
  const descartarSenal = (n: Notif) => {
    if (!n.leida) marcarLeida(n.id);
    mostrarToast(true, 'Listo, no te mostraremos esta señal de nuevo.');
  };

  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <div className="bg-[#eef8f2] min-h-full">
      {/* ── Banner ── */}
      <div className="sticky top-0 z-20 w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_8px_30px_rgba(26,92,56,0.25)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 flex-shrink-0">
              <BellRing size={19} className="text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">Notificaciones</h1>
              <p className="text-[12.5px] font-medium text-green-100/70 mt-0.5">
                {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-10 space-y-2.5">
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-[84px] bg-white/70 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-sm ring-1 ring-gray-100 mb-4">
              <Bell size={30} className="text-gray-300" />
            </div>
            <p className="text-[15px] font-semibold text-gray-700">Sin notificaciones</p>
            <p className="text-[13px] text-gray-400 mt-1">Aquí verás señales de compra, alertas y avisos</p>
          </div>
        )}

        {!loading && notifs.map((n, i) => {
          const cfg = TIPO_CFG[n.tipo] || DEFAULT_CFG;
          const Icon = cfg.Icon;
          const isOpen = expanded === n.id;
          const esSenal = n.tipo === 'senal_compra' && !!n.referencia_id;
          const yaInteresado = esSenal && interes.has(n.referencia_id!);
          const enviandoEste = enviando === n.referencia_id;

          return (
            <div
              key={n.id}
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 overflow-hidden animate-fade-in transition-all duration-300
                ${n.leida ? 'ring-gray-100' : 'ring-[#1A5C38]/15'}`}
            >
              {/* Header (toca para expandir + marcar leída; transacción → confirmar) */}
              <button
                onClick={() => {
                  if (n.tipo === 'confirmacion_transaccion' && n.referencia_id) {
                    if (!n.leida) marcarLeida(n.id);
                    navigate(`/productor/transaccion/${n.referencia_id}/confirmar`);
                    return;
                  }
                  setExpanded(isOpen ? null : n.id);
                  if (!n.leida) marcarLeida(n.id);
                }}
                className="w-full flex items-start gap-3 p-3.5 text-left active:bg-[#f4fbf7]/60 transition-colors"
              >
                {/* Icono profesional */}
                <div className={`relative w-10 h-10 rounded-2xl ring-1 flex items-center justify-center flex-shrink-0 ${cfg.tile}`}>
                  <Icon size={18} strokeWidth={2.1} />
                  {!n.leida && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1A5C38] ring-2 ring-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold ${cfg.chip}`}>{cfg.label}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className={`text-[13.5px] leading-snug whitespace-pre-line ${isOpen ? '' : 'line-clamp-2'} ${n.leida ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                    {n.mensaje}
                  </p>
                </div>

                <span className="text-gray-300 shrink-0 mt-0.5">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {/* Acciones para señal de compra (#9) */}
              {esSenal && (
                <div className="px-3.5 pb-3.5 -mt-0.5">
                  {yaInteresado ? (
                    <div className="flex items-center justify-between gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700">
                        <Check size={15} strokeWidth={2.6} /> Ya respondiste a esta señal
                      </span>
                      <button onClick={() => abrirMapaBodega(n)}
                        className="flex items-center gap-1 text-[12px] font-bold text-[#1A5C38] hover:underline">
                        <MapPin size={13} /> Ver en mapa
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => !enviandoEste && marcarInteres(n)}
                        disabled={enviandoEste}
                        className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold bg-[#1A5C38] text-white shadow-[0_4px_14px_rgba(26,92,56,0.3)] hover:bg-[#16512f] active:scale-[0.97] transition-all duration-200 disabled:opacity-60"
                      >
                        {enviandoEste
                          ? <><Loader2 size={15} className="animate-spin" /> Enviando…</>
                          : <><Heart size={15} strokeWidth={2.3} /> Me interesa</>}
                      </button>
                      <button
                        onClick={() => descartarSenal(n)}
                        className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-gray-500 bg-[#f4fbf7] ring-1 ring-gray-200 hover:bg-[#eef8f2] active:scale-[0.97] transition-all duration-200"
                      >
                        <X size={15} strokeWidth={2.4} /> No me interesa
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Acción para confirmar transacción (#8) */}
              {n.tipo === 'confirmacion_transaccion' && n.referencia_id && (
                <div className="px-3.5 pb-3.5 -mt-0.5">
                  <button
                    onClick={() => { if (!n.leida) marcarLeida(n.id); navigate(`/productor/transaccion/${n.referencia_id}/confirmar`); }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:bg-blue-700 active:scale-[0.97] transition-all duration-200"
                  >
                    <ClipboardCheck size={15} strokeWidth={2.3} /> Revisar y confirmar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Toast flotante premium ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] w-[calc(100%-2rem)] max-w-xs animate-fade-in">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md
            ${toast.ok ? 'bg-[#1A5C38] text-white' : 'bg-red-600 text-white'}`}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {toast.ok ? <Check size={16} strokeWidth={2.8} /> : <ShieldAlert size={16} />}
            </div>
            <p className="text-[13px] font-semibold leading-snug">{toast.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
