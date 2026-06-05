import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone } from 'lucide-react';
import { api } from '../services/api';

interface Interesado {
  id: number;
  nombre: string;
  municipio: string;
  estado: string;
  telefono: string;
  fecha_interes: string;
}

export default function B27InteresadosSenal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interesados, setInteresados] = useState<Interesado[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.senales.interesados(id)
      .then((d: any) => {
        setInteresados(d.interesados || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-gray-900">Productores interesados</h1>
          <p className="text-xs text-gray-500">
            {total} productor{total !== 1 ? 'es' : ''} respondió
          </p>
        </div>
      </div>

      <div className="p-4">
        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : interesados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌽</p>
            <p className="text-gray-500 font-medium">Aún no hay productores interesados</p>
            <p className="text-gray-400 text-sm mt-1">
              Los productores en tu radio recibirán la notificación
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {interesados.map(prod => (
              <div key={prod.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {prod.nombre || 'Productor registrado'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    📍 {[prod.municipio, prod.estado].filter(Boolean).join(', ') || 'Ubicación no disponible'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(prod.fecha_interes).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {prod.telefono && (
                  <a href={`tel:${prod.telefono}`}
                    className="flex items-center gap-2 bg-[#1A5C38] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-800 transition-colors whitespace-nowrap">
                    <Phone size={14} />
                    Llamar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
