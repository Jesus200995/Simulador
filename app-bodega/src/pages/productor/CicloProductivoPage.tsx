import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, CalendarCheck, Ruler, Check, AlertCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CICLOS = [
  { valor: 'PV', etiqueta: 'Primavera-Verano', desc: 'Siembra de marzo a junio' },
  { valor: 'OI', etiqueta: 'Otoño-Invierno', desc: 'Siembra de octubre a enero' },
  { valor: 'ANUAL', etiqueta: 'Ciclo Anual', desc: 'Riego continuo' },
];

const VARIEDADES = [
  'H-520', 'H-563', 'AS-9',  'Pioneer P4082W', 'DK-2038', 'Ceres T-810',
  'San Juan Mixtepec', 'Olotillo', 'Olotón', 'Jala', 'Chiapas', 'Criollo local',
];

export default function CicloProductivoPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [areaHaCalc, setAreaHaCalc] = useState<number | null>(null);

  const [cycleType, setCycleType] = useState('');
  const [cycleYear] = useState(new Date().getFullYear());
  const [hectareas, setHectareas] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState('');
  const [variedadNombre, setVariedadNombre] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/mi-up`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(up => {
        if (up?.area_ha_real) setAreaHaCalc(Number(up.area_ha_real));
        else if (up?.area_ha_calc) setAreaHaCalc(Number(up.area_ha_calc));
      })
      .catch(() => {});
  }, []);

  const canAdvance = () => {
    if (paso === 1) return !!cycleType;
    if (paso === 2) return hectareas !== '' && Number(hectareas) > 0;
    if (paso === 3) return !!fechaSiembra;
    if (paso === 4) return !!variedadNombre;
    return false;
  };

  const enviarCiclo = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('simac_token');
      const res = await fetch(`${BASE}/productor/ciclo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cycle_year: cycleYear,
          cycle_type: cycleType,
          hectareas_sembradas: Number(hectareas),
          fecha_siembra: fechaSiembra,
          variedad_nombre: variedadNombre,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      localStorage.removeItem('ciclo_pendiente');
      navigate('/productor', { state: { cicloGuardado: true } });
    } catch {
      setError('Error de conexion.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-zinc-50 ring-1 ring-zinc-200 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-[#1A5C38] focus:outline-none transition-shadow';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
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

          {paso === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Tipo de ciclo</h2>
              <p className="text-sm text-zinc-500">Ciclo {cycleYear}</p>
              {CICLOS.map(c => (
                <button key={c.valor} onClick={() => setCycleType(c.valor)}
                  className={`w-full ring-1 rounded-2xl py-5 px-5 flex items-center gap-4 text-left transition-all duration-200
                    ${cycleType === c.valor ? 'ring-2 ring-[#1A5C38] bg-emerald-50' : 'ring-zinc-200 bg-white hover:bg-zinc-50'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${cycleType === c.valor ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                    <Wheat size={24} className={cycleType === c.valor ? 'text-[#1A5C38]' : 'text-zinc-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-zinc-800">{c.etiqueta}</p>
                    <p className="text-sm text-zinc-500">{c.desc}</p>
                  </div>
                  {cycleType === c.valor && <Check size={20} className="text-[#1A5C38] shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Hectareas a sembrar</h2>
              <p className="text-sm text-zinc-500">
                {areaHaCalc
                  ? `Tu parcela registrada tiene ${areaHaCalc} ha. Puedes ajustar.`
                  : 'Escribe las hectareas que planeas sembrar este ciclo.'}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0.1" max="9999" step="0.1"
                  value={hectareas}
                  onChange={e => setHectareas(e.target.value)}
                  placeholder={areaHaCalc ? String(areaHaCalc) : '0.0'}
                  className={`${inputCls} text-2xl font-bold text-center flex-1`}
                />
                <span className="text-xl font-bold text-zinc-500 shrink-0">ha</span>
              </div>
              {areaHaCalc && !hectareas && (
                <button onClick={() => setHectareas(String(areaHaCalc))}
                  className="w-full text-[#1A5C38] text-sm font-semibold border-2 border-[#1A5C38] py-3 rounded-2xl hover:bg-emerald-50 transition-colors">
                  Usar area de mi parcela ({areaHaCalc} ha)
                </button>
              )}
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Fecha estimada de siembra</h2>
              <p className="text-sm text-zinc-500">Cuando planeas comenzar a sembrar</p>
              <div className="flex items-center gap-3 bg-white ring-1 ring-zinc-200 rounded-2xl px-4 py-4">
                <CalendarCheck size={20} className="text-[#1A5C38] shrink-0" />
                <input
                  type="date" value={fechaSiembra}
                  onChange={e => setFechaSiembra(e.target.value)}
                  className="flex-1 text-base text-zinc-800 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          )}

          {paso === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Variedad de maiz</h2>
              <p className="text-sm text-zinc-500">Selecciona o escribe el nombre de la variedad</p>
              <input
                type="text" value={variedadNombre}
                onChange={e => setVariedadNombre(e.target.value)}
                placeholder="Nombre de la variedad..."
                className={inputCls}
              />
              <div className="space-y-2">
                {VARIEDADES.filter(v => !variedadNombre || v.toLowerCase().includes(variedadNombre.toLowerCase())).slice(0, 6).map(v => (
                  <button key={v} onClick={() => setVariedadNombre(v)}
                    className={`w-full text-left px-4 py-3 rounded-xl ring-1 text-sm transition-all duration-200 flex items-center gap-2
                      ${variedadNombre === v ? 'ring-2 ring-[#1A5C38] bg-emerald-50 text-emerald-800 font-medium' : 'ring-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'}`}>
                    <Ruler size={14} className={variedadNombre === v ? 'text-[#1A5C38]' : 'text-zinc-300'} />
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-8 py-4 border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto">
          {paso < 4 ? (
            <button onClick={() => { setError(''); setPaso(paso + 1); }}
              disabled={!canAdvance()}
              className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                         disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
              Continuar
            </button>
          ) : (
            <button onClick={enviarCiclo}
              disabled={!canAdvance() || loading}
              className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                         disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
              {loading ? 'Guardando...' : 'Guardar ciclo productivo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
