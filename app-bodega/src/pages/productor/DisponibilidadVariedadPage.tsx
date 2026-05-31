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
    sessionStorage.setItem('disp_variedad_code', v.code);
    sessionStorage.setItem('disp_variedad_nombre', v.nombre_variedad);
    navigate('/productor/disponibilidad/volumen');
  };

  return (
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-5">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
          </button>
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Disponibilidad</p>
          <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">Variedad</h1>
        </div>
      </div>
      <DisponibilidadStepper paso={2} />
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 text-center mb-1">
          Que variedad?
        </h2>
        <p className="text-zinc-500 text-sm text-center mb-6">
          Tipo: {tipoMaiz.charAt(0).toUpperCase() + tipoMaiz.slice(1)}
        </p>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-100 rounded-2xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {variedades.map(v => (
              <button key={v.id} onClick={() => seleccionar(v)}
                className="w-full bg-white ring-1 ring-zinc-200 rounded-2xl
                           py-4 px-5 text-left hover:ring-zinc-300 active:ring-2 active:ring-[#1A5C38] active:bg-emerald-50 transition-all duration-200">
                <p className="font-semibold text-zinc-800">{v.nombre_variedad}</p>
              </button>
            ))}
            {variedades.length === 0 && (
              <p className="text-zinc-400 text-center py-6">No hay variedades registradas para este tipo</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
