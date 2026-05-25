import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Circle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ESTADOS = ['enviada', 'recibida', 'contactado', 'agendada', 'canalizada'];
const ESTADO_LABELS: Record<string, string> = {
  enviada:    'Solicitud enviada',
  recibida:   'La ventanilla recibió tu solicitud',
  contactado: 'La ventanilla te va a contactar',
  agendada:   'Cita agendada',
  canalizada: 'Solicitud canalizada con éxito',
};

interface Solicitud {
  id: number; tipo_apoyo: string; estado: string; created_at: string;
  notas_ventanilla?: string;
}

export default function EstadoSolicitudPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/mis-solicitudes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSolicitudes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="flex items-center px-4 py-3 border-b bg-white">
        <button onClick={() => navigate('/productor/incentivos')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">Mis solicitudes</h1>
        <div className="w-8" />
      </div>

      <div className="px-4 pt-4 space-y-4">
        {solicitudes.length === 0 && (
          <p className="text-gray-400 text-center py-8">No tienes solicitudes aún</p>
        )}

        {solicitudes.map(s => {
          const currentIdx = ESTADOS.indexOf(s.estado);
          return (
            <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-800 capitalize">{s.tipo_apoyo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${s.estado === 'canalizada' ? 'bg-green-100 text-green-700'
                  : s.estado === 'rechazada' ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'}`}>
                  {ESTADO_LABELS[s.estado] || s.estado}
                </span>
              </div>

              {/* Timeline */}
              <div className="space-y-3 ml-1">
                {ESTADOS.map((e, i) => {
                  const done = i <= currentIdx;
                  return (
                    <div key={e} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {done
                          ? <CheckCircle size={18} className="text-[#1A5C38]" />
                          : <Circle size={18} className="text-gray-300" />
                        }
                        {i < ESTADOS.length - 1 && (
                          <div className={`w-0.5 h-6 ${i < currentIdx ? 'bg-[#1A5C38]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <p className={`text-sm ${done ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                        {ESTADO_LABELS[e]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {s.notas_ventanilla && (
                <div className="mt-4 bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-medium">Nota de la ventanilla:</p>
                  <p className="text-sm text-blue-800 mt-1">{s.notas_ventanilla}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
