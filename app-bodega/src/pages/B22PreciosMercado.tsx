import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { PageBanner } from '../components/Layout';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface PrecioItem {
  fecha: string;
  precio_bodega: number | null;
  precio_gobierno: number | null;
  precio_mercado: number | null;
}

const TIPO_COLORS = {
  precio_bodega:    '#1A5C38',
  precio_gobierno:  '#2563eb',
  precio_mercado:   '#d97706',
};

const TIPO_LABELS = {
  precio_bodega:   'Bodega (precio pagado)',
  precio_gobierno: 'Gobierno (precio de referencia)',
  precio_mercado:  'Mercado (promedio regional)',
};

function tendencia(vals: (number | null)[]): 'up' | 'down' | 'flat' {
  const clean = vals.filter((v): v is number => v !== null);
  if (clean.length < 2) return 'flat';
  const diff = clean[clean.length - 1] - clean[0];
  if (diff > 50) return 'up';
  if (diff < -50) return 'down';
  return 'flat';
}

function TrendIcon({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up')   return <TrendingUp  size={18} className="text-emerald-500" />;
  if (dir === 'down') return <TrendingDown size={18} className="text-red-400" />;
  return <Minus size={18} className="text-gray-400" />;
}

function formatoMXN(v: number | null) {
  if (!v) return '—';
  return `$${v.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

export default function B22PreciosMercado() {
  const [datos, setDatos] = useState<PrecioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/precios/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('simac_token')}` }
      });
      const data = await r.json();
      // Normalize: data puede ser array de puntos o tener .series
      const serie: PrecioItem[] = (Array.isArray(data) ? data : data.series || data.precios || [])
        .map((p: any) => ({
          fecha: (p.fecha || '').slice(5),
          precio_bodega:    p.precio_bodega    !== undefined ? Number(p.precio_bodega)    : (p.tipo_precio === 'bodega'   ? Number(p.precio) : null),
          precio_gobierno:  p.precio_gobierno  !== undefined ? Number(p.precio_gobierno)  : (p.tipo_precio === 'gobierno' ? Number(p.precio) : null),
          precio_mercado:   p.precio_mercado   !== undefined ? Number(p.precio_mercado)   : (p.tipo_precio === 'mercado'  ? Number(p.precio) : null),
        }))
        .slice(-30);
      setDatos(serie);
    } catch (e: any) {
      setError('No se pudieron cargar los precios. ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  // Últimos valores para las tarjetas KPI
  const ultimo = datos[datos.length - 1];
  const kpis = ([
    ['precio_bodega',   'Precio Bodega (lo que pagan productores)'],
    ['precio_gobierno', 'Precio Referencia Gobierno'],
    ['precio_mercado',  'Precio de Mercado Regional'],
  ] as [keyof PrecioItem, string][]).map(([k, titulo]) => {
    const vals = datos.map(d => d[k] as number | null);
    const ultimo_val = vals.filter(Boolean).pop() ?? null;
    const dir = tendencia(vals);
    const all_clean = vals.filter((v): v is number => v !== null);
    const min_val = all_clean.length ? Math.min(...all_clean) : null;
    const max_val = all_clean.length ? Math.max(...all_clean) : null;
    return { key: k, titulo, valor: ultimo_val, dir, min: min_val, max: max_val };
  });

  return (
    <div className="w-full">
      <PageBanner title="Precios de Mercado" subtitle="Comparativa bodega · gobierno · mercado" back="/dashboard" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* Refresh */}
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
          {kpis.map(kpi => (
            <div key={kpi.key}
              className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold text-gray-500 leading-snug">{kpi.titulo}</p>
                <TrendIcon dir={kpi.dir} />
              </div>
              <p className="text-[26px] font-black leading-none"
                style={{ color: TIPO_COLORS[kpi.key as keyof typeof TIPO_COLORS] }}>
                {formatoMXN(kpi.valor)}
              </p>
              <p className="text-[11px] text-gray-400">MXN / ton</p>
              {(kpi.min !== null && kpi.max !== null) && (
                <p className="text-[11px] text-gray-400">
                  Rango 30 días: {formatoMXN(kpi.min)} — {formatoMXN(kpi.max)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Posición vs mercado */}
        {ultimo && ultimo.precio_bodega && ultimo.precio_mercado && (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Posición de tu bodega vs mercado</p>
            {(() => {
              const diff = ultimo.precio_bodega - ultimo.precio_mercado;
              const pct = Math.abs(diff / ultimo.precio_mercado * 100).toFixed(1);
              const favorable = diff >= 0;
              return (
                <div className={`rounded-xl p-4 ${favorable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  <p className="text-[14px] font-semibold">
                    {favorable
                      ? `✅ Pagas ${pct}% más que el mercado regional — favorable para productores`
                      : `⚠️ Pagas ${pct}% menos que el mercado regional — considera ajustar tu precio`}
                  </p>
                  <p className="text-[12px] mt-1 opacity-80">
                    Tu precio: {formatoMXN(ultimo.precio_bodega)} · Mercado: {formatoMXN(ultimo.precio_mercado)} · Diferencia: {diff >= 0 ? '+' : ''}{formatoMXN(diff)}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Gráfica comparativa */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Tendencia de precios (30 días)</p>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
            </div>
          ) : datos.length < 2 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
              <TrendingUp size={36} className="text-gray-200" />
              <p className="text-[13px] text-center px-4">Sin datos suficientes para mostrar la gráfica.<br />Publica precios diarios para ver la tendencia.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} width={52} />
                <Tooltip
                  formatter={(v, name) => [
                    `$${Number(v).toLocaleString()}/ton`,
                    TIPO_LABELS[String(name) as keyof typeof TIPO_LABELS] || String(name),
                  ]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
                <Legend
                  formatter={name => TIPO_LABELS[name as keyof typeof TIPO_LABELS] || name}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Line type="monotone" dataKey="precio_bodega"   stroke={TIPO_COLORS.precio_bodega}   strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="precio_gobierno" stroke={TIPO_COLORS.precio_gobierno} strokeWidth={2}   dot={false} connectNulls strokeDasharray="5 3" />
                <Line type="monotone" dataKey="precio_mercado"  stroke={TIPO_COLORS.precio_mercado}  strokeWidth={2}   dot={false} connectNulls strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
