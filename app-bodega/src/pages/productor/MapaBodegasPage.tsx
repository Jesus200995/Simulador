import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import NominatimSearch from '../../components/productor/NominatimSearch';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const iconBodega = (estado: string) => {
  let color = '#6B7280'; // sin_actividad (Gris) — estado neutro por defecto
  if (estado === 'comprando') color = '#10B981'; // Verde
  if (estado === 'limitado') color = '#f59e0b'; // Naranja
  if (estado === 'no_compra') color = '#ef4444'; // Rojo

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <path stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke fill" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker-premium',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
};

interface Bodega {
  id: number; nombre: string; municipio: string; latitud: number; longitud: number;
  estado_compra: string; precio_compra_hoy: number; is_ventanilla: boolean;
  senal_activa?: { id: number; precio_oferta: number; volumen_ton: number; tipo_maiz: string } | null;
}

interface UpData {
  lat: number; lng: number; location_confirmed: boolean; centroid_source: string;
  municipio?: string; estado?: string;
}

function FlyToUP({ up }: { up: UpData | null }) {
  const map = useMap();
  useEffect(() => {
    if (up) {
      map.flyTo([up.lat, up.lng], up.location_confirmed ? 11 : 8, { animate: true, duration: 1.2 });
    }
  }, [up, map]);
  return null;
}

export default function MapaBodegasPage() {
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [up, setUp] = useState<UpData | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [loadingBodegas, setLoadingBodegas] = useState(true);
  const [radioKm, setRadioKm] = useState(100);
  const [filtroTipoMaiz, setFiltroTipoMaiz] = useState<string>('');
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [bodegaConfirmada, setBodegaConfirmada] = useState<string>('');
  const [coordsAproximadas, setCoordsAproximadas] = useState(false);

  // 1. Cargar UP con coordenadas reales
  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const latReal = d.lat ?? null;
        const lngReal = d.lng ?? null;
        const usandoFallback = !latReal || !lngReal;
        setCoordsAproximadas(usandoFallback);

        if (d.municipio) setUp({
          lat: latReal ?? 23.6345,
          lng: lngReal ?? -102.5528,
          location_confirmed: d.location_confirmed,
          centroid_source: d.centroid_source,
          municipio: d.municipio,
          estado: d.estado,
        });
      })
      .catch(() => {});
  }, []);

  // 2. Cargar bodegas filtradas por radio cuando tengamos la UP
  useEffect(() => {
    if (!up) return;
    const token = localStorage.getItem('simac_token');
    setLoadingBodegas(true);
    const params = new URLSearchParams({
      lat: String(up.lat),
      lng: String(up.lng),
      radio_km: String(radioKm),
      ...(filtroTipoMaiz ? { tipo_maiz: filtroTipoMaiz } : {}),
    });
    fetch(`${BASE}/bodegas?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBodegas(Array.isArray(d) ? d : d.bodegas || []))
      .catch(() => {})
      .finally(() => setLoadingBodegas(false));
  }, [up, radioKm, filtroTipoMaiz]);

  const handleMeInteresa = async (senalId: number, nombreBodega?: string) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/senales-compra/${senalId}/interes`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    setBodegaConfirmada(nombreBodega || 'la bodega');
    setConfirmacionVisible(true);
    setTimeout(() => setConfirmacionVisible(false), 4000);
  };

  return (
    <div className="w-full h-full flex flex-col relative min-h-[500px]">
      {coordsAproximadas && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-amber-800 text-sm font-medium">
              Distancias aproximadas
            </p>
            <p className="text-amber-700 text-xs mt-0.5 leading-snug">
              Tu parcela no tiene ubicación exacta.
              Las distancias mostradas son estimadas desde tu municipio.
            </p>
          </div>
          <button
            onClick={() => navigate('/productor/ubicacion')}
            className="text-xs text-amber-700 font-semibold underline whitespace-nowrap flex-shrink-0"
          >
            Actualizar →
          </button>
        </div>
      )}

      {/* Barra de filtros: tipo de maíz (#9) y radio (#10) */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 py-2.5 space-y-2">
        {/* Tipo de maíz */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {['', 'blanco', 'amarillo', 'criollo'].map(tipo => (
            <button
              key={tipo || 'todos'}
              onClick={() => setFiltroTipoMaiz(tipo)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filtroTipoMaiz === tipo
                  ? 'bg-[#1A5C38] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tipo === '' ? 'Todos' : `Maíz ${tipo}`}
            </button>
          ))}
        </div>
        {/* Radio */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium shrink-0">Radio:</span>
          <div className="flex gap-1">
            {[50, 100, 200, 500].map(km => (
              <button
                key={km}
                onClick={() => setRadioKm(km)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  radioKm === km
                    ? 'bg-[#1A5C38] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full">
        <MapContainer
          center={up ? [up.lat, up.lng] : [23.6345, -102.5528]}
          zoom={up?.location_confirmed ? 11 : 6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          ref={setMapRef}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            opacity={0.6}
          />
          <FlyToUP up={up} />

          {/* UP del productor */}
          {up && (
            <>
              <Marker position={[up.lat, up.lng]} />
              {!up.location_confirmed && up.centroid_source === 'municipio' && (
                <Circle
                  center={[up.lat, up.lng]}
                  radius={5000}
                  pathOptions={{ color: '#1A5C38', fillColor: '#1A5C38', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
                />
              )}
            </>
          )}

          {/* Bodegas */}
          {bodegas.filter(b => b.latitud && b.longitud).map(b => (
            <Marker key={b.id} position={[b.latitud, b.longitud]}
              icon={iconBodega(b.estado_compra || 'sin_actividad')}>
              <Popup className="custom-premium-popup" autoPan={false}>
                <div className="p-3.5 space-y-2.5 text-white">
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      b.estado_compra === 'comprando' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                      b.estado_compra === 'limitado' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      b.estado_compra === 'no_compra' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                      'text-gray-300 bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      {b.estado_compra === 'comprando' ? 'Comprando' :
                       b.estado_compra === 'limitado' ? 'Cap. limitada' :
                       b.estado_compra === 'no_compra' ? 'No compra' :
                       'Sin actividad'}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-extrabold text-[13px] text-white tracking-tight leading-tight mb-1 truncate">{b.nombre}</h4>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      📍 {b.municipio}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-300 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Precio hoy:</span>
                      <strong className={b.precio_compra_hoy > 0 ? 'text-emerald-400 font-bold' : 'text-gray-500 font-medium'}>
                        {b.precio_compra_hoy > 0 ? `$${Number(b.precio_compra_hoy).toLocaleString('es-MX')}/ton` : 'Sin precio publicado'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1">
                    {b.senal_activa && (
                      <button onClick={() => handleMeInteresa(b.senal_activa!.id, b.nombre)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center">
                        Me interesa ✓
                      </button>
                    )}
                    <button onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
                      className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[10px] font-black py-2.5 rounded-xl transition-all border border-white/10 flex items-center justify-center">
                        Detalle →
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Sin bodegas en el radio */}
        {bodegas.length === 0 && up && !loadingBodegas && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-white/80 backdrop-blur-sm">
            <div className="text-center px-6 max-w-xs">
              <p className="text-4xl mb-3">🗺</p>
              <p className="font-semibold text-gray-800">No hay bodegas en {radioKm} km</p>
              <p className="text-sm text-gray-500 mt-2">Estamos ampliando la red. Intenta con un radio mayor.</p>
              {radioKm < 500 && (
                <button onClick={() => setRadioKm(500)}
                  className="mt-4 text-[#1A5C38] font-semibold text-sm underline">
                  Buscar en 500 km
                </button>
              )}
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <NominatimSearch
            placeholder="Buscar ejido, localidad..."
            onSelect={(lat, lng) => mapRef?.flyTo([lat, lng], 13)}
          />
        </div>
      </div>

      {/* Toast de confirmación "Me interesa" */}
      {confirmacionVisible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000]
                        bg-[#1A5C38] text-white px-6 py-4 rounded-2xl shadow-2xl
                        flex items-center gap-3 animate-fade-in max-w-xs w-full mx-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-sm">¡Interés registrado!</p>
            <p className="text-green-200 text-xs mt-0.5">
              {bodegaConfirmada} recibirá tu solicitud
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
