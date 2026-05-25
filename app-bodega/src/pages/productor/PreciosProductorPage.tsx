import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
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
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.15)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <h1 className="text-[20px] font-bold text-white leading-tight">Precios</h1>
          <p className="text-[13px] text-green-200/60 mt-0.5">Tu region</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        <p className="text-xs text-zinc-400 mb-4">{data?.estado} - {data?.fecha}</p>

        {/* Tres precios */}
        <div className="space-y-3">
          {PRECIOS_CONFIG.map(cfg => {
            const val = data?.[cfg.clave as keyof PrecioData] as number | null;
            return (
              <div key={cfg.clave} className={`${cfg.bg} rounded-2xl p-4 ${cfg.importante ? 'ring-2 ring-emerald-200' : 'ring-1 ring-zinc-100'}`}>
                <p className="text-xs text-zinc-500 font-medium">{cfg.etiqueta}</p>
                <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>
                  {val ? `$${formatNum(val, 0)}` : '--'} <span className="text-sm font-normal text-zinc-400">/ton</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">{cfg.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Tendencia */}
        {data?.tendencia && data.tendencia.length > 1 && (
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100">
            <p className="text-sm font-bold text-zinc-700 flex items-center gap-1 mb-3">
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
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>{data.tendencia[0]?.fecha?.slice(5)}</span>
              <span>{data.tendencia[data.tendencia.length - 1]?.fecha?.slice(5)}</span>
            </div>
          </div>
        )}

        {/* FIRA */}
        {data?.fira && (
          <div className="mt-4 bg-blue-50 ring-1 ring-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">
              Referencia de costos FIRA · {data.estado}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Modalidad</span>
                <span className="font-medium">{data.fira.modalidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Costo por hectarea</span>
                <span className="font-semibold">${formatNum(data.fira.costo_por_ha, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Precio FIRA de referencia</span>
                <span className="font-semibold text-[#1A5C38]">${formatNum(data.fira.precio_fira, 0)}/ton</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-3">
              Fuente: FIRA · Ciclo PV 2026. Solo disponible para estados con datos reportados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
