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

  const tipoLabel: Record<string, string> = { coberturas: 'Coberturas', incentivos: 'Incentivos', ambos: 'Coberturas e Incentivos' };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Mis Ventanillas" subtitle="Apoyos para productores" />

      <div className="px-4 py-4 space-y-3">
        {loading && <p className="text-center text-gray-400 py-8">Cargando…</p>}

        {ventanillas.map(v => (
          <button
            key={v.id}
            onClick={() => navigate(`/ventanillas/${v.id}`)}
            className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-left hover:border-[#1A5C38] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{v.bodega_nombre}</p>
                {v.nombre_ventanilla && <p className="text-xs text-gray-500">{v.nombre_ventanilla}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {tipoLabel[v.tipo] || v.tipo}
                  </span>
                  {v.solicitudes_pendientes > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                      {v.solicitudes_pendientes} pendientes
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
            </div>
          </button>
        ))}

        {!loading && ventanillas.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🏛️</p>
            <p>Sin ventanillas configuradas</p>
            <p className="text-sm mt-1">Configura una para publicar apoyos</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/ventanillas/nueva')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-900 active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
