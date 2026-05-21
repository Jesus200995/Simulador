import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

const FLUJO = ['contactado', 'agendada', 'canalizada', 'cerrada'];

export default function B21DetalleSolicitud() {
  const { id, sid } = useParams<{ id: string; sid: string }>();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.ventanillas.solicitudes(Number(id))
      .then((r: any) => {
        const found = r.find((s: any) => s.id === Number(sid));
        if (found) { setSolicitud(found); setNuevoEstado(found.estado); }
      }).catch(() => {});
  }, [id, sid]);

  async function guardar() {
    setSaving(true);
    try {
      await api.ventanillas.cambiarEstado(Number(id), Number(sid), { estado: nuevoEstado, notas });
      navigate(`/ventanillas/${id}/solicitudes`);
    } catch (err: any) {
      alert(err.message);
    } finally { setSaving(false); }
  }

  if (!solicitud) return <div className="p-8 text-center text-gray-400">Cargando…</div>;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Detalle de Solicitud" back={`/ventanillas/${id}/solicitudes`} />

      <div className="px-4 py-4 space-y-4">
        {/* Datos del productor */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="font-bold text-gray-900">{solicitud.productor_nombre || 'Productor no registrado'}</p>
          <p className="text-sm text-gray-500">{solicitud.municipio}</p>
          <p className="text-sm text-gray-600">Apoyo: <span className="font-semibold">{solicitud.nombre_apoyo}</span></p>
          <p className="text-xs text-gray-400">{new Date(solicitud.created_at).toLocaleString('es-MX')}</p>
        </div>

        {/* Cambiar estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-semibold text-gray-700 text-sm">Estado de la solicitud</p>
          <div className="flex flex-wrap gap-2">
            {FLUJO.map(e => (
              <button key={e} onClick={() => setNuevoEstado(e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all
                  ${nuevoEstado === e ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]' : 'border-gray-200 text-gray-600'}`}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas de gestión</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Registro de la gestión realizada…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <button onClick={guardar} disabled={saving || nuevoEstado === solicitud.estado}
            className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar cambio de estado'}
          </button>
        </div>
      </div>
    </div>
  );
}
