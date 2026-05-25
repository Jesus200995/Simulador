import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import DisponibilidadStepper from '../../components/productor/DisponibilidadStepper';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Variedad { id: number; nombre_variedad: string; code: string; tipo_maiz: string; }

export default function DisponibilidadVariedadPage() {
  const navigate = useNavigate();
  const tipoMaiz = sessionStorage.getItem('disp_tipo') || '';
  const [variedades, setVariedades] = useState<Variedad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tipoMaiz) { navigate('/productor/disponibilidad/tipo'); return; }
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/catalogos-productor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const all: Variedad[] = d.variedades || [];
        const filtered = all.filter(v => !v.tipo_maiz || v.tipo_maiz === tipoMaiz);
        setVariedades(filtered);
      })
      .finally(() => setLoading(false));
  }, [tipoMaiz, navigate]);

  const seleccionar = (v: Variedad) => {
    sessionStorage.setItem('disp_variedad_id', String(v.id));
    sessionStorage.setItem('disp_variedad_nombre', v.nombre_variedad);
    navigate('/productor/disponibilidad/volumen');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
      </div>
      <DisponibilidadStepper paso={2} />
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
          ¿Qué variedad?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Tipo: {tipoMaiz.charAt(0).toUpperCase() + tipoMaiz.slice(1)}
        </p>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {variedades.map(v => (
              <button key={v.id} onClick={() => seleccionar(v)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl
                           py-4 px-5 text-left active:border-[#1A5C38] active:bg-green-50 transition-all">
                <p className="font-semibold text-gray-800">{v.nombre_variedad}</p>
              </button>
            ))}
            {variedades.length === 0 && (
              <p className="text-gray-400 text-center py-6">No hay variedades registradas para este tipo</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
