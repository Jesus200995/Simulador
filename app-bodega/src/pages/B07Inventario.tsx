import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { AlertTriangle } from 'lucide-react';

export default function B07Inventario() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<{ tipoMaiz: any[]; variedades: any[]; ciclos: any[] }>({ tipoMaiz: [], variedades: [], ciclos: [] });
  const [form, setForm] = useState({
    bodega_id: params.get('bodega_id') || '',
    ciclo: '', tipo_maiz: '', variedad_code: '', origen: 'local',
    volumen_almacenado: '',
    calidad: '', fecha: new Date().toISOString().slice(0, 10), observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [capacidadBodega, setCapacidadBodega] = useState<number | null>(null);
  const [errorVolumen, setErrorVolumen] = useState<string | null>(null);

  // Cargar la capacidad total de la bodega seleccionada
  useEffect(() => {
    if (!form.bodega_id) { setCapacidadBodega(null); return; }
    api.infraestructura.get(Number(form.bodega_id))
      .then((d: any) => setCapacidadBodega(d?.capacidad_ton ? Number(d.capacidad_ton) : null))
      .catch(() => setCapacidadBodega(null));
  }, [form.bodega_id]);

  useEffect(() => {
    api.bodeguero.misBodegas().then((r: any) => setBodegas(r)).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/infraestructura/catalogos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('simac_token')}` }
    }).then(r => r.json()).then(r => {
      setConceptos({
        tipoMaiz: r.tipos_maiz || r.tipo_maiz || [],
        variedades: r.variedades || [],
        ciclos: r.ciclos || [],
      });
    }).catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bodega_id) { toast('Selecciona una bodega', 'error'); return; }
    if (capacidadBodega != null && capacidadBodega > 0 && Number(form.volumen_almacenado) > capacidadBodega) {
      setErrorVolumen(`No puedes registrar más de ${capacidadBodega.toLocaleString('es-MX')} ton — esa es la capacidad total de la bodega.`);
      toast('El volumen supera la capacidad de la bodega', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.infraestructura.inventario(Number(form.bodega_id), form);
      toast('Inventario guardado', 'success');
      navigate(-1);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  }

  const TIPOS_MAIZ_DEFAULT = [['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['criollo','Criollo / Local']];

  const filteredVars = conceptos.variedades.filter((v: {tipo_maiz?: string}) => v.tipo_maiz === form.tipo_maiz);

  const inputClass = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0';
  const labelClass = 'block text-[15px] font-medium text-gray-600 mb-1.5';

  return (
    <div className="w-full">
      <PageBanner title="Actualizar Inventario" subtitle="Registro de volumen almacenado" back="/mis-bodegas" />

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Bodega */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className={`text-[13px] font-semibold text-gray-500 uppercase tracking-wide`}>Bodega</p>
          <div>
            <label className={labelClass}>Selecciona la bodega</label>
            <select value={form.bodega_id} onChange={e => set('bodega_id', e.target.value)} required className={inputClass}>
              <option value="">Selecciona bodega</option>
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ciclo</label>
            <select value={form.ciclo} onChange={e => set('ciclo', e.target.value)} className={inputClass}>
              <option value="">Selecciona ciclo</option>
              {conceptos.ciclos.length > 0
                ? conceptos.ciclos.map(c => <option key={c.code} value={c.code}>{c.label}</option>)
                : [['PV', 'Primavera-Verano'], ['OI', 'Otoño-Invierno'], ['ANUAL', 'Anual']].map(([c, l]) => <option key={c} value={c}>{l}</option>)
              }
            </select>
          </div>
        </div>

        {/* Tipo de maíz */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Tipo de maíz</p>
          <div>
            <label className={labelClass}>Tipo de maíz</label>
            <select value={form.tipo_maiz} onChange={e => set('tipo_maiz', e.target.value)} required className={inputClass}>
              <option value="">Selecciona tipo</option>
              {(conceptos.tipoMaiz.length > 0
                ? conceptos.tipoMaiz.map((t: any) => Array.isArray(t) ? t : [t.code || t.id, t.label || t.nombre || t.code])
                : TIPOS_MAIZ_DEFAULT
              ).map((item: any) => <option key={item[0]} value={item[0]}>{item[1]}</option>)}
            </select>
          </div>
          {form.tipo_maiz && (
            <div>
              <label className={labelClass}>Variedad <span className="text-gray-400 font-normal">(opcional)</span></label>
              <select value={form.variedad_code} onChange={e => set('variedad_code', e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                {filteredVars.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>Origen</label>
            <select value={form.origen} onChange={e => set('origen', e.target.value)} className={inputClass}>
              <option value="local">Local</option>
              <option value="importado">Importado</option>
            </select>
          </div>
        </div>

        {/* Volumen y calidad */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Volumen y calidad</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">
              ¿Qué número debo escribir?
            </p>
            <p className="text-sm text-green-700 leading-relaxed">
              Escribe el <strong>total de toneladas que tienes almacenadas
              en este momento</strong> en la bodega — no solo lo que llegó hoy.
            </p>
            <p className="text-sm text-green-600 mt-2">
              Ejemplo: Si tenías 800 ton y llegaron 200 ton más hoy,
              escribe <strong>1,000</strong> (el total actual).
            </p>
          </div>
          <div>
            <label className={labelClass}>Stock actual total (ton)</label>
            {capacidadBodega != null && capacidadBodega > 0 && (
              <p className="text-xs text-gray-500 mb-1.5">
                Capacidad total de la bodega: <strong>{capacidadBodega.toLocaleString('es-MX')} ton</strong>
              </p>
            )}
            <input
              type="number"
              value={form.volumen_almacenado}
              onChange={e => {
                const val = Number(e.target.value);
                if (capacidadBodega != null && capacidadBodega > 0 && val > capacidadBodega) {
                  setErrorVolumen(`No puedes registrar más de ${capacidadBodega.toLocaleString('es-MX')} ton — esa es la capacidad total de la bodega.`);
                } else {
                  setErrorVolumen(null);
                }
                set('volumen_almacenado', e.target.value);
              }}
              required
              min="0"
              max={capacidadBodega ?? undefined}
              step="0.1"
              placeholder="Ej: 1,500"
              className={inputClass}
            />
            {errorVolumen && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> {errorVolumen}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Este número reemplaza el registro anterior y representa
              el total que hay en tu bodega ahora mismo.
            </p>
          </div>
          <div>
            <label className={labelClass}>Calidad</label>
            <select value={form.calidad} onChange={e => set('calidad', e.target.value)} required className={inputClass}>
              <option value="">Selecciona calidad</option>
              <option value="primera">Primera</option>
              <option value="segunda">Segunda</option>
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Fecha y notas</p>
          <div>
            <label className={labelClass}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required
              max={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={3}
              className={`${inputClass} resize-none`} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40">
          {loading ? 'Guardando…' : 'Guardar inventario'}
        </button>
      </form>
    </div>
  );
}
