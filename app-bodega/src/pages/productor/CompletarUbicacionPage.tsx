import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function CompletarUbicacionPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('simac_token');
      await fetch(`${BASE}/productor/ubicacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
      });
      localStorage.removeItem('dismiss_ubicacion');
      navigate('/productor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 60px - 72px)' }}>
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-2xl shadow-[0_4px_20px_rgba(26,92,56,0.15)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
          </button>
          <h1 className="text-[18px] font-bold text-white">Marca tu parcela</h1>
          <p className="text-[12px] text-green-200/60 mt-0.5">Toca el mapa donde esta tu terreno</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer ref={mapRef} center={[23.6345, -102.5528]} zoom={5}
          style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={(lat, lng) => setCoords({ lat, lng })} />
          {coords && <Marker position={[coords.lat, coords.lng]} />}
        </MapContainer>
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <NominatimSearch placeholder="Buscar ejido, localidad..."
            onSelect={(lat, lng) => { setCoords({ lat, lng }); mapRef.current?.flyTo([lat, lng], 15); }} />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-zinc-200 space-y-2">
        <button onClick={guardar} disabled={!coords || loading}
          className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                     disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
          {loading ? 'Guardando...' : coords ? 'Confirmar ubicacion' : 'Toca el mapa para marcar'}
        </button>
        <button onClick={() => navigate('/productor')}
          className="w-full text-zinc-400 py-2 text-sm hover:text-zinc-500 transition-colors">
          Ahora no
        </button>
      </div>
    </div>
  );
}
