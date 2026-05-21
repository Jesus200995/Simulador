import { useNavigate } from 'react-router-dom';
import { ChevronRight, Receipt, DollarSign, Store, FileText, Warehouse, User } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const ACCIONES = [
  { icon: DollarSign, label: 'Publicar precio del día', desc: 'Precio diario al productor', path: '/precio-diario', iconBg: 'bg-[#1A5C38]/10', iconColor: 'text-[#1A5C38]' },
  { icon: Receipt, label: 'Historial de transacciones', desc: 'Compras registradas', path: '/transacciones', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { icon: Store, label: 'Tarifario de servicios', desc: 'Precios de servicios', path: '/tarifario', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { icon: Warehouse, label: 'Mis ventanillas', desc: 'Apoyos para productores', path: '/ventanillas', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { icon: FileText, label: 'Señales de compra', desc: 'Notifica a productores', path: '/senales/nueva', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
];

export default function MasPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Header interno */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1A5C38]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-[#1A5C38]" />
          </div>
          <div>
            <p className="font-bold text-[17px] text-gray-900">{user?.nombre_completo || 'Bodeguero'}</p>
            <p className="text-[13px] text-gray-500">{user?.email || 'SOMAC'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-3">
        {/* Acciones principales */}
        <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Herramientas</p>
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
          {ACCIONES.map(({ icon: Icon, label, desc, path, iconBg, iconColor }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors text-left"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={19} className={iconColor} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">{label}</p>
                <p className="text-[13px] text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Info app */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-4 py-4 flex items-center gap-3">
          <img src="/icono.png" alt="SIMAC" className="w-9 h-9 flex-shrink-0 rounded-lg ring-1 ring-[#4ade80]" />
          <div>
            <p className="text-[15px] font-bold text-[#1A5C38]">SIMAC</p>
            <p className="text-[12px] text-gray-400">Ordenamiento Maíz Blanco México</p>
          </div>
        </div>
      </div>
    </div>
  );
}
