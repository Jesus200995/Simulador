import { useNavigate } from 'react-router-dom';
import { Landmark, ShieldCheck, ChevronRight, Warehouse } from 'lucide-react';

export default function IncentivosPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F2F2F7]">
      <div className="w-full bg-white/90 backdrop-blur-sm border-b border-black/[0.06] px-4 sm:px-6 pt-3.5 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Apoyos disponibles</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Apoyos del gobierno para productores</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-5 pb-6">

        <button onClick={() => navigate('/productor/ventanillas?tipo=incentivo')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm ring-1 ring-zinc-100
                     flex items-center gap-4 mb-3 text-left active:scale-[0.98] hover:ring-zinc-200 transition-all duration-200">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <Landmark size={26} className="text-[#1A5C38]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-800">Incentivos</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              Apoyos economicos directos para tu produccion de maiz.
              Consulta los programas disponibles en tu region.
            </p>
          </div>
          <ChevronRight size={18} className="text-zinc-400 shrink-0" />
        </button>

        <button onClick={() => navigate('/productor/ventanillas?tipo=cobertura')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm ring-1 ring-zinc-100
                     flex items-center gap-4 mb-6 text-left active:scale-[0.98] hover:ring-zinc-200 transition-all duration-200">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={26} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-800">Coberturas</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              Proteccion contra riesgos climaticos y de precio para tu ciclo productivo.
            </p>
          </div>
          <ChevronRight size={18} className="text-zinc-400 shrink-0" />
        </button>

        <div className="border-t border-zinc-200 pt-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-medium">
            Servicios comerciales de bodega
          </p>
          <div className="bg-white ring-1 ring-zinc-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Warehouse size={20} className="text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-700 font-medium">
                  Los servicios de secado, limpieza y almacenamiento tienen un costo.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  No son apoyos del gobierno. Los cobra la bodega directamente.
                </p>
                <button onClick={() => navigate('/productor/mapa')}
                  className="mt-3 text-[#1A5C38] text-sm font-semibold flex items-center gap-1 hover:underline">
                  Ver bodegas con servicios <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
