import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface Bodega {
  id: number; nombre: string; municipio: string; estado: string;
  semaforo_compra: string; ocupacion_pct: number; stock_actual: number; capacidad_ton: number;
}

const semaforoMap: Record<string, { label: string; dot: string; badge: string }> = {
  verde: { label: 'Comprando', dot: '🟢', badge: 'bg-green-100 text-green-700' },
  amarillo: { label: 'Cap. limitada', dot: '🟡', badge: 'bg-yellow-100 text-yellow-700' },
  rojo: { label: 'No compra', dot: '🔴', badge: 'bg-red-100 text-red-700' },
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

  const barColor = (p: number) => p < 70 ? 'bg-[#1A5C38]' : p < 90 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#1A5C38] to-[#2d7a52] px-4 sm:px-6 pt-6 pb-7 text-white">
        <h1 className="text-[22px] font-bold">Mis Bodegas</h1>
        <p className="text-green-200 text-[14px] mt-0.5">{bodegas.length} bodegas asociadas</p>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-3">
        {loading && <p className="text-center text-[14px] text-gray-400 py-10">Cargando…</p>}

        {bodegas.map(b => {
          const sem = semaforoMap[b.semaforo_compra] || semaforoMap.verde;
          const pct = b.ocupacion_pct ?? 0;
          return (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[17px] text-gray-900 truncate">{b.nombre}</p>
                  <p className="text-[13px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />{b.municipio}, {b.estado}
                  </p>
                </div>
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${sem.badge}`}>
                  {sem.dot} {sem.label}
                </span>
              </div>

              {/* Barra ocupación */}
              <div className="mb-3">
                <div className="flex justify-between text-[12px] text-gray-400 mb-1.5">
                  <span>Ocupación {pct}%</span>
                  <span>{(b.stock_actual || 0).toLocaleString()} / {(b.capacidad_ton || 0).toLocaleString()} ton</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/bodegas/${b.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#F2F2F7] text-[#1A5C38] rounded-xl py-2.5 text-[14px] font-semibold active:opacity-70 transition-opacity"
                >
                  Ver detalle <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => navigate(`/bodegas/${b.id}/semaforo`)}
                  className="flex-1 bg-[#F2F2F7] text-gray-700 rounded-xl py-2.5 text-[14px] font-semibold active:opacity-70 transition-opacity"
                >
                  Actualizar semáforo
                </button>
              </div>
            </div>
          );
        })}

        {!loading && bodegas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🏪</p>
            <p className="font-semibold text-[16px] text-gray-600">Sin bodegas asociadas</p>
            <p className="text-[14px] mt-1">Agrega las bodegas que operas</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/bodegas/seleccionar')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
