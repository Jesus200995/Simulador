import { MapContainer, TileLayer, Marker, Circle, Polygon, useMap } from 'react-leaflet';
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
  poligono?: [number, number][] | null; // coordenadas [lng, lat] de geom_geojson
}

function FitPolygon({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const positions = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  const bounds = L.latLngBounds(positions);
  map.fitBounds(bounds, { padding: [20, 20] });
  return null;
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
  zoom = 14,
  poligono,
}: Props) {
  const showUncertainty = !locationConfirmed || centroidSource !== 'productor';
  const hasPolygon = poligono && poligono.length >= 3;

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
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={19}
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.6}
        />
        {hasPolygon ? (
          <>
            <FitPolygon coords={poligono!} />
            <Polygon
              positions={poligono!.map(([lng, lat]) => [lat, lng] as [number, number])}
              pathOptions={{ color: '#1A5C38', fillColor: '#1A5C38', fillOpacity: 0.2, weight: 2 }}
            />
          </>
        ) : (
          <>
            <MapCenter lat={lat} lng={lng} />
            <Marker position={[lat, lng]} />
            {showUncertainty && (
              <Circle
                center={[lat, lng]}
                radius={radioKm * 1000}
                pathOptions={{ color: '#1A5C38', fillColor: '#1A5C38', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
