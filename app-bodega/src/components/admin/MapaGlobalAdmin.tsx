import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

/* ── light pastel tints for each type ── */
const LIGHT_COLORS: Record<string, { bg: string; border: string; accent: string; badge: string; badgeText: string; expandBg: string }> = {
  productor: {
    bg: 'rgba(26, 92, 56, 0.06)',
    border: 'rgba(26, 92, 56, 0.15)',
    accent: '#1A5C38',
    badge: 'rgba(26, 92, 56, 0.12)',
    badgeText: '#15803d',
    expandBg: 'rgba(26, 92, 56, 0.04)',
  },
  bodega: {
    bg: 'rgba(37, 99, 235, 0.06)',
    border: 'rgba(37, 99, 235, 0.15)',
    accent: '#2563EB',
    badge: 'rgba(37, 99, 235, 0.12)',
    badgeText: '#1d4ed8',
    expandBg: 'rgba(37, 99, 235, 0.04)',
  },
  alerta: {
    bg: 'rgba(220, 38, 38, 0.06)',
    border: 'rgba(220, 38, 38, 0.15)',
    accent: '#DC2626',
    badge: 'rgba(220, 38, 38, 0.12)',
    badgeText: '#b91c1c',
    expandBg: 'rgba(220, 38, 38, 0.04)',
  },
};

/* ── Helper: auto-center map when a popup opens ── */
function FlyToCenter() {
  const map = useMap();

  useEffect(() => {
    const onPopupOpen = (e: any) => {
      const latlng = e.popup.getLatLng();
      if (!latlng) return;
      const targetZoom = Math.max(map.getZoom(), 7);
      const mapSize = map.getSize();
      const offsetY = mapSize.y * 0.30; // push point 30% down from center
      const targetPoint = map.project(latlng, targetZoom);
      // unproject can take a Leaflet Point or an array/object with x,y
      const offsetLatLng = map.unproject([targetPoint.x, targetPoint.y - offsetY], targetZoom);
      map.flyTo(offsetLatLng, targetZoom, { animate: true, duration: 0.5 });
    };
    map.on('popupopen', onPopupOpen);
    return () => { map.off('popupopen', onPopupOpen); };
  }, [map]);

  return null;
}

/* ── POPUP STYLES (injected once) ── */
const POPUP_CSS = `
  .simac-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }
  .simac-popup .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
    line-height: 1.4 !important;
  }
  .simac-popup .leaflet-popup-tip-container {
    display: none !important;
  }
  .simac-popup .leaflet-popup-close-button {
    display: none !important;
  }
  .simac-popup {
    margin-bottom: 6px !important;
  }
`;

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
                detalle: `Área: ${u.area_ha} ha${u.alertas > 0 ? ` · Alertas: ${u.alertas}` : ''}`,
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
                detalle: `Capacidad: ${b.capacidad_toneladas} t · Ocupación: ${b.ocupacion_pct}%`,
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
                nivel: a.nivel_alerta,
              });
            }
          });
        }

        setPuntos(pts);
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
          {(Object.keys(LAYER_CONFIG) as LayerKey[]).map(key => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
                className="sr-only peer"
              />
              <span
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                  layers[key] ? 'border-transparent' : 'border-gray-600 bg-transparent'
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
        <style>{POPUP_CSS}</style>
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#090d12' }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
          />
          <FlyToCenter />
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
              <Popup className="simac-popup" autoPan={false} closeButton={false}>
                <PopupCard p={p} />
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

/* ── SVG icons for each type (professional, no emojis) ── */
const TipoIcons: Record<string, JSX.Element> = {
  productor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L12 8" /><path d="M8 6C8 6 9.5 2 12 2C14.5 2 16 6 16 6" />
      <path d="M6 10C6 10 8 6 12 6C16 6 18 10 18 10" />
      <path d="M12 8V22" /><path d="M8 22H16" />
    </svg>
  ),
  bodega: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V10L12 3L20 10V21H4Z" />
      <rect x="9" y="13" width="6" height="8" rx="1" />
    </svg>
  ),
  alerta: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   PopupCard — Apple 2026 style, light + pastel
   with pointer arrow at bottom
   ───────────────────────────────────────────── */
function PopupCard({ p }: { p: Punto }) {
  const [expanded, setExpanded] = useState(false);
  const theme = LIGHT_COLORS[p.tipo] || LIGHT_COLORS.productor;
  const tipoLabel = p.tipo === 'productor' ? 'Productor' : p.tipo === 'bodega' ? 'Bodega' : 'Alerta';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Card body */}
      <div
        style={{
          width: 260,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
          background: `linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.93))`,
          border: `1.5px solid ${theme.border}`,
          borderRadius: 18,
          boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
          overflow: 'hidden',
        }}
      >
        {/* Accent strip at top */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88, transparent)` }} />

        {/* Content */}
        <div style={{ padding: '14px 16px 12px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: theme.badge,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.badgeText, flexShrink: 0,
            }}>
              {TipoIcons[p.tipo] || TipoIcons.productor}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#1a1a1a',
                lineHeight: 1.25, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.nombre}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.2 }}>
                {p.municipio ? `${p.municipio}, ` : ''}{p.estado}
              </div>
            </div>
          </div>

          {/* Badge row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 600,
              padding: '3px 10px', borderRadius: 99,
              background: theme.badge, color: theme.badgeText,
              letterSpacing: 0.2,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />
              {tipoLabel}
            </span>
            {p.nivel && (
              <span style={{
                display: 'inline-block', fontSize: 10, fontWeight: 600,
                padding: '3px 10px', borderRadius: 99,
                background: p.nivel === 'critico' || p.nivel === 'alto' ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
                color: p.nivel === 'critico' || p.nivel === 'alto' ? '#dc2626' : '#d97706',
              }}>
                {p.nivel}
              </span>
            )}
          </div>

          {/* Expandable section */}
          <div style={{
            maxHeight: expanded ? 160 : 0,
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }}>
            <div style={{
              background: theme.expandBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: '10px 12px',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 11, color: '#555', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                {p.detalle || 'Sin detalles disponibles'}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 8, paddingTop: 8,
                borderTop: `1px solid ${theme.border}`,
                fontSize: 10, color: '#aaa', fontFamily: 'monospace',
              }}>
                <span>{p.latitud.toFixed(4)} N</span>
                <span>{Math.abs(p.longitud).toFixed(4)} W</span>
              </div>
            </div>
          </div>

          {/* Toggle button */}
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              width: '100%',
              padding: '7px 0',
              background: expanded ? theme.expandBg : 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              color: theme.accent,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.2s ease',
              letterSpacing: 0.1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.badge; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = expanded ? theme.expandBg : 'transparent'; }}
          >
            <span>{expanded ? 'Ocultar' : 'Ver mas informacion'}</span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            >
              <path d="M6 9l6 6 6-6" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Arrow/pointer pointing down to the map pin */}
      <svg width="20" height="10" viewBox="0 0 20 10" style={{ marginTop: -1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.08))' }}>
        <polygon points="0,0 10,10 20,0" fill="rgba(255,255,255,0.96)" stroke={theme.border} strokeWidth="1.5"
          strokeLinejoin="round" style={{ strokeDasharray: '0 20 14 0' }} />
      </svg>
    </div>
  );
}
