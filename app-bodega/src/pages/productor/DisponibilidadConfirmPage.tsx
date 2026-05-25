import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function DisponibilidadConfirmPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const tipo = sessionStorage.getItem('disp_tipo') || '';
  const variedadId = sessionStorage.getItem('disp_variedad_id') || '';
  const variedadNombre = sessionStorage.getItem('disp_variedad_nombre') || '';
  const volumen = sessionStorage.getItem('disp_volumen') || '';
  const fechaDesde = sessionStorage.getItem('disp_fecha_desde') || '';
  const fechaHasta = sessionStorage.getItem('disp_fecha_hasta') || '';

  const enviar = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('simac_token');
      const res = await fetch(`${BASE}/productor/disponibilidad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo_maiz: tipo,
          variedad_id: Number(variedadId),
          volumen_ton: Number(volumen),
          fecha_disponible_desde: fechaDesde,
          fecha_disponible_hasta: fechaHasta,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Error al enviar');
        return;
      }
      // Limpiar sessionStorage
      ['disp_tipo','disp_variedad_id','disp_variedad_nombre','disp_volumen','disp_fecha_desde','disp_fecha_hasta']
        .forEach(k => sessionStorage.removeItem(k));
      setSent(true);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle size={64} className="text-[#1A5C38] mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">¡Listo!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Las bodegas cercanas a tu zona podrán ver que tienes maíz disponible.
          Te notificamos si alguna está interesada.
        </p>
        <button onClick={() => navigate('/productor')}
          className="bg-[#1A5C38] text-white px-8 py-3 rounded-2xl font-semibold">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">Confirmar disponibilidad</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Tipo de maíz</span>
            <span className="font-medium text-gray-800 text-sm capitalize">{tipo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Variedad</span>
            <span className="font-medium text-gray-800 text-sm">{variedadNombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Volumen</span>
            <span className="font-bold text-gray-900">{volumen} toneladas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Disponible</span>
            <span className="font-medium text-gray-800 text-sm">{fechaDesde} — {fechaHasta}</span>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-green-800 text-sm">
            Las bodegas cercanas a tu zona podrán ver que tienes maíz disponible.
            Te notificamos si alguna está interesada.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t">
        <button onClick={enviar} disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-bold
                     disabled:opacity-40 active:scale-95 transition-transform">
          {loading ? 'Enviando...' : 'Confirmar y publicar'}
        </button>
      </div>
    </div>
  );
}
