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
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-3 border-b bg-white">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800 truncate">{bodega.nombre}</h1>
        <div className="w-8" />
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">{bodega.nombre}</h2>
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <MapPin size={14} /> {bodega.municipio}, {bodega.estado}
          </div>

          {bodega.capacidad_ton > 0 && (
            <div className="mt-4 flex justify-between bg-gray-50 rounded-xl p-3">
              <span className="text-gray-500 text-sm">Capacidad</span>
              <span className="font-semibold text-gray-800 text-sm">{formatNum(bodega.capacidad_ton, 0)} ton</span>
            </div>
          )}

          {bodega.responsable && (
            <div className="mt-2 flex justify-between bg-gray-50 rounded-xl p-3">
              <span className="text-gray-500 text-sm">Responsable</span>
              <span className="font-medium text-gray-800 text-sm">{bodega.responsable}</span>
            </div>
          )}
        </div>

        {bodega.telefono && (
          <a href={`tel:${bodega.telefono}`}
            className="flex items-center justify-center gap-2 bg-[#1A5C38] text-white py-4 rounded-2xl font-semibold">
            <Phone size={18} /> Llamar a la bodega
          </a>
        )}

        <button onClick={() => navigate('/productor/mapa')}
          className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl text-sm font-medium">
          Volver al mapa
        </button>
      </div>
    </div>
  );
}
