import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

const REGIONES_RADIO: Record<string, [number, number, number]> = {
  // [min, default, max] por estado
  Sinaloa: [30, 80, 200], Sonora: [30, 80, 200], Nayarit: [30, 80, 200],
  default: [20, 60, 150],
};

export default function B10SenalCompra() {
  const [params] = useSearchParams();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [senales, setSenales] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    tipo_maiz: '', variedad_code: '', volumen_ton: '', precio_ofrecido: '',
    vigencia: 'esta_semana', radio_km: '60',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    cargarSenales();
  }, []);

  async function cargarSenales() {
    try {
      const r: any = await api.senales.list();
      setSenales(r);
    } catch (_) {}
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const bodegaSel = bodegas.find(b => b.id === Number(form.bodega_id));
  const radioRange = bodegaSel?.estado ? (REGIONES_RADIO[bodegaSel.estado] || REGIONES_RADIO.default) : REGIONES_RADIO.default;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.senales.create(form);
      alert('Señal publicada. Los productores en el radio serán notificados.');
      setForm(f => ({ ...f, tipo_maiz: '', volumen_ton: '', precio_ofrecido: '' }));
      cargarSenales();
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  async function cancelar(id: number) {
    if (!confirm('¿Cancelar esta señal?')) return;
    try {
      await api.senales.cancel(id);
      cargarSenales();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Publicar Señal de Compra" subtitle="Notifica a productores en tu área" back="/oferta" />

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de maíz que busca</label>
          <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona tipo</option>
            {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variedad (opcional)</label>
          <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Sin especificar</option>
            <option value="NO_SABE">No sabe</option>
            <option value="CRIOLLO_LOCAL">Criollo / local</option>
            <option value="H-40">H-40</option><option value="H-48">H-48</option>
            <option value="H-50">H-50</option><option value="H-52">H-52</option>
            <option value="OTRA">Otra</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volumen que busca (ton)</label>
            <input type="number" value={form.volumen_ton} onChange={e => set('volumen_ton', e.target.value)} step="0.1" placeholder="500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio ofrecido (MXN/ton)</label>
            <input type="number" value={form.precio_ofrecido} onChange={e => set('precio_ofrecido', e.target.value)} required step="1" placeholder="6200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia</label>
          <select value={form.vigencia} onChange={e => set('vigencia', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="esta_semana">Esta semana</option>
            <option value="15_dias">Próximos 15 días</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Radio de búsqueda: {form.radio_km} km
          </label>
          <input type="range"
            min={radioRange[0]} max={radioRange[2]} step={10}
            value={form.radio_km}
            onChange={e => set('radio_km', e.target.value)}
            className="w-full accent-[#1A5C38]"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{radioRange[0]} km</span>
            <span>{radioRange[2]} km</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Publicando…' : 'Publicar señal de compra'}
        </button>
      </form>

      {/* Señales activas de mis bodegas */}
      {senales.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Señales activas</p>
          <div className="space-y-2">
            {senales.slice(0, 5).map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.tipo_maiz} · ${s.precio_ofrecido}/ton</p>
                  <p className="text-xs text-gray-500">{s.bodega_nombre} · {s.interesados_count} interesados</p>
                </div>
                <button onClick={() => cancelar(s.id)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
