import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function B11OfertaTabla() {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoMaiz, setTipoMaiz] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargar();
  }, [tipoMaiz]);

  async function cargar() {
    setLoading(true);
    try {
      const r: any = await api.oferta.municipios(tipoMaiz ? { tipo_maiz: tipoMaiz } : {});
      setDatos(r);
    } catch (_) {} finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Header interno */}
      <div className="bg-gradient-to-r from-[#1A5C38] to-[#2d7a52] px-4 sm:px-6 pt-6 pb-7 text-white">
        <h1 className="text-[22px] font-bold">Oferta de Productores</h1>
        <p className="text-green-200 text-[14px] mt-0.5">Datos agregados por municipio</p>
      </div>

      {/* Filtro sticky */}
      <div className="sticky top-14 sm:top-16 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3">
        <select
          value={tipoMaiz}
          onChange={e => setTipoMaiz(e.target.value)}
          className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
        >
          <option value="">Todos los tipos de maíz</option>
          {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Forrajero'],['criollo','Criollo']].map(([c,l]) => (
            <option key={c} value={c}>{l}</option>
          ))}
        </select>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {loading ? (
          <p className="text-center text-gray-400 text-[14px] py-10">Cargando…</p>
        ) : datos.length === 0 ? (
          <p className="text-center text-gray-400 text-[14px] py-10">Sin datos de oferta disponibles</p>
        ) : (
          <div className="space-y-3">
            {datos.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[17px] text-gray-900">{d.municipio}</p>
                    <p className="text-[13px] text-gray-500">{d.estado}</p>
                  </div>
                  <span className="bg-[#1A5C38]/10 text-[#1A5C38] text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                    {d.ventana_predominante === 'esta_semana' ? 'Esta semana' : '15 días'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-[12px] text-gray-400 mb-0.5">Productores</p>
                    <p className="text-[20px] font-bold text-[#1A5C38]">{d.productores_disponibles}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400 mb-0.5">Toneladas aprox.</p>
                    <p className="text-[20px] font-bold text-gray-800">{Number(d.toneladas_estimadas).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/senales/nueva?municipio=${d.municipio}`)}
                  className="w-full bg-[#F2F2F7] text-[#1A5C38] rounded-xl py-2.5 text-[14px] font-semibold active:opacity-70 transition-opacity"
                >
                  Publicar señal para este municipio
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
