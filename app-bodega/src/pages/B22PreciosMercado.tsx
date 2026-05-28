import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { PageBanner } from '../components/Layout';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

const BONO_MAIZ_USD = 50;

interface MercadoData {
  precio_chicago_usd_bushel: number;
  tipo_cambio_mxn: number;
  bono_maiz_usd: number;
  margen_negociacion_mxn: number;
  timestamp_chicago: string;
  precio_origen_mxn: number;
  servicios_bodega_mxn: number;
  precio_compra_mxn: number;
  pct_productor: number;
  pct_servicios: number;
  precio_venta_mxn: number;
  precio_cedis_disponible: boolean;
  precio_cedis_mxn: number | null;
  series: { fecha: string; precio_compra: number; margen_negociacion: number; precio_venta: number }[];
}

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtUsd(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin" />;
}

export default function B22PreciosMercado() {
  const [data, setData]       = useState<MercadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/precios/mercado`, { headers: HDR() });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch {
      setError('No se pudieron cargar los precios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const LABEL: Record<string, string> = {
    precio_compra:      'Precio de Compra',
    margen_negociacion: 'Margen de Negociación',
    precio_venta:       'Precio de Venta',
  };

  return (
    <div className="w-full">
      <PageBanner title="Precios del maíz blanco · Hoy" subtitle="Referencias de mercado actualizadas" back="/dashboard" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-6">

        {/* Encabezado + botón actualizar */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MÓDULO DE PRECIOS</p>
          <button onClick={cargar} disabled={loading}
            className="flex items-center gap-1.5 text-[13px] text-[#1A5C38] font-semibold disabled:opacity-40">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 rounded-2xl p-4 text-red-600 text-[13px] border border-red-100">{error}</div>
        )}

        {/* ── PRECIO 1 — Margen de Negociación ─────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest">1 DE 4</span>
            <h2 className="text-[15px] font-bold text-gray-800">Margen de Negociación</h2>
          </div>
          <p className="text-[12px] text-gray-400">
            Precio Chicago (CME) convertido a MXN/ton + Bono Maíz fijo de ${BONO_MAIZ_USD} USD/ton
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Card 1 — Precio Chicago */}
            <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio Chicago</p>
              <p className="text-[22px] font-black text-gray-800 leading-tight mt-1">
                {loading ? '—' : fmtUsd(data?.precio_chicago_usd_bushel ?? 0)}
              </p>
              <p className="text-[11px] text-gray-400">USD/bushel · CME Group</p>
            </div>
            {/* Card 2 — Conversión */}
            <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conversión</p>
              <p className="text-[22px] font-black text-gray-800 leading-tight mt-1">× 39.368</p>
              <p className="text-[11px] text-gray-400">
                = {loading ? '—' : fmtUsd((data?.precio_chicago_usd_bushel ?? 0) * 39.368)} USD/ton
              </p>
            </div>
            {/* Card 3 — Tipo de cambio */}
            <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de cambio</p>
              <p className="text-[22px] font-black text-gray-800 leading-tight mt-1">
                {loading ? '—' : `$${(data?.tipo_cambio_mxn ?? 0).toFixed(2)}`}
              </p>
              <p className="text-[11px] text-gray-400">MXN/USD · Banxico</p>
            </div>
            {/* Card 4 — Bono Maíz */}
            <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bono Maíz</p>
              <p className="text-[22px] font-black text-gray-800 leading-tight mt-1">+${BONO_MAIZ_USD} USD</p>
              <p className="text-[11px] text-gray-400">
                = {loading ? '—' : fmt(BONO_MAIZ_USD * (data?.tipo_cambio_mxn ?? 17.42))} MXN/ton
              </p>
            </div>
          </div>

          {/* Total Margen */}
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MARGEN DE NEGOCIACIÓN TOTAL</p>
            {loading
              ? <div className="flex justify-center py-2"><Spinner /></div>
              : <p className="text-[40px] font-black text-white leading-none">{fmt(data?.margen_negociacion_mxn)}</p>
            }
            <p className="text-[12px] text-gray-400 mt-1">MXN/ton · Chicago convertido + Bono Maíz</p>
          </div>
        </section>

        {/* ── PRECIO 2 — Precio de Compra ───────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest">2 DE 4</span>
            <h2 className="text-[15px] font-bold text-gray-800">Precio de Compra</h2>
          </div>

          <div className="border border-black/[0.06] rounded-2xl overflow-hidden shadow-sm">
            {/* PO — verde */}
            <div className="bg-[#1A5C38]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🌽</span>
                <p className="text-[11px] font-bold text-[#1A5C38] uppercase tracking-wider">Lo que gana el productor</p>
              </div>
              {loading
                ? <div className="flex py-1"><Spinner /></div>
                : <p className="text-[34px] font-black text-[#1A5C38] leading-none">{fmt(data?.precio_origen_mxn)}</p>
              }
              <p className="text-[11px] text-[#1A5C38]/70 mt-1">MXN/ton · Precio promedio pagado en bodegas · últimos 7 días</p>
              {!loading && data && (
                <div className="mt-2 inline-block bg-[#1A5C38]/15 rounded-lg px-2 py-0.5">
                  <p className="text-[11px] font-bold text-[#1A5C38]">{data.pct_productor}% del precio de compra</p>
                </div>
              )}
            </div>

            <div className="bg-white py-2 text-center border-y border-black/[0.04]">
              <span className="text-[22px] font-black text-gray-200">+</span>
            </div>

            {/* S — azul */}
            <div className="bg-[#1B4F8A]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🏪</span>
                <p className="text-[11px] font-bold text-[#1B4F8A] uppercase tracking-wider">Servicios de la bodega</p>
              </div>
              {loading
                ? <div className="flex py-1"><Spinner /></div>
                : <p className="text-[34px] font-black text-[#1B4F8A] leading-none">{fmt(data?.servicios_bodega_mxn)}</p>
              }
              <p className="text-[11px] text-[#1B4F8A]/70 mt-1">MXN/ton · Secado, limpieza, almacenamiento, etc.</p>
              {!loading && data && (
                <div className="mt-2 inline-block bg-[#1B4F8A]/15 rounded-lg px-2 py-0.5">
                  <p className="text-[11px] font-bold text-[#1B4F8A]">{data.pct_servicios}% del precio de compra</p>
                </div>
              )}
            </div>

            <div className="bg-white py-2 text-center border-y border-black/[0.04]">
              <span className="text-[22px] font-black text-gray-200">=</span>
            </div>

            {/* Total compra */}
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PRECIO DE COMPRA TOTAL</p>
              {loading
                ? <div className="flex justify-center py-2"><Spinner /></div>
                : <p className="text-[40px] font-black text-gray-800 leading-none">{fmt(data?.precio_compra_mxn)}</p>
              }
              <p className="text-[12px] text-gray-400 mt-1">MXN/ton</p>
            </div>
          </div>
        </section>

        {/* ── PRECIO 3 — Precio de Venta ────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest">3 DE 4</span>
            <h2 className="text-[15px] font-bold text-gray-800">Precio de Venta</h2>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-gray-500">Precio de Compra</p>
              <p className="text-[14px] font-semibold text-gray-700">
                {loading ? '—' : fmt(data?.precio_compra_mxn)} MXN/ton
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-gray-500">− Margen Negociación</p>
              <p className="text-[14px] font-semibold text-gray-700">
                {loading ? '—' : fmt(data?.margen_negociacion_mxn)} MXN/ton
              </p>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-end justify-between">
              <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Precio de Venta</p>
              {loading
                ? <Spinner />
                : <div className="text-right">
                    <p className={`text-[34px] font-black leading-none ${(data?.precio_venta_mxn ?? 0) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {fmt(data?.precio_venta_mxn)}
                    </p>
                    <p className="text-[11px] text-gray-400">MXN/ton</p>
                  </div>
              }
            </div>
          </div>
        </section>

        {/* ── PRECIO 4 — CEDIS En desarrollo ───────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest">4 DE 4</span>
            <h2 className="text-[15px] font-bold text-gray-800">Precio CEDIS</h2>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">EN DESARROLLO</span>
              <h3 className="text-sm font-semibold text-gray-600">Precio CEDIS</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Precio de compra en Centrales de Abasto menos el Margen de Negociación. 
              Próximamente disponible — en proceso de integración con fuentes de datos por contrato con CEDIS.
            </p>
          </div>
        </section>

        {/* ── Gráfica de tendencia 30 días ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Tendencia de precios (30 días)
          </p>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Spinner /></div>
          ) : !data || data.series.length < 2 ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <TrendingUp size={40} className="text-gray-200" />
              <p className="text-[13px] text-gray-400 text-center leading-relaxed px-4">
                Sin datos suficientes para mostrar la gráfica.<br />
                <span className="text-[#1A5C38] font-semibold">Registra precios diarios</span> para ver la tendencia.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${(Number(v)/1000).toFixed(1)}k`} width={52} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${Number(v).toLocaleString('es-MX')}/ton`,
                    LABEL[name] || name,
                  ]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                />
                <Legend formatter={n => LABEL[n] || n} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="precio_compra"      stroke="#1A5C38" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="margen_negociacion"  stroke="#2563eb" strokeWidth={2}   dot={false} connectNulls strokeDasharray="5 3" />
                <Line type="monotone" dataKey="precio_venta"        stroke="#d97706" strokeWidth={2}   dot={false} connectNulls strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-[10px] text-gray-300 text-center pb-4">
          Precios de referencia · CME Group · Banxico · Actualización diaria 7:00 am
        </p>

      </div>
    </div>
  );
}
