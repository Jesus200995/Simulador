import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../services/api';

const estadoBadge: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-700',
  discrepancia: 'bg-red-100 text-red-700',
  expirada: 'bg-gray-100 text-gray-500',
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
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      {/* Header interno */}
      <div className="bg-gradient-to-r from-[#1A5C38] to-[#2d7a52] px-4 sm:px-6 pt-6 pb-7 text-white">
        <h1 className="text-[22px] font-bold">Transacciones</h1>
        <p className="text-green-200 text-[14px] mt-0.5">Historial de compras de maíz</p>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-3">
        {loading && <p className="text-center text-gray-400 text-[14px] py-10">Cargando…</p>}

        {txs.map(tx => (
          <div key={tx.id} className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[16px] text-gray-900 truncate">
                  {tx.nombre_productor || tx.nombre_productor_libre || 'Productor'}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">{tx.bodega_nombre} · {tx.fecha}</p>
                <p className="text-[15px] font-semibold text-[#1A5C38] mt-1.5">
                  {tx.volumen_ton} ton · ${tx.precio_ton?.toLocaleString()}/ton
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">{tx.tipo_maiz}</p>
              </div>
              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${estadoBadge[tx.confirmacion_productor] || 'bg-gray-100 text-gray-500'}`}>
                {tx.confirmacion_productor}
              </span>
            </div>
          </div>
        ))}

        {!loading && txs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-semibold text-[16px] text-gray-600">Sin transacciones registradas</p>
            <p className="text-[14px] mt-1">Registra la primera compra de maíz</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/transacciones/nueva')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
