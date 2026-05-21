import { useNavigate } from 'react-router-dom';
import { Receipt, DollarSign, Store, FileText, Warehouse } from 'lucide-react';
import { PageHeader } from '../components/Layout';

const ACCIONES = [
  { icon: DollarSign, label: 'Publicar precio del día', path: '/precio-diario', color: 'text-green-700 bg-green-50' },
  { icon: Receipt, label: 'Historial de transacciones', path: '/transacciones', color: 'text-blue-700 bg-blue-50' },
  { icon: Store, label: 'Tarifario de servicios', path: '/tarifario', color: 'text-purple-700 bg-purple-50' },
  { icon: Warehouse, label: 'Mis ventanillas', path: '/ventanillas', color: 'text-orange-700 bg-orange-50' },
  { icon: FileText, label: 'Señales de compra', path: '/senales/nueva', color: 'text-cyan-700 bg-cyan-50' },
];

export default function MasPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Más" subtitle="Herramientas y configuración" />
      <div className="px-4 py-4 space-y-2">
        {ACCIONES.map(({ icon: Icon, label, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl ${color} font-semibold text-sm hover:opacity-90 transition-opacity text-left`}>
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
