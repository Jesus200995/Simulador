import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const REGIONES_RADIO: Record<string, [number, number, number]> = {
  Sinaloa: [30, 80, 200], Sonora: [30, 80, 200], Nayarit: [30, 80, 200],
  default: [20, 60, 150],
};

export default function B10SenalCompra() {
  const { toast, confirm } = useToast();
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
      toast('Señal publicada. Los productores en el radio serán notificados.', 'success');
      setForm(f => ({ ...f, tipo_maiz: '', volumen_ton: '', precio_ofrecido: '' }));
      cargarSenales();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  }

  async function cancelar(id: number) {
    const ok = await confirm('¿Cancelar esta señal?');
    if (!ok) return;
    try {
      await api.senales.cancel(id);
      cargarSenales();
    } catch (err: any) { toast(err.message, 'error'); }
  }

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="w-full">
      <PageBanner title="Publicar Señal de Compra" subtitle="Notifica a productores en tu área" back="/oferta" />

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Bodega y maíz */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Bodega y tipo de maíz</p>
          <div>
            <label className={labelClass}>Bodega</label>
            <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required className={inputClass}>
              <option value="">Selecciona bodega</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de maíz que busca</label>
            <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required className={inputClass}>
              <option value="">Selecciona tipo</option>
              {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Variedad <span className="text-gray-400 font-normal">(opcional)</span></label>
            <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              <option value="NO_SABE">No sabe</option>
              <option value="CRIOLLO_LOCAL">Criollo / local</option>
              <option value="H-40">H-40</option>
              <option value="H-48">H-48</option>
              <option value="H-50">H-50</option>
              <option value="H-52">H-52</option>
              <option value="OTRA">Otra</option>
            </select>
          </div>
        </div>

        {/* Volumen y precio */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Volumen y precio</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Volumen que busca (ton)</label>
              <input type="number" value={form.volumen_ton} onChange={e => set('volumen_ton', e.target.value)} step="0.1" placeholder="500" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio ofrecido (MXN/ton)</label>
              <input type="number" value={form.precio_ofrecido} onChange={e => set('precio_ofrecido', e.target.value)} required step="1" placeholder="6200" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Vigencia</label>
            <select value={form.vigencia} onChange={e => set('vigencia', e.target.value)} className={inputClass}>
              <option value="esta_semana">Esta semana</option>
              <option value="15_dias">Próximos 15 días</option>
            </select>
          </div>
        </div>

        {/* Radio de búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-3">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Radio de búsqueda</p>
          <div className="flex items-center justify-between">
            <p className={labelClass + ' mb-0'}>Radio: <span className="text-[#1A5C38] font-bold">{form.radio_km} km</span></p>
            <span className="text-[13px] text-gray-400">{radioRange[0]}–{radioRange[2]} km</span>
          </div>
          <input
            type="range"
            min={radioRange[0]} max={radioRange[2]} step={10}
            value={form.radio_km}
            onChange={e => set('radio_km', e.target.value)}
            className="w-full accent-[#1A5C38] h-2"
          />
          <div className="flex justify-between text-[12px] text-gray-400">
            <span>{radioRange[0]} km</span>
            <span>{radioRange[2]} km</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
          {loading ? 'Publicando…' : 'Publicar señal de compra'}
        </button>
      </form>

      {/* Señales activas */}
      {senales.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Señales activas</p>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-100">
            {senales.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-800">{s.tipo_maiz} · ${s.precio_ofrecido}/ton</p>
                  <p className="text-[12px] text-gray-400">{s.bodega_nombre} · {s.interesados_count} interesados</p>
                </div>
                <button onClick={() => cancelar(s.id)} className="text-red-400 active:text-red-600 p-2 flex-shrink-0">
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
