import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, RefreshCw, Clock, AlertTriangle, Activity } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

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

function Spinner() {
  return <div className="w-5 h-5 border-2 border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin" />;
}

export default function PreciosProductorPage() {
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

  const esDatosDeAyer = data
    ? (new Date().getTime() - new Date(data.timestamp_chicago).getTime() > 24 * 60 * 60 * 1000)
    : false;

  const ventaPositivo = data ? data.precio_venta_mxn >= 0 : true;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50/50 to-gray-100/30">
      
      {/* Header — Apple 2026 Glassmorphic Slim header */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-[24px] shadow-[0_4px_16px_rgba(26,92,56,0.12)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <p className="text-[10px] font-bold text-green-300/80 uppercase tracking-widest mb-1.5">Productor</p>
          <h1 className="text-[20px] sm:text-[22px] font-black text-white leading-tight tracking-tight">
            Precios de Mercado
          </h1>
          <p className="text-[12px] font-medium text-white/70 mt-0.5">Referencias del maíz blanco nacional e internacional</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${esDatosDeAyer ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${esDatosDeAyer ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">
              {esDatosDeAyer ? 'Datos del día anterior' : 'Precios Actualizados'}
            </p>
          </div>
          <button 
            onClick={cargar} 
            disabled={loading}
            className="flex items-center gap-1.5 text-[12px] text-[#1A5C38] font-bold bg-[#1A5C38]/5 hover:bg-[#1A5C38]/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-200"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-md rounded-xl p-3.5 text-red-600 text-[12px] border border-red-100/50 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* 3 Precios Stack */}
        <div className="space-y-3">
          
          {/* Precio 1 — Margen de Negociación */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">1</span>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Margen de Negociación</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Referencia Internacional</span>
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Margen de Negociación Total</h3>
                <p className="text-[10px] text-gray-450 mt-0.5">Precio Chicago convertido + Bono SADER</p>
              </div>
              <div className="text-right">
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <p className="text-[28px] font-black tracking-tight leading-none text-white">{fmt(data?.margen_negociacion_mxn)}</p>
                    <p className="text-[10px] text-gray-450 mt-1">MXN/tonelada</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Precio 2 — Precio de Compra (Lo que te pagan las bodegas) */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1A5C38] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">2</span>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Precio de Compra</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#1A5C38] bg-[#1A5C38]/5 px-2 py-0.5 rounded-full">Precio en Bodega</span>
            </div>

            <div className="bg-[#1A5C38]/5 border border-[#1A5C38]/10 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="text-[11px] font-bold text-[#1A5C38] uppercase tracking-widest">Lo que te pagan las bodegas</h3>
                <p className="text-[10px] text-[#1A5C38]/70 mt-0.5">Precio Origen (PO) promedio de esta semana</p>
              </div>
              <div className="text-right">
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <p className="text-[28px] font-black tracking-tight leading-none text-[#1A5C38]">{fmt(data?.precio_origen_mxn)}</p>
                    <p className="text-[10px] text-[#1A5C38]/70 mt-1">MXN/tonelada</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Precio 3 — Precio de Venta (Diferencial) */}
          <div className={`backdrop-blur-md rounded-2xl border p-4 space-y-2.5 ${ventaPositivo ? 'bg-white/80 border-gray-200/50 shadow-sm' : 'bg-red-50/50 border-red-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B4F8A] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">3</span>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Precio de Venta</p>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ventaPositivo ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-100/50'}`}>
                {ventaPositivo ? 'Favorable' : 'Diferencial Crítico'}
              </span>
            </div>

            <div className="rounded-xl border border-gray-100/60 bg-gray-50/20 p-3 flex justify-between items-center">
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Precio de Venta Neto</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Precio de Compra menos Margen de Negociación</p>
              </div>
              <div className="text-right">
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <p className={`text-[28px] font-black tracking-tight leading-none ${ventaPositivo ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(data?.precio_venta_mxn)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">MXN/tonelada</p>
                  </>
                )}
              </div>
            </div>

            {!loading && data && data.precio_venta_mxn < 0 && (
              <div className="flex items-start gap-1.5 text-[10.5px] text-red-600/90 leading-relaxed bg-red-100/10 rounded-xl p-2.5 border border-red-200/20">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                <p>
                  El precio promedio de las bodegas está por debajo de la referencia internacional de Chicago.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Gráfica de Tendencia */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm p-4 space-y-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Histórico de Precios · 30 días</p>
            </div>
            <span className="text-[10px] text-gray-400">Escala: MXN/ton</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48"><Spinner /></div>
          ) : !data || data.series.length < 2 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <TrendingUp size={30} className="text-gray-300" />
              <p className="text-[12px] text-gray-400 text-center leading-normal">
                Datos históricos en proceso de recopilación.<br />
                Las tendencias se visualizarán próximamente.
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${(Number(v)/1000).toFixed(1)}k`} tickLine={false} axisLine={false} width={45} />
                  <Tooltip
                    formatter={(v: any, name: any) => [
                      `$${Number(v || 0).toLocaleString('es-MX')} MXN`,
                      LABEL[name] || name,
                    ]}
                    labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: '1px solid rgba(229, 231, 235, 0.5)', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                      fontSize: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)'
                    }}
                  />
                  <Legend 
                    formatter={n => LABEL[n] || n} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, paddingTop: 10 }} 
                  />
                  <Line type="monotone" name="precio_compra" dataKey="precio_compra" stroke="#1A5C38" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" name="margen_negociacion" dataKey="margen_negociacion" stroke="#2563eb" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" />
                  <Line type="monotone" name="precio_venta" dataKey="precio_venta" stroke="#d97706" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Footer Timestamp */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-gray-400">
          <Clock size={10} className="text-gray-300" />
          <p>
            CBOT Chicago CME (Maíz Amarillo) · Banxico TC · Actualización automática
          </p>
        </div>

      </div>
    </div>
  );
}
