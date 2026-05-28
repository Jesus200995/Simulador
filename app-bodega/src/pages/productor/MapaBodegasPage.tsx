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

const iconBodega = (estado: string) => new L.DivIcon({
  className: '',
  html: `<div class="w-10 h-10 rounded-full flex items-center justify-center shadow-md
    ${estado === 'comprando' ? 'bg-green-600' : estado === 'limitado' ? 'bg-yellow-500' : 'bg-red-500'}">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"/><path d="M2 22h20"/><path d="M12 2l10 10H2L12 2z"/></svg></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

interface Bodega {
  id: number; nombre: string; municipio: string; latitud: number; longitud: number;
  estado_compra: string; precio_compra_hoy: number; is_ventanilla: boolean;
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
  const [radioKm, setRadioKm] = useState(150);

  // 1. Cargar UP con coordenadas reales
  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.municipio) setUp({
          lat: d.lat ?? 23.6345,
          lng: d.lng ?? -102.5528,
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
    fetch(`${BASE}/bodegas?lat=${up.lat}&lng=${up.lng}&radio_km=${radioKm}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBodegas(Array.isArray(d) ? d : d.bodegas || []))
      .catch(() => {})
      .finally(() => setLoadingBodegas(false));
  }, [up, radioKm]);

  const handleMeInteresa = async (senalId: number) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/senales-compra/${senalId}/interes`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    alert('Le avisamos a la bodega que estás interesado');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 60px - 72px)' }}>
      <div className="flex-1 relative">
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
              icon={iconBodega(b.estado_compra || 'comprando')}>
              <Popup>
                <div className="p-1 min-w-48">
                  <p className="font-bold text-gray-800 text-sm">{b.nombre}</p>
                  <p className="text-xs text-gray-500">{b.municipio}</p>
                  {b.precio_compra_hoy > 0 && (
                    <p className="text-sm font-semibold text-[#1A5C38] mt-1">
                      ${Number(b.precio_compra_hoy).toLocaleString('es-MX')}/ton
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleMeInteresa(b.id)}
                      className="flex-1 bg-[#1A5C38] text-white text-xs py-2 rounded-lg font-semibold">
                      Me interesa
                    </button>
                    <button onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
                      className="flex-1 border border-gray-300 text-gray-700 text-xs py-2 rounded-lg">
                      Detalle
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
    </div>
  );
}
