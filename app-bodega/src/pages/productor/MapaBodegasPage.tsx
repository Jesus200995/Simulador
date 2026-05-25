import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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
    <span class="text-white text-lg">🏪</span></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

interface Bodega {
  id: number; nombre: string; municipio: string; latitud: number; longitud: number;
  estado_compra: string; precio_compra_hoy: number; is_ventanilla: boolean;
}

interface UpData {
  lat: number; lng: number; location_confirmed: boolean; centroid_source: string;
}

export default function MapaBodegasPage() {
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [up, setUp] = useState<UpData | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    // Cargar bodegas
    fetch(`${BASE}/bodegas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setBodegas(Array.isArray(d) ? d : d.bodegas || []))
      .catch(() => {});
    // Cargar UP
    fetch(`${BASE}/productor/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.municipio) setUp({ lat: 23.6, lng: -102.5, location_confirmed: d.location_confirmed, centroid_source: d.centroid_source });
      })
      .catch(() => {});
  }, []);

  const handleMeInteresa = async (senalId: number) => {
    const token = localStorage.getItem('simac_token');
    await fetch(`${BASE}/senales-compra/${senalId}/interes`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    alert('Le avisamos a la bodega que estás interesado');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center px-4 py-3 border-b bg-white z-10">
        <button onClick={() => navigate('/productor')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800">Mapa de bodegas</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          ref={setMapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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
