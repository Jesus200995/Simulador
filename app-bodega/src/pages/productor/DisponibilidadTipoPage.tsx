import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import DisponibilidadStepper from '../../components/productor/DisponibilidadStepper';

const TIPOS = [
  { valor: 'blanco',   etiqueta: 'Maíz Blanco',   emoji: '⬜', descripcion: 'H-40, H-59, H-564C y otros' },
  { valor: 'amarillo', etiqueta: 'Maíz Amarillo',  emoji: '🟡', descripcion: 'H-384A, H-385, Búho y otros' },
  { valor: 'criollo',  etiqueta: 'Maíz Criollo',   emoji: '🌽', descripcion: 'Criollo local o nativo' },
];

export default function DisponibilidadTipoPage() {
  const navigate = useNavigate();

  const seleccionar = (tipo: string) => {
    sessionStorage.setItem('disp_tipo', tipo);
    navigate('/productor/disponibilidad/variedad');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => navigate('/productor')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
      </div>
      <DisponibilidadStepper paso={1} />
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
          ¿Qué tipo de maíz tienes?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">Toca una opción para continuar</p>
        <div className="space-y-3">
          {TIPOS.map(t => (
            <button key={t.valor} onClick={() => seleccionar(t.valor)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl
                         py-5 px-5 flex items-center gap-4 text-left
                         active:border-[#1A5C38] active:bg-green-50 transition-all">
              <span className="text-4xl">{t.emoji}</span>
              <div>
                <p className="text-lg font-semibold text-gray-800">{t.etiqueta}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
