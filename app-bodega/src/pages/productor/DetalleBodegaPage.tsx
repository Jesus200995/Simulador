import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone } from 'lucide-react';
import { formatNum } from '../../utils/format';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface BodegaDetalle {
  id: number; nombre: string; estado: string; municipio: string;
  latitud: number; longitud: number; capacidad_ton: number;
  responsable: string; telefono: string;
}

export default function DetalleBodegaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bodega, setBodega] = useState<BodegaDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/bodegas/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setBodega(d.bodega || d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!bodega) return <div className="min-h-screen flex items-center justify-center text-gray-400">No encontrada</div>;

  return (
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-5">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
          </button>
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Mapa</p>
          <h1 className="text-[19px] sm:text-[22px] font-black text-white leading-tight tracking-tight truncate">{bodega.nombre}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm ring-1 ring-zinc-100">
          <h2 className="font-bold text-zinc-800 text-lg">{bodega.nombre}</h2>
          <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
            <MapPin size={14} /> {bodega.municipio}, {bodega.estado}
          </div>

          {bodega.capacidad_ton > 0 && (
            <div className="mt-4 flex justify-between bg-zinc-50 rounded-xl p-3">
              <span className="text-zinc-500 text-sm">Capacidad</span>
              <span className="font-semibold text-zinc-800 text-sm">{formatNum(bodega.capacidad_ton, 0)} ton</span>
            </div>
          )}

          {bodega.responsable && (
            <div className="mt-2 flex justify-between bg-zinc-50 rounded-xl p-3">
              <span className="text-zinc-500 text-sm">Responsable</span>
              <span className="font-medium text-zinc-800 text-sm">{bodega.responsable}</span>
            </div>
          )}
        </div>

        {bodega.telefono && (
          <a href={`tel:${bodega.telefono}`}
            className="flex items-center justify-center gap-2 bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98]">
            <Phone size={18} /> Llamar a la bodega
          </a>
        )}

        <button onClick={() => navigate('/productor/mapa')}
          className="w-full ring-1 ring-zinc-300 text-zinc-600 py-3 rounded-2xl text-sm font-medium hover:bg-zinc-50 transition-colors">
          Volver al mapa
        </button>
      </div>
    </div>
  );
}
