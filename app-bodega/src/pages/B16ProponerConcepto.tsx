import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B16ProponerConcepto() {
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('MXN/ton');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.conceptos.proponer({ nombre, unidad_default: unidad });
      setOk(true);
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  if (ok) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-10">
        <p className="text-6xl mb-5">✅</p>
        <p className="text-[22px] font-bold text-gray-900">Propuesta enviada</p>
        <p className="text-[15px] text-gray-500 mt-2 mb-8">Te notificaremos cuando el admin la apruebe.</p>
        <button
          onClick={() => navigate('/tarifario')}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity"
        >
          Volver al tarifario
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Proponer Nuevo Servicio" back="/tarifario" />

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Detalles del servicio</p>
          <div>
            <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Nombre del concepto</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Ej: Análisis de calidad"
              className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
            />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-600 mb-1.5">Unidad de cobro</label>
            <select
              value={unidad}
              onChange={e => setUnidad(e.target.value)}
              className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
            >
              <option value="MXN/ton">MXN/ton</option>
              <option value="MXN/ton/mes">MXN/ton/mes</option>
              <option value="MXN/viaje">MXN/viaje</option>
            </select>
          </div>
        </div>

        <div className="bg-[#F2F2F7] rounded-2xl p-4">
          <p className="text-[13px] text-gray-500 leading-snug">
            Tu propuesta será revisada por el equipo de SOMAC. Una vez aprobada, podrás establecer precios para este servicio en tus bodegas.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Enviando…' : 'Enviar propuesta'}
        </button>
      </form>
    </div>
  );
}
