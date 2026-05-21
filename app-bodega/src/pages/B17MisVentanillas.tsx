import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { PageBanner } from '../components/Layout';
import { Building2 } from 'lucide-react';
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
    <div className="w-full">
      <PageBanner title="Mis Ventanillas" subtitle="Apoyos para productores" back="/mas" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ventanillas.map(v => (
            <button
              key={v.id}
              onClick={() => navigate(`/ventanillas/${v.id}/solicitudes`)}
              className="w-full bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A5C38]/[0.08] flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-[#1A5C38]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-gray-900 truncate">{v.bodega_nombre}</p>
                  {v.nombre_ventanilla && (
                    <p className="text-[12px] text-gray-400 truncate">{v.nombre_ventanilla}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tipoBadge[v.tipo] || 'bg-gray-100 text-gray-500'}`}>
                      {tipoLabel[v.tipo] || v.tipo}
                    </span>
                    {v.solicitudes_pendientes > 0 && (
                      <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 font-semibold px-2 py-0.5 rounded-full">
                        {v.solicitudes_pendientes} pendientes
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {!loading && ventanillas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Building2 size={32} className="text-gray-300" />
            </div>
            <p className="font-semibold text-[16px] text-gray-700">Sin ventanillas configuradas</p>
            <p className="text-[14px] text-gray-400">Configura una para publicar apoyos</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/ventanillas/nueva')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
