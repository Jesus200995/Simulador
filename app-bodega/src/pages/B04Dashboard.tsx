import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Package, ClipboardList, Eye, PenLine, ChevronRight } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

interface Stats {
  precio_maiz_hoy: number;
  precio_publicado_usuario: number;
  delta_precio: number;
  solicitudes_ventanilla: number;
  tiene_ventanilla: boolean;
  productores_cercanos: number;
  radio_km: number;
  toneladas_cercanas: number;
  stock_ton: number;
  capacidad_ton: number;
  ocupacion_pct: number;
}

export default function B04Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.home.stats()
      .then((r: any) => setStats(r.bodega || r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const ocupPct = stats.ocupacion_pct ?? 0;
  const barColor = ocupPct < 70 ? 'bg-[#1A5C38]' : ocupPct < 90 ? 'bg-yellow-400' : 'bg-red-500';
  const kpiColor = ocupPct < 70 ? 'green' : ocupPct < 90 ? 'yellow' : 'red';

  const precioTrend = stats.delta_precio
    ? (stats.delta_precio > 0 ? 'up' : 'down')
    : 'neutral';

  const acciones = [
    { icon: ClipboardList, label: 'Publicar precio del día', path: '/precio-diario', color: 'text-[#1A5C38]', bg: 'bg-[#1A5C38]/8' },
    { icon: Eye, label: 'Ver oferta de productores', path: '/oferta', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: PenLine, label: 'Registrar transacción', path: '/transacciones/nueva', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Saludo */}
      <div className="bg-gradient-to-r from-[#1A5C38] to-[#2d7a52] px-4 sm:px-6 pt-6 pb-7 text-white">
        <p className="text-[22px] font-bold leading-tight">
          {saludo}, {user?.nombre_completo?.split(' ')[0] || 'Bodeguero'}
        </p>
        <p className="text-green-200 text-[14px] capitalize mt-0.5">{hoy}</p>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5">
        {loading ? (
          <p className="text-center text-[14px] text-gray-400 py-10">Cargando datos…</p>
        ) : (
          <>
            {/* KPIs 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <KPICard
                title="Precio del maíz"
                value={stats.precio_maiz_hoy ? `$${stats.precio_maiz_hoy.toLocaleString()}` : '—'}
                subtitle="MXN/ton hoy"
                icon={<DollarSign size={16} />}
                trend={precioTrend}
                trendText={stats.delta_precio ? `$${Math.abs(stats.delta_precio)} vs ayer` : undefined}
                color="green"
              />

              {stats.tiene_ventanilla ? (
                <KPICard
                  title="Solicitudes"
                  value={stats.solicitudes_ventanilla ?? 0}
                  subtitle="pendientes en ventanilla"
                  icon={<FileText size={16} />}
                  color="blue"
                  onClick={() => navigate('/ventanillas')}
                />
              ) : (
                <KPICard
                  title="Productores"
                  value={stats.productores_cercanos ?? 0}
                  subtitle={`Con maíz disponible${stats.radio_km ? ` en ${stats.radio_km} km` : ''}`}
                  icon={<Users size={16} />}
                  color="blue"
                  onClick={() => navigate('/oferta')}
                />
              )}

              <KPICard
                title="Productores cercanos"
                value={stats.productores_cercanos ?? 0}
                subtitle={stats.toneladas_cercanas ? `~${stats.toneladas_cercanas.toLocaleString()} ton aprox` : 'en tu área'}
                icon={<Users size={16} />}
                color="green"
                onClick={() => navigate('/oferta')}
              />

              <KPICard
                title="Ocupación"
                value={`${ocupPct}%`}
                subtitle={
                  <div className="mt-1.5">
                    <div className="bg-gray-100 rounded-full h-1.5 w-full">
                      <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(ocupPct, 100)}%` }} />
                    </div>
                    <span className="text-gray-400 text-[11px] mt-0.5 block">
                      {stats.stock_ton?.toLocaleString() ?? '0'} / {stats.capacidad_ton?.toLocaleString() ?? '0'} ton
                    </span>
                  </div>
                }
                icon={<Package size={16} />}
                color={kpiColor}
                onClick={() => navigate('/inventario')}
              />
            </div>

            {/* Acciones rápidas */}
            <div>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Acciones rápidas</p>
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
                {acciones.map(({ icon: Icon, label, path, color, bg }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors text-left"
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon size={18} className={color} />
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-gray-900">{label}</span>
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
