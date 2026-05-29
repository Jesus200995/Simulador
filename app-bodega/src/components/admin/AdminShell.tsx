import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { 
  Home, Users, Warehouse, AlertTriangle, Coins, LogOut, Menu, X, ShieldAlert 
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: any;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    { name: 'Resumen General', path: '/admin', icon: Home },
    { name: 'Productores', path: '/admin/productores', icon: Users },
    { name: 'Bodegas', path: '/admin/bodegas', icon: Warehouse },
    { name: 'Alertas', path: '/admin/alertas', icon: AlertTriangle },
    { name: 'Precios', path: '/admin/precios', icon: Coins },
  ];

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  // Get display title based on current path
  const getPageTitle = () => {
    const current = menuItems.find(item => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname.startsWith('/admin/productores/')) return 'Detalle de Productor';
    if (location.pathname.startsWith('/admin/bodegas/')) return 'Detalle de Bodega';
    return 'Panel de Control';
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold transition-all duration-200
    ${isActive 
      ? 'bg-[#1A5C38] text-white shadow-md shadow-emerald-950/20' 
      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
    }
  `;

  return (
    <div className="min-h-screen bg-[#0d131a] text-gray-100 flex relative overflow-x-hidden">
      
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[#090d12] border-r border-white/5 flex-shrink-0 sticky top-0">
        
        {/* Logo and Brand */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldAlert className="text-emerald-500" size={16} />
          </div>
          <div>
            <h1 className="text-[15px] font-black tracking-tight leading-none text-white">SIMAC Admin</h1>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold">PLAN NACIONAL MAÍZ</p>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white font-extrabold text-[14px] uppercase">
            {user?.nombres ? user.nombres.slice(0, 2) : (user?.nombre_completo ? user.nombre_completo.slice(0, 2) : 'AD')}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-bold text-white truncate leading-none mb-1">{user?.nombres || user?.nombre_completo || 'Administrador'}</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
              {user?.rol || 'Admin'}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/admin'} className={navLinkClass}>
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 active:scale-95 transition-all duration-200"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR MOBILE BACKDROP OVERLAY ── */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── SIDEBAR MOBILE DRAWER ── */}
      <aside 
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-[260px] bg-[#090d12] border-r border-white/5 z-50 flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldAlert className="text-emerald-500" size={16} />
            </div>
            <h1 className="text-[15px] font-black text-white">SIMAC Admin</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white font-extrabold text-[14px] uppercase">
            {user?.nombres ? user.nombres.slice(0, 2) : (user?.nombre_completo ? user.nombre_completo.slice(0, 2) : 'AD')}
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-white leading-none mb-1">{user?.nombres || user?.nombre_completo || 'Administrador'}</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
              {user?.rol || 'Admin'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              end={item.path === '/admin'}
              onClick={() => setIsOpen(false)} 
              className={navLinkClass}
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header/Navbar */}
        <header className="sticky top-0 z-30 bg-[#0d131a]/85 backdrop-blur-md border-b border-white/5 h-[64px] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-[15px] font-bold text-white tracking-tight leading-none">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:inline-block">
              Plan Nacional Maíz 2026
            </span>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="text-right hidden sm:block">
              <p className="text-[11.5px] text-gray-400 font-semibold">{user?.nombres || user?.nombre_completo || 'Administrador'}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{user?.rol || 'Admin'}</p>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
