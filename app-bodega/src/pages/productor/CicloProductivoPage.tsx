import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Wheat, Check, Leaf, Calendar, MapPin,
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

  const [ciclosExistentes, setCiclosExistentes] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargandoCiclos, setCargandoCiclos] = useState(true);

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
        } else {
          // Sin UP no hay ciclos que listar — mostrar el formulario directamente
          setMostrarFormulario(true);
          setCargandoCiclos(false);
        }
      }).catch(() => { setMostrarFormulario(true); setCargandoCiclos(false); });
  }, []);

  // Cargar ciclos existentes cuando ya tengamos la UP
  useEffect(() => {
    if (!upId) return;
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/ups/${upId}/cycles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : (data.cycles || []);
        setCiclosExistentes(lista);
        // Si no hay ciclos, mostrar formulario directamente
        if (lista.length === 0) setMostrarFormulario(true);
      })
      .catch(() => setMostrarFormulario(true))
      .finally(() => setCargandoCiclos(false));
  }, [upId]);

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

  const inputCls = 'w-full bg-slate-50/50 border border-slate-200 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:border-[#1A5C38] focus:bg-white focus:ring-2 focus:ring-[#1A5C38]/10 transition-all outline-none';

  const cycleTypeLabel = (t: string) =>
    t === 'PV' ? 'Primavera-Verano' : t === 'OI' ? 'Otoño-Invierno' : t === 'ANUAL' ? 'Ciclo anual' : t;

  // ── Loader mientras se consultan los ciclos existentes ──
  if (cargandoCiclos) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[#f4f5f7] gap-3">
        <div className="w-8 h-8 border-[3px] border-[#1A5C38]/20 border-t-[#1A5C38] rounded-full animate-spin" />
        <p className="text-[13px] font-semibold text-slate-400">Cargando tus ciclos…</p>
      </div>
    );
  }

  // ── Lista de ciclos existentes + botón para agregar uno nuevo ──
  if (!mostrarFormulario && ciclosExistentes.length > 0) {
    return (
      <div className="flex flex-col font-sans w-full min-h-screen bg-[#f4f5f7] pb-[40px]">
        <div className="w-full bg-gradient-to-b from-[#1A5C38] to-[#124227] rounded-b-[28px] shadow-[0_8px_30px_rgba(26,92,56,0.15)] relative z-10 overflow-hidden">
          <div className="max-w-[700px] mx-auto px-4 sm:px-6 pt-5 pb-7 relative z-20">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => navigate('/productor')}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md active:scale-95">
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <div className="text-[11px] font-bold text-emerald-100/90 uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Mis ciclos
              </div>
              <div className="w-9" />
            </div>
            <h1 className="text-[20px] font-black text-white tracking-tight">Ciclos productivos</h1>
            <p className="text-[13px] text-emerald-100/70 font-medium mt-0.5">Tu siembra registrada en SIMAC</p>
          </div>
        </div>

        <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 -mt-3 relative z-20">
          <div className="max-w-[500px] mx-auto">
            <h3 className="text-[14px] font-bold text-slate-700 mb-3 mt-2">
              Ciclos registrados
            </h3>
            <div className="space-y-3 mb-4">
              {ciclosExistentes.map(ciclo => {
                const crop = ciclo.crops?.[0] || {};
                const variedad = crop.variety_other || crop.variety_id || 'Sin variedad';
                const superficie = crop.area_sown_ha ?? null;
                const estado = ciclo.estado_ciclo || 'activo';
                return (
                  <div
                    key={ciclo.cycle_id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-[14px]">
                        {cycleTypeLabel(ciclo.cycle_type)} {ciclo.cycle_year}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                        {variedad} · {superficie != null ? `${superficie} ha` : '—'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                      estado === 'activo'
                        ? 'bg-green-100 text-green-700'
                        : estado === 'cosechado'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {estado}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setPaso(1); setError(''); setMostrarFormulario(true); }}
              className="w-full py-3 border-2 border-dashed border-[#1A5C38] text-[#1A5C38] rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl leading-none">+</span>
              Agregar otro ciclo productivo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans w-full min-h-screen bg-[#f4f5f7] pb-[100px]">
      
      {/* Header Verde Premium */}
      <div className="w-full bg-gradient-to-b from-[#1A5C38] to-[#124227] rounded-b-[28px] shadow-[0_8px_30px_rgba(26,92,56,0.15)] relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 pt-5 pb-7 relative z-20">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => {
                if (paso > 1) { setPaso(paso - 1); return; }
                // Si ya hay ciclos registrados, volver a la lista; si no, al inicio
                if (ciclosExistentes.length > 0) setMostrarFormulario(false);
                else navigate('/productor');
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-md active:scale-95">
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="text-[11px] font-bold text-emerald-100/90 uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm">
              Paso {paso} de 4
            </div>
            <div className="w-9" />
          </div>
          
          <div className="w-full flex justify-center gap-2 px-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={`h-1.5 flex-1 max-w-[80px] rounded-full transition-all duration-500 shadow-inner
                ${n < paso ? 'bg-emerald-400' : n === paso ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 -mt-4 relative z-20">
        <div className="max-w-[500px] mx-auto">

          {error && (
            <div className="mb-4 p-3.5 bg-red-50/90 backdrop-blur-sm border border-red-100 rounded-[16px] text-red-700 text-[13px] font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Tarjeta Contenedor */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-5 sm:p-7 shadow-[0_8px_25px_rgb(0,0,0,0.03)] border border-white transition-all duration-300">
            
            {/* PASO 1 — Tipo de ciclo + año */}
            {paso === 1 && (
              <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {esPrimerLogin && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-[14px] p-3.5 mb-2 flex gap-3 items-start">
                    <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full shrink-0">
                      <Play size={12} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-indigo-900 text-[13px] font-bold tracking-tight">Un último paso</p>
                      <p className="text-indigo-700/80 text-[12px] font-medium mt-0.5 leading-relaxed">
                        Registra la información de tu siembra actual para las bodegas.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="text-center sm:text-left mb-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1A5C38] mb-4 mx-auto sm:mx-0 shadow-sm border border-emerald-100/50">
                    <Calendar size={22} strokeWidth={2} />
                  </div>
                  <h2 className="text-[20px] sm:text-[22px] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                    Tu ciclo productivo
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium">¿Qué ciclo estás sembrando actualmente?</p>
                </div>

                <div className="space-y-2.5">
                  {CICLOS.map(c => (
                    <button key={c.valor} onClick={() => setForm(f => ({...f, cycle_type: c.valor}))}
                      className={`w-full border-2 rounded-[16px] py-3 px-4 flex items-center gap-3.5 text-left transition-all duration-200 active:scale-[0.98]
                        ${form.cycle_type === c.valor 
                          ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-sm shadow-[#1A5C38]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] text-white shadow-md shadow-[#1A5C38]/30 scale-105' : 'bg-slate-100 text-slate-400'}`}>
                        <Wheat size={18} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-black tracking-tight ${form.cycle_type === c.valor ? 'text-[#1A5C38]' : 'text-slate-800'}`}>
                          {c.label}
                        </p>
                        <p className={`text-[12px] font-medium mt-0.5 ${form.cycle_type === c.valor ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                          {c.desc}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${form.cycle_type === c.valor ? 'bg-[#1A5C38] border-[#1A5C38] scale-110' : 'border-slate-200'}`}>
                        {form.cycle_type === c.valor && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[14px] font-bold text-slate-800 mb-2.5">¿En qué año?</p>
                  <div className="flex gap-2.5">
                    {[AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1].map(y => (
                      <button key={y}
                        onClick={() => setForm(f => ({...f, cycle_year: y}))}
                        className={`flex-1 py-2.5 rounded-[12px] border-2 font-black text-[14px] transition-all active:scale-95
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
              <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 mx-auto sm:mx-0 shadow-sm border border-amber-100/50">
                    <Leaf size={22} strokeWidth={2} />
                  </div>
                  <h2 className="text-[20px] sm:text-[22px] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                    Variedad sembrada
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium">Selecciona el tipo de maíz que produces.</p>
                </div>
                
                {!tipoMaiz ? (
                  <div className="space-y-2.5">
                    {['blanco', 'amarillo', 'criollo'].map((t, idx) => (
                      <button key={t} onClick={() => setTipoMaiz(t as any)}
                        className="w-full rounded-[16px] p-4 border-2 border-slate-100 bg-white hover:border-[#1A5C38]/30 hover:bg-emerald-50/30 text-left transition-all duration-200 active:scale-[0.98] group flex justify-between items-center shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 group-hover:text-[#1A5C38] group-hover:bg-[#1A5C38]/10 bg-slate-50 transition-colors`}>
                            {idx === 0 ? <Wheat size={20} /> : idx === 1 ? <Sun size={20} /> : <Sprout size={20} />}
                          </div>
                          <p className="text-[15px] font-black text-slate-800 capitalize group-hover:text-[#1A5C38] transition-colors tracking-tight">
                            Maíz {t}
                          </p>
                        </div>
                        <ChevronLeft size={18} className="text-slate-300 rotate-180 group-hover:text-[#1A5C38] group-hover:translate-x-1 transition-all" strokeWidth={3} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4 bg-slate-50/80 p-2.5 rounded-[14px] border border-slate-100 shadow-sm">
                      <p className="font-black text-slate-800 capitalize text-[14px] flex items-center gap-2 px-2">
                        {tipoMaiz === 'blanco' ? <Wheat size={18} className="text-[#1A5C38]"/> : tipoMaiz === 'amarillo' ? <Sun size={18} className="text-amber-500"/> : <Sprout size={18} className="text-emerald-500"/>} 
                        Maíz {tipoMaiz}
                      </p>
                      <button onClick={() => { setTipoMaiz(''); setForm(f => ({...f, variety_id: '', variety_other: ''})); setEsCriollo(false); }} 
                        className="text-[#1A5C38] text-[12px] font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
                        Cambiar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mb-4 max-h-[240px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                      {variedades.map(v => (
                        <button key={v.code}
                          onClick={() => {
                            setForm(f => ({...f, variety_id: v.code, variety_other: ''}));
                            setEsCriollo(v.label.toLowerCase().includes('criollo') || v.code === 'MC_CRIOLLO');
                          }}
                          className={`w-full rounded-[14px] p-3.5 border-2 text-left transition-all active:scale-[0.98] flex items-center gap-3
                            ${form.variety_id === v.code
                              ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-sm'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                            ${form.variety_id === v.code ? 'bg-[#1A5C38] border-[#1A5C38]' : 'border-slate-300'}`}>
                            {form.variety_id === v.code && <Check size={10} className="text-white" strokeWidth={4} />}
                          </div>
                          <span className={`text-[13px] font-bold ${form.variety_id === v.code ? 'text-[#1A5C38]' : 'text-slate-700'}`}>
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {esCriollo && (
                      <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50/80 rounded-[16px] border border-slate-100 shadow-sm">
                        <label className="block text-[13px] font-bold text-slate-800 mb-2">
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
              <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 mx-auto sm:mx-0 shadow-sm border border-blue-100/50">
                    <MapPin size={22} strokeWidth={2} />
                  </div>
                  <h2 className="text-[20px] sm:text-[22px] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                    Superficie y cálculo
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium">Estima las dimensiones de tu siembra actual.</p>
                </div>

                {areaHaCalc && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[14px] p-3.5 flex gap-2.5 shadow-sm items-start">
                    <Ruler size={18} className="text-blue-600 shrink-0" />
                    <p className="text-[12px] text-blue-900 font-medium leading-relaxed">
                      Tu predio registrado mide <strong className="font-bold">{areaHaCalc} hectáreas</strong>. 
                      La siembra debe ser igual o menor a esta cantidad.
                    </p>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-[16px] shadow-sm">
                    <label className="block text-[14px] font-bold text-slate-800 mb-2.5 text-center sm:text-left">
                      ¿Hectáreas a sembrar este ciclo?
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input type="number" min="0.1" step="0.1" max={areaHaCalc ?? 9999}
                        value={form.area_sown_ha}
                        onChange={e => setForm(f => ({...f, area_sown_ha: e.target.value}))}
                        placeholder={areaHaCalc ? String(areaHaCalc) : 'Ej: 5.5'}
                        className={`${inputCls} text-[20px] font-black text-center flex-1 py-3 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-[14px] px-2">ha</span>
                    </div>
                    {areaHaCalc && !form.area_sown_ha && (
                      <button onClick={() => setForm(f => ({...f, area_sown_ha: String(areaHaCalc)}))}
                        className="mt-3 w-full text-blue-700 text-[13px] font-bold border border-blue-200 bg-white py-2.5 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm active:scale-95">
                        Usar el total ({areaHaCalc} ha)
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-[16px] shadow-sm">
                    <label className="block text-[14px] font-bold text-slate-800 mb-1 text-center sm:text-left">
                      Rendimiento esperado
                    </label>
                    <p className="text-[12px] text-slate-500 mb-3 font-medium text-center sm:text-left">Por hectárea (ton/ha)</p>
                    <div className="flex items-center gap-2.5">
                      <input type="number" min="0.1" max="30" step="0.1"
                        value={form.yield_expected}
                        onChange={e => setForm(f => ({...f, yield_expected: e.target.value}))}
                        placeholder="Ej: 8"
                        className={`${inputCls} text-[20px] font-black text-center flex-1 py-3 shadow-inner`}
                      />
                      <span className="text-slate-400 font-bold text-[14px] px-2 leading-tight">ton<br/><span className="text-[11px]">/ ha</span></span>
                    </div>
                  </div>
                </div>

                {form.area_sown_ha && form.yield_expected && (
                  <div className="bg-gradient-to-br from-[#1A5C38] to-[#124227] rounded-[20px] p-5 text-center shadow-[0_6px_20px_rgba(26,92,56,0.3)] animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <p className="text-[11px] text-emerald-200 font-bold uppercase tracking-widest relative z-10">Estimación Total</p>
                    <p className="text-[32px] font-black text-white mt-1 leading-none tracking-tight relative z-10">
                      {(Number(form.area_sown_ha) * Number(form.yield_expected)).toFixed(1)} <span className="text-lg text-emerald-200 font-bold tracking-normal">ton</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4 — Fechas + destino */}
            {paso === 4 && (
              <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center sm:text-left mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-4 mx-auto sm:mx-0 shadow-sm border border-indigo-100/50">
                    <Clock size={22} strokeWidth={2} />
                  </div>
                  <h2 className="text-[20px] sm:text-[22px] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                    Fechas y destino
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium">Confirma los tiempos de tu cosecha.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-50/80 rounded-[16px] p-4 border border-slate-100 shadow-sm">
                    <label className="text-[14px] font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400"/> ¿Cuándo vas a sembrar?
                    </label>
                    <input type="date" value={form.planting_date}
                      onChange={e => setForm(f => ({...f, planting_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700 py-3`}
                    />
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-[16px] p-4 border border-slate-100 shadow-sm">
                    <label className="text-[14px] font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                      <Clock size={16} className="text-slate-400"/> ¿Cuándo esperas cosechar? <span className="text-slate-400 font-medium ml-1 text-[11px]">(opcional)</span>
                    </label>
                    <input type="date" value={form.estimated_harvest_date}
                      onChange={e => setForm(f => ({...f, estimated_harvest_date: e.target.value}))}
                      className={`${inputCls} font-bold text-slate-700 py-3`}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-[14px] font-bold text-slate-800 mb-3 text-center sm:text-left">
                      ¿Destino principal de la cosecha? <span className="text-slate-400 font-medium ml-1 text-[11px]">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      {DESTINOS.map((d: any) => (
                        <button key={d.valor}
                          onClick={() => setForm(f => ({...f, destination: f.destination === d.valor ? '' : d.valor}))}
                          className={`rounded-[16px] p-3.5 border-2 text-left transition-all active:scale-95 flex flex-col gap-2.5 items-center text-center
                            ${form.destination === d.valor
                              ? 'border-[#1A5C38] bg-[#1A5C38]/5 shadow-sm'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                          <d.icon size={22} className={form.destination === d.valor ? 'text-[#1A5C38]' : 'text-slate-400'} strokeWidth={2} />
                          <span className={`text-[12px] font-black tracking-tight ${form.destination === d.valor ? 'text-[#1A5C38]' : 'text-slate-600'}`}>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
        <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 py-3.5">
          <div className="max-w-[500px] mx-auto space-y-2.5">
            {paso === 1 && (
              <button onClick={() => { setError(''); setPaso(2); }}
                disabled={!form.cycle_type}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-3.5 rounded-full text-[15px] font-bold disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_6px_15px_rgba(26,92,56,0.2)]">
                Continuar
              </button>
            )}
            {paso === 2 && (
              <button onClick={() => { setError(''); setPaso(3); }}
                disabled={!form.variety_id}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-3.5 rounded-full text-[15px] font-bold disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_6px_15px_rgba(26,92,56,0.2)]">
                Continuar
              </button>
            )}
            {paso === 3 && (
              <button onClick={() => { setError(''); setPaso(4); }}
                disabled={!form.area_sown_ha || Number(form.area_sown_ha) <= 0}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-3.5 rounded-full text-[15px] font-bold disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_6px_15px_rgba(26,92,56,0.2)]">
                Continuar
              </button>
            )}
            {paso === 4 && (
              <button onClick={guardar}
                disabled={!form.planting_date || loading}
                className="w-full bg-[#1A5C38] hover:bg-[#124227] text-white py-3.5 rounded-full text-[15px] font-bold disabled:opacity-40 disabled:scale-100 transition-all active:scale-[0.98] shadow-[0_6px_15px_rgba(26,92,56,0.2)] flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : '✓ Finalizar y guardar'}
              </button>
            )}
            
            <button onClick={saltar} className="w-full py-1.5 text-slate-400 hover:text-slate-600 text-[13px] font-bold transition-colors active:scale-95">
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
