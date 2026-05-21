import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Warehouse, Users, Receipt, MoreHorizontal, Bell } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tablero' },
  { path: '/mis-bodegas', icon: Warehouse, label: 'Bodegas' },
  { path: '/oferta', icon: Users, label: 'Oferta' },
  { path: '/transacciones', icon: Receipt, label: 'Transacciones' },
  { path: '/mas', icon: MoreHorizontal, label: 'Más' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#1A5C38]">SIMAC</span>
          <span className="hidden sm:inline text-xs text-gray-400 font-medium">Bodega</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/notificaciones" className="relative p-2 text-gray-500 hover:text-[#1A5C38]">
            <Bell size={20} />
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            {user?.nombre_completo?.split(' ')[0] || 'Salir'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 flex items-stretch">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors
                ${active ? 'text-[#1A5C38] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-4">
      {back && (
        <button onClick={() => navigate(back)} className="text-sm text-gray-500 hover:text-gray-800 mb-1 flex items-center gap-1">
          ← Volver
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
