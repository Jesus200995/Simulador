import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Users, Wheat, Signal, Heart, MapPin } from 'lucide-react';

export default function B11OfertaTabla() {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoMaiz, setTipoMaiz] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [bodegas, setBodegas] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function cargar(silent = false) {
    if (!silent) setLoading(true);
    try {
      const r: any = await api.oferta.municipios(tipoMaiz ? { tipo_maiz: tipoMaiz } : {});
      // Handle both old format (array) and new format ({data, fallback, mensaje})
      if (Array.isArray(r)) {
        setDatos(r);
        setMensaje('');
      } else {
        setDatos(r.data || []);
        setMensaje(r.mensaje || '');
      }
    } catch { /* ignore */ } finally { if (!silent) setLoading(false); }
  }

  useEffect(() => {
    cargar();
    api.bodeguero.misBodegas().then((r: any) => setBodegas(Array.isArray(r) ? r : [])).catch(() => {});
  }, [tipoMaiz]);

  // F-05: Polling every 30s to refresh interest counts
  useEffect(() => {
    pollRef.current = setInterval(() => cargar(true), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tipoMaiz]);

  async function marcarInteres(municipio: string) {
    if (bodegas.length === 0) {
      toast('No tienes bodegas asociadas', 'error');
      return;
    }
    try {
      await api.oferta.interesMunicipio(municipio, {
        bodega_id: bodegas[0].id,
        tipo_maiz: tipoMaiz || undefined,
      });
      toast(`Productores en ${municipio} notificados de tu interés`, 'success');
    } catch (err: any) {
      toast(err.message || 'Error al enviar interés', 'error');
    }
  }

  return (
    <div className="w-full">
      {/* Banner full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-0.5">Módulo</p>
          <h1 className="text-[22px] sm:text-[26px] font-black text-white leading-tight">Oferta de Productores</h1>
          <p className="text-green-200/70 text-[13px] mt-0.5">Datos agregados por municipio</p>
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
            {[['blanco','Maíz Blanco'],['amarillo','Maíz Amarillo'],['criollo','Criollo / Local']].map(([c,l]) => (
              <option key={c} value={c}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {/* Fallback message */}
        {mensaje && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-[13px] text-amber-700">{mensaje}</p>
          </div>
        )}

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
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-[#1A5C38]/[0.08] text-[#1A5C38] text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                      {d.ventana_predominante === 'esta_semana' ? 'Esta semana' : d.ventana_predominante === '15_dias' ? '15 días' : d.ventana_predominante || 'Esta semana'}
                    </span>
                    {Number(d.distancia_km) > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <MapPin size={9} />{d.distancia_km} km
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${
                    Number(d.productores_disponibles) >= 10 ? 'bg-green-100' :
                    Number(d.productores_disponibles) >= 5 ? 'bg-yellow-50' : 'bg-[#F2F2F7]'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Productores</p>
                    </div>
                    <p className={`text-[22px] font-black ${
                      Number(d.productores_disponibles) >= 10 ? 'text-green-700' :
                      Number(d.productores_disponibles) >= 5 ? 'text-amber-700' : 'text-[#1A5C38]'
                    }`}>{d.productores_disponibles}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${
                    Number(d.toneladas_estimadas) >= 500 ? 'bg-green-100' :
                    Number(d.toneladas_estimadas) >= 100 ? 'bg-yellow-50' : 'bg-[#F2F2F7]'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wheat size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Toneladas</p>
                    </div>
                    <p className={`text-[22px] font-black ${
                      Number(d.toneladas_estimadas) >= 500 ? 'text-green-700' :
                      Number(d.toneladas_estimadas) >= 100 ? 'text-amber-700' : 'text-gray-800'
                    }`}>{Number(d.toneladas_estimadas).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/requerimientos?municipio=${encodeURIComponent(d.municipio)}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1A5C38]/[0.08] text-[#1A5C38] rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    <Signal size={14} /> Requerimiento
                  </button>
                  <button
                    onClick={() => marcarInteres(d.municipio)}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 rounded-xl px-4 py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    <Heart size={14} /> Me interesa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
