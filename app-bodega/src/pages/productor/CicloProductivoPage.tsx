import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Wheat, Check, AlertCircle, Leaf, Calendar, MapPin, 
  Sun, Sprout, Ruler, Home, Store, Globe, Package, Clock, AlertTriangle, Play
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AÑO_ACTUAL = new Date().getFullYear();

const CICLOS = [
  { valor: 'PV',    label: 'Primavera-Verano',  desc: 'Siembra abril – junio' },
  { valor: 'OI',    label: 'Otoño-Invierno',    desc: 'Siembra octubre – diciembre' },
  { valor: 'ANUAL', label: 'Ciclo anual',        desc: 'Producción continua' },
];

const DESTINOS = [
  { valor: 'autoconsumo',    label: 'Autoconsumo', icon: Home },
  { valor: 'venta_local',    label: 'Venta local', icon: Store },
  { valor: 'venta_nacional', label: 'Venta nacional', icon: Globe },
  { valor: 'mixto',          label: 'Mixto (varios)', icon: Package },
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

  const inputCls = 'w-full bg-slate-50/50 border border-slate-200 rounded-[16px] px-4 py-3.5 text-[15px] font-semibold text-slate-800 placeholder-slate-400 focus:border-[#1A5C38] focus:bg-white focus:ring-4 focus:ring-[#1A5C38]/10 transition-all outline-none';

  return (
    <div className="flex flex-col font-sans w-full min-h-screen bg-[#f4f5f7] pb-[120px]">
      
      {/* Header Verde Premium */}
      <div className="w-full bg-gradient-to-b from-[#1A5C38] to-[#124227] rounded-b-[32px] shadow-[0_8px_30px_rgba(26,92,56,0.2)] relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 pt-6 pb-8 relative z-20">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate('/productor')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md active:scale-95">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="text-[12px] font-bold text-emerald-100/90 uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm">
              Paso {paso} de 4
            </div>
            <div className="w-10" />
          </div>
          
          <div className="w-full flex justify-center gap-2 px-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={`h-2 flex-1 max-w-[80px] rounded-full transition-all duration-500 shadow-inner
                ${n < paso ? 'bg-emerald-400' : n === paso ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 -mt-4 relative z-20">
        <div className="max-w-[500px] mx-auto">

          {error && (
            <div className="mb-5 p-4 bg-red-50/90 backdrop-blur-sm border border-red-100 rounded-[20px] text-red-700 text-[14px] font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Tarjeta Contenedor */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300">
            
            {/* PASO 1 — Tipo de ciclo + año */}
            {paso === 1 && (
              <div className="space-y-7 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {esPrimerLogin && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-[16px] p-4 mb-2 flex gap-3 items-start">
                    <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full shrink-0">
                      <Play size={14} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-indigo-900 text-[14px] font-bold tracking-tight">Un último paso</p>
                      <p className="text-indigo-700/80 text-[13px] font-medium mt-0.5 leading-relaxed">
                        Registra la información de tu siembra actual para las bodegas.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-[#1A5C38] mb-5 mx-auto sm:mx-0 shadow-sm border border-emerald-100/50">
                    <Calendar size={26} strokeWidth={2} />
                  </div>
                  <h2 className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Tu ciclo productivo
                  </h2>
                  <p className="text-[14px] text-slate-500 font-medium">¿Qué ciclo estás sembrando actualmente?</p>
                </div>

                <div className="space-y-3">
                  {CICLOS.map(c => (
                    <button key={c.valor} onClick={() => setForm(f => ({...f, cycle_type: c.valor}))}
                      className={`w-full border-2 rounded-[20px] py-4 px-5 flex items-center gap-4 text-left transition-all duration-200 active:scale-[0.98]
                        ${form.cycle_type === c.valor 
                          ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-md shadow-[#1A5C38]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] text-white shadow-lg shadow-[#1A5C38]/30 scale-105' : 'bg-slate-100 text-slate-400'}`}>
                        <Wheat size={22} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[16px] font-black tracking-tight ${form.cycle_type === c.valor ? 'text-[#1A5C38]' : 'text-slate-800'}`}>
                          {c.label}
                        </p>
                        <p className={`text-[13px] font-medium mt-0.5 ${form.cycle_type === c.valor ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                          {c.desc}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] border-[#1A5C38] scale-110' : 'border-slate-200'}`}>
                        {form.cycle_type === c.valor && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <p className="text-[15px] font-bold text-slate-800 mb-3">¿En qué año?</p>
                  <div className="flex gap-3">
                    {[AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1].map(y => (
                      <button key={y}
                        onClick={() => setForm(f => ({...f, cycle_year: y}))}
                        className={`flex-1 py-3.5 rounded-[16px] border-2 font-black text-[15px] transition-all active:scale-95
                          ${form.cycle_year === y 
                            ? 'border-[#1A5C38] bg-[#1A5C38] text-white shadow-md shadow-[#1A5C38]/20' 
                            : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2 — Variedad */}
            {paso === 2 && (
              <div className="space-y-7 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-5 mx-auto sm:mx-0 shadow-sm border border-amber-100/50">
                    <Leaf size={26} strokeWidth={2} />
                  </div>
                  <h2 className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Variedad sembrada
                  </h2>
                  <p className="text-[14px] text-slate-500 font-medium">Selecciona el tipo de maíz que produces.</p>
                </div>
                
                {!tipoMaiz ? (
                  <div className="space-y-3">
                    {['blanco', 'amarillo', 'criollo'].map((t, idx) => (
                      <button key={t} onClick={() => setTipoMaiz(t as any)}
                        className="w-full rounded-[20px] p-5 border-2 border-slate-100 bg-white hover:border-[#1A5C38]/30 hover:bg-emerald-50/30 text-left transition-all duration-200 active:scale-[0.98] group flex justify-between items-center shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-500 group-hover:text-[#1A5C38] group-hover:bg-[#1A5C38]/10 bg-slate-50 transition-colors`}>
                            {idx === 0 ? <Wheat size={24} /> : idx === 1 ? <Sun size={24} /> : <Sprout size={24} />}
                          </div>
                          <p className="text-[17px] font-black text-slate-800 capitalize group-hover:text-[#1A5C38] transition-colors tracking-tight">
                            Maíz {t}
                          </p>
                        </div>
                        <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:text-[#1A5C38] group-hover:translate-x-1 transition-all" strokeWidth={3} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-5 bg-slate-50/80 p-3 rounded-[16px] border border-slate-100 shadow-sm">
                      <p className="font-black text-slate-800 capitalize text-[15px] flex items-center gap-2 px-2">
                        {tipoMaiz === 'blanco' ? <Wheat size={20} className="text-[#1A5C38]"/> : tipoMaiz === 'amarillo' ? <Sun size={20} className="text-amber-500"/> : <Sprout size={20} className="text-emerald-500"/>} 
                        Maíz {tipoMaiz}
                      </p>
                      <button onClick={() => { setTipoMaiz(''); setForm(f => ({...f, variety_id: '', variety_other: ''})); setEsCriollo(false); }} 
                        className="text-[#1A5C38] text-[13px] font-bold bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
                        Cambiar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5 mb-5 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {variedades.map(v => (
                        <button key={v.code}
                          onClick={() => {
                            setForm(f => ({...f, variety_id: v.code, variety_other: ''}));
                            setEsCriollo(v.label.toLowerCase().includes('criollo') || v.code === 'MC_CRIOLLO');
                          }}
                          className={`w-full rounded-[16px] p-4 border-2 text-left transition-all active:scale-[0.98] flex items-center gap-3
                            ${form.variety_id === v.code
                              ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-sm'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
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
                      <div className="animate-in fade-in slide-in-from-top-2 p-5 bg-slate-50/80 rounded-[20px] border border-slate-100 shadow-sm">
                        <label className="block text-[14px] font-bold text-slate-800 mb-2">
                          ¿Cómo se llama tu variedad criolla? <span className="text-slate-400 font-medium ml-1">(opcional)</span>
                        </label>
                        <input type="text"
                          value={form.variety_other}
                          onChange={e => setForm(f => ({...f, variety_other: e.target.value}))}
                          placeholder="Ej: Olotillo, Pepitilla..."
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
              <div className="space-y-7 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-5 mx-auto sm:mx-0 shadow-sm border border-blue-100/50">
                    <MapPin size={26} strokeWidth={2} />
                  </div>
                  <h2 className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Superficie y cálculo
                  </h2>
                  <p className="text-[14px] text-slate-500 font-medium">Estima las dimensiones de tu siembra actual.</p>
                </div>

                {areaHaCalc && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[16px] p-4 flex gap-3 shadow-sm items-start">
                    <Ruler size={20} className="text-blue-600 shrink-0" />
                    <p className="text-[13px] text-blue-900 font-medium leading-relaxed">
                      Tu predio registrado mide <strong className="font-bold">{areaHaCalc} hectáreas</strong>. 
                      La siembra debe ser igual o menor a esta cantidad.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-[20px] shadow-sm">
                    <label className="block text-[15px] font-bold text-slate-800 mb-3 text-center sm:text-left">
                      ¿Hectáreas a sembrar este ciclo?
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0.1" step="0.1" max={areaHaCalc ?? 9999}
                        value={form.area_sown_ha}
                        onChange={e => setForm(f => ({...f, area_sown_ha: e.target.value}))}
                        placeholder={areaHaCalc ? String(areaHaCalc) : 'Ej: 5.5'}
                        className={`${inputCls} text-[24px] font-black text-center flex-1 py-4 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-[16px] px-2">ha</span>
                    </div>
                    {areaHaCalc && !form.area_sown_ha && (
                      <button onClick={() => setForm(f => ({...f, area_sown_ha: String(areaHaCalc)}))}
                        className="mt-4 w-full text-blue-700 text-[14px] font-bold border border-blue-200 bg-white py-3 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm active:scale-95">
                        Usar el total ({areaHaCalc} ha)
                      </button>
                    )}
                  </div>

                  <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-[20px] shadow-sm">
                    <label className="block text-[15px] font-bold text-slate-800 mb-1 text-center sm:text-left">
                      Rendimiento esperado
                    </label>
                    <p className="text-[13px] text-slate-500 mb-4 font-medium text-center sm:text-left">Por hectárea (ton/ha)</p>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0.1" max="30" step="0.1"
                        value={form.yield_expected}
                        onChange={e => setForm(f => ({...f, yield_expected: e.target.value}))}
                        placeholder="Ej: 8"
                        className={`${inputCls} text-[24px] font-black text-center flex-1 py-4 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-[15px] px-2 leading-tight">ton<br/><span className="text-[12px]">/ ha</span></span>
                    </div>
                  </div>
                </div>

                {form.area_sown_ha && form.yield_expected && (
                  <div className="bg-gradient-to-br from-[#1A5C38] to-[#124227] rounded-[24px] p-6 text-center shadow-[0_8px_30px_rgba(26,92,56,0.3)] animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <p className="text-[12px] text-emerald-200 font-bold uppercase tracking-widest relative z-10">Estimación Total</p>
                    <p className="text-[38px] font-black text-white mt-1 leading-none tracking-tight relative z-10">
                      {(Number(form.area_sown_ha) * Number(form.yield_expected)).toFixed(1)} <span className="text-xl text-emerald-200 font-bold tracking-normal">ton</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4 — Fechas + destino */}
            {paso === 4 && (
              <div className="space-y-7 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-5 mx-auto sm:mx-0 shadow-sm border border-indigo-100/50">
                    <Clock size={26} strokeWidth={2} />
                  </div>
                  <h2 className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Fechas y destino
                  </h2>
                  <p className="text-[14px] text-slate-500 font-medium">Confirma los tiempos de tu cosecha.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50/80 rounded-[20px] p-5 border border-slate-100 shadow-sm">
                    <label className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-slate-400"/> ¿Cuándo vas a sembrar?
                    </label>
                    <input type="date" value={form.planting_date}
                      onChange={e => setForm(f => ({...f, planting_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700 py-4`}
                    />
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-[20px] p-5 border border-slate-100 shadow-sm">
                    <label className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Clock size={18} className="text-slate-400"/> ¿Cuándo esperas cosechar? <span className="text-slate-400 font-medium ml-1 text-[12px]">(opcional)</span>
                    </label>
                    <input type="date" value={form.estimated_harvest_date}
                      onChange={e => setForm(f => ({...f, estimated_harvest_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700 py-4`}
                    />
                  </div>

                  <div className="pt-3">
                    <label className="block text-[15px] font-bold text-slate-800 mb-4 text-center sm:text-left">
                      ¿Destino principal de la cosecha? <span className="text-slate-400 font-medium ml-1 text-[12px]">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {DESTINOS.map((d: any) => (
                        <button key={d.valor}
                          onClick={() => setForm(f => ({...f, destination: f.destination === d.valor ? '' : d.valor}))}
                          className={`rounded-[20px] p-4 sm:p-5 border-2 text-left transition-all active:scale-95 flex flex-col gap-3 items-center text-center
                            ${form.destination === d.valor
                              ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-sm'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                          <d.icon size={26} className={form.destination === d.valor ? 'text-[#1A5C38]' : 'text-slate-400'} strokeWidth={2} />
                          <span className={`text-[13px] font-black tracking-tight ${form.destination === d.valor ? 'text-[#1A5C38]' : 'text-slate-600'}`}>
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

      {/* Footer Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 py-4">
          <div className="max-w-[500px] mx-auto space-y-3">
            {paso === 1 && (
              <button onClick={() => { setError(''); setPaso(2); }}
                disabled={!form.cycle_type}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-4 rounded-full text-[16px] font-black disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(26,92,56,0.25)]">
                Continuar
              </button>
            )}
            {paso === 2 && (
              <button onClick={() => { setError(''); setPaso(3); }}
                disabled={!form.variety_id}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-4 rounded-full text-[16px] font-black disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(26,92,56,0.25)]">
                Continuar
              </button>
            )}
            {paso === 3 && (
              <button onClick={() => { setError(''); setPaso(4); }}
                disabled={!form.area_sown_ha || Number(form.area_sown_ha) <= 0}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-4 rounded-full text-[16px] font-black disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(26,92,56,0.25)]">
                Continuar
              </button>
            )}
            {paso === 4 && (
              <button onClick={guardar}
                disabled={!form.planting_date || loading}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-4 rounded-full text-[16px] font-black disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(26,92,56,0.25)] flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : '✓ Finalizar y guardar'}
              </button>
            )}
            
            <button onClick={saltar} className="w-full py-2 text-slate-400 hover:text-slate-600 text-[14px] font-bold transition-colors active:scale-95">
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}on>
        </div>
      </div>
    </div>
  );
}
