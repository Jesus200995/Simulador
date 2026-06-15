import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { formatNum } from '../utils/format';

export default function B09PrecioCompra() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast, confirm } = useToast();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [tiposMaiz, setTiposMaiz] = useState<any[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    tipo_maiz: '', variedad_code: '', calidad: '',
    precio: '', observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [precioAnterior, setPrecioAnterior] = useState<number | null>(null);
  const [historialPrecios, setHistorialPrecios] = useState<{fecha: string; precio: number}[]>([]);
  const precioPreloaded = useRef(false);

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
          const precios: {precio: number; fecha: string}[] = r.precios || r;
          if (precios[0]?.precio) setPrecioAnterior(precios[0].precio);
          const ultimos30 = precios
            .filter(p => p.fecha)
            .slice(0, 30)
            .reverse()
            .map(p => ({ fecha: p.fecha.slice(5), precio: Number(p.precio) }));
          setHistorialPrecios(ultimos30);
          if (!precioPreloaded.current && precios[0]?.precio) {
            precioPreloaded.current = true;
            setForm(f => ({ ...f, precio: String(precios[0].precio) }));
          }
        }).catch(() => {});
    }
  }, [form.bodega_id]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bodega_id || !form.precio) { toast('Bodega y precio son requeridos', 'error'); return; }
    const ok = await confirm(`¿Publicar precio $${form.precio}/ton para ${form.tipo_maiz || 'maíz'} hoy?`);
    if (!ok) return;
    setLoading(true);
    try {
      await api.infraestructura.publicarPrecio(Number(form.bodega_id), {
        ...form,
        tipo_precio: 'bodega',
        fecha: new Date().toISOString().slice(0, 10),
      });
      toast('Precio publicado correctamente', 'success');
      navigate(-1);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  }

  const inputClass = 'w-full bg-[#F2F2F7] rounded-[1rem] px-4 py-3.5 text-[16px] font-medium outline-none transition-all duration-300 focus:ring-2 focus:ring-[#1A5C38]/40 focus:bg-white border-2 border-transparent focus:border-[#1A5C38]/10';
  const labelClass = 'block text-[14px] font-bold text-gray-600 mb-1.5 transition-colors group-hover/card:text-[#1A5C38]';
  const cardClass = 'bg-white rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 space-y-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-black/[0.08] transition-all duration-500 group/card hover:-translate-y-0.5';

  return (
    <div className="w-full">
      <PageBanner title="Publicar Precio de Compra" subtitle="Precio diario que ofreces al productor" back="/dashboard" />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
          {/* Bodega y tipo */}
          <div className={cardClass}>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest transition-colors group-hover/card:text-[#1A5C38]/60">Bodega y tipo de maíz</p>
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
                {(tiposMaiz.length > 0 ? tiposMaiz : [{code:'blanco',label:'Maíz Blanco'},{code:'amarillo',label:'Maíz Amarillo'},{code:'criollo',label:'Criollo / Local'}])
                  .map((t: {code: string; label: string}) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Variedad</label>
              <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                {variedades
                  .filter((v: {tipo_maiz?: string}) => !v.tipo_maiz || v.tipo_maiz === form.tipo_maiz || form.tipo_maiz === '')
                  .map((v: {code: string; label: string}) => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
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

          {/* Precio destacado */}
          <div className={cardClass}>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest transition-colors group-hover/card:text-[#1A5C38]/60">Precio</p>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass + ' mb-0'}>Precio (MXN/ton)</label>
                {precioAnterior && (
                  <span className="text-[13px] text-gray-400 font-medium">Ayer: ${formatNum(precioAnterior)}</span>
                )}
              </div>
              <input
                type="number"
                value={form.precio}
                onChange={e => set('precio', e.target.value)}
                required
                step="1"
                placeholder="6200"
                className="w-full bg-[#F2F2F7] rounded-[1rem] px-4 py-4 text-[28px] font-bold outline-none transition-all duration-300 focus:ring-2 focus:ring-[#1A5C38]/40 focus:bg-white border-2 border-transparent focus:border-[#1A5C38]/10 text-[#1A5C38]"
              />
            </div>
            <div>
              <label className={labelClass}>Observaciones</label>
              <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={2}
                className={`${inputClass} resize-none`} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#1A5C38] text-white rounded-[1.25rem] py-4 text-[16px] font-bold shadow-[0_4px_12px_rgba(26,92,56,0.2)] hover:shadow-[0_8px_24px_rgba(26,92,56,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0">
            {loading ? 'Publicando…' : 'Publicar precio'}
          </button>
        </form>

        {/* C-08: Historial de precios — gráfica últimos 30 días */}
        {historialPrecios.length > 1 && (
          <div className="max-w-4xl mx-auto pb-8 mt-5">
            <div className="bg-white rounded-[1.5rem] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 transition-colors hover:text-[#1A5C38]/60">Historial de precios — últimos 30 días</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={historialPrecios} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${formatNum(v)}`} width={72} />
                  <Tooltip formatter={(v) => [`$${formatNum(Number(v))}/ton`, 'Precio']} labelStyle={{ fontSize: 12, fontWeight: 'bold' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  <Line type="monotone" dataKey="precio" stroke="#1A5C38" strokeWidth={3} dot={{ r: 4, fill: '#1A5C38', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
