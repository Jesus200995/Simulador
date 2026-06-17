import { type ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Warehouse, Users, Receipt, MoreHorizontal, ChevronLeft, X, LogOut, User, Bell, Settings, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import AppHeader from './AppHeader';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tablero' },
  { path: '/mis-bodegas', icon: Warehouse, label: 'Bodegas' },
  { path: '/oferta', icon: Users, label: 'Oferta' },
  { path: '/transacciones', icon: Receipt, label: 'Transacciones' },
  { path: '/mas', icon: MoreHorizontal, label: 'Más' },
];

const SYSTEM_NAME = 'Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México';

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    const fetchNotifs = () => {
      api.notificaciones.mis()
        .then((r: any) => setNoLeidas(r.total_no_leidas || 0))
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  }

  const initials = user?.nombre_completo
    ? user.nombre_completo.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col h-dvh bg-[#eef8f2] overflow-hidden w-full">

      {/* ── Header premium "liquid glass" (compartido) ── */}
      <AppHeader
        subtitle={SYSTEM_NAME}
        initials={initials}
        notifCount={noLeidas}
        onBrand={() => navigate('/dashboard')}
        onBell={() => navigate('/notificaciones')}
        onMenu={() => setDrawerOpen(true)}
      />

      {/* ── Main content ───────────────────────────────── */}
      {/* En desktop el contenido se centra en una columna para verse profesional
          (como en "seleccionar bodegas") en vez de estirarse a todo lo ancho. */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full pb-[72px] bg-[#eef8f2]">
        <div className="w-full max-w-5xl mx-auto">{children}</div>
      </main>

      {/* ── Bottom nav ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] flex items-stretch shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path + '/'));
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] gap-[3px] transition-colors
                ${active ? 'text-[#1A5C38]' : 'text-gray-400'}`}
            >
              <Icon size={23} strokeWidth={active ? 2.4 : 1.7} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              {active && <div className="absolute bottom-0 w-5 h-[2px] bg-[#1A5C38] rounded-full" style={{ position: 'relative' }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Profile Drawer ─────────────────────────────── */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] px-5 pt-12 pb-6">
          <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-white/70 active:text-white">
            <X size={22} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3 shadow-inner">
            <span className="text-white text-[22px] font-bold">{initials}</span>
          </div>
          <p className="text-white font-bold text-[17px] leading-tight">{user?.nombre_completo || 'Usuario'}</p>
          <p className="text-green-200 text-[13px] mt-0.5">{user?.email || ''}</p>
          <span className="inline-block mt-2 bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
            {user?.rol || 'bodega'}
          </span>
        </div>

        {/* Drawer menu */}
        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {[
            { icon: User, label: 'Mi perfil', action: () => { setDrawerOpen(false); navigate('/perfil'); } },
            { icon: Bell, label: 'Notificaciones', action: () => { setDrawerOpen(false); navigate('/notificaciones'); } },
            { icon: Settings, label: 'Configuración', action: () => { setDrawerOpen(false); navigate('/configuracion'); } },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-[#f4fbf7] active:bg-[#eef8f2] transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-[#eef8f2] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#1A5C38]" />
              </div>
              <span className="flex-1 text-[15px] font-medium">{label}</span>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* App info */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center leading-snug">
            {SYSTEM_NAME}
          </p>
          <p className="text-[10px] text-gray-300 text-center mt-0.5">Plan Nacional Maíz 2026 · v1.0</p>
        </div>

        {/* Logout */}
        <div className="px-4 pb-8 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl py-3.5 text-[15px] font-semibold active:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string | number;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border-b border-black/[0.06] px-4 sm:px-6 pt-3.5 pb-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {back !== undefined && (
              <button
                onClick={() => typeof back === 'number' ? navigate(back) : navigate(back)}
                className="flex items-center gap-0.5 text-[#1A5C38] text-[14px] font-medium mb-1.5 active:opacity-60 transition-opacity"
              >
                <ChevronLeft size={18} strokeWidth={2.5} className="-ml-1" />
                Volver
              </button>
            )}
            <h1 className="text-[20px] font-bold text-gray-900 leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[13px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0 pt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBanner({
  title,
  subtitle,
  back,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string | number;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-20 w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_8px_30px_rgba(26,92,56,0.25)] relative overflow-hidden group/banner">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-700 opacity-50 group-hover/banner:opacity-100" />
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pt-4 pb-5 relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/banner:translate-x-1">
        {back !== undefined && (
          <button
            onClick={() => typeof back === 'number' ? navigate(back) : navigate(back)}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-2 active:opacity-60 transition-opacity hover:text-green-100"
          >
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1 transition-transform group-hover/banner:-translate-x-0.5" />
            Volver
          </button>
        )}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {badge && <div className="mb-1.5">{badge}</div>}
            <h1 className="text-[20px] sm:text-[24px] font-bold text-white leading-tight drop-shadow-sm">{title}</h1>
            {subtitle && <p className="text-green-100/80 text-[13px] mt-0.5 leading-snug font-medium">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
