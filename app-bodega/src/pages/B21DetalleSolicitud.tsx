import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

const FLUJO = ['contactado', 'agendada', 'canalizada', 'cerrada'];

const flujoColor: Record<string, string> = {
  contactado: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  agendada: 'border-purple-400 bg-purple-50 text-purple-800',
  canalizada: 'border-green-500 bg-green-50 text-green-800',
  cerrada: 'border-gray-300 bg-gray-50 text-gray-600',
};

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

  if (!solicitud) return (
    <div className="p-10 text-center text-gray-400 text-[15px]">Cargando…</div>
  );

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Detalle de Solicitud" back={`/ventanillas/${id}/solicitudes`} />

      <div className="px-4 sm:px-6 py-5 space-y-4">
        {/* Datos del productor */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Productor</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p className="font-bold text-[17px] text-gray-900">
              {solicitud.productor_nombre || 'Productor no registrado'}
            </p>
            <p className="text-[14px] text-gray-500">{solicitud.municipio}</p>
            <p className="text-[14px] text-gray-700">
              Apoyo: <span className="font-semibold text-gray-900">{solicitud.nombre_apoyo}</span>
            </p>
            <p className="text-[12px] text-gray-400">
              {new Date(solicitud.created_at).toLocaleString('es-MX')}
            </p>
          </div>
        </div>

        {/* Cambiar estado */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Estado de la solicitud</p>
          <div className="flex flex-wrap gap-2">
            {FLUJO.map(e => (
              <button
                key={e}
                onClick={() => setNuevoEstado(e)}
                className={`px-4 py-2 rounded-xl text-[14px] font-semibold border-2 transition-all
                  ${nuevoEstado === e
                    ? flujoColor[e] || 'border-[#1A5C38] bg-green-50 text-[#1A5C38]'
                    : 'border-transparent bg-[#F2F2F7] text-gray-600'}`}
              >
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Notas de gestión</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Registro de la gestión realizada…"
              className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[16px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0 resize-none"
            />
          </div>

          <button
            onClick={guardar}
            disabled={saving || nuevoEstado === solicitud.estado}
            className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar cambio de estado'}
          </button>
        </div>
      </div>
    </div>
  );
}
