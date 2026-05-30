import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Wheat, Check, AlertCircle, Leaf, Calendar, MapPin } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AÑO_ACTUAL = new Date().getFullYear();

const CICLOS = [
  { valor: 'PV',    label: 'Primavera-Verano',  desc: 'Siembra abril – junio' },
  { valor: 'OI',    label: 'Otoño-Invierno',    desc: 'Siembra octubre – diciembre' },
  { valor: 'ANUAL', label: 'Ciclo anual',        desc: 'Producción continua con riego' },
];

const DESTINOS = [
  { valor: 'autoconsumo',    label: 'Autoconsumo', emoji: '🏡' },
  { valor: 'venta_local',    label: 'Venta local', emoji: '🏘️' },
  { valor: 'venta_nacional', label: 'Venta nacional', emoji: '🇲🇽' },
  { valor: 'mixto',          label: 'Mixto (varios)', emoji: '📦' },
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
      navigate('/productor', { state: { mensaje: 'Ciclo productivo guardado con éxito' } });
    } catch { setError('Error de conexión al servidor. Revisa tu internet e intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const saltar = () => {
    localStorage.setItem('ciclo_pendiente', '1');
    navigate('/productor');
  };

  const inputCls = 'w-full bg-slate-50/50 border border-slate-200/80 rounded-[20px] px-5 py-4 text-[15px] font-medium text-slate-800 placeholder-slate-400 focus:border-[#1A5C38] focus:bg-white focus:ring-4 focus:ring-green-100 transition-all outline-none shadow-sm';

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col font-sans selection:bg-[#1A5C38] selection:text-white pb-6">
      
      {/* Header Fijo con Progreso Blur */}
      <div className="sticky top-0 z-50 flex flex-col px-4 sm:px-6 py-4 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full mb-3">
          <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate('/productor')}
            className="w-10 h-10 -ml-2 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Paso {paso} de 4
          </div>
          <div className="w-10" />
        </div>
        
        {/* Progress Bar Apple Style */}
        <div className="max-w-3xl mx-auto w-full flex justify-center gap-1.5 px-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-2 flex-1 max-w-[80px] rounded-full transition-all duration-500 shadow-inner
              ${n < paso ? 'bg-emerald-500' : n === paso ? 'bg-gradient-to-r from-[#1A5C38] to-emerald-500' : 'bg-slate-200/80'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="max-w-[600px] mx-auto">

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200/60 rounded-[20px] text-rose-700 text-sm font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Tarjeta Contenedor Principal con Glassmorphism */}
          <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 sm:p-10 border border-white/60 relative overflow-hidden transition-all duration-300">
            {/* Soft Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            {/* PASO 1 — Tipo de ciclo + año */}
            {paso === 1 && (
              <div className="space-y-6 sm:space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {esPrimerLogin && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[24px] p-5 mb-4 shadow-sm">
                    <p className="text-indigo-800 text-[15px] font-bold tracking-tight">Un último paso antes de empezar 🌽</p>
                    <p className="text-indigo-600/80 text-[13px] font-medium mt-1 leading-relaxed">
                      Registra la información de tu ciclo productivo para que las bodegas conozcan tu oferta con anticipación.
                    </p>
                  </div>
                )}
                
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#1A5C38] mb-5 mx-auto sm:mx-0 shadow-sm border border-emerald-100">
                    <Calendar size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-none mb-3">
                    Tu ciclo productivo
                  </h2>
                  <p className="text-[15px] text-slate-500 font-medium">¿Qué ciclo estás sembrando actualmente?</p>
                </div>

                <div className="space-y-3.5">
                  {CICLOS.map(c => (
                    <button key={c.valor} onClick={() => setForm(f => ({...f, cycle_type: c.valor}))}
                      className={`w-full border-2 rounded-[24px] py-4 sm:py-5 px-5 sm:px-6 flex items-center gap-4 text-left transition-all duration-200 group
                        ${form.cycle_type === c.valor 
                          ? 'border-[#1A5C38] bg-emerald-50/50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'}`}>
                      <div className={`w-[46px] h-[46px] rounded-[16px] flex items-center justify-center shrink-0 transition-colors
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] text-white shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'}`}>
                        <Wheat size={24} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[17px] font-bold ${form.cycle_type === c.valor ? 'text-[#1A5C38]' : 'text-slate-800'}`}>
                          {c.label}
                        </p>
                        <p className={`text-[13px] font-medium mt-0.5 ${form.cycle_type === c.valor ? 'text-emerald-700/70' : 'text-slate-500'}`}>
                          {c.desc}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] border-[#1A5C38]' : 'border-slate-200'}`}>
                        {form.cycle_type === c.valor && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[15px] font-bold text-slate-800 mb-4">¿En qué año?</p>
                  <div className="flex gap-3">
                    {[AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1].map(y => (
                      <button key={y}
                        onClick={() => setForm(f => ({...f, cycle_year: y}))}
                        className={`flex-1 py-3.5 rounded-[18px] border-2 font-bold text-[15px] transition-all
                          ${form.cycle_year === y 
                            ? 'border-[#1A5C38] bg-emerald-50 text-[#1A5C38] shadow-sm' 
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2 — Variedad */}
            {paso === 2 && (
              <div className="space-y-6 sm:space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-5 mx-auto sm:mx-0 shadow-sm border border-amber-100">
                    <Leaf size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-none mb-3">
                    Variedad sembrada
                  </h2>
                  <p className="text-[15px] text-slate-500 font-medium">Selecciona el tipo de maíz que estás produciendo.</p>
                </div>
                
                {!tipoMaiz ? (
                  <div className="space-y-3.5">
                    {['blanco', 'amarillo', 'criollo'].map((t, idx) => (
                      <button key={t} onClick={() => setTipoMaiz(t as any)}
                        className="w-full rounded-[24px] p-5 sm:p-6 border-2 border-slate-100 bg-white hover:border-[#1A5C38]/30 hover:bg-emerald-50/30 text-left transition-all duration-200 group flex justify-between items-center shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{idx === 0 ? '🌽' : idx === 1 ? '🌞' : '🌾'}</span>
                          <p className="text-xl font-bold text-slate-800 capitalize group-hover:text-[#1A5C38] transition-colors">
                            Maíz {t}
                          </p>
                        </div>
                        <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:text-[#1A5C38] group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-5">
                      <p className="font-bold text-slate-800 capitalize text-lg flex items-center gap-2">
                        {tipoMaiz === 'blanco' ? '🌽' : tipoMaiz === 'amarillo' ? '🌞' : '🌾'} Maíz {tipoMaiz}
                      </p>
                      <button onClick={() => { setTipoMaiz(''); setForm(f => ({...f, variety_id: '', variety_other: ''})); setEsCriollo(false); }} 
                        className="text-[#1A5C38] text-[13px] font-bold bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors">
                        Cambiar tipo
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-[250px] sm:max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {variedades.map(v => (
                        <button key={v.code}
                          onClick={() => {
                            setForm(f => ({...f, variety_id: v.code, variety_other: ''}));
                            setEsCriollo(v.label.toLowerCase().includes('criollo') || v.code === 'MC_CRIOLLO');
                          }}
                          className={`w-full rounded-[18px] p-4 border-2 text-left transition-all flex items-center gap-3
                            ${form.variety_id === v.code
                              ? 'border-[#1A5C38] bg-emerald-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                            ${form.variety_id === v.code ? 'bg-[#1A5C38] border-[#1A5C38]' : 'border-slate-300'}`}>
                            {form.variety_id === v.code && <Check size={12} className="text-white" strokeWidth={4} />}
                          </div>
                          <span className={`text-[14px] font-bold ${form.variety_id === v.code ? 'text-[#1A5C38]' : 'text-slate-700'}`}>
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {esCriollo && (
                      <div className="animate-in fade-in slide-in-from-top-2 p-5 bg-slate-50 rounded-[24px] border border-slate-200">
                        <label className="block text-[14px] font-bold text-slate-800 mb-2">
                          ¿Cómo se llama tu variedad criolla? <span className="text-slate-400 font-medium ml-1">(opcional)</span>
                        </label>
                        <input type="text"
                          value={form.variety_other}
                          onChange={e => setForm(f => ({...f, variety_other: e.target.value}))}
                          placeholder="Ej: Olotillo, Pepitilla, Olotón..."
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PASO 3 — Superficie + rendimiento */}
            {paso === 3 && (
              <div className="space-y-6 sm:space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 mx-auto sm:mx-0 shadow-sm border border-blue-100">
                    <MapPin size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-none mb-3">
                    Superficie y cálculo
                  </h2>
                  <p className="text-[15px] text-slate-500 font-medium">Estima las dimensiones de tu siembra actual.</p>
                </div>

                {areaHaCalc && (
                  <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-[20px] p-4 flex gap-3 shadow-sm">
                    <span className="text-xl">📐</span>
                    <p className="text-[13px] text-emerald-800 font-medium leading-relaxed">
                      Tu predio tiene registradas <strong className="font-black text-emerald-900 text-sm">{areaHaCalc} hectáreas</strong>. 
                      La superficie sembrada que captures debe ser igual o menor a esta área.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="p-5 sm:p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                    <label className="block text-[15px] font-bold text-slate-800 mb-3 text-center sm:text-left">
                      ¿Cuántas hectáreas vas a sembrar este ciclo?
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0.1" step="0.1" max={areaHaCalc ?? 9999}
                        value={form.area_sown_ha}
                        onChange={e => setForm(f => ({...f, area_sown_ha: e.target.value}))}
                        placeholder={areaHaCalc ? String(areaHaCalc) : 'Ej: 5.5'}
                        className={`${inputCls} text-[28px] font-black text-center flex-1 py-5 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-xl px-2">ha</span>
                    </div>
                    {areaHaCalc && !form.area_sown_ha && (
                      <button onClick={() => setForm(f => ({...f, area_sown_ha: String(areaHaCalc)}))}
                        className="mt-4 w-full text-[#1A5C38] text-[14px] font-bold border-2 border-emerald-200 bg-white py-3 rounded-[16px] hover:bg-emerald-50 hover:border-[#1A5C38] transition-all shadow-sm">
                        Llenar con el total de mi parcela ({areaHaCalc} ha)
                      </button>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                    <label className="block text-[15px] font-bold text-slate-800 mb-1 text-center sm:text-left">
                      Rendimiento que esperas
                    </label>
                    <p className="text-[13px] text-slate-400 mb-4 font-medium text-center sm:text-left">Según tu experiencia en esta parcela <span className="font-bold text-slate-500">(ton/ha)</span></p>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0.1" max="30" step="0.1"
                        value={form.yield_expected}
                        onChange={e => setForm(f => ({...f, yield_expected: e.target.value}))}
                        placeholder="Ej: 8"
                        className={`${inputCls} text-[28px] font-black text-center flex-1 py-5 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-lg px-2 leading-none">ton<br/><span className="text-sm">/ ha</span></span>
                    </div>
                  </div>
                </div>

                {form.area_sown_ha && form.yield_expected && (
                  <div className="bg-gradient-to-br from-[#1A5C38] to-[#124227] rounded-[24px] p-6 text-center shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <p className="text-[13px] text-emerald-200 font-bold uppercase tracking-widest relative z-10">Producción estimada</p>
                    <p className="text-[42px] sm:text-[48px] font-black text-white mt-1 leading-none tracking-tight relative z-10">
                      {(Number(form.area_sown_ha) * Number(form.yield_expected)).toFixed(1)} <span className="text-2xl text-emerald-200 font-bold tracking-normal">ton</span>
                    </p>
                    <div className="inline-block mt-3 px-3 py-1.5 bg-black/20 rounded-full text-[12px] font-bold text-emerald-100 relative z-10">
                      {form.area_sown_ha} ha × {form.yield_expected} ton/ha
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4 — Fechas + destino */}
            {paso === 4 && (
              <div className="space-y-6 sm:space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-5 mx-auto sm:mx-0 shadow-sm border border-indigo-100">
                    <Calendar size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-none mb-3">
                    Fechas y destino
                  </h2>
                  <p className="text-[15px] text-slate-500 font-medium">Casi listo. Confirma los tiempos de tu cosecha.</p>
                </div>

                <div className="space-y-5">
                  <div className="bg-slate-50 rounded-[24px] p-5 sm:p-6 border border-slate-100">
                    <label className="block text-[15px] font-bold text-slate-800 mb-2">
                      📅 ¿Cuándo vas a sembrar?
                    </label>
                    <input type="date" value={form.planting_date}
                      onChange={e => setForm(f => ({...f, planting_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700`}
                    />
                  </div>
                  
                  <div className="bg-slate-50 rounded-[24px] p-5 sm:p-6 border border-slate-100">
                    <label className="block text-[15px] font-bold text-slate-800 mb-2">
                      ⏳ ¿Cuándo esperas cosechar? <span className="text-slate-400 font-medium ml-1 text-[13px]">(opcional)</span>
                    </label>
                    <input type="date" value={form.estimated_harvest_date}
                      onChange={e => setForm(f => ({...f, estimated_harvest_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700`}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-[15px] font-bold text-slate-800 mb-4">
                      ¿A dónde va tu cosecha principalmente? <span className="text-slate-400 font-medium ml-1 text-[13px]">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {DESTINOS.map(d => (
                        <button key={d.valor}
                          onClick={() => setForm(f => ({...f, destination: f.destination === d.valor ? '' : d.valor}))}
                          className={`rounded-[20px] p-4 border-2 text-left transition-all flex flex-col gap-2 items-center text-center
                            ${form.destination === d.valor
                              ? 'border-[#1A5C38] bg-emerald-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                          <span className="text-2xl">{d.emoji}</span>
                          <span className={`text-[13px] font-bold ${form.destination === d.valor ? 'text-[#1A5C38]' : 'text-slate-600'}`}>
                            {d.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Bottom Sheet Flotante */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-none z-50">
        <div className="max-w-[600px] mx-auto pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-[32px] shadow-[0_20px_40px_rgb(0,0,0,0.12)] border border-white/80 space-y-3">
            {paso === 1 && (
              <button onClick={() => { setError(''); setPaso(2); }}
                disabled={!form.cycle_type}
                className="w-full bg-gradient-to-r from-[#1A5C38] to-[#14472b] hover:from-[#14472b] hover:to-[#0f3621] text-white py-4 sm:py-4.5 rounded-[20px] text-[17px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_8px_20px_rgba(26,92,56,0.3)]">
                Continuar
              </button>
            )}
            {paso === 2 && (
              <button onClick={() => { setError(''); setPaso(3); }}
                disabled={!form.variety_id}
                className="w-full bg-gradient-to-r from-[#1A5C38] to-[#14472b] hover:from-[#14472b] hover:to-[#0f3621] text-white py-4 sm:py-4.5 rounded-[20px] text-[17px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_8px_20px_rgba(26,92,56,0.3)]">
                Continuar
              </button>
            )}
            {paso === 3 && (
              <button onClick={() => { setError(''); setPaso(4); }}
                disabled={!form.area_sown_ha || Number(form.area_sown_ha) <= 0}
                className="w-full bg-gradient-to-r from-[#1A5C38] to-[#14472b] hover:from-[#14472b] hover:to-[#0f3621] text-white py-4 sm:py-4.5 rounded-[20px] text-[17px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_8px_20px_rgba(26,92,56,0.3)]">
                Continuar
              </button>
            )}
            {paso === 4 && (
              <button onClick={guardar}
                disabled={!form.planting_date || loading}
                className="w-full bg-gradient-to-r from-[#1A5C38] to-[#14472b] hover:from-[#14472b] hover:to-[#0f3621] text-white py-4 sm:py-4.5 rounded-[20px] text-[17px] font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_8px_20px_rgba(26,92,56,0.3)] flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : '✓ Finalizar y guardar ciclo'}
              </button>
            )}
            
            <button onClick={saltar} className="w-full py-2 text-slate-400 hover:text-slate-600 text-[13px] font-bold transition-colors">
              Ahora no — completar después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
