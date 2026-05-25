import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import { formatNum } from '../../utils/format';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface PrecioData {
  estado: string;
  fecha: string;
  precio_compra: number | null;
  precio_bodega: number | null;
  precio_mercado: number | null;
  fira: { costo_por_ha: number; precio_fira: number; pct_ganancia: number; modalidad: string } | null;
  tendencia: { fecha: string; precio_compra: number }[];
}

const PRECIOS_CONFIG = [
  { clave: 'precio_compra', etiqueta: 'Precio de compra', desc: 'Lo que te pagan por tu maíz hoy en tu región', color: 'text-[#1A5C38]', bg: 'bg-green-50', importante: true },
  { clave: 'precio_bodega', etiqueta: 'Precio bodega', desc: 'Precio de compra más servicios de secado y limpieza', color: 'text-blue-700', bg: 'bg-blue-50', importante: false },
  { clave: 'precio_mercado', etiqueta: 'Precio de mercado', desc: 'Lo que paga la industria harinera. Incluye transporte.', color: 'text-purple-700', bg: 'bg-purple-50', importante: false },
];

export default function PreciosProductorPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PrecioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/precios`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando precios...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="flex items-center px-4 py-3 border-b bg-white">
        <button onClick={() => navigate('/productor')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">Precios</h1>
        <div className="w-8" />
      </div>

      <div className="px-4 pt-4">
        <p className="text-xs text-gray-400 mb-4">{data?.estado} · {data?.fecha}</p>

        {/* Tres precios */}
        <div className="space-y-3">
          {PRECIOS_CONFIG.map(cfg => {
            const val = data?.[cfg.clave as keyof PrecioData] as number | null;
            return (
              <div key={cfg.clave} className={`${cfg.bg} rounded-2xl p-4 ${cfg.importante ? 'border-2 border-green-200' : ''}`}>
                <p className="text-xs text-gray-500 font-medium">{cfg.etiqueta}</p>
                <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>
                  {val ? `$${formatNum(val, 0)}` : '—'} <span className="text-sm font-normal text-gray-400">/ton</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{cfg.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Tendencia */}
        {data?.tendencia && data.tendencia.length > 1 && (
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-3">
              <TrendingUp size={14} /> Tendencia 30 días
            </p>
            <div className="flex items-end gap-0.5 h-24">
              {data.tendencia.map((p, i) => {
                const max = Math.max(...data.tendencia.map(t => t.precio_compra));
                const min = Math.min(...data.tendencia.map(t => t.precio_compra));
                const range = max - min || 1;
                const h = ((p.precio_compra - min) / range) * 80 + 16;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full bg-[#1A5C38] rounded-t opacity-70"
                      style={{ height: `${h}%` }} title={`${p.fecha}: $${p.precio_compra}`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{data.tendencia[0]?.fecha?.slice(5)}</span>
              <span>{data.tendencia[data.tendencia.length - 1]?.fecha?.slice(5)}</span>
            </div>
          </div>
        )}

        {/* FIRA */}
        {data?.fira && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">
              Referencia de costos FIRA · {data.estado}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Modalidad</span>
                <span className="font-medium">{data.fira.modalidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Costo por hectárea</span>
                <span className="font-semibold">${formatNum(data.fira.costo_por_ha, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio FIRA de referencia</span>
                <span className="font-semibold text-[#1A5C38]">${formatNum(data.fira.precio_fira, 0)}/ton</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Fuente: FIRA · Ciclo PV 2026. Solo disponible para estados con datos reportados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
