import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

const ESTADOS = ['Todas', 'recibida', 'contactado', 'agendada', 'canalizada', 'cerrada'];

const badgeColor: Record<string, string> = {
  recibida: 'bg-blue-100 text-blue-700',
  contactado: 'bg-yellow-100 text-yellow-800',
  agendada: 'bg-purple-100 text-purple-700',
  canalizada: 'bg-green-100 text-green-700',
  cerrada: 'bg-gray-100 text-gray-500',
};

export default function B20Solicitudes() {
  const { id } = useParams<{ id: string }>();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const estado = filtro === 'Todas' ? undefined : filtro;
    api.ventanillas.solicitudes(Number(id), estado)
      .then((r: any) => setSolicitudes(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, filtro]);

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Solicitudes" subtitle="Productores interesados" back={`/ventanillas/${id}`} />

      {/* Filtros scroll horizontal */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {ESTADOS.map(e => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all
              ${filtro === e ? 'bg-[#1A5C38] text-white' : 'bg-[#F2F2F7] text-gray-600'}`}
          >
            {e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-2">
        {loading && <p className="text-center text-gray-400 text-[14px] py-10">Cargando…</p>}

        {solicitudes.map(s => (
          <button
            key={s.id}
            onClick={() => navigate(`/ventanillas/${id}/solicitudes/${s.id}`)}
            className="w-full bg-white rounded-2xl shadow-sm border border-black/5 p-4 text-left active:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-gray-900 truncate">{s.productor_nombre || 'Productor'}</p>
              <p className="text-[13px] text-gray-500 mt-0.5">{s.municipio} · {s.nombre_apoyo}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{new Date(s.created_at).toLocaleDateString('es-MX')}</p>
            </div>
            <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeColor[s.estado] || 'bg-gray-100 text-gray-500'}`}>
              {s.estado}
            </span>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}

        {!loading && solicitudes.length === 0 && (
          <p className="text-center text-gray-400 text-[14px] py-12">Sin solicitudes con este filtro</p>
        )}
      </div>
    </div>
  );
}
