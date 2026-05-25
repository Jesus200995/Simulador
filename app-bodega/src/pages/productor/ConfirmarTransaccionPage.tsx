import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatNum } from '../../utils/format';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Txn {
  bodega_nombre: string; tipo_maiz: string; volumen_ton: number; precio_ton: number; fecha: string;
}

export default function ConfirmarTransaccionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Txn | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/transacciones/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTxn(d))
      .finally(() => setLoading(false));
  }, [id]);

  const confirmar = async (esCorrecta: boolean) => {
    setSending(true);
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/transacciones/${id}/confirmar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirmado: esCorrecta }),
    });
    navigate('/productor', { state: { mensaje: esCorrecta ? 'Transacción confirmada' : 'Discrepancia reportada' } });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!txn) return <div className="min-h-screen flex items-center justify-center text-gray-400">Transacción no encontrada</div>;

  const total = (txn.volumen_ton || 0) * (txn.precio_ton || 0);

  return (
    <div className="min-h-screen bg-white flex flex-col px-4 pt-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
          🌽
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {txn.bodega_nombre} registró una compra
        </h2>
        <p className="text-gray-500 text-sm mt-2">¿Los datos son correctos?</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 mb-8 space-y-3">
        {[
          { label: 'Bodega', value: txn.bodega_nombre },
          { label: 'Tipo de maíz', value: txn.tipo_maiz },
          { label: 'Volumen', value: `${txn.volumen_ton} toneladas` },
          { label: 'Precio por ton', value: `$${formatNum(txn.precio_ton, 0)}` },
          { label: 'Total', value: `$${formatNum(total, 0)}`, bold: true },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">{row.label}</span>
            <span className={`text-sm ${row.bold ? 'font-bold text-gray-900 text-base' : 'font-medium text-gray-800'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <button onClick={() => confirmar(true)} disabled={sending}
        className="w-full bg-[#1A5C38] text-white py-5 rounded-2xl text-lg
                   font-bold active:scale-95 transition-transform mb-3 shadow-lg disabled:opacity-50">
        ✓ Sí, es correcto
      </button>
      <button onClick={() => confirmar(false)} disabled={sending}
        className="w-full border-2 border-red-400 text-red-600 py-5 rounded-2xl
                   text-lg font-bold active:scale-95 transition-transform disabled:opacity-50">
        ✗ Los datos no son correctos
      </button>
      <p className="text-center text-xs text-gray-400 mt-4">
        Si hay un error, el equipo técnico lo revisará y te contactará.
      </p>
    </div>
  );
}
