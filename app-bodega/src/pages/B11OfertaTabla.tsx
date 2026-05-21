import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Users, Wheat, Signal } from 'lucide-react';

export default function B11OfertaTabla() {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoMaiz, setTipoMaiz] = useState('');
  const navigate = useNavigate();

  async function cargar() {
    setLoading(true);
    try {
      const r: any = await api.oferta.municipios(tipoMaiz ? { tipo_maiz: tipoMaiz } : {});
      setDatos(r);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => {
    cargar();
  }, [tipoMaiz]);

  return (
    <div className="w-full">
      {/* Banner full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <p className="text-[13px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Módulo</p>
          <h1 className="text-[26px] sm:text-[30px] font-black text-white leading-tight">Oferta de Productores</h1>
          <p className="text-green-200/70 text-[14px] mt-1">Datos agregados por municipio</p>
        </div>
      </div>

      {/* Filtro sticky */}
      <div className="sticky top-[60px] z-10 bg-white/95 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <select
            value={tipoMaiz}
            onChange={e => setTipoMaiz(e.target.value)}
            className="w-full sm:w-60 bg-[#F2F2F7] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0"
          >
            <option value="">Todos los tipos de maíz</option>
            {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Forrajero'],['criollo','Criollo']].map(([c,l]) => (
              <option key={c} value={c}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : datos.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
            <Wheat size={40} className="text-gray-200" />
            <p className="text-[14px]">Sin datos de oferta disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {datos.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[16px] text-gray-900">{d.municipio}</p>
                    <p className="text-[12px] text-gray-400">{d.estado}</p>
                  </div>
                  <span className="bg-[#1A5C38]/[0.08] text-[#1A5C38] text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                    {d.ventana_predominante === 'esta_semana' ? 'Esta semana' : '15 días'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F2F2F7] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Productores</p>
                    </div>
                    <p className="text-[22px] font-black text-[#1A5C38]">{d.productores_disponibles}</p>
                  </div>
                  <div className="bg-[#F2F2F7] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wheat size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Toneladas</p>
                    </div>
                    <p className="text-[22px] font-black text-gray-800">{Number(d.toneladas_estimadas).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/senales/nueva?municipio=${d.municipio}`)}
                  className="flex items-center justify-center gap-2 bg-[#1A5C38]/[0.08] text-[#1A5C38] rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                >
                  <Signal size={14} /> Publicar señal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
