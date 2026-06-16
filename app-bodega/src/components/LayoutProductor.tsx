import { useEffect, type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, TrendingUp, Award, User, Bell, X, LogOut, Settings, ChevronRight, ChevronLeft, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const NAV = [
  { path: '/productor', icon: Home, label: 'Inicio' },
  { path: '/productor/mapa', icon: Map, label: 'Mapa' },
  { path: '/productor/precios', icon: TrendingUp, label: 'Precios' },
  { path: '/productor/incentivos', icon: Award, label: 'Apoyos' },
  { path: '/productor/perfil', icon: User, label: 'Perfil' },
];

const SYSTEM_NAME = 'Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México';

export function LayoutProductor({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cicloPendiente = typeof window !== 'undefined' && localStorage.getItem('ciclo_pendiente') === '1';

  const [notifNoLeidas, setNotifNoLeidas] = useState(0);
  const token = localStorage.getItem('simac_token');
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const r = await fetch(`${BASE}/alertas/notificaciones/mis`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const d = await r.json();
          setNotifNoLeidas(d.total_no_leidas ?? 0);
        }
      } catch { /* silencioso */ }
    };

    if (token) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60_000);
      return () => clearInterval(interval);
    }
  }, [token, BASE]);

  function handleLogout() {
    logout();
    navigate('/login-productor');
    setDrawerOpen(false);
  }

  const nombres = user?.nombres || user?.nombre_completo || '';
  const initials = nombres
    ? nombres.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'P';

  return (
    <div className="fixed inset-0 bg-[#f4f5f7] flex flex-col w-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-none z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 h-[60px] flex items-center justify-between shadow-sm">

        {/* Left: Logo + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img src="/icono.png" alt="SIMAC" className="w-9 h-9 rounded-[10px] ring-[1.5px] ring-[#1A5C38]/40 shadow-sm" />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-[16px] font-black tracking-tight leading-none text-[#1A5C38]">SIMAC</span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-[2px] truncate max-w-[200px] sm:max-w-[320px]">
              {SYSTEM_NAME}
            </span>
          </div>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-3 ml-3 flex-shrink-0">
          <button
            onClick={() => navigate('/productor/alertas')}
            className="relative w-8 h-8 flex items-center justify-center rounded-full active:opacity-70 transition-opacity hover:bg-slate-100"
          >
            <Bell size={20} className="text-slate-600" />
            {notifNoLeidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                               bg-rose-500 text-white text-[10px] font-bold rounded-full
                               flex items-center justify-center px-1 border-2 border-white">
                {notifNoLeidas > 9 ? '9+' : notifNoLeidas}
              </span>
            )}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="active:opacity-70 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A5C38] to-[#14472b] flex items-center justify-center shadow-sm">
              <span className="text-white text-[12px] font-bold">{initials}</span>
            </div>
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────── */}
      {/* En desktop el contenido se centra en una columna (como en "seleccionar
          bodegas"); las vistas de mapa a pantalla completa van a todo lo ancho. */}
      <main className="flex-1 overflow-y-auto w-full relative scroll-smooth bg-[#f4f5f7]">
        {(pathname === '/productor/mapa' || pathname.startsWith('/productor/ubicacion'))
          ? children
          : <div className="w-full max-w-2xl mx-auto">{children}</div>}
      </main>

      {/* ── Bottom nav ─────────────────────────────────── */}
      <nav className="flex-none z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 flex items-stretch shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || (path !== '/productor' && pathname.startsWith(path + '/'))
            || (path === '/productor' && pathname === '/productor');
          const isPerfil = path === '/productor/perfil';
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] gap-1 transition-colors
                ${active ? 'text-[#1A5C38]' : 'text-slate-400 hover:text-slate-500'}`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {isPerfil && cicloPendiente && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Profile Drawer ─────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] px-5 pt-12 pb-6">
          <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-white/70 active:text-white">
            <X size={22} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3 shadow-inner">
            <span className="text-white text-[22px] font-bold">{initials}</span>
          </div>
          <p className="text-white font-bold text-[17px] leading-tight">{nombres || 'Productor'}</p>
          <span className="inline-block mt-2 bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Productor
          </span>
        </div>

        {/* Drawer menu */}
        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {[
            { icon: User, label: 'Mi perfil', action: () => { setDrawerOpen(false); navigate('/productor/perfil'); } },
            { icon: CalendarCheck, label: 'Ciclo productivo', action: () => { setDrawerOpen(false); navigate('/productor/ciclo'); } },
            { icon: Bell, label: 'Alertas', action: () => { setDrawerOpen(false); navigate('/productor/alertas'); } },
            { icon: Settings, label: 'Configuracion', action: () => {} },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center flex-shrink-0">
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
          <p className="text-[10px] text-gray-300 text-center mt-0.5">Plan Nacional Maiz 2026 · v1.0</p>
        </div>

        {/* Logout */}
        <div className="px-4 pb-8 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl py-3.5 text-[15px] font-semibold active:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageHeaderProductor({
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
    <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 pt-3.5 pb-4 shadow-sm">
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {back !== undefined && (
              <button
                onClick={() => typeof back === 'number' ? navigate(back) : navigate(back)}
                className="flex items-center gap-0.5 text-[#1A5C38] text-[14px] font-bold mb-2 hover:opacity-70 transition-opacity"
              >
                <ChevronLeft size={18} strokeWidth={2.5} className="-ml-1" />
                Volver
              </button>
            )}
            <h1 className="text-[20px] font-bold text-slate-900 leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0 pt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}
