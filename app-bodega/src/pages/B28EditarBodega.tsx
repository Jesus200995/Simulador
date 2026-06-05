import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Phone, FileText, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function B28EditarBodega() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [horario, setHorario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.infraestructura.get(Number(id))
      .then((r: any) => {
        const b = r.bodega || r;
        setNombre(b.nombre || '');
        setHorario(b.horario || '');
        setTelefono(b.telefono_contacto || '');
        setObservaciones(b.observaciones || '');
      })
      .catch(() => setError('No se pudo cargar la bodega'))
      .finally(() => setCargando(false));
  }, [id]);

  const guardar = async () => {
    if (!id) return;
    setGuardando(true);
    setError(null);
    try {
      await api.bodeguero.editarBodega(id, {
        horario: horario.trim(),
        telefono_contacto: telefono.trim(),
        observaciones: observaciones.trim(),
      });
      setOk(true);
      setTimeout(() => navigate(`/bodegas/${id}`), 900);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">Editar datos de bodega</h1>
          <p className="text-xs text-gray-500 truncate">{nombre}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Aviso: nombre/ubicación los controla el Admin */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
          <Lock size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-blue-700 leading-relaxed">
            El nombre y la ubicación de la bodega los gestiona el administrador.
            Aquí puedes actualizar tus datos de contacto.
          </p>
        </div>

        {/* Horario */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Clock size={15} className="text-[#1A5C38]" /> Horario de atención
          </label>
          <input
            type="text"
            value={horario}
            onChange={e => setHorario(e.target.value)}
            placeholder="Ej. Lun a Vie 8:00–17:00, Sáb 8:00–13:00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]/30"
          />
        </div>

        {/* Teléfono */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Phone size={15} className="text-[#1A5C38]" /> Teléfono de contacto
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Ej. 667 123 4567"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]/30"
          />
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FileText size={15} className="text-[#1A5C38]" /> Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Información adicional para los productores (servicios, requisitos, etc.)"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A5C38]/30"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {ok && <p className="text-green-600 text-sm text-center font-medium">✓ Cambios guardados</p>}

        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full bg-[#1A5C38] text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
