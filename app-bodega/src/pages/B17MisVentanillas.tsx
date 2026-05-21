import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B17MisVentanillas() {
  const [ventanillas, setVentanillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.ventanillas.list()
      .then((r: any) => setVentanillas(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tipoLabel: Record<string, string> = {
    coberturas: 'Coberturas',
    incentivos: 'Incentivos',
    ambos: 'Coberturas e Incentivos',
  };

  const tipoBadge: Record<string, string> = {
    coberturas: 'bg-blue-100 text-blue-700',
    incentivos: 'bg-purple-100 text-purple-700',
    ambos: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Mis Ventanillas" subtitle="Apoyos para productores" back="/mas" />

      <div className="px-4 sm:px-6 py-5 space-y-3">
        {loading && <p className="text-center text-gray-400 text-[14px] py-10">Cargando…</p>}

        {ventanillas.map(v => (
          <button
            key={v.id}
            onClick={() => navigate(`/ventanillas/${v.id}/solicitudes`)}
            className="w-full bg-white rounded-2xl shadow-sm border border-black/5 p-4 text-left active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[16px] text-gray-900">{v.bodega_nombre}</p>
                {v.nombre_ventanilla && (
                  <p className="text-[13px] text-gray-500 mt-0.5">{v.nombre_ventanilla}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${tipoBadge[v.tipo] || 'bg-gray-100 text-gray-500'}`}>
                    {tipoLabel[v.tipo] || v.tipo}
                  </span>
                  {v.solicitudes_pendientes > 0 && (
                    <span className="text-[12px] bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">
                      {v.solicitudes_pendientes} pendientes
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
            </div>
          </button>
        ))}

        {!loading && ventanillas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🏛️</p>
            <p className="font-semibold text-[16px] text-gray-600">Sin ventanillas configuradas</p>
            <p className="text-[14px] mt-1">Configura una para publicar apoyos</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/ventanillas/nueva')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
