import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B09PrecioCompra() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [tiposMaiz, setTiposMaiz] = useState<any[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    tipo_maiz: '', variedad_code: '', humedad_pct: '', calidad: '',
    precio: '', observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [precioAnterior, setPrecioAnterior] = useState<number | null>(null);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/infraestructura/catalogos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('simac_token')}` }
    }).then(r => r.json()).then(r => {
      setTiposMaiz(r.tipos_maiz || r.tipo_maiz || []);
      setVariedades(r.variedades || []);
    }).catch(() => {});
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

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title="Publicar Precio de Compra" subtitle="Precio diario que ofreces al productor" back="/dashboard" />

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
        {/* Bodega y tipo */}
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
            <label className={labelClass}>Tipo de maíz</label>
            <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required className={inputClass}>
              <option value="">Selecciona tipo</option>
              {tiposMaiz.length > 0
                ? tiposMaiz.map((t: {code: string; label: string}) => <option key={t.code} value={t.code}>{t.label}</option>)
                : [['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)
              }
            </select>
          </div>
          <div>
            <label className={labelClass}>Variedad</label>
            <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {variedades.length > 0
                ? variedades.map((v: {code: string; label: string}) => <option key={v.code} value={v.code}>{v.label}</option>)
                : ['NO_SABE','CRIOLLO_LOCAL','H-40','H-48','H-50','H-52','H-66','H-70','VS-22','VS-23','OTRA'].map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Humedad base (%)</label>
              <input type="number" value={form.humedad_pct} onChange={e => set('humedad_pct', e.target.value)} step="0.1" placeholder="14.0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Calidad</label>
              <select value={form.calidad} onChange={e => set('calidad', e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                <option value="primera">Primera</option>
                <option value="segunda">Segunda</option>
              </select>
            </div>
          </div>
        </div>

        {/* Precio destacado */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Precio</p>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + ' mb-0'}>Precio (MXN/ton)</label>
              {precioAnterior && (
                <span className="text-[13px] text-gray-400">Ayer: ${precioAnterior.toLocaleString()}</span>
              )}
            </div>
            <input
              type="number"
              value={form.precio}
              onChange={e => set('precio', e.target.value)}
              required
              step="1"
              placeholder="6200"
              className="w-full bg-[#F2F2F7] rounded-xl px-4 py-4 text-[28px] font-bold outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0 text-[#1A5C38]"
            />
          </div>
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={2}
              className={`${inputClass} resize-none`} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
          {loading ? 'Publicando…' : 'Publicar precio'}
        </button>
      </form>
    </div>
  );
}
