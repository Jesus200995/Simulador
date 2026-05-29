import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Warehouse, Landmark, AlertTriangle, TrendingUp,
  RefreshCw, ChevronRight, Activity, Clock, CheckCircle2,
  ArrowUpRight, Zap, ShieldAlert
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

function fmt(v: number) {
  return `$${Math.abs(v).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}
function fmtTon(v: number) {
  return `${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 0 })} t`;
}
function fmtTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
    }).format(new Date(iso));
  } catch { return '—'; }
}

interface KpiData {
  productores_activos: number;
  productores_pendientes: number;
  bodegas_activas: number;
  bodegas_pendientes: number;
  transacciones_7d: number;
  alertas_criticas: number;
  alertas_medias: number;
  requerimientos_ton: number;
  disponibilidades_ton: number;
}

interface Precios {
  chicago_mxn: number;
  precio_compra: number;
  precio_venta: number;
  tipo_cambio: number;
  chicago_usd: number;
  timestamp: string;
}

interface Evento {
  tipo: string;
  descripcion: string;
  actor: string;
  fecha: string;
  link: string;
}

export default function DashboardAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData>({
    productores_activos: 0, productores_pendientes: 0,
    bodegas_activas: 0, bodegas_pendientes: 0,
    transacciones_7d: 0, alertas_criticas: 0, alertas_medias: 0,
    requerimientos_ton: 0, disponibilidades_ton: 0,
  });
  const [precios, setPrecios] = useState<Precios | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');

  async function cargar() {
    setLoading(true);
    try {
      const [resumen, preciosR, alertasR, actividadR] = await Promise.allSettled([
        fetch(`${BASE}/dashboard/admin/resumen`, { headers: HDR() }).then(r => r.json()),
        fetch(`${BASE}/precios/mercado`, { headers: HDR() }).then(r => r.json()),
        fetch(`${BASE}/dashboard/admin/alertas`, { headers: HDR() }).then(r => r.json()),
        fetch(`${BASE}/admin/actividad-reciente`, { headers: HDR() }).then(r => r.json()),
      ]);

      if (resumen.status === 'fulfilled') {
        const d = resumen.value;
        setKpis(prev => ({
          ...prev,
          productores_activos: d.productores_activos ?? prev.productores_activos,
          productores_pendientes: d.productores_pendientes ?? prev.productores_pendientes,
          bodegas_activas: d.bodegas_activas ?? prev.bodegas_activas,
          bodegas_pendientes: d.bodegas_pendientes ?? prev.bodegas_pendientes,
          disponibilidades_ton: d.disponibilidades_totales ?? prev.disponibilidades_ton,
          requerimientos_ton: d.requerimientos_totales ?? prev.requerimientos_ton,
        }));
      }

      if (preciosR.status === 'fulfilled') {
        const m = preciosR.value;
        if (m.precio_compra_mxn) {
          setPrecios({
            chicago_mxn: m.precio_origen_mxn ?? 0,
            precio_compra: m.precio_compra_mxn,
            precio_venta: m.precio_venta_mxn,
            tipo_cambio: m.tipo_cambio_mxn ?? 0,
            chicago_usd: m.precio_chicago_usd_bushel ?? 0,
            timestamp: m.timestamp_chicago ?? new Date().toISOString(),
          });
        }
      }

      if (alertasR.status === 'fulfilled') {
        const al = alertasR.value;
        setKpis(prev => ({
          ...prev,
          alertas_criticas: al.criticas_count ?? prev.alertas_criticas,
          alertas_medias: al.moderadas_count ?? prev.alertas_medias,
        }));
      }

      if (actividadR.status === 'fulfilled') {
        const ev = actividadR.value;
        if (Array.isArray(ev.eventos)) {
          setEventos(ev.eventos.slice(0, 6));
        }
      }

      setLastUpdate(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  // Skeleton card
  const Skeleton = () => (
    <div className="animate-pulse bg-white/[0.04] rounded-2xl h-[120px]" />
  );

  const tipoColor: Record<string, string> = {
    validacion: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    bodega: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    transaccion: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    alerta: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Header row ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Panel de Control</p>
          <h1 className="text-[17px] sm:text-[19px] font-black text-white tracking-tight leading-none">
            Resumen General
          </h1>
          {lastUpdate && (
            <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
              <Clock size={9} /> Actualizado a las {lastUpdate}
            </p>
          )}
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-2 rounded-xl active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Recargar
        </button>
      </div>

      {/* ── KPI Grid 2×3 ───────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Productores */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-500/20 transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Productores</p>
                <p className="text-[26px] sm:text-[32px] font-black text-white leading-none tracking-tight">{kpis.productores_activos}</p>
                <p className="text-[10px] text-gray-500 mt-1">activos y validados</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Users size={16} />
              </div>
            </div>
            {kpis.productores_pendientes > 0 && (
              <Link to="/admin/productores" className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/8 hover:bg-amber-500/12 border border-amber-500/15 rounded-lg px-2.5 py-1.5 transition-all">
                <span>{kpis.productores_pendientes} pendientes de validar</span>
                <ChevronRight size={11} />
              </Link>
            )}
          </div>

          {/* Bodegas */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Bodegas</p>
                <p className="text-[26px] sm:text-[32px] font-black text-white leading-none tracking-tight">{kpis.bodegas_activas}</p>
                <p className="text-[10px] text-gray-500 mt-1">aprobadas con silo</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Warehouse size={16} />
              </div>
            </div>
            {kpis.bodegas_pendientes > 0 && (
              <Link to="/admin/bodegas" className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/8 hover:bg-amber-500/12 border border-amber-500/15 rounded-lg px-2.5 py-1.5 transition-all">
                <span>{kpis.bodegas_pendientes} pendientes de aprobar</span>
                <ChevronRight size={11} />
              </Link>
            )}
          </div>

          {/* Transacciones */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-indigo-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Operaciones</p>
                <p className="text-[26px] sm:text-[32px] font-black text-white leading-none tracking-tight">{kpis.transacciones_7d}</p>
                <p className="text-[10px] text-gray-500 mt-1">últimos 7 días</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Landmark size={16} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <Zap size={9} className="text-indigo-400" />
              <span>Flujo monitoreado</span>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-red-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Alertas</p>
                <p className={`text-[26px] sm:text-[32px] font-black leading-none tracking-tight ${kpis.alertas_criticas > 0 ? 'text-red-400' : 'text-white'}`}>
                  {kpis.alertas_criticas + kpis.alertas_medias}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {kpis.alertas_criticas} crít · {kpis.alertas_medias} medias
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${kpis.alertas_criticas > 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-gray-500/10 border border-gray-500/20 text-gray-500'}`}>
                <AlertTriangle size={16} />
              </div>
            </div>
            {(kpis.alertas_criticas + kpis.alertas_medias) > 0 && (
              <Link to="/admin/alertas" className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-red-400 bg-red-500/8 hover:bg-red-500/12 border border-red-500/15 rounded-lg px-2.5 py-1.5 transition-all">
                <span>Gestionar alertas</span>
                <ChevronRight size={11} />
              </Link>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Disponibilidad</p>
                <p className="text-[22px] sm:text-[26px] font-black text-white leading-none tracking-tight">
                  {fmtTon(kpis.disponibilidades_ton)}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">declaradas por productores</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <ShieldAlert size={9} className="text-emerald-400" />
              <span>Maíz blanco nacional</span>
            </div>
          </div>

          {/* Requerimientos */}
          <div className="bg-[#080c11] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Requerimientos</p>
                <p className="text-[22px] sm:text-[26px] font-black text-white leading-none tracking-tight">
                  {fmtTon(kpis.requerimientos_ton)}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">demandados por bodegas</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <Zap size={9} className="text-amber-400" />
              <span>Silo con capacidad activa</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Precio Banner ───────────────────────────── */}
      {precios && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f3320] via-[#0c2a1a] to-[#081a10] border border-emerald-500/20 p-5 sm:p-6">
          {/* Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Precios en Vivo</span>
                </div>
                <h2 className="text-[15px] sm:text-[17px] font-black text-white tracking-tight">Maíz Blanco · Chicago CME</h2>
                <p className="text-[10px] text-emerald-300/50 mt-1 flex items-center gap-1">
                  <Clock size={9} />
                  {fmtTime(precios.timestamp)} · TC: ${precios.tipo_cambio.toFixed(2)} MXN/USD · Chicago: ${precios.chicago_usd.toFixed(4)} USD/bu
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/precios')}
                className="self-start flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0a1f13] text-[12px] sm:text-[13px] font-extrabold px-4 py-2.5 rounded-xl active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-900/50 flex-shrink-0"
              >
                Ver detalle
                <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Price columns - horizontal scroll on mobile */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider mb-2">Precio Origen</p>
                <p className="text-[18px] sm:text-[22px] font-black text-white leading-none">{fmt(precios.chicago_mxn)}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-300/40 mt-1">Chicago MXN/ton</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider mb-2">Precio Compra</p>
                <p className="text-[18px] sm:text-[22px] font-black text-white leading-none">{fmt(precios.precio_compra)}</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-300/40 mt-1">Promedio bodegas</p>
              </div>
              <div className="bg-white/[0.04] border border-emerald-500/15 rounded-xl p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider mb-2">Precio Venta</p>
                <p className={`text-[18px] sm:text-[22px] font-black leading-none ${precios.precio_venta > 0 ? 'text-emerald-300' : 'text-white'}`}>
                  {fmt(precios.precio_venta)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-emerald-300/40 mt-1">Con margen bodega</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Actividad reciente ──────────────────────── */}
      <section className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <h2 className="text-[13px] sm:text-[14px] font-bold text-white">Actividad Reciente</h2>
          </div>
          <Link to="/admin/productores" className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-0.5 transition-colors">
            Ver todo <ChevronRight size={12} />
          </Link>
        </div>

        {/* Mobile: Cards stacked */}
        <div className="sm:hidden divide-y divide-white/[0.04]">
          {eventos.length === 0 ? (
            <div className="px-5 py-6 text-center text-[12px] text-gray-600">Sin actividad reciente</div>
          ) : eventos.map((ev, idx) => (
            <div key={idx} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tipoColor[ev.tipo] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {ev.tipo}
                </span>
                <span className="text-[10px] text-gray-600 flex-shrink-0">{ev.fecha}</span>
              </div>
              <p className="text-[12px] text-gray-300 font-medium leading-snug">{ev.descripcion}</p>
              <p className="text-[10px] text-gray-600 mt-1">{ev.actor}</p>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left divide-y divide-white/[0.04]">
            <thead>
              <tr className="text-gray-600 text-[9px] uppercase tracking-widest font-bold">
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {eventos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-gray-600">Sin actividad reciente registrada</td>
                </tr>
              ) : eventos.map((ev, idx) => (
                <tr key={idx} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tipoColor[ev.tipo] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                      {ev.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-gray-200 max-w-[280px]">
                    <span className="line-clamp-1">{ev.descripcion}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-500">{ev.actor}</td>
                  <td className="px-5 py-3.5 text-[11px] text-gray-600 whitespace-nowrap">{ev.fecha}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={ev.link} className="text-emerald-500 hover:text-emerald-400 text-[11px] font-bold inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver <ChevronRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
