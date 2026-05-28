import { useEffect, useState } from 'react';
import { TrendingUp, Sprout, Warehouse, Coins, Info, LineChart, Percent } from 'lucide-react';
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
    <div className="flex items-center justify-between py-1.5 border-b border-black/[0.03] last:border-b-0">
      <div>
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>
        {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
      </div>
      <span className="font-semibold text-zinc-950 text-[14px]">{value}</span>
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
    <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-[#F2F2F7]">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border-[2.5px] border-[#1A5C38] border-t-transparent animate-spin" />
        <span className="text-[13px] font-medium text-zinc-500">Cargando precios...</span>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-[#F2F2F7]">
      <div className="text-center px-4">
        <Info size={32} className="text-zinc-300 mx-auto mb-2" />
        <p className="text-[13px] font-medium text-zinc-500">Sin datos disponibles en este momento</p>
      </div>
    </div>
  );

  const ventaPositivo = data.precio_venta_mxn >= 0;

  return (
    <div className="bg-[#F2F2F7] pb-6">
      {/* Header — Apple 2026 Glassmorphic Slim header */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-[24px] shadow-[0_4px_16px_rgba(26,92,56,0.15)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-4">
          <p className="text-[10px] font-bold text-green-300/80 uppercase tracking-widest mb-1.5">Mercado</p>
          <h1 className="text-[18px] sm:text-[20px] font-black text-white leading-tight tracking-tight">
            Desglose de Precios
          </h1>
          <p className="text-[12px] font-medium text-white/50 mt-0.5">Maíz blanco · Referencias oficiales</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3.5 space-y-3">
        {/* PRECIO 1 — Margen de Negociación */}
        <div className="bg-white rounded-[20px] p-3.5 shadow-sm border border-black/[0.03]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Coins size={14} className="text-amber-500" />
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
              Precio 1 — Margen de Negociación
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className="bg-zinc-50/70 border border-black/[0.02] rounded-xl p-2.5 hover:bg-zinc-50 transition-colors">
              <p className="text-[10px] text-zinc-400 font-medium">CME Chicago</p>
              <p className="font-extrabold text-[14px] text-zinc-900 mt-0.5">
                ${data.precio_chicago_usd_bushel} <span className="text-[10px] font-medium text-zinc-400">USD/bu</span>
              </p>
            </div>
            <div className="bg-zinc-50/70 border border-black/[0.02] rounded-xl p-2.5 hover:bg-zinc-50 transition-colors">
              <p className="text-[10px] text-zinc-400 font-medium">Conversión TM</p>
              <p className="font-extrabold text-[14px] text-zinc-900 mt-0.5">
                {(data.precio_chicago_usd_bushel * 39.368).toFixed(1)} <span className="text-[10px] font-medium text-zinc-400">USD/t</span>
              </p>
            </div>
            <div className="bg-zinc-50/70 border border-black/[0.02] rounded-xl p-2.5 hover:bg-zinc-50 transition-colors">
              <p className="text-[10px] text-zinc-400 font-medium">Tipo de Cambio</p>
              <p className="font-extrabold text-[14px] text-zinc-900 mt-0.5">
                ${data.tipo_cambio_mxn} <span className="text-[10px] font-medium text-zinc-400">MXN</span>
              </p>
            </div>
            <div className="bg-zinc-50/70 border border-black/[0.02] rounded-xl p-2.5 hover:bg-zinc-50 transition-colors">
              <p className="text-[10px] text-zinc-400 font-medium">Bono Adicional</p>
              <p className="font-extrabold text-[14px] text-zinc-900 mt-0.5">
                ${data.bono_maiz_usd} <span className="text-[10px] font-medium text-zinc-400">USD</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl px-3.5 py-2.5 flex justify-between items-center">
            <span className="text-[12px] text-amber-900 font-bold">Total Margen CME</span>
            <span className="text-[16px] font-black text-amber-700">
              ${formatNum(data.margen_negociacion_mxn, 0)} <span className="text-[10px] font-semibold text-amber-600/80">MXN/t</span>
            </span>
          </div>
        </div>

        {/* PRECIO 2 — Precio de Compra */}
        <div className="bg-white rounded-[20px] p-3.5 shadow-sm border border-black/[0.03]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sprout size={14} className="text-emerald-500" />
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
              Precio 2 — Precio de Compra
            </p>
          </div>

          <div className="space-y-2 mb-2.5">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center hover:bg-emerald-50 transition-colors">
              <div>
                <p className="text-[12px] font-bold text-emerald-900 flex items-center gap-1">
                  Ingreso Productor
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{data.pct_productor}% del precio total</p>
              </div>
              <span className="text-[16px] font-black text-[#1A5C38]">${formatNum(data.precio_origen_mxn, 0)}</span>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-3.5 py-2.5 flex justify-between items-center hover:bg-blue-50 transition-colors">
              <div>
                <p className="text-[12px] font-bold text-blue-900 flex items-center gap-1">
                  Servicios de Bodega
                </p>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">{data.pct_servicios}% del precio total</p>
              </div>
              <span className="text-[16px] font-black text-blue-700">${formatNum(data.servicios_bodega_mxn, 0)}</span>
            </div>
          </div>

          <div className="bg-zinc-950 rounded-xl px-3.5 py-2.5 flex justify-between items-center shadow-sm">
            <span className="text-[12px] text-zinc-200 font-semibold">Total Precio de Compra</span>
            <span className="text-[16px] font-black text-white">
              ${formatNum(data.precio_compra_mxn, 0)} <span className="text-[10px] font-semibold text-zinc-400">MXN/t</span>
            </span>
          </div>
        </div>

        {/* PRECIO 3 — Precio de Venta */}
        <div className={`rounded-[20px] p-3.5 shadow-sm border ${ventaPositivo ? 'bg-white border-black/[0.03]' : 'bg-red-50/50 border-red-100'}`}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Warehouse size={14} className="text-indigo-500" />
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
              Precio 3 — Precio de Venta
            </p>
          </div>
          
          <div className="space-y-0.5 mb-2.5">
            <PrecioRow label="Precio de compra base" value={`$${formatNum(data.precio_compra_mxn, 0)} MXN/t`} />
            <PrecioRow label="Margen de negociación internacional" value={`− $${formatNum(data.margen_negociacion_mxn, 0)} MXN/t`} />
          </div>

          <div className={`rounded-xl px-3.5 py-2.5 flex justify-between items-center border ${ventaPositivo ? 'bg-green-50/60 border-green-200/50' : 'bg-red-100/60 border-red-200'}`}>
            <span className={`text-[12px] font-bold ${ventaPositivo ? 'text-green-900' : 'text-red-950'}`}>
              Precio de Venta Estimado
            </span>
            <span className={`text-[16px] font-black ${ventaPositivo ? 'text-[#1A5C38]' : 'text-red-700'}`}>
              {ventaPositivo ? '' : '−'}${formatNum(Math.abs(data.precio_venta_mxn), 0)} <span className="text-[10px] font-semibold">MXN/t</span>
            </span>
          </div>
          {!ventaPositivo && (
            <p className="text-[11px] text-red-600 mt-2 font-medium">
              El margen de negociación supera el precio de compra en este periodo.
            </p>
          )}
        </div>

        {/* PRECIO 4 — CEDIS (en desarrollo) */}
        <div className="bg-white rounded-[20px] p-3.5 shadow-sm border border-black/[0.02] flex items-center justify-between opacity-60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">Precio 4 — CEDIS</p>
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">Precio en centros de distribución</p>
          </div>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2.5 py-0.5 rounded-full font-bold tracking-wide">
            FUTURO
          </span>
        </div>

        {/* Gráfica tendencia 30 días */}
        {data.series && data.series.length > 1 && (
          <div className="bg-white rounded-[20px] p-3.5 shadow-sm border border-black/[0.03]">
            <div className="flex items-center gap-1.5 mb-3">
              <LineChart size={14} className="text-[#1A5C38]" />
              <p className="text-[12px] font-bold text-zinc-800">Tendencia (30 días)</p>
            </div>
            
            <div className="flex items-end gap-0.5 h-20 px-1">
              {data.series.map((s, i) => {
                const vals = data.series.map(t => t.precio_compra);
                const max = Math.max(...vals);
                const min = Math.min(...vals);
                const range = max - min || 1;
                const h = ((s.precio_compra - min) / range) * 75 + 15;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-full bg-[#1A5C38] rounded-t-[2px] opacity-75 hover:opacity-100 transition-opacity duration-150"
                      style={{ height: `${h}%` }} 
                      title={`${s.fecha}: $${s.precio_compra}`} 
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-zinc-400 mt-2 border-t border-black/[0.02] pt-1.5">
              <span>{data.series[0]?.fecha}</span>
              <span>{data.series[data.series.length - 1]?.fecha}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
