import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Package, Tag, Eye, PenLine, ChevronRight, Warehouse, Activity, BadgeCheck, Factory } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

interface Stats {
  mis_bodegas: number;
  total_stock: number;
  total_capacidad: number;
  ocupacion_pct: number;
  espacio_libre: number;
  ultimo_precio: number;
  tiene_ventanilla: boolean;
  solicitudes_pendientes: number;
  productores_cercanos: number;
  toneladas_cercanas: number;
}

export default function B04Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.home.stats()
      .then((r: any) => setStats(r.stats || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Mexico timezone clock (always Mexico, not device)
  const getMexicoTime = () => new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: '2-digit', hour12: true });
  const getMexicoHour = () => Number(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false }));
  const [reloj, setReloj] = useState(getMexicoTime());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => setReloj(getMexicoTime()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  const hora = getMexicoHour();
  const saludo = hora < 12 ? '¡Buenos días!' : hora < 19 ? '¡Buenas tardes!' : '¡Buenas noches!';
  const hoy = new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long' });

  const ocupPct = stats.ocupacion_pct ?? 0;
  const barColor = ocupPct < 70 ? 'bg-[#1A5C38]' : ocupPct < 90 ? 'bg-amber-400' : 'bg-red-500';
  const kpiColor = ocupPct < 70 ? 'green' : ocupPct < 90 ? 'yellow' : 'red';

  const acciones = [
    { icon: Tag,        label: 'Publicar precio del día',   path: '/precio-diario',       desc: 'Precio que ofreces hoy',        iconColor: 'text-[#1A5C38]',  bg: 'bg-[#1A5C38]/[0.08]' },
    { icon: Eye,        label: 'Ver oferta de productores', path: '/oferta',               desc: 'Disponibilidad por municipio',  iconColor: 'text-blue-600',   bg: 'bg-blue-50' },
    { icon: PenLine,    label: 'Registrar transacción',     path: '/transacciones/nueva',  desc: 'Compra o venta de maíz',        iconColor: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Activity,   label: 'Actualizar inventario',     path: '/inventario',           desc: 'Volumen almacenado hoy',        iconColor: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="w-full">
      {/* ── Banner full-bleed ── */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-2">Tablero</p>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
              <span className="text-white text-[15px] font-black">
                {(user?.nombre_completo || 'B').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">
                {saludo}
              </h1>
              <p className="text-[13px] font-medium text-white/40 mt-0.5 truncate">{user?.nombre_completo || ''}</p>
            </div>
          </div>
          {/* Role badge + date + Mexico clock row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
              {user?.rol === 'industria'
                ? <Factory size={11} className="text-green-200" />
                : <Warehouse size={11} className="text-green-200" />}
              <span className="text-[11px] font-bold text-white capitalize">{user?.rol || 'bodega'}</span>
              <BadgeCheck size={11} className="text-green-300" />
            </div>
            <p className="text-green-200/60 text-[11px] capitalize">{hoy}</p>
            {/* Reloj tiempo real México */}
            <div className="ml-auto bg-[#22c55e]/20 border border-[#22c55e]/30 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[11px] font-bold text-white tracking-wide">{reloj}</span>
              <span className="text-[9px] text-green-200/70 font-medium">MX</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPIs: 2 cols mobile → 4 cols desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                title="Precio promedio de maíz al productor hoy"
                value={stats.ultimo_precio ? `$${stats.ultimo_precio.toLocaleString()}` : '—'}
                subtitle="MXN/ton · último publicado"
                icon={<DollarSign size={15} />}
                color="green"
                onClick={() => navigate('/precio-diario')}
              />
              {stats.tiene_ventanilla ? (
                <KPICard
                  title="Solicitudes"
                  value={stats.solicitudes_pendientes ?? 0}
                  subtitle="pendientes en ventanilla"
                  icon={<FileText size={15} />}
                  color="blue"
                  onClick={() => navigate('/ventanillas')}
                />
              ) : (
                <KPICard
                  title="Mis bodegas"
                  value={stats.mis_bodegas ?? 0}
                  subtitle="bodegas asociadas"
                  icon={<Warehouse size={15} />}
                  color="blue"
                  onClick={() => navigate('/mis-bodegas')}
                />
              )}

              <KPICard
                title="Productores cercanos"
                value={stats.productores_cercanos ?? 0}
                subtitle={`~${(stats.toneladas_cercanas ?? 0).toLocaleString()} ton disponibles`}
                icon={<Package size={15} />}
                color="green"
                onClick={() => navigate('/oferta')}
              />
              <KPICard
                title="Ocupación del almacén"
                value={`${ocupPct}%`}
                subtitle={
                  <div className="space-y-1 mt-0.5">
                    <div className="bg-gray-100 rounded-full h-1.5 w-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(ocupPct, 100)}%` }} />
                    </div>
                    <span className="block text-[10px]">{(stats.total_stock ?? 0).toLocaleString()} ton de {(stats.total_capacidad ?? 0).toLocaleString()} ton · {(stats.espacio_libre ?? Math.max(0, (stats.total_capacidad ?? 0) - (stats.total_stock ?? 0))).toLocaleString()} ton libres</span>
                  </div>
                }
                icon={<Activity size={15} />}
                color={kpiColor}
                onClick={() => navigate('/inventario')}
              />
            </div>

            {/* Acciones rápidas: 1 col mobile → 2 cols desktop */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Acciones rápidas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {acciones.map(({ icon: Icon, label, path, desc, iconColor, bg }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform text-left"
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon size={19} className={iconColor} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">{label}</p>
                      <p className="text-[12px] text-gray-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
