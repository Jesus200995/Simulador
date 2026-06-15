import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Receipt, Tag, Store, FileText, Warehouse, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

const ACCIONES = [
  { icon: Tag,       label: 'Publicar precio del día',    desc: 'Precio diario al productor',  path: '/precio-diario',  iconBg: 'bg-[#1A5C38]/[0.08]', iconColor: 'text-[#1A5C38]' },
  { icon: Receipt,   label: 'Historial de transacciones', desc: 'Compras registradas',         path: '/transacciones', iconBg: 'bg-blue-50',           iconColor: 'text-blue-600' },
  { icon: Store,     label: 'Tarifario de servicios',     desc: 'Precios de servicios',        path: '/tarifario',     iconBg: 'bg-purple-50',         iconColor: 'text-purple-600' },
  { icon: Warehouse, label: 'Mis ventanillas',            desc: null,                         path: '/ventanillas',   iconBg: 'bg-orange-50',         iconColor: 'text-orange-500' },
  { icon: FileText,    label: 'Requerimientos de maíz',      desc: 'Notifica a productores',     path: '/senales/nueva',     iconBg: 'bg-cyan-50',         iconColor: 'text-cyan-600' },
  { icon: TrendingUp,  label: 'Precios de mercado',          desc: 'Bodega vs gobierno vs mercado', path: '/precios-mercado', iconBg: 'bg-indigo-50',       iconColor: 'text-indigo-600' },
];

export default function MasPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ventCount, setVentCount] = useState<number | null>(null);

  useEffect(() => {
    api.ventanillas.list().then((r: any) => {
      setVentCount(Array.isArray(r) ? r.length : (r?.ventanillas?.length ?? 0));
    }).catch(() => {});
  }, []);

  const initials = (user?.nombre_completo || 'B')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div className="w-full">
      {/* Banner de perfil full-bleed */}
      <div className="sticky top-0 z-20 w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_8px_30px_rgba(26,92,56,0.25)] relative overflow-hidden group/banner">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-700 opacity-50 group-hover/banner:opacity-100" />
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pt-4 pb-5 flex items-center gap-4 relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/banner:translate-x-1">
          <div className="w-14 h-14 rounded-[1.25rem] bg-white/20 backdrop-blur-sm shadow-inner flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover/banner:scale-110 group-hover/banner:-rotate-6">
            <span className="text-[18px] font-bold text-white drop-shadow-sm">{initials}</span>
          </div>
          <div>
            <p className="text-[18px] font-bold text-white leading-tight drop-shadow-sm">{user?.nombre_completo || 'Usuario'}</p>
            <p className="text-green-100/80 text-[12px] mt-0.5 font-medium">{user?.email || ''}</p>
            <span className="inline-block mt-1.5 bg-white/20 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">{user?.rol || 'Bodega'}</span>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-6 space-y-6">
        {/* Herramientas: 1 col mobile → 2 cols desktop */}
        <div>
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3 transition-colors hover:text-[#1A5C38]/60">Herramientas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ACCIONES.map(({ icon: Icon, label, desc, path, iconBg, iconColor }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-4 px-5 py-5 bg-white rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all duration-500 text-left hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-black/[0.08] group/card"
              >
                <span className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover/card:scale-110 group-hover/card:-rotate-3 ${iconBg}`}>
                  <Icon size={22} className={iconColor} />
                </span>
                <div className="flex-1 min-w-0 transition-transform duration-500 group-hover/card:translate-x-1">
                  <p className="text-[16px] font-bold text-gray-900 group-hover/card:text-[#1A5C38] transition-colors truncate">{label}</p>
                  <p className="text-[13px] text-gray-500 font-medium truncate mt-0.5">
                    {desc !== null ? desc : (
                      ventCount != null && ventCount > 0
                        ? `${ventCount} ventanilla${ventCount !== 1 ? 's' : ''} activa${ventCount !== 1 ? 's' : ''}`
                        : 'Toca para configurar una ventanilla de apoyo'
                    )}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0 transition-transform duration-300 group-hover/card:translate-x-1 group-hover/card:text-[#1A5C38]" />
              </button>
            ))}
          </div>
        </div>

        {/* Info app */}
        <div className="bg-white rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] px-5 py-5 flex items-center gap-4 transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-black/[0.08] group/card">
          <img src="/icono.png" alt="SIMAC" className="w-12 h-12 flex-shrink-0 rounded-[1.25rem] ring-1 ring-[#4ade80] transition-transform duration-500 group-hover/card:scale-110 group-hover/card:rotate-3 shadow-sm" />
          <div className="transition-transform duration-500 group-hover/card:translate-x-1">
            <p className="text-[16px] font-black text-[#1A5C38] tracking-tight">SIMAC</p>
            <p className="text-[13px] text-gray-500 font-medium mt-0.5">Sistema de Ordenamiento · Maíz Blanco México</p>
          </div>
        </div>
      </div>
    </div>
  );
}
