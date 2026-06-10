import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  LayoutDashboard, Users, Warehouse, AlertTriangle,
  TrendingUp, LogOut, Menu, X, ShieldCheck, ChevronRight,
  Sprout, BarChart3, Settings
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: any;
  exact?: boolean;
}

const MENU: SidebarItem[] = [
  { label: 'Resumen',      path: '/admin',                icon: LayoutDashboard, exact: true },
  { label: 'Productores',  path: '/admin/productores',    icon: Users },
  { label: 'Bodegas',      path: '/admin/bodegas',        icon: Warehouse },
  { label: 'Alertas',      path: '/admin/alertas',        icon: AlertTriangle },
  { label: 'Precios',      path: '/admin/precios',        icon: TrendingUp },
  { label: 'Producción',   path: '/admin/produccion',     icon: Sprout },
  { label: 'Mercado',      path: '/admin/mercado',        icon: BarChart3 },
  { label: 'Configuración',path: '/admin/configuracion',  icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const pageTitle = () => {
    const m = MENU.find(i => i.exact ? i.path === location.pathname : location.pathname.startsWith(i.path));
    if (location.pathname.match(/\/admin\/productores\/.+/)) return 'Detalle Productor';
    if (location.pathname.match(/\/admin\/bodegas\/.+/)) return 'Detalle Bodega';
    return m?.label ?? 'Panel';
  };

  const initials = () => {
    const n = user?.nombres || user?.nombre_completo || 'AD';
    return n.slice(0, 2).toUpperCase();
  };

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 shadow-[0_1px_2px_rgba(16,92,56,0.06)]'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 ring-1 ring-transparent'
    }`;

  const Brand = ({ small }: { small?: boolean }) => (
    <div className="flex items-center gap-2.5">
      <div className={`${small ? 'w-7 h-7' : 'w-9 h-9'} rounded-[11px] bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(16,92,56,0.25)]`}>
        <ShieldCheck className="text-white" size={small ? 14 : 17} strokeWidth={2.4} />
      </div>
      <div>
        <h1 className={`${small ? 'text-[13px]' : 'text-[14.5px]'} font-black text-gray-900 tracking-tight leading-none`}>SIMAC Admin</h1>
        {!small && <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-widest">Plan Nacional Maíz</p>}
      </div>
    </div>
  );

  const UserCard = () => (
    <div className="flex items-center gap-2.5 bg-gray-50 rounded-2xl px-3 py-2.5 ring-1 ring-gray-200/70">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-[12px] flex-shrink-0 shadow-[0_2px_6px_rgba(16,92,56,0.22)]">
        {initials()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-gray-900 truncate leading-none mb-1">
          {user?.nombres || user?.nombre_completo || 'Administrador'}
        </p>
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
          {user?.rol || 'admin'}
        </span>
      </div>
    </div>
  );

  const NavItems = ({ mobile }: { mobile?: boolean }) => (
    <>
      {MENU.map(item => (
        <NavLink key={item.path} to={item.path} end={item.exact} className={navCls}>
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-500" />}
              <item.icon size={16} strokeWidth={2.2} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {!mobile && <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F6F8] text-gray-900 select-none">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-[244px] xl:w-[264px] h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/70 flex-shrink-0">
        <div className="flex items-center px-5 py-5 border-b border-gray-200/60 flex-shrink-0">
          <Brand />
        </div>
        <div className="px-4 py-4 border-b border-gray-200/60 flex-shrink-0">
          <UserCard />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          <NavItems />
        </nav>
        <div className="px-3 py-4 border-t border-gray-200/60 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 ring-1 ring-transparent hover:ring-red-100 active:scale-[0.98] transition-all duration-200"
          >
            <LogOut size={16} strokeWidth={2.2} className="flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER ── */}
      <div
        className={`lg:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white shadow-2xl
          transition-transform duration-300 ease-out w-[78vw] max-w-[300px]
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 flex-shrink-0">
          <Brand small />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-200/60 flex-shrink-0">
          <UserCard />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          <NavItems mobile />
        </nav>
        <div className="px-3 py-4 border-t border-gray-200/60 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} strokeWidth={2.2} className="flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-15 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200/70 bg-white/70 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Admin</span>
              <ChevronRight size={12} className="text-gray-300 hidden sm:inline flex-shrink-0" />
              <h2 className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 tracking-tight truncate">
                {pageTitle()}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PNMB 2026</span>
              <div className="h-3.5 w-px bg-gray-200" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[11.5px] text-gray-800 font-extrabold truncate max-w-[140px] leading-tight">
                {user?.nombres || user?.nombre_completo || 'Administrador'}
              </p>
              <p className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider mt-0.5 leading-none">
                {user?.rol || 'admin'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-[11px] flex-shrink-0 shadow-[0_2px_6px_rgba(16,92,56,0.22)]">
              {initials()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          <div key={location.pathname} className="max-w-[1400px] mx-auto h-full animate-fade-in">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-200/70 flex items-center justify-around px-1 py-1.5 safe-area-bottom flex-shrink-0">
          {MENU.slice(0, 5).map(item => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path} end={item.exact}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1">
                <item.icon size={19} strokeWidth={2.1}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className={`text-[9px] font-bold truncate transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
          <button onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 flex-1">
            <Menu size={19} strokeWidth={2.1} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-400">Más</span>
          </button>
        </nav>
        <div className="lg:hidden h-[60px] flex-shrink-0" />
      </div>
    </div>
  );
}
