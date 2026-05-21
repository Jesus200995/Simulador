import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B18AltaVentanilla() {
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: '', tipo: '', nombre_enlace_agricultura: '',
    nombre_ventanilla: '', telefono_responsable: '', correo_responsable: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.ventanillas.create({ ...form, bodega_id: Number(form.bodega_id) });
      navigate('/ventanillas');
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Nueva Ventanilla" back="/ventanillas" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bodega asociada</label>
          <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ventanilla</label>
          <div className="grid grid-cols-3 gap-2">
            {[['coberturas', 'Coberturas'], ['incentivos', 'Incentivos'], ['ambos', 'Ambos']].map(([k, l]) => (
              <button type="button" key={k} onClick={() => set('tipo', k)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                  ${form.tipo === k ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del enlace con Agricultura *</label>
          <input type="text" value={form.nombre_enlace_agricultura} onChange={e => set('nombre_enlace_agricultura', e.target.value)} required
            placeholder="Nombre del responsable"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la ventanilla (opcional)</label>
          <input type="text" value={form.nombre_ventanilla} onChange={e => set('nombre_ventanilla', e.target.value)}
            placeholder="Ej: Ventanilla Norte"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input type="tel" value={form.telefono_responsable} onChange={e => set('telefono_responsable', e.target.value)} required
              placeholder="6671234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
            <input type="email" value={form.correo_responsable} onChange={e => set('correo_responsable', e.target.value)} required
              placeholder="correo@sader.gob.mx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Guardando…' : 'Crear ventanilla'}
        </button>
      </form>
    </div>
  );
}
