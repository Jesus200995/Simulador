import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, MapPin, CheckCircle, ChevronLeft, Warehouse, List, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { formatNum } from '../utils/format';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fix default marker icon for Leaflet + bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onCoords }: { onCoords: (lat: number, lon: number) => void }) {
  useMapEvents({ click(e) { onCoords(e.latlng.lat, e.latlng.lng); } });
  return null;
}

interface Bodega { id: number; nombre: string; municipio: string; estado: string; capacidad_ton: number; latitud?: number; longitud?: number; semaforo_compra?: string; }

const iconoVerde = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#1A5C38;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12] as [number, number],
  iconAnchor: [6, 6] as [number, number],
});
const iconoVerdeCheck = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#0f3520;border-radius:50%;border:2.5px solid #4ade80;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:9px;line-height:1">✓</span></div>',
  iconSize: [16, 16] as [number, number],
  iconAnchor: [8, 8] as [number, number],
});

function MapController({ bounds, flyTo }: { bounds: [number, number][] | null; flyTo: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds || bounds.length === 0) return;
    if (bounds.length === 1) {
      map.flyTo(bounds[0], 12, { animate: true, duration: 0.8 });
    } else {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  useEffect(() => {
    if (!flyTo) return;
    map.flyTo(flyTo, 14, { animate: true, duration: 0.8 });
  }, [flyTo, map]);
  return null;
}

export default function B03SelectBodegas() {
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [results, setResults] = useState<Bodega[]>([]);
  const [selected, setSelected] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [municipio, setMunicipio] = useState('');
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [altaForm, setAltaForm] = useState({ nombre: '', estado: '', municipio: '', localidad: '', capacidad_ton: '', responsable: '', telefono: '', email: '' });
  const [altaEstados, setAltaEstados] = useState<any[]>([]);
  const [altaMunicipios, setAltaMunicipios] = useState<any[]>([]);
  const [enviandoAlta, setEnviandoAlta] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const [stats, setStats] = useState<{ total_bodegas: number; total_capacidad_ton: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<[number, number][] | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

  async function search(q = query, est = estado, mun = municipio) {
    setLoading(true);
    try {
      const res = await api.bodegas.list({ q, estado: est, municipio: mun });
      setResults((res.bodegas || res).slice(0, 30));
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => {
    api.auth.states().then((r: any) => { setStates(r.states || r); setAltaEstados(r.states || r); }).catch(() => {});
    search('', '', '');
  }, []);

  useEffect(() => {
    if (estado) {
      const st = states.find((s: any) => s.name === estado);
      if (st) api.auth.municipalities(st.state_id).then((r: any) => setMunicipios(r.municipalities || [])).catch(() => {});
    } else { setMunicipios([]); setMunicipio(''); }
  }, [estado, states]);

  useEffect(() => {
    if (altaForm.estado) {
      const st = altaEstados.find((s: any) => s.name === altaForm.estado || String(s.state_id) === altaForm.estado);
      if (st) api.auth.municipalities(st.state_id).then((r: any) => setAltaMunicipios(r.municipalities || [])).catch(() => {});
    } else { setAltaMunicipios([]); }
  }, [altaForm.estado, altaEstados]);

  useEffect(() => {
    const t = setTimeout(() => search(query, estado, municipio), 400);
    return () => clearTimeout(t);
  }, [query, estado, municipio]);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE_URL}/bodegas/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (vista !== 'mapa') return;
    const withCoords = results.filter(b => b.latitud && b.longitud && Math.abs(b.latitud) > 0.001);
    setMapBounds(withCoords.length > 0 ? withCoords.map(b => [b.latitud!, b.longitud!]) : null);
  }, [results, vista]);

  function toggle(b: Bodega) {
    setSelected(s =>
      s.some(x => x.id === b.id) ? s.filter(x => x.id !== b.id) : [...s, b]
    );
  }

  async function continuar() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    const failed: string[] = [];
    for (const b of selected) {
      try {
        await api.bodeguero.solicitar(b.id);
      } catch (err: any) {
        failed.push(`${b.nombre}: ${err.message}`);
      }
    }
    setSaving(false);
    if (failed.length > 0) {
      setError(failed.join('\n'));
      return;
    }
    navigate('/mis-bodegas');
  }

  return (
    <div className="min-h-dvh bg-[#F2F2F7] flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#1A5C38] px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-2 mb-4 pt-3">
          <button onClick={() => navigate('/login')}
            className="text-white/80 flex items-center gap-0.5 active:opacity-60 transition-opacity">
            <ChevronLeft size={20} strokeWidth={2.5} className="-ml-1" />
            <span className="text-[15px] font-medium">Volver</span>
          </button>
        </div>
        <h1 className="text-[22px] font-bold text-white">Selecciona tus bodegas</h1>
        <p className="text-green-200 text-[14px] mt-0.5">Busca en el catálogo nacional</p>
      </div>

      {/* Chips seleccionadas */}
      {selected.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1A5C38] mb-2">
            Seleccionadas ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(b => (
              <span key={b.id} className="bg-[#1A5C38]/10 text-[#1A5C38] text-[13px] font-medium rounded-full px-3 py-1 flex items-center gap-1.5">
                {b.nombre}
                <button onClick={() => toggle(b)} className="text-[#1A5C38]/60 active:text-red-500">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-6 pt-4 pb-32 space-y-3 max-w-2xl mx-auto w-full">
        {/* KPIs globales del catálogo */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-700">{stats.total_bodegas.toLocaleString('es-MX')}</p>
              <p className="text-xs text-green-600 mt-1">Bodegas en el catálogo</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{formatNum(stats.total_capacidad_ton)} ton</p>
              <p className="text-xs text-blue-600 mt-1">Capacidad total registrada</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar bodega…"
              className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border border-black/5 shadow-sm"
            />
          </div>
          <select
            value={estado}
            onChange={e => { setEstado(e.target.value); setMunicipio(''); }}
            className="bg-white rounded-xl px-3 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border border-black/5 shadow-sm min-w-0 max-w-28"
          >
            <option value="">Estado</option>
            {states.map((s: any) => <option key={s.state_id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        {estado && municipios.length > 0 && (
          <select
            value={municipio}
            onChange={e => setMunicipio(e.target.value)}
            className="w-full bg-white rounded-xl px-3 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border border-black/5 shadow-sm"
          >
            <option value="">Todos los municipios</option>
            {municipios.map((m: any) => <option key={m.municipality_id} value={m.name}>{m.name}</option>)}
          </select>
        )}

        {/* Toggle Lista / Mapa */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setVista('lista')}
            className={`flex-1 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
              vista === 'lista' ? 'bg-[#1A5C38] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List size={15} /> Lista
          </button>
          <button
            onClick={() => setVista('mapa')}
            className={`flex-1 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
              vista === 'mapa' ? 'bg-[#1A5C38] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapIcon size={15} /> Mapa
          </button>
        </div>

        {/* Vista Lista */}
        {vista === 'lista' && <>
        {loading && <p className="text-center text-[14px] text-gray-400 py-4">Buscando…</p>}
        <div className="space-y-2">
          {results.map(b => {
            const isSelected = selected.some(x => x.id === b.id);
            return (
              <div key={b.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm transition-all
                ${isSelected ? 'border-[#1A5C38]/40' : 'border-black/5'}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-gray-900 truncate">{b.nombre}</p>
                  <p className="text-[13px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />{b.municipio}, {b.estado}
                    {b.capacidad_ton > 0 && ` · ${formatNum(b.capacidad_ton)} ton`}
                  </p>
                </div>
                <button
                  onClick={() => toggle(b)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-[#1A5C38] text-white' : 'bg-[#F2F2F7] text-gray-500'}`}
                >
                  {isSelected ? <CheckCircle size={18} /> : <Plus size={18} />}
                </button>
              </div>
            );
          })}
        </div>
        </>}

        {/* Vista Mapa */}
        {vista === 'mapa' && (
          <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: '450px' }}>
            <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%' }}>
              {import.meta.env.VITE_MAPBOX_TOKEN ? (
                <TileLayer
                  url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                  attribution="© Mapbox © OpenStreetMap"
                />
              ) : (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution="© CartoDB © OpenStreetMap"
                />
              )}
              <MapController bounds={mapBounds} flyTo={flyToCoords} />
              {results
                .filter(b => b.latitud && b.longitud && Math.abs(b.latitud) > 0.001)
                .map(b => (
                  <Marker
                    key={b.id}
                    position={[b.latitud!, b.longitud!]}
                    icon={selected.some(s => s.id === b.id) ? iconoVerdeCheck : iconoVerde}
                    eventHandlers={{ click: () => setFlyToCoords([b.latitud!, b.longitud!]) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 186 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>{b.nombre}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px' }}>{b.municipio}, {b.estado}</p>
                        {b.capacidad_ton > 0 && (
                          <p style={{ fontSize: 11, color: '#374151', margin: '0 0 4px' }}>Capacidad: {formatNum(b.capacidad_ton)} ton</p>
                        )}
                        {b.semaforo_compra && (
                          <p style={{ fontSize: 11, margin: '0 0 8px' }}>
                            {b.semaforo_compra === 'verde' && '🟢 Comprando'}
                            {b.semaforo_compra === 'amarillo' && '🟡 Cap. limitada'}
                            {b.semaforo_compra === 'rojo' && '🔴 No compra'}
                          </p>
                        )}
                        {selected.some(s => s.id === b.id) ? (
                          <p style={{ fontSize: 12, color: '#1A5C38', fontWeight: 600, margin: 0 }}>✓ Ya agregada</p>
                        ) : (
                          <button
                            onClick={() => toggle(b)}
                            style={{ width: '100%', background: '#1A5C38', color: 'white', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 6 }}
                          >
                            + Agregar esta bodega
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))
              }
            </MapContainer>
          </div>
        )}

        {/* C-07: Solicitar alta de bodega nueva */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-[13px] text-gray-500 mb-3">¿No encontraste tu bodega en el catálogo?</p>
          <button
            onClick={() => setMostrarAlta(true)}
            className="w-full border-2 border-dashed border-green-300 rounded-xl py-3 px-4 text-green-700 font-medium text-[14px] active:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Warehouse size={16} /> Solicitar alta de bodega nueva
          </button>
        </div>

        {mostrarAlta && (
          <div className="bg-white rounded-2xl border border-[#1A5C38]/20 shadow-md p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[15px] font-bold text-[#1A5C38]">Nueva bodega</p>
              <button onClick={() => setMostrarAlta(false)} className="text-gray-400 active:text-red-500"><X size={18} /></button>
            </div>
            <p className="text-[12px] text-gray-400">Llena los datos y un administrador aprobará tu solicitud.</p>
            {[
              { k: 'nombre', label: 'Nombre de la bodega *', type: 'text' },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="block text-[13px] font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={(altaForm as any)[k]} onChange={e => setAltaForm(f => ({ ...f, [k]: e.target.value }))} className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0" />
              </div>
            ))}
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Estado *</label>
              <select value={altaForm.estado} onChange={e => setAltaForm(f => ({ ...f, estado: e.target.value, municipio: '' }))} className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0">
                <option value="">Selecciona estado</option>
                {altaEstados.map((s: any) => <option key={s.state_id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Municipio *</label>
              <select value={altaForm.municipio} onChange={e => setAltaForm(f => ({ ...f, municipio: e.target.value }))} className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0">
                <option value="">Selecciona municipio</option>
                {altaMunicipios.map((m: any) => <option key={m.municipality_id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            {[
              { k: 'localidad', label: 'Localidad', type: 'text' },
              { k: 'capacidad_ton', label: 'Capacidad total (ton) *', type: 'number' },
              { k: 'responsable', label: 'Nombre del responsable *', type: 'text' },
              { k: 'telefono', label: 'Teléfono (10 dígitos) *', type: 'tel' },
              { k: 'email', label: 'Correo electrónico', type: 'email' },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="block text-[13px] font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={(altaForm as any)[k]} onChange={e => setAltaForm(f => ({ ...f, [k]: e.target.value }))} className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#1A5C38]/30 border-0" />
              </div>
            ))}
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1">Ubicación de la bodega</label>
              <p className="text-[11px] text-gray-500 mb-2">Toca el mapa para marcar la ubicación de tu bodega</p>
              <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '180px' }}>
                <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                  {import.meta.env.VITE_MAPBOX_TOKEN ? (
                    <TileLayer
                      url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                      attribution="© Mapbox © OpenStreetMap"
                    />
                  ) : (
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution="© CartoDB © OpenStreetMap"
                    />
                  )}
                  <MapClickHandler onCoords={(lat, lon) => setCoords({ lat, lon })} />
                  {coords && <Marker position={[coords.lat, coords.lon]} />}
                </MapContainer>
              </div>
              {coords ? (
                <p className="text-[11px] text-green-600 mt-1">✓ Ubicación marcada: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">Sin ubicación — el administrador la completará al aprobar</p>
              )}
            </div>
            <button
              disabled={enviandoAlta || !altaForm.nombre || !altaForm.estado || !altaForm.municipio || !altaForm.capacidad_ton || !altaForm.responsable || !altaForm.telefono}
              onClick={async () => {
                setEnviandoAlta(true);
                try {
                  await api.bodegas.create({
                    nombre: altaForm.nombre,
                    estado: altaForm.estado,
                    municipio: altaForm.municipio,
                    localidad: altaForm.localidad,
                    capacidad_ton: Number(altaForm.capacidad_ton),
                    latitud: coords?.lat ?? 0,
                    longitud: coords?.lon ?? 0,
                    responsable: altaForm.responsable,
                    telefono: altaForm.telefono,
                    email: altaForm.email,
                    estatus: 'pendiente',
                  });
                  toast('Tu solicitud fue enviada. Te notificaremos cuando sea aprobada.', 'success');
                  setMostrarAlta(false);
                  setCoords(null);
                  setAltaForm({ nombre: '', estado: '', municipio: '', localidad: '', capacidad_ton: '', responsable: '', telefono: '', email: '' });
                } catch (err: any) {
                  toast(err.message || 'Error al enviar solicitud', 'error');
                } finally { setEnviandoAlta(false); }
              }}
              className="w-full bg-[#1A5C38] text-white rounded-2xl py-3.5 text-[15px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
            >
              {enviandoAlta ? 'Enviando…' : 'Enviar solicitud de alta'}
            </button>
          </div>
        )}

        {/* Continuar sin seleccionar bodega */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full text-[15px] text-gray-400 font-medium py-2 active:opacity-70 transition-opacity"
        >
          Continuar sin asociar bodega por ahora
        </button>
      </div>

      {/* Botón continuar fijo abajo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 px-4 py-3 pb-safe">
        <div className="max-w-2xl mx-auto space-y-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-[12px] text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}
          <button
            onClick={continuar}
            disabled={selected.length === 0 || saving}
            className="w-full bg-[#1A5C38] text-white rounded-2xl py-4 text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Guardando…' : `Asociar ${selected.length} bodega${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
