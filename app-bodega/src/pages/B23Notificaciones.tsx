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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-[15px] text-gray-400 font-medium">No tienes notificaciones por ahora</p>
            <p className="text-[13px] text-gray-300 mt-1">Cuando haya actividad en tus bodegas, aparecerá aquí.</p>
          </div>
        ) : (
          notifs.map(n => {
            const cfg = TIPO_CONFIG[n.tipo || ''] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
            const Icon = cfg.icon;
            const titulo = n.titulo || n.tipo_alerta || 'Notificación';
            const mensaje = n.mensaje || '';

            return (
              <button
                key={n.id}
                onClick={() => tocarNotif(n)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]
                  ${n.leida ? 'bg-white border-black/[0.04]' : 'bg-white border-[#1A5C38]/20 shadow-sm'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                  <Icon size={17} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[14px] truncate ${n.leida ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {titulo}
                    </p>
                    {!n.leida && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#1A5C38]" />
                    )}
                  </div>
                  {mensaje && <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-2">{mensaje}</p>}
                  <p className="text-[11px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
