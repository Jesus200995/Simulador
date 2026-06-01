import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapaGlobalAdminProps {
  token: string;
  apiUrl: string;
}

interface Punto {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
  municipio: string;
  latitud: number;
  longitud: number;
  detalle?: string;
  nivel?: string;
}

const LAYER_CONFIG = {
  productores: { color: '#1A5C38', label: 'Productores' },
  bodegas:     { color: '#2563EB', label: 'Bodegas' },
  alertas:     { color: '#DC2626', label: 'Alertas' },
} as const;

type LayerKey = keyof typeof LAYER_CONFIG;

export default function MapaGlobalAdmin({ token, apiUrl }: MapaGlobalAdminProps) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    productores: true,
    bodegas: true,
    alertas: true,
  });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = estadoFiltro ? `?estado=${encodeURIComponent(estadoFiltro)}` : '';
    fetch(`${apiUrl}/dashboard/admin/mapa${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const pts: Punto[] = [];
        
        if (data.ups && Array.isArray(data.ups)) {
          data.ups.forEach((u: any) => {
            if (u.lat && u.lng) {
              pts.push({
                id: u.up_id,
                nombre: u.up_name || 'UP Sin Nombre',
                tipo: 'productor',
                estado: u.state_name || '',
                municipio: u.municipality_name || '',
                latitud: u.lat,
                longitud: u.lng,
                detalle: `Área: ${u.area_ha} ha${u.alertas > 0 ? ` | Alertas: ${u.alertas}` : ''}`
              });
            }
          });
        }
        
        if (data.bodegas && Array.isArray(data.bodegas)) {
          data.bodegas.forEach((b: any) => {
            if (b.lat && b.lng) {
              pts.push({
                id: b.id,
                nombre: b.nombre || 'Bodega',
                tipo: 'bodega',
                estado: b.estado || '',
                municipio: b.municipio || '',
                latitud: b.lat,
                longitud: b.lng,
                detalle: `Capacidad: ${b.capacidad_toneladas} t | Ocupación: ${b.ocupacion_pct}%`
              });
            }
          });
        }
        
        if (data.alertas && Array.isArray(data.alertas)) {
          data.alertas.forEach((a: any) => {
            if (a.lat && a.lng) {
              pts.push({
                id: a.id,
                nombre: `Alerta: ${a.tipo_alerta}`,
                tipo: 'alerta',
                estado: a.state_name || '',
                municipio: a.municipality_name || '',
                latitud: a.lat,
                longitud: a.lng,
                detalle: `UP: ${a.up_name}`,
                nivel: a.nivel_alerta
              });
            }
          });
        }
        
        setPuntos(pts);
        // Extract unique states for filter
        const uniqueEstados = [...new Set(pts.map(p => p.estado).filter(Boolean))].sort();
        if (estados.length === 0) setEstados(uniqueEstados);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl, token, estadoFiltro]);

  const toggleLayer = (key: LayerKey) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = puntos.filter(p => {
    if (!p.latitud || !p.longitud) return false;
    if (p.tipo === 'productor' && !layers.productores) return false;
    if (p.tipo === 'bodega' && !layers.bodegas) return false;
    if (p.tipo === 'alerta' && !layers.alertas) return false;
    return true;
  });

  const getColor = (tipo: string) => {
    if (tipo === 'productor') return LAYER_CONFIG.productores.color;
    if (tipo === 'bodega') return LAYER_CONFIG.bodegas.color;
    if (tipo === 'alerta') return LAYER_CONFIG.alertas.color;
    return '#6B7280';
  };

  return (
    <section className="bg-[#080c11] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">
            Geolocalización
          </p>
          <h2 className="text-[13px] sm:text-[14px] font-bold text-white">
            Mapa Nacional
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Layer toggles */}
          {(Object.keys(LAYER_CONFIG) as LayerKey[]).map(key => (
            <label
              key={key}
              className="flex items-center gap-1.5 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
                className="sr-only peer"
              />
              <span
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                  layers[key]
                    ? 'border-transparent'
                    : 'border-gray-600 bg-transparent'
                }`}
                style={layers[key] ? { background: LAYER_CONFIG[key].color, borderColor: LAYER_CONFIG[key].color } : {}}
              >
                {layers[key] && (
                  <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[11px] font-medium text-gray-400">
                {LAYER_CONFIG[key].label}
              </span>
            </label>
          ))}

          {/* State filter */}
          <select
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            className="bg-[#090d12] border border-white/10 text-gray-300 text-[11px] font-medium rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500/40 transition-colors"
          >
            <option value="">Todo el país</option>
            {estados.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: 420 }}>
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#090d12]/60 backdrop-blur-sm">
            <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#090d12' }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
          />
          {filtered.map(p => (
            <CircleMarker
              key={`${p.tipo}-${p.id}`}
              center={[p.latitud, p.longitud]}
              radius={p.tipo === 'alerta' ? 7 : 5}
              pathOptions={{
                fillColor: getColor(p.tipo),
                fillOpacity: 0.85,
                color: 'white',
                weight: 1.5,
              }}
            >
              <Popup>
                <PopupContent p={p} color={getColor(p.tipo)} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend footer */}
      <div className="flex items-center gap-4 px-4 sm:px-5 py-2.5 border-t border-white/[0.06] text-[10px] text-gray-600">
        <span>{filtered.length} punto{filtered.length !== 1 ? 's' : ''} visibles</span>
        <span className="ml-auto">Tiles: ESRI World Imagery</span>
      </div>
    </section>
  );
}

function PopupContent({ p, color }: { p: Punto; color: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-w-[180px] max-w-[240px] font-sans">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-bold text-[13px] leading-tight text-gray-900 m-0">{p.nombre}</h3>
      </div>
      <p className="text-[11px] text-gray-500 m-0 mb-2 leading-tight">
        {p.municipio ? `${p.municipio}, ` : ''}{p.estado}
      </p>
      
      <div className="mb-3">
        <span 
          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
          style={{ background: color }}
        >
          {p.tipo === 'productor' ? 'Productor' : p.tipo === 'bodega' ? 'Bodega' : 'Alerta'}
        </span>
        {p.nivel && (
          <span className={`inline-block ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm ${p.nivel === 'ALTA' || p.nivel === 'critico' ? 'bg-red-500' : 'bg-amber-500'}`}>
            {p.nivel}
          </span>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[200px] opacity-100 mt-2 mb-3' : 'max-h-0 opacity-0 m-0'}`}>
        <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
          <p className="text-[11px] text-gray-700 m-0 font-medium">{p.detalle || 'No hay detalles adicionales disponibles.'}</p>
          <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-400">
            <span>Lat: {p.latitud.toFixed(4)}</span>
            <span>Lng: {p.longitud.toFixed(4)}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="w-full py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
      >
        <span>{expanded ? 'Ocultar información' : 'Ver más información'}</span>
        <svg className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
