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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="flex items-center px-4 py-3 border-b bg-white">
        <button onClick={() => navigate('/productor/incentivos')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">
          {tipo === 'incentivo' ? 'Ventanillas de incentivos' : 'Ventanillas de coberturas'}
        </h1>
        <div className="w-8" />
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && <p className="text-gray-400 text-center py-8">Cargando ventanillas...</p>}

        {!loading && items.length === 0 && (
          <p className="text-gray-400 text-center py-8">No hay ventanillas disponibles en tu región</p>
        )}

        {items.map(v => (
          <div key={v.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="font-bold text-gray-800">{v.nombre}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {v.municipio}, {v.estado}
            </p>
            <button onClick={() => solicitar(v.id)}
              disabled={solicitando === v.id}
              className="mt-3 w-full bg-[#1A5C38] text-white py-3 rounded-xl text-sm font-semibold
                         active:scale-95 transition-transform disabled:opacity-50">
              {solicitando === v.id ? 'Enviando...' : 'Solicitar información'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
