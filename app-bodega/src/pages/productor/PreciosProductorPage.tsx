import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatNum } from '../../utils/format';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface MercadoData {
  precio_chicago_usd_bushel: number;
  tipo_cambio_mxn: number;
  bono_maiz_usd: number;
  margen_negociacion_mxn: number;
  precio_origen_mxn: number;
  servicios_bodega_mxn: number;
  precio_compra_mxn: number;
  pct_productor: number;
  pct_servicios: number;
  precio_venta_mxn: number;
  precio_cedis_disponible: boolean;
  series: { fecha: string; precio_compra: number; margen_negociacion: number; precio_venta: number }[];
}

function PrecioRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-sm text-zinc-600">{label}</span>
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
      </div>
      <span className="font-bold text-zinc-800 text-sm">{value}</span>
    </div>
  );
}

export default function PreciosProductorPage() {
  const [data, setData] = useState<MercadoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/precios/mercado`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Cargando precios...
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Sin datos disponibles
    </div>
  );

  const ventaPositivo = data.precio_venta_mxn >= 0;

  return (
    <div className="bg-[#F2F2F7] pb-8">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-2">Precios</p>
          <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">
            Desglose de precios
          </h1>
          <p className="text-[13px] font-medium text-white/40 mt-0.5">Maíz blanco · Mercado nacional</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 space-y-4">

        {/* PRECIO 1 — Margen de Negociación */}
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-3">
            Precio 1 — Margen de Negociación
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-xs text-zinc-400">Chicago</p>
              <p className="font-bold text-zinc-800">${data.precio_chicago_usd_bushel} <span className="text-xs font-normal text-zinc-400">USD/bu</span></p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-xs text-zinc-400">Conversión</p>
              <p className="font-bold text-zinc-800">{(data.precio_chicago_usd_bushel * 39.368).toFixed(1)} <span className="text-xs font-normal text-zinc-400">USD/ton</span></p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-xs text-zinc-400">Tipo de cambio</p>
              <p className="font-bold text-zinc-800">${data.tipo_cambio_mxn} <span className="text-xs font-normal text-zinc-400">MXN</span></p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-xs text-zinc-400">Bono maíz</p>
              <p className="font-bold text-zinc-800">${data.bono_maiz_usd} <span className="text-xs font-normal text-zinc-400">USD</span></p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-amber-800 font-medium">Total margen</span>
            <span className="text-lg font-black text-amber-700">${formatNum(data.margen_negociacion_mxn, 0)} <span className="text-xs font-normal">MXN/ton</span></span>
          </div>
        </div>

        {/* PRECIO 2 — Precio de Compra */}
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-3">
            Precio 2 — Precio de Compra
          </p>
          <div className="space-y-2 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-green-800">🌽 Lo que ganas tú</p>
                <p className="text-xs text-green-600">{data.pct_productor}% del precio de compra</p>
              </div>
              <span className="text-lg font-black text-[#1A5C38]">${formatNum(data.precio_origen_mxn, 0)}</span>
            </div>
            <div className="flex items-center justify-center text-zinc-300 text-lg font-bold">+</div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-blue-800">🏪 Servicios bodega</p>
                <p className="text-xs text-blue-600">{data.pct_servicios}% del precio de compra</p>
              </div>
              <span className="text-lg font-black text-blue-700">${formatNum(data.servicios_bodega_mxn, 0)}</span>
            </div>
            <div className="flex items-center justify-center text-zinc-300 text-lg font-bold">=</div>
          </div>
          <div className="bg-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-white font-semibold">Total precio de compra</span>
            <span className="text-lg font-black text-white">${formatNum(data.precio_compra_mxn, 0)} <span className="text-xs font-normal text-zinc-400">MXN/ton</span></span>
          </div>
        </div>

        {/* PRECIO 3 — Precio de Venta */}
        <div className={`rounded-2xl p-4 shadow-sm ring-1 ${ventaPositivo ? 'bg-white ring-zinc-100' : 'bg-red-50 ring-red-200'}`}>
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-3">
            Precio 3 — Precio de Venta
          </p>
          <PrecioRow label="Precio compra" value={`$${formatNum(data.precio_compra_mxn, 0)}`} />
          <PrecioRow label="Margen negociación" value={`− $${formatNum(data.margen_negociacion_mxn, 0)}`} />
          <div className={`mt-2 rounded-xl px-4 py-3 flex justify-between items-center ${ventaPositivo ? 'bg-green-50 border border-green-200' : 'bg-red-100 border border-red-300'}`}>
            <span className={`text-sm font-semibold ${ventaPositivo ? 'text-green-800' : 'text-red-800'}`}>Precio de venta estimado</span>
            <span className={`text-lg font-black ${ventaPositivo ? 'text-[#1A5C38]' : 'text-red-700'}`}>
              {ventaPositivo ? '' : '−'}${formatNum(Math.abs(data.precio_venta_mxn), 0)} <span className="text-xs font-normal text-zinc-400">MXN/ton</span>
            </span>
          </div>
          {!ventaPositivo && (
            <p className="text-xs text-red-600 mt-2">El margen de negociación supera el precio de compra en este período.</p>
          )}
        </div>

        {/* PRECIO 4 — CEDIS (en desarrollo) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100 flex items-center justify-between opacity-60">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">Precio 4 — CEDIS</p>
            <p className="text-sm text-zinc-500 mt-1">Precio en centro de distribución</p>
          </div>
          <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full font-medium">En desarrollo</span>
        </div>

        {/* Gráfica tendencia 30 días */}
        {data.series && data.series.length > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100">
            <p className="text-sm font-bold text-zinc-700 flex items-center gap-1 mb-3">
              <TrendingUp size={14} /> Tendencia 30 días — Precio de Compra
            </p>
            <div className="flex items-end gap-0.5 h-24">
              {data.series.map((s, i) => {
                const vals = data.series.map(t => t.precio_compra);
                const max = Math.max(...vals);
                const min = Math.min(...vals);
                const range = max - min || 1;
                const h = ((s.precio_compra - min) / range) * 80 + 16;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full bg-[#1A5C38] rounded-t opacity-70"
                      style={{ height: `${h}%` }} title={`${s.fecha}: $${s.precio_compra}`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>{data.series[0]?.fecha}</span>
              <span>{data.series[data.series.length - 1]?.fecha}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
