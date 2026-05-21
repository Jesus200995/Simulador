import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

const estadoBadge: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  discrepancia: 'bg-red-100 text-red-800',
  expirada: 'bg-gray-100 text-gray-600',
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
    <div className="max-w-lg mx-auto">
      <PageHeader title="Transacciones" subtitle="Historial de compras" />

      <div className="px-4 py-4 space-y-3">
        {loading && <p className="text-center text-gray-400 py-8">Cargando…</p>}

        {txs.map(tx => (
          <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{tx.nombre_productor || tx.nombre_productor_libre || 'Productor'}</p>
                <p className="text-xs text-gray-500">{tx.bodega_nombre} · {tx.fecha}</p>
                <p className="text-sm font-semibold text-[#1A5C38] mt-1">
                  {tx.volumen_ton} ton · ${tx.precio_ton?.toLocaleString()}/ton
                </p>
                <p className="text-xs text-gray-400">{tx.tipo_maiz}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoBadge[tx.confirmacion_productor] || 'bg-gray-100 text-gray-600'}`}>
                {tx.confirmacion_productor}
              </span>
            </div>
          </div>
        ))}

        {!loading && txs.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>Sin transacciones registradas</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/transacciones/nueva')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-900 active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
