import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface Bodega {
  id: number; nombre: string; municipio: string; estado: string;
  semaforo_compra: string; ocupacion_pct: number; stock_actual: number; capacidad_ton: number;
}

const semaforoMap: Record<string, { label: string; dot: string }> = {
  verde: { label: 'Comprando', dot: '🟢' },
  amarillo: { label: 'Cap. limitada', dot: '🟡' },
  rojo: { label: 'No compra', dot: '🔴' },
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

  const barColor = (p: number) => p < 70 ? 'bg-green-500' : p < 90 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-[#1A5C38] text-white px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold">Mis Bodegas</h1>
        <p className="text-green-200 text-sm">{bodegas.length} bodegas asociadas</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading && <p className="text-center text-gray-400 py-8">Cargando…</p>}

        {bodegas.map(b => {
          const sem = semaforoMap[b.semaforo_compra] || semaforoMap.verde;
          const pct = b.ocupacion_pct ?? 0;
          return (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{b.nombre}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />{b.municipio}, {b.estado}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold">{sem.dot} {sem.label}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Ocupación {pct}%</span>
                      <span>{(b.stock_actual || 0).toLocaleString()} / {(b.capacidad_ton || 0).toLocaleString()} ton</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate(`/bodegas/${b.id}`)}
                  className="flex-1 text-sm font-semibold text-[#1A5C38] border border-[#1A5C38] rounded-lg py-2 hover:bg-green-50 flex items-center justify-center gap-1"
                >
                  Ver detalle <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => navigate(`/bodegas/${b.id}/semaforo`)}
                  className="flex-1 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
                >
                  Actualizar semáforo
                </button>
              </div>
            </div>
          );
        })}

        {!loading && bodegas.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🏪</p>
            <p className="font-semibold">Sin bodegas asociadas</p>
            <p className="text-sm mt-1">Agrega las bodegas que operas</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/bodegas/seleccionar')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-900 active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
