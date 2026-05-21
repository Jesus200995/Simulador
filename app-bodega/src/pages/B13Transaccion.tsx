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

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Registrar Transacción" subtitle="Nueva compra de maíz" back="/transacciones" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bodega donde ocurrió la compra</label>
          <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del productor</label>
          <input type="text" value={form.nombre_productor_libre}
            onChange={e => set('nombre_productor_libre', e.target.value)}
            placeholder="Busca por nombre o CURP, o escribe libremente"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de maíz</label>
          <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona tipo</option>
            {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variedad</label>
          <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Sin especificar</option>
            <option value="CRIOLLO_LOCAL">Criollo / local</option>
            <option value="H-40">H-40</option><option value="H-48">H-48</option>
            <option value="H-50">H-50</option><option value="H-52">H-52</option>
            <option value="VS-22">VS-22</option><option value="VS-23">VS-23</option>
            <option value="OTRA">Otra</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volumen (ton)</label>
            <input type="number" value={form.volumen_ton} onChange={e => set('volumen_ton', e.target.value)} required step="0.1" placeholder="50"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio pagado (MXN/ton)</label>
            <input type="number" value={form.precio_ton} onChange={e => set('precio_ton', e.target.value)} required step="1" placeholder="6200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de compra</label>
          <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required
            max={new Date().toISOString().slice(0, 10)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Registrando…' : 'Registrar transacción'}
        </button>
      </form>
    </div>
  );
}
