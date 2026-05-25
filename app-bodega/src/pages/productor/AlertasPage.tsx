import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Bell } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Notif {
  id: number; tipo: string; mensaje: string; leida: boolean; created_at: string;
  titulo?: string; referencia_id?: number;
}

const NIVEL_CONFIG: Record<string, { color: string; label: string }> = {
  alerta_sanitaria: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Sanitaria' },
  alerta_climatica: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Climática' },
  senal_compra:     { color: 'bg-green-100 text-green-700 border-green-200', label: 'Señal de compra' },
  transaccion:      { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Transacción' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default function AlertasPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/alertas/notificaciones/mis`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNotifs(d.notificaciones || d || []))
      .finally(() => setLoading(false));
  }, []);

  const marcarLeida = async (id: number) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/alertas/notificaciones/${id}/leer`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;

  return (
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.15)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <h1 className="text-[20px] font-bold text-white leading-tight">Alertas</h1>
          <p className="text-[13px] text-green-200/60 mt-0.5">Notificaciones recientes</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 space-y-3">
        {notifs.length === 0 && (
          <div className="text-center py-12">
            <Bell size={40} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400">No tienes alertas por ahora</p>
          </div>
        )}

        {notifs.map(n => {
          const cfg = NIVEL_CONFIG[n.tipo] || { color: 'bg-gray-100 text-gray-700 border-gray-200', label: n.tipo };
          const isOpen = expanded === n.id;
          return (
            <button key={n.id}
              onClick={() => { setExpanded(isOpen ? null : n.id); if (!n.leida) marcarLeida(n.id); }}
              className={`w-full bg-white rounded-2xl p-4 shadow-sm ring-1 text-left transition-all duration-200
                ${n.leida ? 'ring-zinc-100' : 'ring-zinc-100 border-l-4 border-l-[#1A5C38]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-zinc-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className={`text-sm leading-snug ${n.leida ? 'text-zinc-600' : 'text-zinc-800 font-medium'}`}>
                    {n.mensaje}
                  </p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-zinc-400 shrink-0 mt-1" />
                         : <ChevronDown size={16} className="text-zinc-400 shrink-0 mt-1" />}
              </div>
              {isOpen && n.titulo && (
                <p className="mt-2 text-xs text-zinc-500 border-t border-zinc-100 pt-2">{n.titulo}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
