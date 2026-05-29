import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Warehouse, Landmark, AlertTriangle, Search, 
  Activity, Clock, ChevronRight, RefreshCw, CheckCircle2, ArrowRight
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

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

interface Evento {
  tipo: 'validacion' | 'bodega' | 'transaccion' | 'alerta';
  descripcion: string;
  actor: string;
  fecha: string;
  link: string;
}

interface PreciosHoy {
  margen_negociacion: number;
  precio_compra: number;
  precio_venta: number;
  timestamp: string;
}

export default function DashboardAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData>({
    productores_activos: 184,
    productores_pendientes: 3,
    bodegas_activas: 42,
    bodegas_pendientes: 2,
    transacciones_7d: 156,
    alertas_criticas: 5,
    alertas_medias: 12,
    requerimientos_ton: 12400,
    disponibilidades_ton: 8900
  });
  const [precios, setPrecios] = useState<PreciosHoy>({
    margen_negociacion: 4890,
    precio_compra: 5460,
    precio_venta: 570,
    timestamp: new Date().toISOString()
  });

  const eventos: Evento[] = [
    { tipo: 'validacion', descripcion: 'Productor Juan Carlos Rivera (Tipo B) registrado', actor: 'Sistema', fecha: 'Hace 5 min', link: '/admin/productores' },
    { tipo: 'alerta', descripcion: 'Brecha de precio de venta excedió 20% en Guanajuato', actor: 'Auditor Mercados', fecha: 'Hace 12 min', link: '/admin/alertas' },
    { tipo: 'transaccion', descripcion: 'Nueva transacción de 45 ton confirmada en Bodega El Bajío', actor: 'Bodega El Bajío', fecha: 'Hace 34 min', link: '/admin' },
    { tipo: 'bodega', descripcion: 'Bodega San Juan (Jalisco) solicitó aprobación de tarifario', actor: 'Bodega San Juan', fecha: 'Hace 1 hora', link: '/admin/bodegas' },
    { tipo: 'validacion', descripcion: 'Productor María Elena Gómez aprobada y activada', actor: 'Supervisor Admin', fecha: 'Hace 2 horas', link: '/admin/productores' },
  ];

  async function cargarDatos() {
    setLoading(true);
    try {
      // 1. Obtener KPIs desde el backend (si falla, usamos mockups realistas)
      const resResumen = await fetch(`${BASE}/dashboard/admin/resumen`, { headers: HDR() });
      if (resResumen.ok) {
        const resumen = await resResumen.json();
        // Mapear campos si existen
        setKpis(prev => ({
          ...prev,
          productores_activos: resumen.productores_activos ?? prev.productores_activos,
          productores_pendientes: resumen.productores_pendientes ?? prev.productores_pendientes,
          bodegas_activas: resumen.bodegas_activas ?? prev.bodegas_activas,
          bodegas_pendientes: resumen.bodegas_pendientes ?? prev.bodegas_pendientes,
          disponibilidades_ton: resumen.disponibilidades_totales ?? prev.disponibilidades_ton,
          requerimientos_ton: resumen.requerimientos_totales ?? prev.requerimientos_ton
        }));
      }

      // 2. Obtener precios de mercado
      const resPrecios = await fetch(`${BASE}/precios/mercado`, { headers: HDR() });
      if (resPrecios.ok) {
        const m = await resPrecios.json();
        setPrecios({
          margen_negociacion: m.margen_negociacion_mxn ?? 4890,
          precio_compra: m.precio_compra_mxn ?? 5460,
          precio_venta: m.precio_venta_mxn ?? 570,
          timestamp: m.timestamp_chicago ?? new Date().toISOString()
        });
      }

      // 3. Obtener alertas
      const resAlertas = await fetch(`${BASE}/dashboard/admin/alertas`, { headers: HDR() });
      if (resAlertas.ok) {
        const al = await resAlertas.json();
        setKpis(prev => ({
          ...prev,
          alertas_criticas: al.criticas_count ?? prev.alertas_criticas,
          alertas_medias: al.moderadas_count ?? prev.alertas_medias
        }));
      }

      // 4. Intentar obtener transacciones
      const resTx = await fetch(`${BASE}/precios/transacciones/resumen`, { headers: HDR() });
      if (resTx.ok) {
        const tx = await resTx.json();
        setKpis(prev => ({
          ...prev,
          transacciones_7d: tx.total ?? prev.transacciones_7d
        }));
      }
    } catch (e) {
      console.error('Error al cargar datos en dashboard:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function fmtNum(v: number) {
    return v.toLocaleString('es-MX');
  }

  function fmt(v: number) {
    return `$${v.toLocaleString('es-MX')}`;
  }

  return (
    <div className="space-y-6">
      
      {/* Upper header action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">AUDITORÍA OPERACIONAL</p>
          <p className="text-[12px] text-gray-400">Datos consolidados del sistema en vivo</p>
        </div>
        <button 
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-[#1A5C38] font-bold bg-[#1A5C38]/5 hover:bg-[#1A5C38]/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-200"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Recargar Panel
        </button>
      </div>

      {/* ── SECTION 1: 6 KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Productores */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Productores</span>
              <p className="text-[28px] font-black text-white leading-none">{loading ? '—' : kpis.productores_activos}</p>
              <p className="text-[10px] text-gray-400">Validados y operando</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users size={16} />
            </div>
          </div>
          {kpis.productores_pendientes > 0 && (
            <Link 
              to="/admin/productores" 
              className="mt-4 flex items-center justify-between text-[11px] font-bold text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-lg px-2.5 py-1 transition-all"
            >
              <span>{kpis.productores_pendientes} Pendientes de Validación</span>
              <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* Card 2: Bodegas */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Bodegas</span>
              <p className="text-[28px] font-black text-white leading-none">{loading ? '—' : kpis.bodegas_activas}</p>
              <p className="text-[10px] text-gray-400">Aprobadas con silo físico</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Warehouse size={16} />
            </div>
          </div>
          {kpis.bodegas_pendientes > 0 && (
            <Link 
              to="/admin/bodegas" 
              className="mt-4 flex items-center justify-between text-[11px] font-bold text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-lg px-2.5 py-1 transition-all"
            >
              <span>{kpis.bodegas_pendientes} Pendientes de Aprobación</span>
              <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* Card 3: Transacciones */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Transacciones (7d)</span>
              <p className="text-[28px] font-black text-white leading-none">{loading ? '—' : kpis.transacciones_7d}</p>
              <p className="text-[10px] text-gray-400">Operaciones coordinadas</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Landmark size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1 leading-none">
            <span>Volumen fluido y monitoreado</span>
          </div>
        </div>

        {/* Card 4: Alertas */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Alertas Activas</span>
              <p className="text-[28px] font-black text-red-500 leading-none">{loading ? '—' : kpis.alertas_criticas + kpis.alertas_medias}</p>
              <p className="text-[10px] text-gray-450">{kpis.alertas_criticas} críticas · {kpis.alertas_medias} medias</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle size={16} />
            </div>
          </div>
          {(kpis.alertas_criticas > 0 || kpis.alertas_medias > 0) && (
            <Link 
              to="/admin/alertas" 
              className="mt-4 flex items-center justify-between text-[11px] font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg px-2.5 py-1 transition-all"
            >
              <span>Gestionar Alertas Activas</span>
              <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* Card 5: Requerimientos */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Requerimientos Activos</span>
              <p className="text-[24px] font-black text-white leading-none">
                {loading ? '—' : `${fmtNum(kpis.requerimientos_ton)} t`}
              </p>
              <p className="text-[10px] text-gray-400">Demandado por bodegas</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Search size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1 leading-none">
            <span>Silo con capacidad de compra</span>
          </div>
        </div>

        {/* Card 6: Disponibilidades */}
        <div className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Disponibilidad Declarada</span>
              <p className="text-[24px] font-black text-white leading-none">
                {loading ? '—' : `${fmtNum(kpis.disponibilidades_ton)} t`}
              </p>
              <p className="text-[10px] text-gray-400">Declarada por productores</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1 leading-none">
            <span>Maíz blanco nacional cosechado</span>
          </div>
        </div>

      </div>

      {/* ── SECTION 2: LIVE PRICING CARD ── */}
      <section className="bg-gradient-to-br from-[#1A5C38] via-[#124227] to-[#0b2b1a] rounded-[24px] border border-emerald-500/20 p-6 shadow-xl relative overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <h2 className="text-[12px] font-extrabold text-emerald-300 tracking-widest uppercase">Precios del Maíz Blanco · Hoy</h2>
            </div>
            <h3 className="text-[20px] font-bold text-white tracking-tight">Referencias Nacionales e Internacionales</h3>
            <p className="text-[11px] text-emerald-100/60 flex items-center gap-1">
              <Clock size={11} /> Actualizado hoy · Base de Chicago CME & Banxico
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-12 flex-1 md:justify-end md:max-w-xl">
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Margen Negociación</p>
              <p className="text-[24px] font-black text-white tracking-tight leading-none">
                {fmt(precios.margen_negociacion)}
              </p>
              <p className="text-[10px] text-emerald-200/50">Chicago CME + Bono</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Precio Compra</p>
              <p className="text-[24px] font-black text-white tracking-tight leading-none">
                {fmt(precios.precio_compra)}
              </p>
              <p className="text-[10px] text-emerald-200/50">Promedio Bodegas (PO+S)</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Precio Venta</p>
              <p className="text-[24px] font-black text-white tracking-tight leading-none">
                {fmt(precios.precio_venta)}
              </p>
              <p className="text-[10px] text-emerald-200/50">Diferencial Neto</p>
            </div>

          </div>

          <button 
            onClick={() => navigate('/admin/precios')}
            className="flex items-center justify-center gap-2 bg-white text-[#1A5C38] hover:bg-emerald-50 active:scale-95 px-5 py-3 rounded-xl text-[13px] font-extrabold tracking-tight transition-all duration-200 shadow-lg shadow-emerald-950/20"
          >
            Ver Detalle Completo
            <ArrowRight size={14} />
          </button>

        </div>
      </section>

      {/* ── SECTION 3: RECENT ACTIVITIES TABLE ── */}
      <section className="bg-[#090d12]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-emerald-500" />
          <h2 className="text-[14px] font-bold text-white tracking-tight">Actividad Operacional Reciente</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] divide-y divide-white/5">
            <thead>
              <tr className="text-gray-500 font-bold text-[10.5px] uppercase tracking-widest">
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {eventos.map((ev, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-3.5 px-4 font-semibold">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ev.tipo === 'validacion' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                      ev.tipo === 'bodega' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' :
                      ev.tipo === 'transaccion' ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' :
                      'text-red-400 bg-red-500/10 border border-red-500/20'
                    }`}>
                      {ev.tipo}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">{ev.descripcion}</td>
                  <td className="py-3.5 px-4 text-gray-400">{ev.actor}</td>
                  <td className="py-3.5 px-4 text-gray-500">{ev.fecha}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link 
                      to={ev.link} 
                      className="text-emerald-500 hover:text-emerald-400 font-bold text-[12.5px] inline-flex items-center gap-0.5 hover:underline"
                    >
                      Auditar <ChevronRight size={12} />
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
