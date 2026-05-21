import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Package, Tag, Eye, PenLine, ChevronRight, Warehouse, Activity } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

interface Stats {
  mis_bodegas: number;
  total_stock: number;
  total_capacidad: number;
  ocupacion_pct: number;
  ultimo_precio: number;
  tiene_ventanilla: boolean;
  solicitudes_pendientes: number;
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

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

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
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <p className="text-[13px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Tablero</p>
          <h1 className="text-[26px] sm:text-[30px] font-black text-white leading-tight">
            {saludo}, {user?.nombre_completo?.split(' ')[0] || 'Bodeguero'}
          </h1>
          <p className="text-green-200/70 text-[14px] capitalize mt-1">{hoy}</p>
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
                title="Precio bodega"
                value={stats.ultimo_precio ? `$${stats.ultimo_precio.toLocaleString()}` : '—'}
                subtitle="MXN/ton · último registrado"
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
                title="Stock total"
                value={`${(stats.total_stock ?? 0).toLocaleString()} ton`}
                subtitle={`de ${(stats.total_capacidad ?? 0).toLocaleString()} ton capacidad`}
                icon={<Package size={15} />}
                color="green"
                onClick={() => navigate('/mis-bodegas')}
              />
              <KPICard
                title="Ocupación"
                value={`${ocupPct}%`}
                subtitle={
                  <div className="space-y-1 mt-0.5">
                    <div className="bg-gray-100 rounded-full h-1.5 w-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(ocupPct, 100)}%` }} />
                    </div>
                    <span className="block">promedio de tus bodegas</span>
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
