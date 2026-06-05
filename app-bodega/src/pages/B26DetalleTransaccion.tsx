import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

interface Transaccion {
  id: number;
  bodega_nombre: string;
  nombre_productor: string;
  volumen_ton: number;
  precio_por_ton: number;
  tipo_maiz: string;
  variedad: string;
  calidad?: string;
  fecha: string;
  confirmacion_productor: string;
  peso_precio_sistema: number;
  observaciones?: string;
  created_at: string;
}

export default function B26DetalleTransaccion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [txn, setTxn] = useState<Transaccion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.transacciones.get(id)
      .then(setTxn)
      .catch((e: any) => setError(e?.message || 'Transacción no encontrada'))
      .finally(() => setCargando(false));
  }, [id]);

  const estadoConfirmacion = () => {
    if (!txn) return null;
    if (txn.confirmacion_productor === 'confirmada') {
      return (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Confirmada por el productor</p>
            <p className="text-green-600 text-xs mt-0.5">El productor verificó los datos de la transacción</p>
          </div>
        </div>
      );
    }
    if (txn.confirmacion_productor === 'discrepancia') {
      return (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">El productor reportó una discrepancia</p>
            <p className="text-red-600 text-xs mt-0.5">Contacta al productor para resolver la diferencia</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <Clock className="text-amber-600 w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">Pendiente de confirmación</p>
          <p className="text-amber-600 text-xs mt-0.5">El productor aún no ha confirmado esta transacción</p>
        </div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error || 'Transacción no encontrada'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-gray-500 underline">
          Volver
        </button>
      </div>
    );
  }

  const volumen = Number(txn.volumen_ton) || 0;
  const precio = Number(txn.precio_por_ton) || 0;
  const peso = Number(txn.peso_precio_sistema) || 0;
  const total = volumen * precio;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-gray-900">Detalle de transacción</h1>
          <p className="text-xs text-gray-500">#{txn.id}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Estado de confirmación */}
        {estadoConfirmacion()}

        {/* Datos principales */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Datos de la compra</h3>
          <div className="space-y-3">
            {[
              { label: 'Productor', valor: txn.nombre_productor || '—' },
              { label: 'Bodega', valor: txn.bodega_nombre },
              { label: 'Tipo de maíz', valor: txn.tipo_maiz || '—' },
              { label: 'Variedad', valor: txn.variedad || '—' },
              { label: 'Calidad', valor: txn.calidad || '—' },
              { label: 'Volumen', valor: `${volumen} toneladas` },
              { label: 'Precio por tonelada', valor: `$${precio.toLocaleString('es-MX')} MXN` },
              { label: 'Total', valor: `$${total.toLocaleString('es-MX')} MXN`, destacado: true },
              {
                label: 'Fecha',
                valor: txn.fecha
                  ? new Date(txn.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—',
              },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className={`text-sm font-medium ${item.destacado ? 'text-[#1A5C38] text-base' : 'text-gray-800'}`}>
                  {item.valor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        {txn.observaciones && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
            <p className="text-gray-600 text-sm">{txn.observaciones}</p>
          </div>
        )}

        {/* Peso en Precio Sistema */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 text-center">
            Peso en Precio Sistema:{' '}
            <span className="font-semibold text-gray-700">
              {peso > 0 ? `${(peso * 100).toFixed(0)}%` : 'Pendiente de confirmación'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
