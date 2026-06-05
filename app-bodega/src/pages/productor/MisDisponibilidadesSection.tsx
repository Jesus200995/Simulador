import { useEffect, useState } from 'react';

interface Disponibilidad {
  id: number;
  variedad_code: string;
  variedad_nombre?: string;
  volumen_estimado_ton: number;
  fecha_disponible_desde: string;
  fecha_disponible_hasta: string;
  activa: boolean;
  municipio: string;
  estado: string;
}

interface Props {
  token: string;
  apiUrl: string;
  onActualizar: () => void;
}

export default function MisDisponibilidadesSection({ token, apiUrl, onActualizar }: Props) {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = () => {
    fetch(`${apiUrl}/productor/disponibilidad`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setDisponibilidades(Array.isArray(d) ? d : d.data || []))
      .catch(() => setDisponibilidades([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const cancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta disponibilidad?')) return;
    setCancelando(id);
    try {
      await fetch(`${apiUrl}/productor/disponibilidad/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      cargar();
      onActualizar();
    } catch (_) {
      alert('Error al cancelar. Intenta de nuevo.');
    } finally {
      setCancelando(null);
    }
  };

  if (cargando) {
    return <div className="h-20 bg-gray-100 rounded-xl animate-pulse mt-4" />;
  }

  if (disponibilidades.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌽</span>
        <h3 className="font-semibold text-green-800">
          Mi disponibilidad activa
        </h3>
        <span className="ml-auto bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
          {disponibilidades.length} activa{disponibilidades.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {disponibilidades.map(disp => (
          <div key={disp.id} className="bg-white rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">
                {disp.variedad_nombre || disp.variedad_code}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {disp.volumen_estimado_ton} toneladas
                {disp.municipio ? ` · ${disp.municipio}, ${disp.estado}` : ''}
              </p>
              {disp.fecha_disponible_desde && (
                <p className="text-xs text-gray-400 mt-1">
                  Disponible:{' '}
                  {new Date(disp.fecha_disponible_desde).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(disp.fecha_disponible_hasta).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            <button
              onClick={() => cancelar(disp.id)}
              disabled={cancelando === disp.id}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 whitespace-nowrap mt-1"
            >
              {cancelando === disp.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-green-600 mt-3 text-center">
        Las bodegas de tu región pueden ver esta información de forma agregada
      </p>
    </div>
  );
}
