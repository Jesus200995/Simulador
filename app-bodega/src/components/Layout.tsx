import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Warehouse, Users, Receipt, MoreHorizontal, ChevronLeft } from 'lucide-react';
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
    <div className="flex flex-col min-h-dvh bg-[#F2F2F7] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="SOMAC" className="w-7 h-7" />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-[#1A5C38] tracking-tight">SOMAC</span>
            <span className="hidden sm:block text-[11px] text-gray-400 font-medium leading-tight">
              Maíz Blanco México
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-[13px] text-gray-500 font-medium active:opacity-60 transition-opacity"
        >
          {user?.nombre_completo?.split(' ')[0] || 'Salir'}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-gray-200/50 flex items-stretch pb-safe">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors
                ${active ? 'text-[#1A5C38]' : 'text-gray-400'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`font-${active ? 'semibold' : 'medium'}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: string | number;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 pt-3 pb-4">
      {back !== undefined && (
        <button
          onClick={() => {
            if (typeof back === 'number') navigate(back);
            else navigate(back);
          }}
          className="flex items-center gap-0.5 text-[#1A5C38] text-[15px] font-medium mb-2 active:opacity-60 transition-opacity"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="-ml-1" />
          Volver
        </button>
      )}
      <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-[14px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
