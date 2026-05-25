import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Ventanilla {
  id: number; nombre: string; municipio: string; estado: string;
}

export default function VentanillasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'incentivo';
  const [items, setItems] = useState<Ventanilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [solicitando, setSolicitando] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/infraestructura?is_ventanilla=true`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const solicitar = async (infraId: number) => {
    setSolicitando(infraId);
    try {
      const token = localStorage.getItem('simac_token');
      const res = await fetch(`${BASE}/productor/solicitar-apoyo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ infraestructura_id: infraId, tipo_apoyo: tipo, notas: '' }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/productor/solicitud/${data.solicitud_id}`);
      }
    } finally {
      setSolicitando(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="flex items-center px-4 sm:px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <button onClick={() => navigate('/productor/incentivos')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronLeft size={22} className="text-zinc-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-zinc-800">
          {tipo === 'incentivo' ? 'Ventanillas de incentivos' : 'Ventanillas de coberturas'}
        </h1>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 space-y-3">
        {loading && <p className="text-zinc-400 text-center py-8">Cargando ventanillas...</p>}

        {!loading && items.length === 0 && (
          <p className="text-zinc-400 text-center py-8">No hay ventanillas disponibles en tu region</p>
        )}

        {items.map(v => (
          <div key={v.id} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-zinc-100">
            <p className="font-bold text-zinc-800">{v.nombre}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {v.municipio}, {v.estado}
            </p>
            <button onClick={() => solicitar(v.id)}
              disabled={solicitando === v.id}
              className="mt-3 w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-3 rounded-xl text-sm font-semibold
                         active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
              {solicitando === v.id ? 'Enviando...' : 'Solicitar informacion'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
