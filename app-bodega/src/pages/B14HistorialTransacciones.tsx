import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

const estadoBadge: Record<string, string> = {
  pendiente:    'bg-amber-50 text-amber-700 border border-amber-200',
  confirmada:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  discrepancia: 'bg-red-50 text-red-700 border border-red-200',
  expirada:     'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function B14HistorialTransacciones() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.transacciones.list()
      .then((r: any) => setTxs(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full">
      {/* Banner full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <p className="text-[13px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Módulo</p>
          <h1 className="text-[26px] sm:text-[30px] font-black text-white leading-tight">Transacciones</h1>
          <p className="text-green-200/70 text-[14px] mt-1">
            {loading ? 'Cargando…' : `${txs.length} transacción${txs.length !== 1 ? 'es' : ''} registrada${txs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {txs.map(tx => (
            <div key={tx.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
              <div className="flex justify-between items-start gap-3 mb-2">
                <p className="font-bold text-[15px] text-gray-900 truncate flex-1">
                  {tx.nombre_productor || tx.nombre_productor_libre || 'Productor'}
                </p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${estadoBadge[tx.confirmacion_productor] || 'bg-gray-100 text-gray-500'}`}>
                  {tx.confirmacion_productor}
                </span>
              </div>
              <p className="text-[12px] text-gray-400">{tx.bodega_nombre} · {tx.fecha}</p>
              <p className="text-[16px] font-bold text-[#1A5C38] mt-2">
                {tx.volumen_ton} ton · ${tx.precio_ton?.toLocaleString()}/ton
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{tx.tipo_maiz}</p>
            </div>
          ))}
        </div>

        {!loading && txs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={32} className="text-gray-300" />
            </div>
            <p className="font-semibold text-[16px] text-gray-700">Sin transacciones registradas</p>
            <p className="text-[14px] text-gray-400">Registra la primera compra de maíz</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/transacciones/nueva')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
