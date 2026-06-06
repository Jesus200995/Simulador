import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Wheat, Signal, Trash2, Heart, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { formatNum } from '../utils/format';
import { useToast } from '../components/Toast';

const tipoLabel: Record<string, string> = {
  blanco: 'Maíz Blanco', amarillo: 'Maíz Amarillo', criollo: 'Criollo / Local',
};

export default function B30MisInteresesOferta() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const cargar = useCallback(() => {
    setLoading(true);
    api.oferta.misIntereses()
      .then((r: any) => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const quitar = async (id: number, municipio: string) => {
    const ok = await confirm(`¿Quitar "${municipio}" de tus intereses?`);
    if (!ok) return;
    setEliminando(id);
    try {
      await api.oferta.quitarInteres(id);
      setItems(prev => prev.filter(x => x.id !== id));
      toast('Interés eliminado', 'success');
    } catch {
      toast('No se pudo eliminar', 'error');
    } finally {
      setEliminando(null);
    }
  };

  const fechaFmt = (s: string) =>
    s ? new Date(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_4px_20px_rgba(26,92,56,0.25)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-5">
          <button onClick={() => navigate('/oferta')}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Oferta de productores
          </button>
          <h1 className="text-[22px] sm:text-[26px] font-black text-white leading-tight flex items-center gap-2">
            <Heart size={22} className="fill-white/90 text-white/90" /> Mis intereses
          </h1>
          <p className="text-green-200/70 text-[13px] mt-0.5">
            {loading ? 'Cargando…' : `${items.length} municipio${items.length !== 1 ? 's' : ''} que te interesa${items.length !== 1 ? 'n' : ''}`}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Heart size={32} className="text-rose-300" />
            </div>
            <p className="font-semibold text-[16px] text-gray-700">Aún no marcas intereses</p>
            <p className="text-[14px] text-gray-400 max-w-xs">
              En “Oferta de productores” toca <span className="font-semibold text-rose-500">Me interesa</span> en
              los municipios que te interesen para guardarlos aquí.
            </p>
            <button onClick={() => navigate('/oferta')}
              className="mt-2 bg-[#1A5C38] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold active:opacity-80">
              Ver oferta de productores →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[16px] text-gray-900 truncate">{d.municipio}</p>
                    <p className="text-[12px] text-gray-400 flex items-center gap-1">
                      <MapPin size={11} /> {d.estado || 'Sin estado'}
                    </p>
                  </div>
                  {d.tipo_maiz && (
                    <span className="bg-[#1A5C38]/[0.08] text-[#1A5C38] text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                      {tipoLabel[d.tipo_maiz] || d.tipo_maiz}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${Number(d.productores_disponibles) >= 10 ? 'bg-green-100' : Number(d.productores_disponibles) >= 5 ? 'bg-yellow-50' : 'bg-[#F2F2F7]'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Productores</p>
                    </div>
                    <p className="text-[22px] font-black text-[#1A5C38]">{d.productores_disponibles}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${Number(d.toneladas_estimadas) >= 500 ? 'bg-green-100' : Number(d.toneladas_estimadas) >= 100 ? 'bg-yellow-50' : 'bg-[#F2F2F7]'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wheat size={12} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Toneladas</p>
                    </div>
                    <p className="text-[22px] font-black text-gray-800">{formatNum(d.toneladas_estimadas)}</p>
                  </div>
                </div>

                {Number(d.productores_disponibles) === 0 && (
                  <p className="text-[12px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 -mt-1">
                    Sin oferta activa por ahora en este municipio.
                  </p>
                )}

                <p className="text-[11px] text-gray-400">Marcado el {fechaFmt(d.created_at)}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/requerimientos?municipio=${encodeURIComponent(d.municipio)}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1A5C38]/[0.08] text-[#1A5C38] rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    <Signal size={14} /> Requerimiento
                  </button>
                  <button
                    onClick={() => quitar(d.id, d.municipio)}
                    disabled={eliminando === d.id}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 rounded-xl px-4 py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Quitar
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
