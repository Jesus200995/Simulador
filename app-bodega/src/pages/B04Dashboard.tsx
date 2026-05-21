import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Package, ClipboardList, Eye, PenLine } from 'lucide-react';
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
  const barColor = ocupPct < 70 ? 'bg-green-500' : ocupPct < 90 ? 'bg-yellow-400' : 'bg-red-500';
  const kpiColor = ocupPct < 70 ? 'green' : ocupPct < 90 ? 'yellow' : 'red';

  const precioTrend = stats.delta_precio
    ? (stats.delta_precio > 0 ? 'up' : 'down')
    : 'neutral';

  return (
    <div className="max-w-lg mx-auto">
      {/* Saludo */}
      <div className="bg-gradient-to-r from-[#1A5C38] to-[#2d7a52] px-4 pt-5 pb-6 text-white">
        <p className="text-lg font-bold">{saludo}, {user?.nombre_completo?.split(' ')[0] || 'Bodeguero'}</p>
        <p className="text-green-200 text-sm capitalize">{hoy}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">Cargando datos…</p>
        ) : (
          <>
            {/* KPIs 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <KPICard
                title="Precio del Maíz hoy"
                value={stats.precio_maiz_hoy ? `$${stats.precio_maiz_hoy.toLocaleString()}` : '—'}
                subtitle="MXN/ton"
                icon={<DollarSign size={18} />}
                trend={precioTrend}
                trendText={stats.delta_precio ? `$${Math.abs(stats.delta_precio)} vs ayer` : undefined}
                color="green"
              />

              {stats.tiene_ventanilla ? (
                <KPICard
                  title="Solicitudes ventanilla"
                  value={stats.solicitudes_ventanilla ?? 0}
                  subtitle="pendientes"
                  icon={<FileText size={18} />}
                  color="blue"
                  onClick={() => navigate('/ventanillas')}
                />
              ) : (
                <KPICard
                  title="Productores cercanos"
                  value={stats.productores_cercanos ?? 0}
                  subtitle={`Con maíz disponible${stats.radio_km ? ` en ${stats.radio_km} km` : ''}`}
                  icon={<Users size={18} />}
                  color="blue"
                  onClick={() => navigate('/oferta')}
                />
              )}

              <KPICard
                title="Productores cercanos"
                value={stats.productores_cercanos ?? 0}
                subtitle={stats.toneladas_cercanas ? `~${stats.toneladas_cercanas.toLocaleString()} ton aprox` : 'en tu área'}
                icon={<Users size={18} />}
                color="green"
                onClick={() => navigate('/oferta')}
              />

              <KPICard
                title="Ocupación almacén"
                value={`${ocupPct}%`}
                subtitle={
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-1.5 w-full">
                      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(ocupPct, 100)}%` }} />
                    </div>
                    <span className="text-gray-400 text-xs">
                      {stats.stock_ton?.toLocaleString() ?? '0'} / {stats.capacidad_ton?.toLocaleString() ?? '0'} ton
                    </span>
                  </div>
                }
                icon={<Package size={18} />}
                color={kpiColor}
                onClick={() => navigate('/inventario')}
              />
            </div>

            {/* Acceso rápido */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acciones rápidas</p>
              <div className="space-y-2">
                {[
                  { icon: ClipboardList, label: 'Publicar precio del día', path: '/precio-diario', color: 'bg-green-50 text-[#1A5C38]' },
                  { icon: Eye, label: 'Ver oferta de productores', path: '/oferta', color: 'bg-blue-50 text-blue-700' },
                  { icon: PenLine, label: 'Registrar transacción', path: '/transacciones/nueva', color: 'bg-orange-50 text-orange-700' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-medium text-sm ${color} hover:opacity-90 active:scale-98 transition-all shadow-sm`}
                  >
                    <Icon size={20} />
                    {label}
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
