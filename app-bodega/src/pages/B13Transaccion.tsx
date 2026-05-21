import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B13Transaccion() {
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: '', nombre_productor_libre: '', tipo_maiz: '', variedad_code: '',
    volumen_ton: '', precio_ton: '',
    fecha: new Date().toISOString().slice(0, 10), notas: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.transacciones.create(form);
      alert('Transacción registrada. El productor recibirá notificación si está en el sistema.');
      navigate('/transacciones');
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Registrar Transacción" subtitle="Nueva compra de maíz" back="/transacciones" />

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
        {/* Bodega y productor */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Bodega y productor</p>
          <div>
            <label className={labelClass}>Bodega donde ocurrió la compra</label>
            <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required className={inputClass}>
              <option value="">Selecciona bodega</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nombre del productor</label>
            <input
              type="text"
              value={form.nombre_productor_libre}
              onChange={e => set('nombre_productor_libre', e.target.value)}
              placeholder="Busca por nombre o CURP, o escribe libremente"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tipo de maíz */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Tipo de maíz</p>
          <div>
            <label className={labelClass}>Tipo de maíz</label>
            <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required className={inputClass}>
              <option value="">Selecciona tipo</option>
              {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Variedad</label>
            <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              <option value="CRIOLLO_LOCAL">Criollo / local</option>
              <option value="H-40">H-40</option>
              <option value="H-48">H-48</option>
              <option value="H-50">H-50</option>
              <option value="H-52">H-52</option>
              <option value="VS-22">VS-22</option>
              <option value="VS-23">VS-23</option>
              <option value="OTRA">Otra</option>
            </select>
          </div>
        </div>

        {/* Volumen, precio y fecha */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Volumen, precio y fecha</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Volumen (ton)</label>
              <input type="number" value={form.volumen_ton} onChange={e => set('volumen_ton', e.target.value)} required step="0.1" placeholder="50" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio pagado (MXN/ton)</label>
              <input type="number" value={form.precio_ton} onChange={e => set('precio_ton', e.target.value)} required step="1" placeholder="6200" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Fecha de compra</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required
              max={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className={`${inputClass} resize-none`} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
          {loading ? 'Registrando…' : 'Registrar transacción'}
        </button>
      </form>
    </div>
  );
}
