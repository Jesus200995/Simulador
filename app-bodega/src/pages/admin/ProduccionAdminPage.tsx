import { useState, useEffect } from 'react';
import { Sprout, RefreshCw, AlertTriangle, TrendingUp, MapPin, Layers, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

function fmtNum(v: number, dec = 0) {
  return Number(v).toLocaleString('es-MX', { maximumFractionDigits: dec });
}

interface ProduccionData {
  por_estado: { estado: string; ups: number; cultivos: number; area_ha: number; produccion_ton: number }[];
  por_ciclo: { cycle_type: string; cycle_year: number; ciclos: number; cultivos: number; area_ha: number }[];
  ups_sin_ciclo: number;
  superficie_total_ha: number;
  superficie_sembrada_ha: number;
  produccion_esperada_ton: number;
  productores_con_ciclo: number;
}

export default function ProduccionAdminPage() {
  const [data, setData] = useState<ProduccionData | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/dashboard/admin/produccion`, { headers: HDR() });
      const d = await r.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function colorCobertura(pct: number) {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  }
  function bgCobertura(pct: number) {
    if (pct >= 70) return 'bg-emerald-500/10 border-emerald-500/25';
    if (pct >= 40) return 'bg-amber-500/10 border-amber-500/25';
    return 'bg-red-500/10 border-red-500/25';
  }

  const CARD = 'bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-2';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Módulo</p>
          <h1 className="text-[17px] sm:text-[19px] font-black text-white tracking-tight leading-none">Producción</h1>
        </div>
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Recargar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Superficie total', value: fmtNum(data?.superficie_total_ha ?? 0), sub: 'hectáreas registradas', icon: <MapPin size={15} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Superficie sembrada', value: fmtNum(data?.superficie_sembrada_ha ?? 0), sub: 'ha con ciclo activo', icon: <Sprout size={15} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Cosecha esperada', value: fmtNum(data?.produccion_esperada_ton ?? 0), sub: 'toneladas estimadas', icon: <TrendingUp size={15} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Con ciclo capturado', value: fmtNum(data?.productores_con_ciclo ?? 0), sub: 'cultivos registrados', icon: <CheckCircle size={15} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Sin ciclo capturado', value: fmtNum(data?.ups_sin_ciclo ?? 0), sub: 'predios sin info', icon: <XCircle size={15} />, color: (data?.ups_sin_ciclo ?? 0) > 0 ? 'text-amber-400' : 'text-gray-500', bg: (data?.ups_sin_ciclo ?? 0) > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-gray-500/10 border-gray-500/20' },
        ].map((kpi, i) => (
          <div key={i} className={CARD}>
            <div className="flex items-start justify-between">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{kpi.label}</p>
              <div className={`w-7 h-7 rounded-lg ${kpi.bg} border flex items-center justify-center ${kpi.color} flex-shrink-0`}>{kpi.icon}</div>
            </div>
            <p className={`text-[22px] sm:text-[26px] font-black leading-none tracking-tight ${loading ? 'text-gray-600 animate-pulse' : kpi.color}`}>
              {loading ? '—' : kpi.value}
            </p>
            <p className="text-[10px] text-gray-600">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={13} className="text-emerald-400" />
          <h2 className="text-[13px] font-bold text-white">Producción y Área por Estado</h2>
        </div>
        {loading ? <div className="h-[240px] bg-white/[0.02] rounded-xl animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.por_estado ?? []} margin={{ top: 0, right: 0, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="estado" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11 }} labelStyle={{ color: '#e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="produccion_ton" name="Producción (ton)" fill="#1A5C38" radius={[3, 3, 0, 0]} />
              <Bar dataKey="area_ha" name="Área (ha)" fill="#2563EB" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Semáforo */}
      <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.05]">
          <AlertTriangle size={13} className="text-amber-400" />
          <h2 className="text-[13px] font-bold text-white">Semáforo de Cobertura por Estado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 text-[9px] uppercase tracking-widest font-bold">
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Predios</th>
                <th className="px-4 py-3 text-right">Con ciclo</th>
                <th className="px-4 py-3 text-right">Área ha</th>
                <th className="px-4 py-3 text-right">Producción ton</th>
                <th className="px-4 py-3 text-center">Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(data?.por_estado ?? []).map((row, i) => {
                const pct = row.ups > 0 ? Math.round((row.cultivos / row.ups) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-200">{row.estado}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-400 text-right">{fmtNum(row.ups)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-400 text-right">{fmtNum(row.cultivos)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-400 text-right">{fmtNum(row.area_ha, 1)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-400 text-right">{fmtNum(row.produccion_ton, 1)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${bgCobertura(pct)} ${colorCobertura(pct)}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
              {!loading && (data?.por_estado ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px] text-gray-600">Sin datos de producción disponibles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
