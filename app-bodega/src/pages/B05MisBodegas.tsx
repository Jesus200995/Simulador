import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, MapPin, Warehouse, Circle } from 'lucide-react';
import { api } from '../services/api';

interface Bodega {
  id: number; nombre: string; municipio: string; estado: string;
  semaforo_compra: string; ocupacion_pct: number; stock_actual: number; capacidad_ton: number;
}

const semaforoMap: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  verde:    { label: 'Comprando',       color: 'bg-emerald-500', dot: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amarillo: { label: 'Cap. limitada',   color: 'bg-amber-400',  dot: 'text-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  rojo:     { label: 'No compra',       color: 'bg-red-500',    dot: 'text-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
};

export default function B05MisBodegas() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.bodeguero.misBodegas()
      .then((r: any) => setBodegas(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const barColor = (p: number) => p < 70 ? 'bg-[#1A5C38]' : p < 90 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="w-full">
      {/* Banner full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <p className="text-[13px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Módulo</p>
          <h1 className="text-[26px] sm:text-[30px] font-black text-white leading-tight">Mis Bodegas</h1>
          <p className="text-green-200/70 text-[14px] mt-1">
            {loading ? 'Cargando…' : `${bodegas.length} bodega${bodegas.length !== 1 ? 's' : ''} asociada${bodegas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        )}

        {/* Grid: 1 col mobile → 2 cols tablet → 3 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {bodegas.map(b => {
            const sem = semaforoMap[b.semaforo_compra] || semaforoMap.verde;
            const pct = b.ocupacion_pct ?? 0;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[16px] text-gray-900 leading-tight">{b.nombre}</p>
                    <p className="text-[13px] text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{b.municipio}, {b.estado}</span>
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${sem.badge}`}>
                    <Circle size={7} fill="currentColor" className={sem.dot} />
                    {sem.label}
                  </span>
                </div>

                {/* Barra ocupación */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                    <span className="font-medium">Ocupación {pct}%</span>
                    <span>{(b.stock_actual || 0).toLocaleString()} / {(b.capacidad_ton || 0).toLocaleString()} ton</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(pct)} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/bodegas/${b.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A5C38]/[0.08] text-[#1A5C38] rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    Detalle <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate(`/bodegas/${b.id}/semaforo`)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    Semáforo
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && bodegas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Warehouse size={32} className="text-gray-300" />
            </div>
            <p className="font-semibold text-[16px] text-gray-700">Sin bodegas asociadas</p>
            <p className="text-[14px] text-gray-400">Toca + para agregar las bodegas que operas</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/bodegas/seleccionar')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
