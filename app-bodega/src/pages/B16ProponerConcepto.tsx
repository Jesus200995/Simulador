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
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">✅</p>
      <p className="text-lg font-bold text-gray-900">Propuesta enviada</p>
      <p className="text-sm text-gray-500 mt-2">Te notificaremos cuando el admin la apruebe.</p>
      <button onClick={() => navigate('/tarifario')} className="mt-6 bg-[#1A5C38] text-white px-6 py-3 rounded-xl font-semibold">
        Volver al tarifario
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Proponer Nuevo Servicio" back="/tarifario" />
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del concepto</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
            placeholder="Ej: Análisis de calidad"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
          <select value={unidad} onChange={e => setUnidad(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="MXN/ton">MXN/ton</option>
            <option value="MXN/ton/mes">MXN/ton/mes</option>
            <option value="MXN/viaje">MXN/viaje</option>
          </select>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Enviando…' : 'Enviar propuesta'}
        </button>
      </form>
    </div>
  );
}
