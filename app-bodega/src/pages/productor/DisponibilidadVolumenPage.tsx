import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import DisponibilidadStepper from '../../components/productor/DisponibilidadStepper';

const RANGOS_RAPIDOS = [
  { label: 'Esta semana',      dias: 7  },
  { label: 'Este mes',         dias: 30 },
  { label: 'Próximos 2 meses', dias: 60 },
  { label: 'Elegir fechas',    dias: null },
];

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().split('T')[0];
}

export default function DisponibilidadVolumenPage() {
  const navigate = useNavigate();
  const [volumen, setVolumen] = useState(20);
  const [rangoIdx, setRangoIdx] = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [custom, setCustom] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const selectRango = (idx: number) => {
    const r = RANGOS_RAPIDOS[idx];
    setRangoIdx(idx);
    if (r.dias === null) {
      setCustom(true);
      setFechaDesde(today);
      setFechaHasta('');
    } else {
      setCustom(false);
      setFechaDesde(today);
      setFechaHasta(addDays(new Date(), r.dias));
    }
  };

  const canContinue = volumen > 0 && fechaDesde && fechaHasta;

  const confirmar = () => {
    sessionStorage.setItem('disp_volumen', String(volumen));
    sessionStorage.setItem('disp_fecha_desde', fechaDesde);
    sessionStorage.setItem('disp_fecha_hasta', fechaHasta);
    navigate('/productor/disponibilidad/confirmar');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
      </div>
      <DisponibilidadStepper paso={3} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Volumen */}
        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">¿Cuántas toneladas?</h2>
        <div className="text-center mt-4 mb-2">
          <span className="text-5xl font-bold text-[#1A5C38]">{volumen}</span>
          <span className="text-xl text-gray-400 ml-1">ton</span>
        </div>
        <input type="range" min={1} max={200} step={1} value={volumen}
          onChange={e => setVolumen(Number(e.target.value))}
          className="w-full accent-[#1A5C38]" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 ton</span><span>200 ton</span>
        </div>

        {/* Fecha */}
        <h3 className="text-base font-bold text-gray-800 mt-8 mb-3">¿Cuándo estará disponible?</h3>
        <div className="grid grid-cols-2 gap-2">
          {RANGOS_RAPIDOS.map((r, i) => (
            <button key={i} onClick={() => selectRango(i)}
              className={`py-3 rounded-xl text-sm font-medium border-2 transition-all
                ${rangoIdx === i ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]' : 'border-gray-200 text-gray-600'}`}>
              {r.label}
            </button>
          ))}
        </div>

        {custom && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#1A5C38] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#1A5C38] focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 border-t">
        <button onClick={confirmar} disabled={!canContinue}
          className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-bold
                     disabled:opacity-40 active:scale-95 transition-transform">
          Continuar
        </button>
      </div>
    </div>
  );
}
