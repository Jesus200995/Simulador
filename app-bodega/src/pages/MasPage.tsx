import { useNavigate } from 'react-router-dom';
import { ChevronRight, Receipt, Tag, Store, FileText, Warehouse, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const ACCIONES = [
  { icon: Tag,       label: 'Publicar precio del día',    desc: 'Precio diario al productor',  path: '/precio-diario',  iconBg: 'bg-[#1A5C38]/[0.08]', iconColor: 'text-[#1A5C38]' },
  { icon: Receipt,   label: 'Historial de transacciones', desc: 'Compras registradas',         path: '/transacciones', iconBg: 'bg-blue-50',           iconColor: 'text-blue-600' },
  { icon: Store,     label: 'Tarifario de servicios',     desc: 'Precios de servicios',        path: '/tarifario',     iconBg: 'bg-purple-50',         iconColor: 'text-purple-600' },
  { icon: Warehouse, label: 'Mis ventanillas',            desc: 'Apoyos para productores',    path: '/ventanillas',   iconBg: 'bg-orange-50',         iconColor: 'text-orange-500' },
  { icon: FileText,    label: 'Requerimientos de maíz',      desc: 'Notifica a productores',     path: '/senales/nueva',     iconBg: 'bg-cyan-50',         iconColor: 'text-cyan-600' },
  { icon: TrendingUp,  label: 'Precios de mercado',          desc: 'Bodega vs gobierno vs mercado', path: '/precios-mercado', iconBg: 'bg-indigo-50',       iconColor: 'text-indigo-600' },
];

export default function MasPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const initials = (user?.nombre_completo || 'B')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div className="w-full">
      {/* Banner de perfil full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <span className="text-[18px] font-black text-white">{initials}</span>
          </div>
          <div>
            <p className="text-[18px] font-black text-white leading-tight">{user?.nombre_completo || 'Usuario'}</p>
            <p className="text-green-200/80 text-[12px] mt-0.5">{user?.email || ''}</p>
            <span className="inline-block mt-1.5 bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">{user?.rol || 'Bodega'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Herramientas: 1 col mobile → 2 cols desktop */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Herramientas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACCIONES.map(({ icon: Icon, label, desc, path, iconBg, iconColor }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform text-left"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={19} className={iconColor} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">{label}</p>
                <p className="text-[12px] text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Info app */}
        <div className="bg-white rounded-2xl border border-black/[0.06] px-4 py-4 flex items-center gap-3">
          <img src="/icono.png" alt="SOMEC" className="w-10 h-10 flex-shrink-0 rounded-xl ring-1 ring-[#4ade80]" />
          <div>
            <p className="text-[15px] font-bold text-[#1A5C38]">SOMEC</p>
            <p className="text-[12px] text-gray-400">Sistema de Ordenamiento · Maíz Blanco México</p>
          </div>
        </div>
      </div>
    </div>
  );
}
