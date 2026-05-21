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

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Nueva Ventanilla" back="/ventanillas" />

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
        {/* Bodega y tipo */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Bodega y tipo</p>
          <div>
            <label className={labelClass}>Bodega asociada</label>
            <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required className={inputClass}>
              <option value="">Selecciona bodega</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de ventanilla</label>
            <div className="grid grid-cols-3 gap-2">
              {[['coberturas', 'Coberturas'], ['incentivos', 'Incentivos'], ['ambos', 'Ambos']].map(([k, l]) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => set('tipo', k)}
                  className={`py-3 rounded-xl text-[14px] font-semibold transition-all border-2
                    ${form.tipo === k
                      ? 'border-[#1A5C38] bg-[#1A5C38]/5 text-[#1A5C38]'
                      : 'border-transparent bg-[#F2F2F7] text-gray-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsable */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Responsable</p>
          <div>
            <label className={labelClass}>Nombre del enlace con Agricultura</label>
            <input
              type="text"
              value={form.nombre_enlace_agricultura}
              onChange={e => set('nombre_enlace_agricultura', e.target.value)}
              required
              placeholder="Nombre del responsable"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nombre de la ventanilla <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="text"
              value={form.nombre_ventanilla}
              onChange={e => set('nombre_ventanilla', e.target.value)}
              placeholder="Ej: Ventanilla Norte"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="tel"
                value={form.telefono_responsable}
                onChange={e => set('telefono_responsable', e.target.value)}
                required
                placeholder="6671234567"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Correo</label>
              <input
                type="email"
                value={form.correo_responsable}
                onChange={e => set('correo_responsable', e.target.value)}
                required
                placeholder="correo@sader.gob.mx"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Guardando…' : 'Crear ventanilla'}
        </button>
      </form>
    </div>
  );
}
