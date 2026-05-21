import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

export default function B07Inventario() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<{ tipoMaiz: any[]; variedades: any[]; ciclos: any[] }>({ tipoMaiz: [], variedades: [], ciclos: [] });
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    ciclo: '', tipo_maiz: '', variedad_code: '', origen: 'local',
    volumen_almacenamiento: '', volumen_problema: '',
    humedad_pct: '', calidad: '', fecha: new Date().toISOString().slice(0, 10), observaciones: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    Promise.all([api.bodegas.list(), api.infraestructura.get(1)])
      .catch(() => {});
    // Cargar cat_catalog de tipo_maiz
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/infraestructura/catalogos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('simac_token')}` }
    }).then(r => r.json()).then(r => {
      setConceptos({
        tipoMaiz: r.tipo_maiz || [],
        variedades: r.variedades || r.crop_variety || [],
        ciclos: r.ciclos || r.cycle_type || [],
      });
    }).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bodega_id) { alert('Selecciona una bodega'); return; }
    setLoading(true);
    try {
      await api.infraestructura.inventario(Number(form.bodega_id), form);
      alert('Inventario guardado');
      navigate(-1);
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  }

  const filteredVars = form.tipo_maiz === 'criollo'
    ? conceptos.variedades.filter(v => ['CRIOLLO_LOCAL', 'OTRA'].includes(v.code))
    : conceptos.variedades;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Actualizar Inventario" back="/mis-bodegas" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Bodega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
          <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona bodega</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        {/* Ciclo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
          <select value={form.ciclo} onChange={e => set('ciclo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona ciclo</option>
            {conceptos.ciclos.length > 0
              ? conceptos.ciclos.map(c => <option key={c.code} value={c.code}>{c.label}</option>)
              : [['PV', 'Primavera-Verano'], ['OI', 'Otoño-Invierno'], ['ANUAL', 'Anual']].map(([c, l]) => <option key={c} value={c}>{l}</option>)
            }
          </select>
        </div>

        {/* Tipo de maíz */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de maíz</label>
          <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="">Selecciona tipo</option>
            {conceptos.tipoMaiz.length > 0
              ? conceptos.tipoMaiz.map(t => <option key={t.code} value={t.code}>{t.label}</option>)
              : [['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Maíz Forrajero'],['palomero','Maíz Palomero'],['morado','Maíz Morado'],['criollo','Maíz Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)
            }
          </select>
        </div>

        {/* Variedad — NUEVO */}
        {form.tipo_maiz && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variedad <span className="text-gray-400">(opcional)</span></label>
            <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
              <option value="">Sin especificar</option>
              {filteredVars.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
            </select>
          </div>
        )}

        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
          <select value={form.origen} onChange={e => set('origen', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
            <option value="local">Local</option>
            <option value="importado">Importado</option>
          </select>
        </div>

        {/* Volúmenes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vol. almacenamiento (ton)</label>
            <input type="number" value={form.volumen_almacenamiento} onChange={e => set('volumen_almacenamiento', e.target.value)} required min="0" step="0.1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vol. con problema (ton)</label>
            <input type="number" value={form.volumen_problema} onChange={e => set('volumen_problema', e.target.value)} min="0" step="0.1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>
        </div>

        {/* Humedad y calidad — NUEVO */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Humedad (%) ✨</label>
            <input type="number" value={form.humedad_pct} onChange={e => set('humedad_pct', e.target.value)} min="0" max="100" step="0.1" placeholder="14.5"
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

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required
            max={new Date().toISOString().slice(0, 10)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60">
          {loading ? 'Guardando…' : 'Guardar inventario'}
        </button>
      </form>
    </div>
  );
}
