import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ChevronLeft, AlertCircle } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [coordsProductor, setCoordsProductor] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsCargadas, setCoordsCargadas] = useState(false);

  // Cargar coordenadas del productor desde el dashboard
  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.lat && d.lng) setCoordsProductor({ lat: d.lat, lng: d.lng });
      })
      .catch(() => {})
      .finally(() => setCoordsCargadas(true));
  }, []);

  // Cargar ventanillas (filtradas por distancia si hay coordenadas)
  useEffect(() => {
    if (!coordsCargadas) return;
    const token = localStorage.getItem('simac_token');
    setLoading(true);
    const params = new URLSearchParams({ es_ventanilla: 'true', is_ventanilla: 'true' });
    if (coordsProductor) {
      params.set('lat', String(coordsProductor.lat));
      params.set('lng', String(coordsProductor.lng));
      params.set('radio_km', '200');
    }
    fetch(`${BASE}/infraestructura?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(d.infraestructura || (Array.isArray(d) ? d : d.data) || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [coordsCargadas, coordsProductor]);

  const solicitar = async (infraId: number) => {
    setSolicitando(infraId);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('simac_token');
      const res = await fetch(`${BASE}/productor/solicitar-apoyo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ infraestructura_id: infraId, tipo_apoyo: tipo, notas: '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo enviar la solicitud. Intenta de nuevo.');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
      navigate(`/productor/solicitud/${data.solicitud_id || data.id}`);
    } catch {
      setErrorMsg('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSolicitando(null);
    }
  };

  return (
    <div className="bg-white">
      <div className="sticky top-0 z-20 w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-5">
          <button onClick={() => navigate('/productor/incentivos')}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
          </button>
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Apoyos</p>
          <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight">
            {tipo === 'incentivo' ? 'Ventanillas de incentivos' : 'Ventanillas de coberturas'}
          </h1>
        </div>
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

      {/* Toast de error */}
      {errorMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] w-[calc(100%-2rem)] max-w-xs animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl bg-red-600 text-white">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p className="text-[13px] font-semibold leading-snug">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
