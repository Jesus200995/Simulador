import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function IncentivosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-6 pb-24">
      <div className="flex items-center mb-5 -mx-4 px-4 pb-3 border-b bg-white -mt-6 pt-3">
        <button onClick={() => navigate('/productor')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">Apoyos disponibles</h1>
        <div className="w-8" />
      </div>

      <p className="text-gray-500 text-sm mb-6">Apoyos del gobierno para productores</p>

      {/* Incentivos */}
      <button onClick={() => navigate('/productor/ventanillas?tipo=incentivo')}
        className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                   flex items-center gap-4 mb-3 text-left active:scale-[0.98] transition-transform">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
          🏛
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">Incentivos</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Apoyos económicos directos para tu producción de maíz.
            Consulta los programas disponibles en tu región.
          </p>
        </div>
        <span className="text-gray-400 ml-auto text-xl">›</span>
      </button>

      {/* Coberturas */}
      <button onClick={() => navigate('/productor/ventanillas?tipo=cobertura')}
        className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                   flex items-center gap-4 mb-6 text-left active:scale-[0.98] transition-transform">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
          🛡
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">Coberturas</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Protección contra riesgos climáticos y de precio para tu ciclo productivo.
          </p>
        </div>
        <span className="text-gray-400 ml-auto text-xl">›</span>
      </button>

      {/* Separador — servicios comerciales */}
      <div className="border-t border-gray-200 pt-5">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">
          Servicios comerciales de bodega
        </p>
        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700 font-medium">
            Los servicios de secado, limpieza y almacenamiento tienen un costo.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            No son apoyos del gobierno. Los cobra la bodega directamente.
          </p>
          <button onClick={() => navigate('/productor/mapa')}
            className="mt-3 text-[#1A5C38] text-sm font-semibold">
            Ver bodegas con servicios →
          </button>
        </div>
      </div>
    </div>
  );
}
