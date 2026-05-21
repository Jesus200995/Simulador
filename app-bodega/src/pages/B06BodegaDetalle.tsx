import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageBanner } from '../components/Layout';
import { api } from '../services/api';
import { Phone, MapPin, Zap, Package, BarChart2, Signal } from 'lucide-react';

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

  const tabIcons: Record<Tab, React.ReactNode> = {
    general:    <MapPin size={14} />,
    inventario: <Package size={14} />,
    precios:    <BarChart2 size={14} />,
    senales:    <Signal size={14} />,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
    </div>
  );
  if (!bodega) return (
    <div className="flex flex-col items-center justify-center py-24 gap-2">
      <p className="text-[16px] font-semibold text-gray-600">Bodega no encontrada</p>
    </div>
  );

  return (
    <div className="w-full">
      <PageBanner
        title={bodega.nombre}
        subtitle={`${bodega.municipio}, ${bodega.estado}`}
        back="/mis-bodegas"
      />

      {/* Tabs sticky */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-black/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-3.5 text-[13px] font-semibold transition-colors border-b-2
                ${tab === t.key ? 'border-[#1A5C38] text-[#1A5C38]' : 'border-transparent text-gray-400'}`}
            >
              {tabIcons[t.key]}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {/* ── General ── */}
        {tab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-100">
              <p className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Información</p>
              {[
                ['Capacidad', `${(bodega.capacidad_ton || 0).toLocaleString()} ton`],
                ['Localidad', bodega.localidad || '—'],
                ['Estatus operativo', bodega.estatus_operativo || '—'],
                ['Coordenadas', `${bodega.latitud?.toFixed(4) || '—'}, ${bodega.longitud?.toFixed(4) || '—'}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3.5">
                  <span className="text-[14px] text-gray-500">{k}</span>
                  <span className="text-[14px] font-semibold text-gray-800 text-right max-w-[55%] truncate">{v}</span>
                </div>
              ))}
            </div>
            {contactos.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-100">
                <p className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Contactos</p>
                {contactos.map((c: any) => (
                  <div key={c.id} className="px-4 py-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A5C38]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone size={14} className="text-[#1A5C38]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-800">{c.nombre}</p>
                      {c.cargo && <p className="text-[12px] text-gray-400">{c.cargo}</p>}
                      {c.telefono && <p className="text-[12px] text-[#1A5C38] font-medium">{c.telefono}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Inventario ── */}
        {tab === 'inventario' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/inventario?bodega_id=${id}`)}
              className="flex items-center gap-2 px-5 py-3 bg-[#1A5C38] text-white rounded-2xl text-[15px] font-semibold active:opacity-80 transition-opacity"
            >
              <Zap size={16} /> Actualizar inventario
            </button>
            {ultimoInventario ? (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-100">
                <div className="px-4 py-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Último registro</p>
                  <span className="text-[12px] text-gray-400">{ultimoInventario.fecha || '—'}</span>
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
                    <span className="text-[14px] text-gray-500">{k}</span>
                    <span className="text-[14px] font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                {ultimoInventario.observaciones && (
                  <div className="px-4 py-3.5">
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Observaciones</p>
                    <p className="text-[14px] text-gray-700">{ultimoInventario.observaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                <Package size={32} className="text-gray-200" />
                <p className="text-[14px]">Sin registros de inventario</p>
              </div>
            )}
          </div>
        )}

        {/* ── Precios ── */}
        {tab === 'precios' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/precio-diario?bodega_id=${id}`)}
              className="flex items-center gap-2 px-5 py-3 bg-[#1A5C38] text-white rounded-2xl text-[15px] font-semibold active:opacity-80 transition-opacity"
            >
              <Zap size={16} /> Publicar precio de hoy
            </button>
            {precios.length > 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Últimos 30 días</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={precios.slice(0, 30).reverse()}>
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} width={55} />
                    <Tooltip formatter={(v: any) => [`$${v}`, 'Precio']} />
                    <Line type="monotone" dataKey="precio" stroke="#1A5C38" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-3 divide-y divide-gray-100">
                  {precios.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center py-2.5">
                      <span className="text-[13px] text-gray-400">{p.fecha} · {p.tipo_maiz}</span>
                      <span className="text-[14px] font-bold text-[#1A5C38]">${p.precio?.toLocaleString()}/ton</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                <BarChart2 size={32} className="text-gray-200" />
                <p className="text-[14px]">Sin historial de precios</p>
              </div>
            )}
          </div>
        )}

        {/* ── Señales ── */}
        {tab === 'senales' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/senales/nueva?bodega_id=${id}`)}
              className="flex items-center gap-2 px-5 py-3 bg-[#1A5C38] text-white rounded-2xl text-[15px] font-semibold active:opacity-80 transition-opacity"
            >
              <Signal size={16} /> Nueva señal de compra
            </button>
            <div className="bg-white rounded-2xl border border-black/[0.06] p-4 text-center">
              <p className="text-[14px] text-gray-400">Las señales activas se ven en la sección Oferta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
