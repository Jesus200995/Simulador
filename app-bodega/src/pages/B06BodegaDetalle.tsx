import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../components/Layout';
import { api } from '../services/api';

type Tab = 'general' | 'inventario' | 'precios' | 'senales';

export default function B06BodegaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('general');
  const [bodega, setBodega] = useState<any>(null);
  const [precios, setPrecios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.infraestructura.get(Number(id))
      .then((r: any) => setBodega(r.bodega || r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'precios') {
      api.infraestructura.precios(Number(id))
        .then((r: any) => setPrecios(r.precios || r))
        .catch(() => {});
    }
  }, [tab, id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'inventario', label: 'Inventario' },
    { key: 'precios', label: 'Precios' },
    { key: 'senales', label: 'Señales activas' },
  ];

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando…</div>;
  if (!bodega) return <div className="p-8 text-center text-red-500">Bodega no encontrada</div>;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title={bodega.nombre} subtitle={`${bodega.municipio}, ${bodega.estado}`} back="/mis-bodegas" />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2
              ${tab === t.key ? 'border-[#1A5C38] text-[#1A5C38]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'general' && (
          <div className="space-y-3">
            {[
              ['Capacidad', `${(bodega.capacidad_ton || 0).toLocaleString()} ton`],
              ['Localidad', bodega.localidad || '—'],
              ['Latitud', bodega.latitud?.toFixed(5) || '—'],
              ['Longitud', bodega.longitud?.toFixed(5) || '—'],
              ['Estatus operativo', bodega.estatus_operativo || '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex justify-between">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'inventario' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/inventario?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm"
            >
              Actualizar inventario
            </button>
            {bodega.ultimo_inventario ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <p className="font-semibold text-gray-800">Último registro</p>
                {Object.entries(bodega.ultimo_inventario).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">Sin registros de inventario</p>
            )}
          </div>
        )}

        {tab === 'precios' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/precio-diario?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm"
            >
              Publicar precio de hoy
            </button>
            {precios.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-800 mb-3">Últimos 30 días</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={precios.slice(0, 30).reverse()}>
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`$${v}`, 'Precio']} />
                    <Line type="monotone" dataKey="precio" stroke="#1A5C38" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'senales' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/senales/nueva?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white py-3 rounded-xl font-semibold text-sm"
            >
              + Nueva señal de compra
            </button>
            <p className="text-center text-gray-400 text-sm py-4">Ver señales activas en la sección Oferta</p>
          </div>
        )}
      </div>
    </div>
  );
}
