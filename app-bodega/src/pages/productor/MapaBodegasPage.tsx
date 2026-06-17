import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MapPin, Package, Warehouse, Map as MapIcon,
  CheckCircle2, Wheat, Navigation, Layers
} from 'lucide-react';

mapboxgl.accessToken = [
  'pk.eyJ1IjoibWFyaWVsMDgi',
  'LCJhIjoiY202emV3MDhhMDN6Y',
  'jJscHVqaXExdGpjMyJ9.F_ACoKzS_4e280lD0XndEw'
].join('');

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Bodega {
  id: number; nombre: string; municipio: string;
  latitud: number; longitud: number;
  estado_compra: string; precio_compra_hoy: number;
  is_ventanilla: boolean;
  capacidad_ton?: number; stock_actual?: number;
  senal_activa?: { id: number; precio_oferta: number; volumen_ton: number; tipo_maiz: string } | null;
}

interface UpData {
  lat: number; lng: number;
  location_confirmed: boolean; centroid_source: string;
  municipio?: string; estado?: string;
  poligono?: GeoJSON.Polygon | null;   // polígono real de la parcela si existe
}



// Color semáforo de bodegas
const SEMAFORO: Record<string, { fill: string; label: string }> = {
  comprando:     { fill: '#10B981', label: 'Comprando' },
  limitado:      { fill: '#F59E0B', label: 'Cap. Limitada' },
  no_compra:     { fill: '#EF4444', label: 'No compra' },
  sin_actividad: { fill: '#6B7280', label: 'Sin actividad' },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function MapaBodegasPage() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const upMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [up, setUp] = useState<UpData | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loadingBodegas, setLoadingBodegas] = useState(true);
  const [radioKm, setRadioKm] = useState(100);
  const [filtroTipoMaiz, setFiltroTipoMaiz] = useState('');
  const [coordsAproximadas, setCoordsAproximadas] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [bodegaConfirmada, setBodegaConfirmada] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  // ── 1. Init mapa ─────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-102.5528, 23.6345],
      zoom: 5,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.current.on('load', () => {
      setMapReady(true);
      map.current?.resize();
    });

    // Forzar resize para evitar contenedor de 0px en layouts flexibles
    setTimeout(() => map.current?.resize(), 100);
    setTimeout(() => map.current?.resize(), 500);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ── Toggle style ──────────────────────────────
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const style = mapStyle === 'streets'
      ? 'mapbox://styles/mapbox/streets-v12'
      : 'mapbox://styles/mapbox/satellite-streets-v12';
    map.current.setStyle(style);
    // re-draw after style loads
    map.current.once('styledata', () => {
      drawParcela();
      drawBodegas();
    });
  }, [mapStyle]); // eslint-disable-line

  // ── 2. Cargar UP ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const latReal = d.lat ?? null;
        const lngReal = d.lng ?? null;
        const usandoFallback = !latReal || !lngReal;
        setCoordsAproximadas(usandoFallback);
        if (d.municipio) {
          setUp({
            lat: latReal ?? 23.6345,
            lng: lngReal ?? -102.5528,
            location_confirmed: d.location_confirmed,
            centroid_source: d.centroid_source,
            municipio: d.municipio,
            estado: d.estado,
            poligono: d.poligono ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  // ── 3. Cargar bodegas ─────────────────────────
  useEffect(() => {
    if (!up) return;
    const token = localStorage.getItem('simac_token');
    setLoadingBodegas(true);
    const params = new URLSearchParams({
      lat: String(up.lat), lng: String(up.lng),
      radio_km: String(radioKm),
      ...(filtroTipoMaiz ? { tipo_maiz: filtroTipoMaiz } : {}),
    });
    fetch(`${BASE}/bodegas?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setBodegas(Array.isArray(d) ? d : d.bodegas || []))
      .catch(() => {})
      .finally(() => setLoadingBodegas(false));
  }, [up, radioKm, filtroTipoMaiz]);

  // ── 4. Dibuja polígono UP en el mapa ──────────
  const drawParcela = useCallback(() => {
    if (!map.current || !mapReady || !up) return;

    // Limpia capa anterior
    ['up-fill', 'up-outline', 'up-pulse'].forEach(id => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
    });
    if (map.current.getSource('up-source')) map.current.removeSource('up-source');

    if (upMarkerRef.current) { upMarkerRef.current.remove(); upMarkerRef.current = null; }

    const geom: GeoJSON.Geometry = up.poligono
      ? up.poligono
      : { type: 'Point', coordinates: [up.lng, up.lat] };

    map.current.addSource('up-source', {
      type: 'geojson',
      data: { type: 'Feature', geometry: geom, properties: {} }
    });

    if (up.poligono) {
      // Polígono azul relleno
      map.current.addLayer({
        id: 'up-fill',
        type: 'fill',
        source: 'up-source',
        paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.25 }
      });
      map.current.addLayer({
        id: 'up-outline',
        type: 'line',
        source: 'up-source',
        paint: { 'line-color': '#2563EB', 'line-width': 2.5, 'line-dasharray': [] }
      });
    }

    // Marcador animado en el centroide
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position:relative;width:28px;height:28px;cursor:pointer">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.6)"></div>
      </div>
      <style>
        @keyframes ping{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.5);opacity:0}}
      </style>
    `;

    const popupNode = document.createElement('div');
    const popupRoot = createRoot(popupNode);
    popupRoot.render(
      <div className="w-52 p-3 space-y-2.5 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={14} className="text-blue-600" />
          </div>
          <div className="overflow-hidden">
            <p className="font-black text-gray-900 text-[13px] leading-tight truncate">Tu Parcela</p>
            <p className="text-gray-500 text-[9px] truncate">{up.municipio}</p>
          </div>
        </div>
        <div className="bg-blue-50/80 rounded-lg p-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">Ubicación</span>
            <span className={`font-bold ${up.location_confirmed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {up.location_confirmed ? '✓ Conf.' : 'Aprox.'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">Lat,Lng</span>
            <span className="font-mono text-gray-700">{up.lat.toFixed(3)}, {up.lng.toFixed(3)}</span>
          </div>
        </div>
        {!up.location_confirmed && (
          <button onClick={() => navigate('/productor/ubicacion')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold py-2 rounded-lg transition-all shadow-sm mt-0.5">
            Actualizar ubicación →
          </button>
        )}
      </div>
    );

    const popup = new mapboxgl.Popup({ 
      anchor: 'bottom', 
      offset: [0, -14], 
      closeButton: false, 
      className: 'custom-premium-popup' 
    }).setDOMContent(popupNode);

    popup.on('open', () => {
      const isMobile = window.innerWidth < 1024;
      map.current?.flyTo({ 
        center: [up.lng, up.lat], 
        zoom: 13, 
        duration: 800,
        offset: [0, isMobile ? 120 : 60]
      });
    });

    upMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([up.lng, up.lat])
      .setPopup(popup)
      .addTo(map.current!);

    // Fly
    if (up.poligono) {
      const coords = up.poligono.coordinates[0] as [number, number][];
      const bounds = coords.reduce(
        (b, c) => b.extend(c as mapboxgl.LngLatLike),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1200 });
    } else {
      map.current.flyTo({ center: [up.lng, up.lat], zoom: up.location_confirmed ? 11 : 8, duration: 1200 });
    }
  }, [up, mapReady]);

  useEffect(() => { drawParcela(); }, [drawParcela]);

  // ── 5. Dibuja marcadores de bodegas ───────────
  const drawBodegas = useCallback(() => {
    if (!map.current || !mapReady) return;
    // Limpia anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    bodegas.filter(b => b.latitud && b.longitud).forEach(b => {
      const sem = SEMAFORO[b.estado_compra] || SEMAFORO.sin_actividad;

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position:relative;cursor:pointer;width:34px;height:40px">
          <svg viewBox="0 0 34 40" style="width:34px;height:40px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
            <path d="M17 2C9.82 2 4 7.82 4 15c0 9.75 13 23 13 23s13-13.25 13-23C30 7.82 24.18 2 17 2z" fill="${sem.fill}" stroke="white" stroke-width="1.5"/>
            <circle cx="17" cy="15" r="5" fill="white" opacity="0.9"/>
          </svg>
          ${b.is_ventanilla ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#7C3AED;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" style="width:7px;height:7px;fill:white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>` : ''}
        </div>
      `;
      const popupNode = document.createElement('div');
      const popupRoot = createRoot(popupNode);
      
      const cap = Number(b.capacidad_ton || 0);
      const stock = Number(b.stock_actual || 0);
      const pct = cap > 0 ? Math.min(100, (stock / cap) * 100) : 0;
      const libre = Math.max(0, cap - stock);

      popupRoot.render(
        <div className="w-[240px] p-3 space-y-2.5 bg-white relative">
          <div className="flex justify-between items-start border-b border-gray-100 pb-2">
            <div className="w-full overflow-hidden">
              <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-1 border"
                style={{ color: sem.fill, borderColor: sem.fill + '40', background: sem.fill + '15' }}>
                {sem.label}
              </span>
              <h3 className="font-black text-gray-900 text-[13px] leading-tight truncate">{b.nombre}</h3>
              <p className="text-gray-500 text-[9px] flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={9} className="flex-shrink-0" /> {b.municipio}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="bg-emerald-50 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-[#1A5C38]/10 flex items-center justify-center flex-shrink-0">
                  <Wheat size={12} className="text-[#1A5C38]" />
                </div>
                <p className="text-[10px] text-gray-600 font-medium">Precio hoy</p>
              </div>
              <p className="font-black text-[#1A5C38] text-[14px]">
                {b.precio_compra_hoy > 0 ? `$${Number(b.precio_compra_hoy).toLocaleString('es-MX')}` : '—'}
              </p>
            </div>

            {cap > 0 && (
              <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-gray-500 flex items-center gap-1"><Package size={9}/> {stock.toLocaleString()}t</span>
                  <span className="text-emerald-600 flex items-center gap-1"><Warehouse size={9}/> {libre.toLocaleString()}t</span>
                </div>
              </div>
            )}
            
            {b.senal_activa && (
              <div className="bg-blue-50/80 rounded-lg p-2.5">
                <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Señal de compra</p>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-gray-700 font-medium">{b.senal_activa.volumen_ton}t {b.senal_activa.tipo_maiz}</p>
                  <p className="text-emerald-600 font-black text-[12px]">${Number(b.senal_activa.precio_oferta).toLocaleString('es-MX')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1.5 pt-1 border-t border-gray-100">
            {b.senal_activa && (
              <button onClick={() => handleMeInteresa(b.senal_activa!.id, b.nombre)}
                className="flex-[1.5] bg-[#1A5C38] hover:bg-[#15482d] text-white text-[10px] font-black py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all">
                <CheckCircle2 size={11} /> Me interesa
              </button>
            )}
            <button onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-all">
              <Navigation size={10} /> Detalle
            </button>
          </div>
        </div>
      );

      const popup = new mapboxgl.Popup({ 
        anchor: 'bottom', 
        offset: [0, -42], 
        closeButton: false, 
        className: 'custom-premium-popup', 
        maxWidth: '300px' 
      }).setDOMContent(popupNode);

      popup.on('open', () => {
        const isMobile = window.innerWidth < 1024;
        map.current?.flyTo({ 
          center: [b.longitud, b.latitud], 
          zoom: 12.5, 
          duration: 800,
          offset: [0, isMobile ? 140 : 80]
        });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([b.longitud, b.latitud])
        .setPopup(popup)
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [bodegas, mapReady]);

  useEffect(() => { drawBodegas(); }, [drawBodegas]);

  // ── Me Interesa ───────────────────────────────
  const handleMeInteresa = async (senalId: number, nombreBodega?: string) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/senales-compra/${senalId}/interes`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    setBodegaConfirmada(nombreBodega || 'la bodega');
    setConfirmacionVisible(true);
    setTimeout(() => setConfirmacionVisible(false), 4000);
  };

  const comprando  = bodegas.filter(b => b.estado_compra === 'comprando').length;

  // ── RENDER ────────────────────────────────────
  return (
    <div className="absolute inset-0 flex flex-col bg-[#eef8f2]">

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 bg-gradient-to-r from-[#1A5C38] to-[#226b44] px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <MapIcon size={18} className="text-emerald-300" />
              <h1 className="text-white font-black text-[17px] sm:text-[20px] leading-tight tracking-tight">
                Mapa de Bodegas
              </h1>
            </div>
            <p className="text-emerald-200/80 text-[12px] sm:text-[13px] font-medium leading-snug">
              Encuentra bodegas activas cerca de tu parcela, compara precios y registra tu interés
            </p>
          </div>
          {/* Stats pill */}
          <div className="flex-shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/10">
            <div className="text-center">
              <p className="text-white font-black text-[15px] leading-none">{bodegas.length}</p>
              <p className="text-emerald-300/80 text-[9px] font-bold mt-0.5 uppercase tracking-wide">Bodegas</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-emerald-400 font-black text-[15px] leading-none">{comprando}</p>
              <p className="text-emerald-300/80 text-[9px] font-bold mt-0.5 uppercase tracking-wide">Comprando</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Aviso aproximado ── */}
      {coordsAproximadas && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
          <MapPin size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-[12px] font-medium flex-1">
            Ubicación aproximada — las distancias son estimadas desde tu municipio.
          </p>
          <button onClick={() => navigate('/productor/ubicacion')}
            className="text-amber-700 text-[11px] font-bold underline flex-shrink-0">
            Actualizar →
          </button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-3 py-2.5 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {(['', 'blanco', 'amarillo', 'criollo'] as const).map(tipo => (
            <button key={tipo || 'todos'} onClick={() => setFiltroTipoMaiz(tipo)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                filtroTipoMaiz === tipo
                  ? 'bg-[#1A5C38] text-white shadow-sm'
                  : 'bg-[#eef8f2] text-gray-600 hover:bg-emerald-100'}`}>
              {tipo === '' ? 'Todos' : `Maíz ${tipo}`}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1 self-stretch" />
          {[50, 100, 200, 500].map(km => (
            <button key={km} onClick={() => setRadioKm(km)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                radioKm === km
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* ── MAPA + PANEL ── */}
      <div className="flex-1 min-h-0 relative flex lg:p-4 gap-4">

        {/* Mapa */}
        <div className="flex-1 relative rounded-none lg:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ minHeight: '300px' }} />

          {/* Loading overlay */}
          {loadingBodegas && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-[12px] font-semibold text-gray-700">
              <div className="w-3 h-3 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
              Cargando bodegas…
            </div>
          )}

          {/* Style toggle */}
          <button
            onClick={() => setMapStyle(s => s === 'streets' ? 'satellite' : 'streets')}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5 text-[12px] font-bold text-gray-700 hover:bg-white transition-all">
            <Layers size={14} />
            {mapStyle === 'streets' ? 'Satélite' : 'Mapa'}
          </button>

          <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 z-10 bg-white/90 backdrop-blur-md rounded-xl p-2.5 shadow-lg space-y-1.5 border border-black/5">
            {Object.entries(SEMAFORO).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: v.fill }} />
                <span className="text-[10px] text-gray-700 font-medium">{v.label}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-1.5 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] text-gray-700 font-medium">Tu parcela</span>
            </div>
          </div>

          {/* Sin bodegas */}
          {bodegas.length === 0 && up && !loadingBodegas && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/70 backdrop-blur-sm">
              <div className="text-center px-6 max-w-xs bg-white rounded-2xl p-8 shadow-2xl">
                <MapIcon size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-800">No hay bodegas en {radioKm} km</p>
                <p className="text-sm text-gray-500 mt-1">Intenta ampliar el radio de búsqueda</p>
                {radioKm < 500 && (
                  <button onClick={() => setRadioKm(500)}
                    className="mt-4 px-4 py-2 bg-[#1A5C38] text-white rounded-xl text-sm font-semibold">
                    Buscar en 500 km
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {confirmacionVisible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[3000] bg-[#1A5C38] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs w-full mx-4">
          <CheckCircle2 size={22} className="flex-shrink-0" />
          <div>
            <p className="font-black text-[13px]">¡Interés registrado!</p>
            <p className="text-emerald-200 text-[11px] mt-0.5">{bodegaConfirmada} recibirá tu solicitud</p>
          </div>
        </div>
      )}
    </div>
  );
}
