import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B09PrecioCompra() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    tipo_maiz: '', variedad_code: '', humedad_pct: '', calidad: '',
    precio: '', observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [precioAnterior, setPrecioAnterior] = useState<number | null>(null);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.bodega_id) {
      api.infraestructura.precios(Number(form.bodega_id))
        .then((r: any) => {
          const precios = r.precios || r;
          if (precios[0]?.precio) setPrecioAnterior(precios[0].precio);
        }).catch(() => {});
    }
  }, [form.bodega_id]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bodega_id || !form.precio) { alert('Bodega y precio son requeridos'); return; }
    setLoading(true);
    try {
      await api.infraestructura.publicarPrecio(Number(form.bodega_id), {
        ...form,
        tipo_precio: 'bodega',
        fecha: new Date().toISOString().slice(0, 10),
      });
      alert('Precio publicado correctamente');
      navigate(-1);
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Publicar Precio de Compra" subtitle="Precio diario que ofreces al productor" back="/dashboard" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
          <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de maíz</label>
          <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona tipo</option>
            {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </div>

        {/* Variedad — NUEVO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variedad ✨</label>
          <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Sin especificar</option>
            <option value="NO_SABE">No sabe</option>
            <option value="CRIOLLO_LOCAL">Criollo / local</option>
            <option value="H-40">H-40</option>
            <option value="H-48">H-48</option>
            <option value="H-50">H-50</option>
            <option value="H-52">H-52</option>
            <option value="H-66">H-66</option>
            <option value="H-70">H-70</option>
            <option value="VS-22">VS-22</option>
            <option value="VS-23">VS-23</option>
            <option value="OTRA">Otra</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Humedad base (%) ✨</label>
            <input type="number" value={form.humedad_pct} onChange={e => set('humedad_pct', e.target.value)} step="0.1" placeholder="14.0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calidad ✨</label>
            <select value={form.calidad} onChange={e => set('calidad', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
              <option value="">Sin especificar</option>
              <option value="primera">Primera</option>
              <option value="segunda">Segunda</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio (MXN/ton)
            {precioAnterior && <span className="ml-2 text-gray-400 text-xs">Ayer: ${precioAnterior.toLocaleString()}</span>}
          </label>
          <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} required step="1" placeholder="6200"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38] text-lg font-bold" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Publicando…' : 'Publicar precio'}
        </button>
      </form>
    </div>
  );
}
