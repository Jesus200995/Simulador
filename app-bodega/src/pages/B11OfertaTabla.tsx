import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
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
    <div className="max-w-lg mx-auto">
      <PageHeader title="Oferta de Productores" subtitle="Datos agregados por municipio" />

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <select value={tipoMaiz} onChange={e => setTipoMaiz(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]">
          <option value="">Todos los tipos de maíz</option>
          {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['forrajero','Forrajero'],['criollo','Criollo']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}
        </select>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando…</p>
        ) : datos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin datos de oferta disponibles</p>
        ) : (
          <div className="space-y-2">
            {datos.map((d, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{d.municipio}</p>
                    <p className="text-xs text-gray-500">{d.estado}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {d.ventana_predominante === 'esta_semana' ? 'Esta semana' : '15 días'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Productores</p>
                    <p className="font-bold text-[#1A5C38]">{d.productores_disponibles}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Toneladas aprox.</p>
                    <p className="font-bold">{Number(d.toneladas_estimadas).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/senales/nueva?municipio=${d.municipio}`)}
                  className="w-full mt-3 text-xs font-semibold text-[#1A5C38] border border-[#1A5C38] rounded-lg py-1.5 hover:bg-green-50"
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
