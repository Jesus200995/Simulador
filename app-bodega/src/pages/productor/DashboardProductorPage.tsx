import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, ChevronRight } from 'lucide-react';
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

const SEMAFORO: Record<string, { emoji: string; texto: string }> = {
  comprando:  { emoji: '🟢', texto: 'Comprando' },
  limitado:   { emoji: '🟡', texto: 'Capacidad limitada' },
  no_compra:  { emoji: '🔴', texto: 'No compra esta semana' },
};

function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-[#1A5C38] h-28" />
      <div className="mx-4 -mt-4 bg-white rounded-2xl h-32" />
      <div className="mx-4 mt-5 space-y-3">
        <div className="bg-white rounded-2xl h-20" />
        <div className="bg-white rounded-2xl h-20" />
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Alerta activa */}
      {data?.alerta_activa && (
        <div className={`px-4 py-3 flex items-center justify-between
          ${data.alerta_activa.tipo === 'alerta_climatica' ? 'bg-orange-500' : 'bg-red-600'}`}>
          <p className="text-white text-sm font-medium flex-1 leading-tight">
            ⚠ {data.alerta_activa.mensaje}
          </p>
          <button onClick={() => navigate('/productor/alertas')}
            className="ml-3 text-white text-xs border border-white/60 rounded-lg px-3 py-1.5 shrink-0 font-medium">
            Ver detalle
          </button>
        </div>
      )}

      {/* Header verde */}
      <div className="bg-[#1A5C38] px-4 pt-5 pb-6 flex items-start justify-between">
        <div>
          <p className="text-green-200 text-sm">{data?.municipio} · {hoy}</p>
          <p className="text-white text-lg font-semibold mt-0.5">
            Buenos días, {data?.nombres?.split(' ')[0]}
          </p>
        </div>
        <button onClick={() => navigate('/productor/alertas')} className="relative p-2">
          <Bell size={22} className="text-white" />
        </button>
      </div>

      {/* Precio del día */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Precio de compra hoy · tu región
        </p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">
            ${data?.precio_hoy ? formatNum(data.precio_hoy, 0) : '—'}
          </span>
          <span className="text-base text-gray-400 pb-1">/ton</span>
          {delta !== 0 && (
            <span className={`text-sm pb-1 font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {delta > 0 ? '↑' : '↓'} ${formatNum(Math.abs(delta), 0)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Promedio regional</p>
        <button onClick={() => navigate('/productor/precios')}
          className="mt-3 text-[#1A5C38] text-sm font-semibold flex items-center gap-1">
          Ver desglose de precios <ChevronRight size={14} />
        </button>
      </div>

      {/* Bodegas cercanas */}
      <div className="mx-4 mt-5">
        <p className="text-sm font-bold text-gray-700 mb-3">Bodegas comprando hoy</p>
        <div className="space-y-2">
          {(data?.bodegas_cercanas ?? []).map(b => (
            <button key={b.id}
              onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100
                         flex items-center justify-between active:scale-[0.98] transition-transform text-left">
              <div className="flex items-center gap-3">
                <span className="text-xl">{SEMAFORO[b.estado_compra]?.emoji || '🟢'}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{b.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.municipio} · {Number(b.distancia_km).toFixed(0)} km
                    {b.is_ventanilla && (
                      <span className="ml-2 bg-[#E8F5EE] text-[#1A5C38] text-xs px-2 py-0.5 rounded-full font-medium">
                        Ventanilla
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-gray-900 text-sm">
                  ${b.precio_compra_hoy ? formatNum(b.precio_compra_hoy, 0) : '—'}
                </p>
                <p className="text-xs text-gray-400">/ton</p>
              </div>
            </button>
          ))}
          {(data?.bodegas_cercanas?.length ?? 0) === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No hay bodegas registradas en tu región aún</p>
          )}
        </div>
        <button onClick={() => navigate('/productor/mapa')}
          className="w-full mt-3 py-3 text-[#1A5C38] text-sm font-semibold
                     border-2 border-[#1A5C38] rounded-2xl active:bg-green-50">
          Ver mapa completo
        </button>
      </div>

      {/* Botón principal */}
      <div className="mx-4 mt-5">
        <button
          onClick={() => !isPendiente && navigate('/productor/disponibilidad/tipo')}
          disabled={isPendiente}
          className={`w-full py-5 rounded-2xl text-white text-lg font-bold
            flex items-center justify-center gap-3 transition-all
            ${isPendiente ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#1A5C38] active:scale-[0.97] shadow-lg shadow-green-900/20'}`}
        >
          <span className="text-2xl">🌽</span>
          Tengo maíz disponible
        </button>
        {isPendiente && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Tu cuenta está en validación. Te avisamos cuando puedas declarar disponibilidad.
          </p>
        )}
      </div>

      {/* Banner ubicación */}
      {data && !data.location_confirmed && !dismissed && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 text-sm font-semibold flex items-center gap-1">
            <MapPin size={14} /> Mejora tu experiencia
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Marca tu parcela en el mapa para ver solo las bodegas más cercanas a ti.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => navigate('/productor/ubicacion')}
              className="flex-1 bg-amber-500 text-white text-sm py-2.5 rounded-xl font-semibold">
              Marcar mi parcela
            </button>
            <button onClick={() => { localStorage.setItem('dismiss_ubicacion', '1'); setDismissed(true); }}
              className="px-4 text-amber-600 text-sm">
              Ahora no
            </button>
          </div>
        </div>
      )}

      {/* Nav inferior simple */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <button onClick={() => navigate('/productor')}
          className="flex-1 py-3 text-center text-xs font-semibold text-[#1A5C38]">
          <span className="text-lg block">🏠</span>Inicio
        </button>
        <button onClick={() => navigate('/productor/mapa')}
          className="flex-1 py-3 text-center text-xs text-gray-400">
          <span className="text-lg block">🗺</span>Mapa
        </button>
        <button onClick={() => navigate('/productor/precios')}
          className="flex-1 py-3 text-center text-xs text-gray-400">
          <span className="text-lg block">💰</span>Precios
        </button>
        <button onClick={() => navigate('/productor/incentivos')}
          className="flex-1 py-3 text-center text-xs text-gray-400">
          <span className="text-lg block">🏛</span>Apoyos
        </button>
        <button onClick={() => navigate('/productor/perfil')}
          className="flex-1 py-3 text-center text-xs text-gray-400">
          <span className="text-lg block">👤</span>Perfil
        </button>
      </div>
    </div>
  );
}
