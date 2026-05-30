import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BONO_MAIZ_BLANCO_USD = 50; // fijo — se configurará desde Admin en el futuro

export default function PreciosProductorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('simac_token');

  useEffect(() => {
    fetch(`${BASE}/productor/precios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin" /></div>;
  if (!data) return null;

  // ── Cálculos ────────────────────────────────────────────────────────────
  const chicago     = data.precio_chicago_usd_bushel;
  const tipoCambio  = data.tipo_cambio_mxn;
  const po          = data.precio_compra;          // PO — lo que paga la bodega
  const servicios   = data.servicios_promedio;     // S — tarifario de servicios
  const tieneChicago   = chicago != null && tipoCambio != null;
  const tieneServicios = servicios != null;
  const tienePO        = po != null;

  // Margen de Negociación = (Chicago × 39.368 × tipo_cambio) + (Bono × tipo_cambio)
  const margen = tieneChicago
    ? (chicago * 39.368 * tipoCambio) + (BONO_MAIZ_BLANCO_USD * tipoCambio)
    : null;

  // Precio de Compra = PO + S
  const precioCompra = tienePO && tieneServicios ? po + servicios : null;

  // Precio de Venta = Precio de Compra − Margen de Negociación
  const precioVenta = precioCompra != null && margen != null
    ? precioCompra - margen
    : null;

  const esFavorable = precioVenta != null && precioVenta >= 0;

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-24 font-sans selection:bg-[#1A5C38] selection:text-white">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[28px] p-5 sm:p-7 border border-white/40">
          <button onClick={() => navigate('/productor')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm mb-4 flex items-center gap-1 font-medium w-fit">
            ← Regresar
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center text-[28px] shadow-inner shrink-0">
                🌽
              </div>
              <div>
                <h1 className="text-[22px] sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  Precios del maíz
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Referencia internacional, precio de compra y venta.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs text-[#1A5C38] font-bold bg-green-50 border border-green-100/50 rounded-full px-3.5 py-2 shadow-sm">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Actualizado hoy
            </div>
          </div>
        </div>

        {/* ── PRECIO 1 — Referencia internacional ── */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4 p-5 sm:p-7">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1A5C38] to-[#124227] text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-md shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg tracking-tight">
                Referencia internacional
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium leading-relaxed max-w-lg">
                Se calcula en tiempo real con el futuro de Chicago, tipo de cambio y bono de maíz blanco.
              </p>
            </div>
          </div>

          <div className="mx-4 sm:mx-7 mb-5 sm:mb-7 bg-gradient-to-br from-[#1A2F1F] to-[#0f1d13] rounded-[24px] p-5 sm:p-7 shadow-xl relative overflow-hidden">
            {/* Soft Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex flex-col mb-6 sm:mb-8 relative z-10">
              <p className="text-[40px] sm:text-[56px] leading-none font-black text-white tracking-tight">
                {margen != null
                  ? `$${margen.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                  : <span className="text-3xl text-gray-400 font-medium tracking-normal">Sin datos</span>
                }
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-md border border-green-400/20 uppercase tracking-wider">
                  Margen de negociación
                </span>
                <span className="text-gray-400 text-xs font-bold tracking-wider uppercase">MXN/ton</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 relative z-10">
              {[
                { icon: '📈', label: 'Futuro Chicago', value: tieneChicago ? `$${chicago} USD/bu` : 'Sin datos' },
                { icon: '💵', label: 'Tipo de cambio', value: tipoCambio != null ? `$${tipoCambio} MXN` : 'Sin datos' },
                { icon: '🏷', label: 'Bono maíz', value: `+$${BONO_MAIZ_BLANCO_USD} USD` },
              ].map((item, i) => (
                <div key={item.label} className="flex-1 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-[20px] p-4 flex items-center sm:flex-col sm:items-start sm:justify-between transition-colors hover:bg-white/[0.08]">
                  <div className="w-[42px] h-[42px] bg-white/[0.08] rounded-[14px] flex items-center justify-center text-[22px] shrink-0 mr-3.5 sm:mr-0 sm:mb-3">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight">
                      {item.label}
                    </p>
                    <p className="text-[15px] font-bold text-white mt-0.5">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10 mt-5">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center sm:text-left">
                🧮 <span className="text-white/60">(Futuro × 39.368 × dólar) + bono =</span> <span className="text-green-400 font-bold ml-1">Margen</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── PRECIO 2 — Precio de compra ── */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1A5C38] to-[#124227] text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                2
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg tracking-tight">
                  Precio de compra
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5 font-medium leading-relaxed">
                  Pago que realiza la bodega más sus servicios de tarifario.
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#1A5C38] bg-green-50 border border-green-200/50 rounded-full px-3.5 py-1.5 shrink-0 self-start sm:self-auto shadow-sm tracking-wider uppercase">
              Precio en Bodega
            </span>
          </div>

          <div className="px-4 sm:px-7 pb-5 sm:pb-7">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">

              {/* PO */}
              <div className="w-full sm:flex-1 bg-gradient-to-br from-[#E8F5EE] to-[#d8efe3] border border-green-200/60 rounded-[24px] p-5 sm:p-6 shadow-sm relative overflow-hidden group">
                <div className="w-[46px] h-[46px] bg-[#1A5C38] rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <span className="text-white text-xl">💰</span>
                </div>
                <p className="text-[11px] text-[#1A5C38] font-black uppercase tracking-wider mb-1">
                  Pago bodega (PO)
                </p>
                <p className="text-[28px] sm:text-[34px] font-black text-[#1A5C38] tracking-tight leading-none">
                  {tienePO ? `$${po.toLocaleString('es-MX')}` : <span className="text-lg text-gray-400 font-medium tracking-normal">Sin datos</span>}
                </p>
              </div>

              <span className="text-3xl font-black text-gray-300 shrink-0 rotate-90 sm:rotate-0 drop-shadow-sm">+</span>

              {/* S */}
              <div className="w-full sm:flex-1 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/60 rounded-[24px] p-5 sm:p-6 shadow-sm relative overflow-hidden group">
                <div className="w-[46px] h-[46px] bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <p className="text-[11px] text-blue-700 font-black uppercase tracking-wider mb-1">
                  Servicios (S)
                </p>
                <p className="text-[28px] sm:text-[34px] font-black text-blue-700 tracking-tight leading-none">
                  {tieneServicios ? `$${servicios.toLocaleString('es-MX')}` : <span className="text-lg text-gray-400 font-medium tracking-normal">Sin datos</span>}
                </p>
              </div>

              <span className="text-3xl font-black text-gray-300 shrink-0 rotate-90 sm:rotate-0 drop-shadow-sm">=</span>

              {/* Total */}
              <div className="w-full sm:flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[24px] p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                <div className="w-[46px] h-[46px] bg-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform">
                  <span className="text-white text-xl">🏷</span>
                </div>
                <p className="text-[11px] text-gray-300 font-black uppercase tracking-wider mb-1">
                  Total Compra
                </p>
                <p className="text-[28px] sm:text-[34px] font-black text-white tracking-tight leading-none">
                  {precioCompra != null ? `$${precioCompra.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : <span className="text-lg text-gray-400 font-medium tracking-normal">Sin datos</span>}
                </p>
              </div>
            </div>
            
            <p className="mt-5 text-[11px] text-gray-400 font-medium text-center bg-gray-50/80 rounded-xl py-2.5">
              Si no hay precios recientes o tarifario de servicios, las tarjetas mostrarán "Sin datos".
            </p>
          </div>
        </div>

        {/* ── PRECIO 3 — Precio de venta ── */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4 p-5 sm:p-7 pb-2 sm:pb-3">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1A5C38] to-[#124227] text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-md shrink-0">
              3
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg tracking-tight">
                Precio de venta
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium leading-relaxed">
                El precio neto resultante al restar el margen de negociación a la compra.
              </p>
            </div>
          </div>

          <div className="px-4 sm:px-7 pb-5 sm:pb-7">
            <div className="bg-[#f8fafc] rounded-[24px] p-5 sm:p-7 mb-4 border border-gray-100 shadow-sm">
              <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mb-5">
                Versión 1 — Productor con servicios
              </p>
              <div className="space-y-3.5 mb-5">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-gray-600 font-semibold flex items-center gap-2.5">
                    <span className="bg-white p-1 rounded-md shadow-sm text-sm">🛒</span> Precio de compra
                  </span>
                  <span className="font-bold text-gray-900">
                    {precioCompra != null ? `$${precioCompra.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-gray-600 font-semibold flex items-center gap-2.5">
                    <span className="bg-white p-1 rounded-md shadow-sm text-sm">➖</span> Margen de negociación
                  </span>
                  <span className="font-bold text-gray-900">
                    {margen != null ? `$${margen.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '—'}
                  </span>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <span className="font-black text-gray-900 flex items-center gap-2.5 text-lg">
                    <span className="text-[22px]">🏆</span> Diferencial de venta
                  </span>
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
                    <span className={`text-[26px] sm:text-[32px] font-black tracking-tight leading-none
                      ${precioVenta == null ? 'text-gray-400'
                        : esFavorable ? 'text-[#1A5C38]'
                        : 'text-rose-600'}`}>
                      {precioVenta != null
                        ? `$${Math.abs(precioVenta).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                        : 'Sin datos'
                      }
                    </span>
                    {precioVenta != null && (
                      <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider
                        ${esFavorable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/50'}`}>
                        {esFavorable ? '✓ Favorable' : '⚠ Deficit'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {precioVenta != null && !esFavorable && (
                <div className="flex items-start gap-2.5 text-[13px] text-rose-700 bg-rose-50 border border-rose-200/60 rounded-2xl p-4 font-semibold mt-6 shadow-sm">
                  <span className="text-base mt-0.5">⚠</span>
                  <p>Alerta: El precio de compra actual se encuentra por debajo del margen de negociación internacional sugerido.</p>
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-[24px] p-5 bg-white/50 relative overflow-hidden group transition-colors hover:border-amber-200 hover:bg-amber-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 relative z-10">
                <p className="text-[15px] font-bold text-gray-600 group-hover:text-amber-800 transition-colors">
                  Versión 2 — Precio CEDIS
                </p>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full w-fit">
                  En desarrollo
                </span>
              </div>
              <p className="text-[13px] text-gray-400 font-medium leading-relaxed relative z-10 group-hover:text-amber-700/70 transition-colors">
                Precio en Centrales de Abasto menos el Margen de Negociación. 
                Se habilitará dinámicamente cuando el administrador configure los módulos.
              </p>
            </div>
          </div>
        </div>

        {/* ── HISTÓRICO 30 DÍAS ── */}
        {data.tendencia?.length > 0 && (
          <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-5 sm:p-7 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-lg">📈</div>
                <p className="text-lg font-bold text-gray-900 tracking-tight">
                  Histórico a 30 días
                </p>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">MXN / TON</p>
            </div>
            
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.tendencia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(f) => new Date(f).toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={v => `$${(Number(v)/1000).toFixed(1)}k`} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    formatter={(v: any) => [
                      `$${Number(v || 0).toLocaleString('es-MX')} MXN`,
                      'Precio Compra',
                    ]}
                    labelFormatter={(f) => new Date(f).toLocaleDateString('es-MX', {day: 'numeric', month: 'long', year: 'numeric'})}
                    labelStyle={{ fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}
                    contentStyle={{ 
                      borderRadius: 20, 
                      border: '1px solid rgba(226, 232, 240, 0.8)', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', 
                      fontSize: 14,
                      fontWeight: '600',
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      padding: '16px 20px'
                    }}
                  />
                  <Line type="monotone" name="precio_compra" dataKey="precio_compra" stroke="#10b981" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981', style: {filter: 'drop-shadow(0px 4px 6px rgba(16, 185, 129, 0.4))'} }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── FIRA ── */}
        {data.fira && (
          <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-slate-200/60 rounded-[32px] p-5 sm:p-7 mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-[38px] h-[38px] bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 text-lg shadow-inner">📘</div>
              <p className="text-[17px] font-bold text-slate-800 tracking-tight">
                Referencia FIRA · {data.estado}
              </p>
            </div>
            
            <div className="grid gap-3 text-[14px] relative z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/60 backdrop-blur-sm rounded-[18px] p-4 border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <span className="text-slate-500 font-semibold mb-1 sm:mb-0">Modalidad de riego</span>
                <span className="font-bold text-slate-800">{data.fira.modalidad}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/60 backdrop-blur-sm rounded-[18px] p-4 border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <span className="text-slate-500 font-semibold mb-1 sm:mb-0">Costo productivo por hectárea</span>
                <span className="font-bold text-slate-800">
                  ${data.fira.costo_por_ha.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/60 backdrop-blur-sm rounded-[18px] p-4 border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <span className="text-slate-500 font-semibold mb-1 sm:mb-0">Precio FIRA sugerido</span>
                <span className="font-black text-[#1A5C38] text-lg sm:text-base">
                  ${data.fira.precio_fira.toLocaleString('es-MX')} / ton
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-5 text-center tracking-wide uppercase">
              Fuente: Costos FIRA · Ciclo PV 2026
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
