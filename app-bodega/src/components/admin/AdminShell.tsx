import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  LayoutDashboard, Users, Warehouse, AlertTriangle,
  TrendingUp, LogOut, Menu, X, ShieldAlert, ChevronRight,
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

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer open
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
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
    }`;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0b1117] text-gray-100 select-none">

      {/* ══════════════════════════════════════════
          SIDEBAR — DESKTOP (≥1024px)
      ══════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-[240px] xl:w-[260px] h-screen bg-[#080c11] border-r border-white/[0.06] flex-shrink-0 select-none">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="w-8 h-8 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="text-emerald-400" size={15} />
          </div>
          <div>
            <h1 className="text-[14px] font-black text-white tracking-tight leading-none">SIMAC Admin</h1>
            <p className="text-[9px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">Plan Nacional Maíz</p>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[12px] flex-shrink-0">
              {initials()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-white truncate leading-none mb-0.5">
                {user?.nombres || user?.nombre_completo || 'Administrador'}
              </p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                {user?.rol || 'admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
          {MENU.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={navCls}
            >
              <item.icon size={15} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/10 active:scale-[0.98] transition-all duration-200"
          >
            <LogOut size={15} className="flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MOBILE DRAWER — Overlay + Sidebar
      ══════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 flex flex-col
          bg-[#080c11] border-r border-white/[0.08]
          transition-transform duration-300 ease-out
          w-[75vw] max-w-[300px]
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="text-emerald-400" size={13} />
            </div>
            <h1 className="text-[13px] font-black text-white">SIMAC Admin</h1>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Drawer user */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[12px] flex-shrink-0">
              {initials()}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-white truncate leading-none mb-0.5">
                {user?.nombres || user?.nombre_completo || 'Administrador'}
              </p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                {user?.rol || 'admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
          {MENU.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={navCls}
            >
              <item.icon size={15} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Drawer logout */}
        <div className="px-3 py-4 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.06] border border-transparent transition-all"
          >
            <LogOut size={14} className="flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* Top header bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] bg-[#0b1117]/90 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden -ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-gray-450 hover:text-white hover:bg-white/[0.05] transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb / page title */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:inline">Admin</span>
              <ChevronRight size={11} className="text-gray-600 hidden sm:inline flex-shrink-0" />
              <h2 className="text-[13px] sm:text-[14px] font-extrabold text-white tracking-tight truncate">
                {pageTitle()}
              </h2>
            </div>
          </div>

          {/* Right side info */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-550 uppercase tracking-widest">PNMB 2026</span>
              <div className="h-3 w-px bg-white/10" />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-gray-300 font-extrabold truncate max-w-[140px] leading-tight">
                {user?.nombres || user?.nombre_completo || 'Administrador'}
              </p>
              <p className="text-[9.5px] text-gray-500 font-black uppercase tracking-wider mt-0.5 leading-none">
                {user?.rol || 'admin'}
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[10px] flex-shrink-0">
              {initials()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto h-full">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#080c11]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-around px-2 py-2 safe-area-bottom flex-shrink-0">
          {MENU.map(item => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1"
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}
                />
                <span className={`text-[9px] font-bold truncate ${isActive ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </NavLink>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 flex-1"
          >
            <LogOut size={18} className="text-red-400/60" />
            <span className="text-[9px] font-bold text-red-400/60">Salir</span>
          </button>
        </nav>

        {/* Bottom spacer for mobile nav */}
        <div className="lg:hidden h-[62px] flex-shrink-0" />
      </div>
    </div>
  );
}
