import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { useSearchParams } from 'react-router-dom';
import { Trash2, Wheat } from 'lucide-react';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { formatNum } from '../utils/format';

const TIPOS_MAIZ = [
  { code: 'blanco', label: 'Maíz Blanco' },
  { code: 'amarillo', label: 'Maíz Amarillo' },
  { code: 'criollo', label: 'Criollo / Local' },
];

const REGIONES_RADIO: Record<string, [number, number, number]> = {
  Sinaloa: [30, 80, 200], Sonora: [30, 80, 200], Nayarit: [30, 80, 200],
  default: [20, 60, 150],
};

const today = new Date().toISOString().slice(0, 10);

export default function B10Requerimiento() {
  const { toast, confirm } = useToast();
  const [searchParams] = useSearchParams();
  const municipioPre = searchParams.get('municipio') || '';

  const [bodegas, setBodegas] = useState<{id: number; nombre: string; estado?: string}[]>([]);
  const [variedades, setVariedades] = useState<{code: string; label: string; tipo_maiz?: string}[]>([]);
  const [requerimientos, setRequerimientos] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: '',
    tipo_maiz: '', variedad_code: '', volumen_ton: '', precio_ofrecido: '',
    vigencia_inicio: today,
    vigencia_fin: '',
    radio_km: '60',
    municipio: municipioPre,
  });
  const [loading, setLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/infraestructura/catalogos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('simac_token')}` }
    }).then(r => r.json()).then(r => {
      setVariedades(r.variedades || []);
    }).catch(() => {});
    cargarRequerimientos();
  }, []);

  // F-05: Poll every 30s for interesados count updates
  useEffect(() => {
    pollRef.current = setInterval(() => cargarRequerimientos(), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function cargarRequerimientos() {
    try {
      const r: any = await api.senales.list();
      setRequerimientos(Array.isArray(r) ? r : []);
    } catch (_) {}
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const bodegaSel = bodegas.find(b => b.id === Number(form.bodega_id));
  const radioRange = bodegaSel?.estado
    ? (REGIONES_RADIO[bodegaSel.estado] || REGIONES_RADIO.default)
    : REGIONES_RADIO.default;

  const filteredVars = form.tipo_maiz === 'criollo'
    ? variedades.filter(v =>
        ['MC_CRIOLLO', 'MC_NOSABE', 'CRIOLLO_LOCAL', 'NO_SABE'].includes(v.code) || v.tipo_maiz === 'criollo'
      )
    : variedades.filter(v => !v.tipo_maiz || v.tipo_maiz === form.tipo_maiz);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vigencia_fin) { toast('Selecciona la fecha de fin', 'error'); return; }
    if (form.vigencia_fin < form.vigencia_inicio) { toast('La fecha de fin no puede ser anterior al inicio', 'error'); return; }
    setLoading(true);
    try {
      await api.senales.create({
        ...form,
        vigencia: 'rango',
      });
      toast('Requerimiento publicado. Los productores en el radio serán notificados.', 'success');
      setForm(f => ({ ...f, tipo_maiz: '', volumen_ton: '', precio_ofrecido: '', vigencia_fin: '' }));
      cargarRequerimientos();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  }

  async function cancelar(id: number) {
    const ok = await confirm('¿Cancelar este requerimiento?');
    if (!ok) return;
    try {
      await api.senales.cancel(id);
      cargarRequerimientos();
    } catch (err: any) { toast(err.message, 'error'); }
  }

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="w-full">
      <PageBanner title="Requerimientos de Maíz" subtitle="Notifica a productores en tu área" back="/oferta" />

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
            <select value={form.tipo_maiz} onChange={e => { set('tipo_maiz', e.target.value); set('variedad_code', ''); }} required className={inputClass}>
              <option value="">Selecciona tipo</option>
              {TIPOS_MAIZ.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
          {form.tipo_maiz && (
            <div>
              <label className={labelClass}>Variedad <span className="text-gray-400 font-normal">(opcional)</span></label>
              <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
                <option value="">Sin especificar / No sabe</option>
                {filteredVars.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </div>
          )}
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
        </div>

        {/* Vigencia — date range picker (C-11) */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <div>
            <label className={labelClass}>¿Para cuándo necesitas el maíz?</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12px] text-gray-400 mb-1">Fecha de inicio</p>
                <input type="date" value={form.vigencia_inicio} min={today}
                  onChange={e => set('vigencia_inicio', e.target.value)} required className={inputClass} />
              </div>
              <div>
                <p className="text-[12px] text-gray-400 mb-1">Fecha de fin</p>
                <input type="date" value={form.vigencia_fin} min={form.vigencia_inicio || today}
                  onChange={e => set('vigencia_fin', e.target.value)} required className={inputClass} />
              </div>
            </div>
            <p className="text-[12px] text-gray-400 mt-2">Indica el período en que necesitas recibir el maíz en tu bodega</p>
          </div>
        </div>

        {/* Radio de búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-3">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Radio de búsqueda</p>
          <div className="flex items-center justify-between">
            <p className={labelClass + ' mb-0'}>Radio: <span className="text-[#1A5C38] font-bold">{form.radio_km} km</span></p>
            <span className="text-[13px] text-gray-400">{radioRange[0]}–{radioRange[2]} km</span>
          </div>
          <input type="range" min={radioRange[0]} max={radioRange[2]} step={10}
            value={form.radio_km} onChange={e => set('radio_km', e.target.value)}
            className="w-full accent-[#1A5C38] h-2" />
          <div className="flex justify-between text-[12px] text-gray-400">
            <span>{radioRange[0]} km</span><span>{radioRange[2]} km</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
          {loading ? 'Publicando…' : '+ Nuevo requerimiento de maíz'}
        </button>
      </form>

      {/* Requerimientos activos (C-10) */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-2">Requerimientos activos</p>
        {requerimientos.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-gray-400 bg-white rounded-2xl border border-black/[0.06]">
            <Wheat size={32} className="text-gray-200" />
            <p className="text-[13px] text-center px-4">No tienes requerimientos de maíz activos. Publica uno para que los productores cercanos lo vean.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-100">
            {requerimientos.map(s => (
              <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-800">
                    {TIPOS_MAIZ.find(t => t.code === s.tipo_maiz)?.label || s.tipo_maiz}
                    {s.variedad_code ? ` · ${s.variedad_code}` : ''}
                    {' '}<span className="text-[#1A5C38]">${formatNum(s.precio_ofrecido)}/ton</span>
                  </p>
                  <p className="text-[12px] text-gray-400">{s.bodega_nombre}</p>
                  {(s.vigencia_inicio || s.vigencia_fin) && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {s.vigencia_inicio ? s.vigencia_inicio.slice(0, 10) : ''}{s.vigencia_fin ? ` → ${s.vigencia_fin.slice(0, 10)}` : ''}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400">{s.interesados_count ?? 0} productores interesados</p>
                  {s.volumen_ton && <p className="text-[11px] text-gray-400">Busca: {s.volumen_ton} ton</p>}
                </div>
                <button onClick={() => cancelar(s.id)} className="text-red-400 active:text-red-600 p-2 flex-shrink-0 mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
