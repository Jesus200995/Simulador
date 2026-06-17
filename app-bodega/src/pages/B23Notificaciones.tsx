import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Signal, Receipt, Store, Megaphone, ClipboardList, Tag, Wheat } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

interface Notif {
  id: number;
  leida: boolean;
  created_at: string;
  titulo: string | null;
  mensaje: string | null;
  tipo: string | null;
  referencia_id: number | null;
  referencia_tipo: string | null;
  alerta_id: number | null;
  tipo_alerta: string | null;
  nivel_alerta: string | null;
}

const TIPO_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; route?: string }> = {
  nuevo_requerimiento:       { icon: Signal,         color: 'text-cyan-600',    bg: 'bg-cyan-50',    route: '/requerimientos' },
  interes_senal:             { icon: Signal,         color: 'text-cyan-600',    bg: 'bg-cyan-50',    route: '/requerimientos' },
  confirmacion_transaccion:  { icon: Receipt,        color: 'text-orange-500',  bg: 'bg-orange-50',  route: '/transacciones' },
  interes_bodega_oferta:     { icon: Megaphone,      color: 'text-blue-600',    bg: 'bg-blue-50',    route: '/oferta' },
  nueva_disponibilidad:      { icon: Wheat,          color: 'text-green-600',   bg: 'bg-green-50',   route: '/oferta' },
  solicitud_apoyo:           { icon: Store,          color: 'text-purple-600',  bg: 'bg-purple-50',  route: '/ventanillas' },
  cambio_estado_solicitud:   { icon: ClipboardList,  color: 'text-green-600',   bg: 'bg-green-50' },
  alerta_tarifario:          { icon: Tag,            color: 'text-amber-600',   bg: 'bg-amber-50',   route: '/tarifario' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function B23Notificaciones() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = () => {
      api.notificaciones.mis()
        .then((r: any) => setNotifs(r.notificaciones || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    cargar();
    // Auto-refresco cada 30 segundos mientras la página está abierta
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  async function marcarTodas() {
    await api.notificaciones.leerTodas();
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  }

  async function tocarNotif(n: Notif) {
    if (!n.leida) {
      api.notificaciones.leer(n.id).catch(() => {});
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
    }
    const cfg = TIPO_CONFIG[n.tipo || ''];
    if (cfg?.route) {
      navigate(cfg.route);
    }
  }

  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <div className="w-full">
      <PageHeader
        title="Notificaciones"
        subtitle={noLeidas > 0 ? `${noLeidas} sin leer` : 'Todas leídas'}
        back="/dashboard"
        action={
          noLeidas > 0 ? (
            <button onClick={marcarTodas} className="flex items-center gap-1.5 text-[13px] text-[#1A5C38] font-semibold active:opacity-60">
              <CheckCheck size={15} /> Leer todas
            </button>
          ) : undefined
        }
      />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-[#f4fbf7] rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Bell size={40} className="text-gray-300" />
            </div>
            <p className="text-[17px] text-gray-600 font-bold tracking-tight">No tienes notificaciones por ahora</p>
            <p className="text-[14px] text-gray-400 mt-1 font-medium">Cuando haya actividad en tus bodegas, aparecerá aquí.</p>
          </div>
        ) : (
          notifs.map(n => {
            const cfg = TIPO_CONFIG[n.tipo || ''] || { icon: Bell, color: 'text-gray-500', bg: 'bg-[#f4fbf7]' };
            const Icon = cfg.icon;
            const titulo = n.titulo || n.tipo_alerta || 'Notificación';
            const mensaje = n.mensaje || '';

            return (
              <button
                key={n.id}
                onClick={() => tocarNotif(n)}
                className={`w-full flex items-start gap-4 p-5 rounded-[1.5rem] border text-left transition-all duration-500 active:scale-[0.98] group/notif
                  ${n.leida ? 'bg-white border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5' : 'bg-emerald-50/30 border-[#1A5C38]/20 shadow-[0_4px_16px_rgba(26,92,56,0.08)] hover:-translate-y-0.5'}`}
              >
                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover/notif:scale-110 ${cfg.bg}`}>
                  <Icon size={22} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0 transition-transform duration-500 group-hover/notif:translate-x-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-[16px] truncate ${n.leida ? 'font-bold text-gray-700' : 'font-black text-gray-900 group-hover/notif:text-[#1A5C38] transition-colors'}`}>
                      {titulo}
                    </p>
                    {!n.leida && (
                      <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-[#1A5C38] shadow-[0_0_8px_rgba(26,92,56,0.5)]" />
                    )}
                  </div>
                  {mensaje && <p className={`text-[13px] mt-1 line-clamp-2 ${n.leida ? 'text-gray-500 font-medium' : 'text-gray-600 font-medium'}`}>{mensaje}</p>}
                  <p className="text-[12px] text-gray-400 mt-2 font-medium">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
