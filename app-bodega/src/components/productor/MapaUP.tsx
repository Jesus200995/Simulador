import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  lat: number;
  lng: number;
  locationConfirmed: boolean;
  centroidSource: string;
  radioKm?: number;
  height?: string;
  zoom?: number;
}

// Componente para centrar el mapa automáticamente
function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.setView([lat, lng], map.getZoom());
  return null;
}

/**
 * MapaUP - Mapa estático de la Unidad Productiva
 * Muestra el centroide con pin verde y radio de incertidumbre si aplica
 * Usado en P-17 Mi Perfil
 */
export default function MapaUP({
  lat,
  lng,
  locationConfirmed,
  centroidSource,
  radioKm = 5,
  height = '200px',
  zoom = 14
}: Props) {
  // Si la ubicación no está confirmada por el productor, mostramos radio de incertidumbre
  const showUncertainty = !locationConfirmed || centroidSource !== 'productor';

  return (
    <div style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapCenter lat={lat} lng={lng} />
        
        {/* Pin verde en el centroide */}
        <Marker position={[lat, lng]} />
        
        {/* Radio de incertidumbre si la ubicación es aproximada */}
        {showUncertainty && (
          <Circle
            center={[lat, lng]}
            radius={radioKm * 1000} // convertir km a metros
            pathOptions={{
              color: '#1A5C38',
              fillColor: '#1A5C38',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6 4'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
