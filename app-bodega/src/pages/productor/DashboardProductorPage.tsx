import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Wheat, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNum } from '../../utils/format';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface DashData {
  municipio: string;
  estado: string;
  location_confirmed: boolean;
  centroid_source: string;
  precio_hoy: number | null;
  precio_ayer: number | null;
  alerta_activa: { mensaje: string; tipo: string } | null;
  bodegas_cercanas: {
    id: number; nombre: string; municipio: string;
    precio_compra_hoy: number; is_ventanilla: boolean;
    estado_compra: string; distancia_km: number;
  }[];
  nombres: string;
  estado_validacion: string;
}

const SEMAFORO: Record<string, { cls: string; texto: string }> = {
  comprando:  { cls: 'bg-emerald-500', texto: 'Comprando' },
  limitado:   { cls: 'bg-amber-400', texto: 'Capacidad limitada' },
  no_compra:  { cls: 'bg-red-500', texto: 'No compra' },
};

function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 animate-pulse">
      <div className="bg-[#1A5C38] h-28" />
      <div className="max-w-2xl mx-auto px-4">
        <div className="-mt-4 bg-white rounded-2xl h-32" />
        <div className="mt-5 space-y-3">
          <div className="bg-white rounded-2xl h-20" />
          <div className="bg-white rounded-2xl h-20" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardProductorPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isPendiente = data?.estado_validacion === 'pendiente';
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('dismiss_ubicacion') === '1');

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;

  const delta = (data?.precio_hoy ?? 0) - (data?.precio_ayer ?? 0);
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-zinc-50">
      {data?.alerta_activa && (
        <div className={`px-4 sm:px-6 py-3 flex items-center justify-between
          ${data.alerta_activa.tipo === 'alerta_climatica' ? 'bg-orange-500' : 'bg-red-600'}`}>
          <p className="text-white text-sm font-medium flex-1 leading-tight flex items-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0" /> {data.alerta_activa.mensaje}
          </p>
          <button onClick={() => navigate('/productor/alertas')}
            className="ml-3 text-white text-xs border border-white/60 rounded-lg px-3 py-1.5 shrink-0 font-medium hover:bg-white/10 transition-colors">
            Ver detalle
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] px-4 sm:px-6 pt-5 pb-6 rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-2xl mx-auto">
          <p className="text-green-200/80 text-[13px]">{data?.municipio} - {hoy}</p>
          <p className="text-white text-lg sm:text-xl font-semibold mt-0.5">
            Buenos dias, {data?.nombres?.split(' ')[0]}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="-mt-4 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 font-medium">
            Precio de compra hoy - tu region
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-zinc-900">
              ${data?.precio_hoy ? formatNum(data.precio_hoy, 0) : '--'}
            </span>
            <span className="text-base text-zinc-400 pb-1">/ton</span>
            {delta !== 0 && (
              <span className={`text-sm pb-1 font-semibold flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {delta > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                ${formatNum(Math.abs(delta), 0)}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Promedio regional</p>
          <button onClick={() => navigate('/productor/precios')}
            className="mt-3 text-[#1A5C38] text-sm font-semibold flex items-center gap-1 hover:underline">
            Ver desglose de precios <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-zinc-700 mb-3">Bodegas comprando hoy</p>
          <div className="space-y-2">
            {(data?.bodegas_cercanas ?? []).map(b => {
              const sem = SEMAFORO[b.estado_compra] || SEMAFORO.comprando;
              return (
                <button key={b.id}
                  onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100
                             flex items-center justify-between active:scale-[0.98] transition-all duration-200 text-left hover:ring-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${sem.cls}`} />
                    <div>
                      <p className="font-semibold text-zinc-800 text-sm leading-tight">{b.nombre}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {b.municipio} - {Number(b.distancia_km).toFixed(0)} km
                        {b.is_ventanilla && (
                          <span className="ml-2 bg-emerald-50 text-[#1A5C38] text-xs px-2 py-0.5 rounded-full font-medium">
                            Ventanilla
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-zinc-900 text-sm">
                      ${b.precio_compra_hoy ? formatNum(b.precio_compra_hoy, 0) : '--'}
                    </p>
                    <p className="text-xs text-zinc-400">/ton</p>
                  </div>
                </button>
              );
            })}
            {(data?.bodegas_cercanas?.length ?? 0) === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">No hay bodegas registradas en tu region aun</p>
            )}
          </div>
          <button onClick={() => navigate('/productor/mapa')}
            className="w-full mt-3 py-3 text-[#1A5C38] text-sm font-semibold
                       ring-2 ring-[#1A5C38] rounded-2xl hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200">
            Ver mapa completo
          </button>
        </div>

        <div className="mt-5">
          <button
            onClick={() => !isPendiente && navigate('/productor/disponibilidad/tipo')}
            disabled={isPendiente}
            className={`w-full py-5 rounded-2xl text-white text-lg font-semibold
              flex items-center justify-center gap-3 transition-all duration-200
              ${isPendiente ? 'bg-zinc-300 cursor-not-allowed'
                : 'bg-[#1A5C38] hover:bg-[#15482d] active:scale-[0.97] shadow-lg shadow-green-900/20'}`}
          >
            <Wheat size={24} />
            Tengo maiz disponible
          </button>
          {isPendiente && (
            <p className="text-center text-xs text-zinc-400 mt-2">
              Tu cuenta esta en validacion. Te avisamos cuando puedas declarar disponibilidad.
            </p>
          )}
        </div>

        {data && !data.location_confirmed && !dismissed && (
          <div className="mt-4 bg-amber-50 ring-1 ring-amber-200 rounded-2xl p-4">
            <p className="text-amber-800 text-sm font-semibold flex items-center gap-1.5">
              <MapPin size={14} /> Mejora tu experiencia
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Marca tu parcela en el mapa para ver solo las bodegas mas cercanas a ti.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => navigate('/productor/ubicacion')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm py-2.5 rounded-xl font-semibold transition-colors">
                Marcar mi parcela
              </button>
              <button onClick={() => { localStorage.setItem('dismiss_ubicacion', '1'); setDismissed(true); }}
                className="px-4 text-amber-600 text-sm hover:underline">
                Ahora no
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
