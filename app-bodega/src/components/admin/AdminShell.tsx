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
        ? 'bg-emerald-700/50 text-white ring-1 ring-emerald-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
        : 'text-emerald-100/70 hover:text-white hover:bg-emerald-700/30 ring-1 ring-transparent'
    }`;

  const JustifiedText = ({ text, className }: { text: string; className?: string }) => (
    <div className={`flex justify-between ${className || ''}`}>
      {text.split('').map((c, i) => c === ' ' ? <span key={i} className="w-[0.3em]" /> : <span key={i}>{c}</span>)}
    </div>
  );

  const Brand = ({ small }: { small?: boolean }) => (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-white/20 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-3 group-hover:bg-white/20 group-active:scale-95`}>
        <ShieldCheck className="text-white transition-transform duration-500 group-hover:scale-110" size={small ? 16 : 19} strokeWidth={2.4} />
      </div>
      <div className={`${small ? 'w-[90px]' : 'w-[125px]'} flex flex-col justify-center transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1`}>
        <div style={{ fontFamily: "'Outfit', sans-serif" }}>
          <JustifiedText 
            text="SIMAC" 
            className={`${small ? 'text-[15px]' : 'text-[18px]'} font-black text-emerald-300 leading-none uppercase mb-[4px]`} 
          />
        </div>
        {!small && (
          <JustifiedText 
            text="PLAN NACIONAL MAÍZ" 
            className="text-[7.5px] text-emerald-200/80 font-bold uppercase leading-none mb-[5px] transition-colors duration-300 group-hover:text-emerald-100" 
          />
        )}
        <div className="w-full">
          <div className="w-full bg-emerald-700/40 text-emerald-200 text-[8px] font-bold uppercase py-[3px] rounded border border-emerald-600/30 leading-none">
            <JustifiedText text="ADMINISTRADOR" className="px-1.5" />
          </div>
        </div>
      </div>
    </div>
  );

  const UserCard = () => (
    <div className="flex items-center gap-2.5 bg-emerald-900/40 rounded-2xl px-3 py-2.5 ring-1 ring-emerald-700/50 group hover:bg-emerald-900/60 transition-all duration-300 cursor-default">
      <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-black text-[13px] flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
        {initials()}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-[11px] font-extrabold text-white truncate leading-none mb-[4px] group-hover:text-emerald-50 transition-colors uppercase">
          {user?.nombres || user?.nombre_completo || 'Administrador'}
        </p>
        <div className="flex items-center">
          <span className="bg-emerald-800/60 text-emerald-300 text-[7px] font-bold uppercase tracking-widest px-1.5 py-[3px] rounded border border-emerald-700/50 leading-none group-hover:text-emerald-200 transition-colors">
            {user?.rol === 'admin' ? 'Administrador' : (user?.rol || 'Administrador')}
          </span>
        </div>
      </div>
    </div>
  );

  const NavItems = ({ mobile }: { mobile?: boolean }) => (
    <>
      {MENU.map(item => (
        <NavLink key={item.path} to={item.path} end={item.exact} className={navCls}>
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-400" />}
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
      <aside className="hidden lg:flex flex-col w-[244px] xl:w-[264px] h-screen bg-emerald-800 border-r border-emerald-900/50 flex-shrink-0 rounded-br-[2.5rem] shadow-[2px_4px_16px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center px-5 py-5 border-b border-emerald-700/50 flex-shrink-0">
          <Brand />
        </div>
        <div className="px-4 py-4 border-b border-emerald-700/50 flex-shrink-0">
          <UserCard />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          <NavItems />
        </nav>
        <div className="px-3 py-4 border-t border-emerald-700/50 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/20 ring-1 ring-transparent hover:ring-red-500/30 active:scale-[0.98] transition-all duration-200"
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
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-emerald-800 shadow-2xl
          transition-transform duration-300 ease-out w-[78vw] max-w-[300px]
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-700/50 flex-shrink-0">
          <Brand small />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-xl bg-emerald-700/50 flex items-center justify-center text-emerald-200 hover:text-white hover:bg-emerald-600/50 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-emerald-700/50 flex-shrink-0">
          <UserCard />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
          <NavItems mobile />
        </nav>
        <div className="px-3 py-4 border-t border-emerald-700/50 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={15} strokeWidth={2.2} className="flex-shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-15 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1b5e3a]/50 bg-[#2e8b57] backdrop-blur-xl flex-shrink-0 rounded-br-[2.5rem] shadow-[0_4px_16px_rgba(0,0,0,0.05)] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-[#1b5e3a]/50 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-1.5 min-w-0 group cursor-pointer">
              <span className="text-[9px] font-bold text-white uppercase tracking-widest hidden sm:inline transition-colors duration-300 bg-[#1b5e3a]/40 px-1.5 py-[3px] rounded border border-[#1b5e3a]/50 leading-none">Administrador</span>
              <ChevronRight size={12} className="text-white/60 hidden sm:inline flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              <h2 className="text-[14px] sm:text-[15px] font-extrabold text-white tracking-tight truncate transition-colors duration-300">
                {pageTitle()}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">PNMB 2026</span>
              <div className="h-3.5 w-px bg-white/30" />
            </div>
            <div className="text-right hidden sm:flex flex-col justify-center group cursor-default">
              <p className="text-[10.5px] text-white font-extrabold truncate max-w-[140px] leading-none mb-[4px] transition-colors duration-300 uppercase">
                {user?.nombres || user?.nombre_completo || 'Administrador'}
              </p>
              <div className="flex justify-end">
                <span className="bg-[#1b5e3a]/60 text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-[3px] rounded border border-white/20 leading-none transition-colors duration-300">
                  {user?.rol === 'admin' ? 'Administrador' : (user?.rol || 'Administrador')}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1b5e3a] flex items-center justify-center text-white font-black text-[11px] flex-shrink-0 shadow-inner ring-1 ring-white/30 hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer">
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
