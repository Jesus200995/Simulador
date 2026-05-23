import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { PageBanner } from '../components/Layout';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface SerieItem {
  fecha: string;
  precio_bodega:   number | null;
  precio_gobierno: number | null;
  precio_mercado:  number | null;
}

interface DashData {
  kpi: { promedio: number; maximo: number; minimo: number; total_registros: number } | null;
  ultimo_gobierno:    { precio: number; tipo_maiz: string; fecha: string } | null;
  ultimo_internacional: { precio: number; tipo_maiz: string; fecha: string } | null;
}

const COLORS = { precio_bodega: '#1A5C38', precio_gobierno: '#2563eb', precio_mercado: '#d97706' };
const LABELS = {
  precio_bodega:   'Bodega (precio pagado)',
  precio_gobierno: 'Gobierno (ref.)',
  precio_mercado:  'Mercado regional',
};

function trend(vals: (number | null)[]): 'up' | 'down' | 'flat' {
  const c = vals.filter((v): v is number => v !== null);
  if (c.length < 2) return 'flat';
  return c[c.length - 1] - c[0] > 50 ? 'up' : c[c.length - 1] - c[0] < -50 ? 'down' : 'flat';
}

function fmt(v: number | null) {
  if (v === null || v === 0) return '—';
  return `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function TrendIcon({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up')   return <TrendingUp  size={16} className="text-emerald-500" />;
  if (dir === 'down') return <TrendingDown size={16} className="text-red-400" />;
  return <Minus size={16} className="text-gray-300" />;
}

export default function B22PreciosMercado() {
  const [series, setSeries]   = useState<SerieItem[]>([]);
  const [dash, setDash]       = useState<DashData>({ kpi: null, ultimo_gobierno: null, ultimo_internacional: null });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const [rSeries, rDash] = await Promise.all([
        fetch(`${BASE}/precios/series`,    { headers: HDR() }).then(r => r.json()),
        fetch(`${BASE}/precios/dashboard`, { headers: HDR() }).then(r => r.json()),
      ]);

      /* series → short date label */
      const serie: SerieItem[] = (Array.isArray(rSeries) ? rSeries : []).map((p: SerieItem) => ({
        ...p,
        fecha:          (p.fecha || '').slice(5),
        precio_bodega:   p.precio_bodega   ? Number(p.precio_bodega)   : null,
        precio_gobierno: p.precio_gobierno ? Number(p.precio_gobierno) : null,
        precio_mercado:  p.precio_mercado  ? Number(p.precio_mercado)  : null,
      }));

      setSeries(serie);
      setDash({
        kpi:                  rDash.kpi || null,
        ultimo_gobierno:      rDash.ultimo_gobierno || null,
        ultimo_internacional: rDash.ultimo_internacional || null,
      });
    } catch (e: any) {
      setError('No se pudieron cargar los precios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  /* KPI cards */
  const ultimo = series[series.length - 1] ?? null;
  const kpis = ([
    ['precio_bodega',   'Precio Bodega', 'Lo que pagas al productor'],
    ['precio_gobierno', 'Precio Gobierno', 'Precio de referencia oficial'],
    ['precio_mercado',  'Precio Mercado', 'Promedio regional observado'],
  ] as [keyof SerieItem, string, string][]).map(([k, titulo, sub]) => {
    const vals = series.map(d => d[k] as number | null);
    const val  = vals.filter((v): v is number => v !== null).pop() ?? null;
    const dir  = trend(vals);
    return { k, titulo, sub, val, dir };
  });

  /* Último precio bodega vs mercado */
  const pb = ultimo?.precio_bodega ?? null;
  const pm = ultimo?.precio_mercado ?? null;

  return (
    <div className="w-full">
      <PageBanner title="Precios de Mercado" subtitle="Comparativa bodega · gobierno · mercado" back="/dashboard" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Últimos 30 días</p>
          <button onClick={cargar} disabled={loading}
            className="flex items-center gap-1.5 text-[13px] text-[#1A5C38] font-semibold disabled:opacity-40">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 rounded-2xl p-4 text-red-600 text-[13px] border border-red-100">{error}</div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kpis.map(({ k, titulo, sub, val, dir }) => (
            <div key={k} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 leading-snug">{titulo}</p>
                  <p className="text-[11px] text-gray-400">{sub}</p>
                </div>
                <TrendIcon dir={dir} />
              </div>
              <p className="text-[28px] font-black leading-none mt-1"
                style={{ color: COLORS[k as keyof typeof COLORS] }}>
                {loading ? <span className="text-gray-200 text-[20px]">—</span> : fmt(val)}
              </p>
              <p className="text-[11px] text-gray-400">MXN / ton</p>

              {/* Small indicator line */}
              <div className="h-0.5 rounded-full mt-1" style={{ background: COLORS[k as keyof typeof COLORS], opacity: val ? 1 : 0.15 }} />
            </div>
          ))}
        </div>

        {/* Posición vs mercado */}
        {pb && pm && (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Tu posición vs mercado</p>
            {(() => {
              const diff = pb - pm;
              const pct  = Math.abs(diff / pm * 100).toFixed(1);
              const ok   = diff >= 0;
              return (
                <div className={`rounded-xl p-4 ${ok ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <p className={`text-[14px] font-semibold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {ok ? `✅ Pagas ${pct}% más que el mercado — favorable para el productor`
                        : `⚠️ Pagas ${pct}% menos que el mercado — considera ajustar`}
                  </p>
                  <p className={`text-[12px] mt-1 ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                    Tu precio: {fmt(pb)} · Mercado: {fmt(pm)} · Dif: {diff >= 0 ? '+' : ''}{fmt(diff)}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Stats de base de datos */}
        {!loading && dash.kpi && (dash.kpi.total_registros ?? 0) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Precio promedio',  val: fmt(dash.kpi.promedio) },
              { label: 'Precio máximo',    val: fmt(dash.kpi.maximo) },
              { label: 'Precio mínimo',    val: fmt(dash.kpi.minimo) },
              { label: 'Total registros',  val: String(dash.kpi.total_registros) },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 text-center">
                <p className="text-[18px] font-black text-gray-800">{s.val}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gráfica de tendencia */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Tendencia de precios (30 días)</p>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
            </div>
          ) : series.length < 2 ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <TrendingUp size={40} className="text-gray-200" />
              <p className="text-[13px] text-gray-400 text-center leading-relaxed px-4">
                Sin datos suficientes para mostrar la gráfica.<br />
                <span className="text-[#1A5C38] font-semibold">Publica precios diarios</span> desde "Publicar Precio de Compra" para ver la tendencia.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} width={52} />
                <Tooltip
                  formatter={(v, name) => [`$${Number(v).toLocaleString()}/ton`, LABELS[String(name) as keyof typeof LABELS] || String(name)]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                />
                <Legend formatter={n => LABELS[n as keyof typeof LABELS] || n} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="precio_bodega"   stroke={COLORS.precio_bodega}   strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="precio_gobierno" stroke={COLORS.precio_gobierno} strokeWidth={2}   dot={false} connectNulls strokeDasharray="5 3" />
                <Line type="monotone" dataKey="precio_mercado"  stroke={COLORS.precio_mercado}  strokeWidth={2}   dot={false} connectNulls strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
