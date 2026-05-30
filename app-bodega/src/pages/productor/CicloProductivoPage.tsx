import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Wheat, Check, AlertCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AÑO_ACTUAL = new Date().getFullYear();

const CICLOS = [
  { valor: 'PV',    label: 'Primavera-Verano',  desc: 'Siembra abril – junio' },
  { valor: 'OI',    label: 'Otoño-Invierno',    desc: 'Siembra octubre – diciembre' },
  { valor: 'ANUAL', label: 'Ciclo anual',        desc: 'Producción continua con riego' },
];

const DESTINOS = [
  { valor: 'autoconsumo',    label: 'Autoconsumo' },
  { valor: 'venta_local',    label: 'Venta local' },
  { valor: 'venta_nacional', label: 'Venta nacional' },
  { valor: 'mixto',          label: 'Mixto (varios destinos)' },
];

interface Variedad { code: string; label: string; }

export default function CicloProductivoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const esPrimerLogin = location.state?.desde === 'login';

  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [upId, setUpId] = useState<number | null>(null);
  const [areaHaCalc, setAreaHaCalc] = useState<number | null>(null);
  const [variedades, setVariedades] = useState<Variedad[]>([]);
  const [tipoMaiz, setTipoMaiz] = useState<'blanco' | 'amarillo' | 'criollo' | ''>('');
  const [esCriollo, setEsCriollo] = useState(false);

  const [form, setForm] = useState({
    cycle_year:             AÑO_ACTUAL,
    cycle_type:             '',
    variety_id:             '',
    variety_other:          '',
    area_sown_ha:           '',
    yield_expected:         '',
    planting_date:          '',
    estimated_harvest_date: '',
    destination:            '',
  });

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const up = d.ups?.[0] ?? d[0];
        if (up) {
          setUpId(up.up_id);
          setAreaHaCalc(up.area_ha_calc ? Number(up.area_ha_calc) : null);
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tipoMaiz) return;
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/catalogos-productor?tipo_maiz=${tipoMaiz}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const maiz: Variedad[] = d.varieties?.maiz ?? [];
        setVariedades(maiz);
      }).catch(() => {});
  }, [tipoMaiz]);

  const guardar = async () => {
    if (!upId) { setError('No se encontró tu unidad productiva.'); return; }
    const token = localStorage.getItem('simac_token');
    setLoading(true); setError('');
    try {
      const cicloRes = await fetch(`${BASE}/ups/${upId}/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cycle_year: form.cycle_year, cycle_type: form.cycle_type }),
      }).then(r => r.json());

      if (!cicloRes.cycle?.cycle_id) { setError(cicloRes.error || 'Error al crear ciclo'); return; }

      const cropRes = await fetch(`${BASE}/cycles/${cicloRes.cycle.cycle_id}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          crop:                   'maiz',
          variety_id:             form.variety_id,
          variety_other:          form.variety_other || null,
          area_sown_ha:           Number(form.area_sown_ha),
          planting_date:          form.planting_date,
          yield_expected:         form.yield_expected ? Number(form.yield_expected) : null,
          estimated_harvest_date: form.estimated_harvest_date || null,
          destination:            form.destination || null,
        }),
      });

      if (!cropRes.ok) {
        const err = await cropRes.json();
        setError(err.error || 'Error al guardar cultivo'); return;
      }

      localStorage.removeItem('ciclo_pendiente');
      localStorage.setItem('ciclo_completado', '1');
      navigate('/productor', { state: { mensaje: 'Ciclo productivo guardado' } });
    } catch { setError('Error de conexión. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const saltar = () => {
    localStorage.setItem('ciclo_pendiente', '1');
    navigate('/productor');
  };

  const inputCls = 'w-full bg-zinc-50 ring-1 ring-zinc-200 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-[#1A5C38] focus:outline-none transition-shadow';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 sm:px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate('/productor')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronLeft size={22} className="text-zinc-600" />
        </button>
        <div className="flex-1 flex justify-center gap-1.5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-1.5 w-8 sm:w-10 rounded-full transition-all duration-300
              ${n <= paso ? 'bg-[#1A5C38]' : 'bg-zinc-200'}`} />
          ))}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 sm:px-8 py-6 sm:py-8">

          {error && (
            <div className="mb-5 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* PASO 1 — Tipo de ciclo + año */}
          {paso === 1 && (
            <div className="space-y-4">
              {esPrimerLogin && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-2">
                  <p className="text-blue-800 text-sm font-semibold">Un último paso 🌽</p>
                  <p className="text-blue-700 text-xs mt-1">
                    Registra tu ciclo productivo para que las bodegas conozcan tu oferta.
                  </p>
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Mi ciclo productivo</h2>
              <p className="text-sm text-zinc-500 mb-4">¿Qué ciclo estás sembrando?</p>
              {CICLOS.map(c => (
                <button key={c.valor} onClick={() => setForm(f => ({...f, cycle_type: c.valor}))}
                  className={`w-full ring-1 rounded-2xl py-4 px-5 flex items-center gap-4 text-left transition-all duration-200
                    ${form.cycle_type === c.valor ? 'ring-2 ring-[#1A5C38] bg-emerald-50' : 'ring-zinc-200 bg-white hover:bg-zinc-50'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                    ${form.cycle_type === c.valor ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                    <Wheat size={22} className={form.cycle_type === c.valor ? 'text-[#1A5C38]' : 'text-zinc-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-800">{c.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{c.desc}</p>
                  </div>
                  {form.cycle_type === c.valor && <Check size={18} className="text-[#1A5C38] shrink-0" />}
                </button>
              ))}

              <p className="text-sm font-semibold text-zinc-800 mt-4 mb-2">¿En qué año?</p>
              <div className="flex gap-3">
                {[AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1].map(y => (
                  <button key={y}
                    onClick={() => setForm(f => ({...f, cycle_year: y}))}
                    className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all
                      ${form.cycle_year === y ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]' : 'border-gray-200 text-gray-600'}`}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2 — Variedad */}
          {paso === 2 && (
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">¿Qué variedad siembras?</h2>
              <p className="text-sm text-zinc-500 mb-4">Toca la que más se acerca a tu semilla</p>
              
              {!tipoMaiz ? (
                <div className="space-y-3">
                  {['blanco', 'amarillo', 'criollo'].map(t => (
                    <button key={t} onClick={() => setTipoMaiz(t as any)}
                      className="w-full rounded-2xl p-4 border-2 border-gray-200 text-left hover:bg-zinc-50">
                      <p className="font-semibold text-gray-800 capitalize">Maíz {t}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button onClick={() => { setTipoMaiz(''); setForm(f => ({...f, variety_id: '', variety_other: ''})); setEsCriollo(false); }} className="text-[#1A5C38] text-sm underline mb-2">← Cambiar tipo de maíz</button>
                  {variedades.map(v => (
                    <button key={v.code}
                      onClick={() => {
                        setForm(f => ({...f, variety_id: v.code, variety_other: ''}));
                        setEsCriollo(v.label.toLowerCase().includes('criollo') || v.code === 'MC_CRIOLLO');
                      }}
                      className={`w-full rounded-xl p-3.5 border-2 text-left transition-all flex items-center gap-2
                        ${form.variety_id === v.code
                          ? 'border-[#1A5C38] bg-green-50'
                          : 'border-gray-200 bg-white'}`}>
                      {form.variety_id === v.code && <Check size={14} className="text-[#1A5C38] shrink-0" />}
                      <span className="text-sm font-medium text-gray-800">{v.label}</span>
                    </button>
                  ))}
                  
                  {esCriollo && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Cómo se llama tu variedad criolla? <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input type="text"
                        value={form.variety_other}
                        onChange={e => setForm(f => ({...f, variety_other: e.target.value}))}
                        placeholder="Ej: Olotillo, Pepitilla, Olotón..."
                        className={inputCls}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PASO 3 — Superficie + rendimiento */}
          {paso === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Superficie y fechas</h2>
              {areaHaCalc && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-700">
                    📐 Tu predio tiene <strong>{areaHaCalc} ha</strong> registradas.
                    La superficie sembrada puede ser igual o menor.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  ¿Cuántas hectáreas vas a sembrar este ciclo?
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" min="0.1" step="0.1" max={areaHaCalc ?? 9999}
                    value={form.area_sown_ha}
                    onChange={e => setForm(f => ({...f, area_sown_ha: e.target.value}))}
                    placeholder={areaHaCalc ? String(areaHaCalc) : 'Ej: 5.5'}
                    className={`${inputCls} text-2xl font-bold text-center flex-1`}
                  />
                  <span className="text-zinc-500 font-medium">ha</span>
                </div>
                {areaHaCalc && !form.area_sown_ha && (
                  <button onClick={() => setForm(f => ({...f, area_sown_ha: String(areaHaCalc)}))}
                    className="mt-2 w-full text-[#1A5C38] text-sm font-semibold border-2 border-[#1A5C38] py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                    Usar área de mi parcela ({areaHaCalc} ha)
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Rendimiento que esperas <span className="text-zinc-400 font-normal">(ton/ha)</span>
                </label>
                <p className="text-xs text-zinc-400 mb-2">Según tu experiencia en esta parcela</p>
                <div className="flex items-center gap-3">
                  <input type="number" min="0.1" max="30" step="0.1"
                    value={form.yield_expected}
                    onChange={e => setForm(f => ({...f, yield_expected: e.target.value}))}
                    placeholder="Ej: 8"
                    className={`${inputCls} text-2xl font-bold text-center flex-1`}
                  />
                  <span className="text-zinc-500 font-medium">ton/ha</span>
                </div>
              </div>
              {form.area_sown_ha && form.yield_expected && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-zinc-500">Producción estimada total</p>
                  <p className="text-3xl font-bold text-[#1A5C38] mt-1">
                    {(Number(form.area_sown_ha) * Number(form.yield_expected)).toFixed(1)} ton
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {form.area_sown_ha} ha × {form.yield_expected} ton/ha
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 4 — Fechas + destino */}
          {paso === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Fechas y destino</h2>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  ¿Cuándo vas a sembrar?
                </label>
                <input type="date" value={form.planting_date}
                  onChange={e => setForm(f => ({...f, planting_date: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  ¿Cuándo esperas cosechar? <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <input type="date" value={form.estimated_harvest_date}
                  onChange={e => setForm(f => ({...f, estimated_harvest_date: e.target.value}))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  ¿A dónde va tu cosecha? <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DESTINOS.map(d => (
                    <button key={d.valor}
                      onClick={() => setForm(f => ({...f, destination: f.destination === d.valor ? '' : d.valor}))}
                      className={`rounded-xl p-3 border-2 text-sm font-medium text-left transition-all
                        ${form.destination === d.valor
                          ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]'
                          : 'border-gray-200 text-gray-700'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 sm:px-8 py-4 border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto space-y-2">
          {paso === 1 && (
            <button onClick={() => { setError(''); setPaso(2); }}
              disabled={!form.cycle_type}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-semibold disabled:opacity-40">
              Continuar →
            </button>
          )}
          {paso === 2 && (
            <button onClick={() => { setError(''); setPaso(3); }}
              disabled={!form.variety_id}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-semibold disabled:opacity-40">
              Continuar →
            </button>
          )}
          {paso === 3 && (
            <button onClick={() => { setError(''); setPaso(4); }}
              disabled={!form.area_sown_ha || Number(form.area_sown_ha) <= 0}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-semibold disabled:opacity-40">
              Continuar →
            </button>
          )}
          {paso === 4 && (
            <button onClick={guardar}
              disabled={!form.planting_date || loading}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-semibold disabled:opacity-40">
              {loading ? 'Guardando...' : '✓ Guardar ciclo productivo'}
            </button>
          )}
          <button onClick={saltar} className="w-full py-2 text-zinc-400 text-sm">
            Ahora no — completar después
          </button>
        </div>
      </div>
    </div>
  );
}
