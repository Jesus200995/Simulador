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
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [precios, setPrecios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.infraestructura.get(Number(id))
      .then((r: any) => {
        setBodega(r.bodega || r);
        setInventarios(r.inventarios || []);
        setContactos(r.contactos || []);
      })
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
    { key: 'senales', label: 'Señales' },
  ];

  const ultimoInventario = inventarios[0] || null;

  if (loading) return <div className="p-10 text-center text-gray-400 text-[15px]">Cargando…</div>;
  if (!bodega) return <div className="p-10 text-center text-red-500 text-[15px]">Bodega no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto overflow-x-hidden">
      <PageHeader title={bodega.nombre} subtitle={`${bodega.municipio}, ${bodega.estado}`} back="/mis-bodegas" />

      {/* Tabs horizontales */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
        <div className="flex px-4 sm:px-6 min-w-max">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-3.5 text-[14px] font-semibold transition-colors border-b-2
                ${tab === t.key
                  ? 'border-[#1A5C38] text-[#1A5C38]'
                  : 'border-transparent text-gray-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-3">
        {tab === 'general' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
              {[
                ['Capacidad', `${(bodega.capacidad_ton || 0).toLocaleString()} ton`],
                ['Localidad', bodega.localidad || '—'],
                ['Estatus operativo', bodega.estatus_operativo || '—'],
                ['Latitud', bodega.latitud?.toFixed(5) || '—'],
                ['Longitud', bodega.longitud?.toFixed(5) || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3.5">
                  <span className="text-[15px] text-gray-500">{k}</span>
                  <span className="text-[15px] font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            {contactos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Contactos</p>
                </div>
                {contactos.map((c: any) => (
                  <div key={c.id} className="px-4 py-3.5">
                    <p className="text-[15px] font-semibold text-gray-800">{c.nombre}</p>
                    {c.cargo && <p className="text-[13px] text-gray-500">{c.cargo}</p>}
                    {c.telefono && <p className="text-[13px] text-[#1A5C38]">{c.telefono}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'inventario' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/inventario?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity"
            >
              Actualizar inventario
            </button>
            {ultimoInventario ? (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Último registro</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{ultimoInventario.fecha || '—'}</p>
                </div>
                {[
                  ['Tipo de maíz', ultimoInventario.tipo_maiz || '—'],
                  ['Vol. almacenado', `${(ultimoInventario.volumen_almacenamiento || 0).toLocaleString()} ton`],
                  ['Vol. con problema', `${(ultimoInventario.volumen_problema || 0).toLocaleString()} ton`],
                  ['Humedad', ultimoInventario.humedad_pct ? `${ultimoInventario.humedad_pct}%` : '—'],
                  ['Calidad', ultimoInventario.calidad || '—'],
                  ['Ciclo', ultimoInventario.ciclo || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-[15px] text-gray-500">{k}</span>
                    <span className="text-[15px] font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                {ultimoInventario.observaciones && (
                  <div className="px-4 py-3.5">
                    <p className="text-[13px] text-gray-400">Observaciones</p>
                    <p className="text-[14px] text-gray-700 mt-0.5">{ultimoInventario.observaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-[14px] py-6">Sin registros de inventario</p>
            )}
          </div>
        )}

        {tab === 'precios' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/precio-diario?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity"
            >
              Publicar precio de hoy
            </button>
            {precios.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Últimos 30 días</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={precios.slice(0, 30).reverse()}>
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`$${v}`, 'Precio']} />
                    <Line type="monotone" dataKey="precio" stroke="#1A5C38" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 bg-white rounded-2xl divide-y divide-gray-100">
                  {precios.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center px-1 py-2.5">
                      <span className="text-[13px] text-gray-500">{p.fecha} · {p.tipo_maiz}</span>
                      <span className="text-[15px] font-bold text-[#1A5C38]">${p.precio?.toLocaleString()}/ton</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {precios.length === 0 && (
              <p className="text-center text-gray-400 text-[14px] py-6">Sin historial de precios</p>
            )}
          </div>
        )}

        {tab === 'senales' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/senales/nueva?bodega_id=${id}`)}
              className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity"
            >
              + Nueva señal de compra
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
              <p className="text-[14px] text-gray-400 text-center">Ver señales activas en la sección Oferta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
