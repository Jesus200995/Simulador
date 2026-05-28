import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Maximize2 } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import NominatimSearch from '../../components/productor/NominatimSearch';
import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function CompletarUbicacionPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [poligono, setPoligono] = useState<[number, number][] | null>(null);
  const [areaCalc, setAreaCalc] = useState<number | null>(null);
  const [areaReal, setAreaReal] = useState('');
  const [coincideArea, setCoincideArea] = useState<boolean | null>(null);
  const [poligonoExistente, setPoligonoExistente] = useState<[number, number][] | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 23.6345, lng: -102.5528 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('simac_token');
    fetch(`${BASE}/productor/mi-up`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(up => {
        if (up?.geom_coordenadas) setPoligonoExistente(up.geom_coordenadas);
        if (up?.lat && up?.lng) setCenter({ lat: up.lat, lng: up.lng });
      })
      .catch(() => {});
  }, []);

  const guardar = async () => {
    if (!coords && !poligono) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('simac_token');
      const centroide = coords || center;
      const areaRealNum = coincideArea === false && areaReal ? Number(areaReal) : areaCalc;
      await fetch(`${BASE}/productor/ubicacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lat: centroide.lat, lng: centroide.lng,
          poligono: poligono || null,
          area_calc_ha: areaCalc || null,
          area_real_ha: areaRealNum,
          coincide_area: coincideArea,
        }),
      });
      localStorage.removeItem('dismiss_ubicacion');
      navigate('/productor');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(f => !f);
    setTimeout(() => mapRef.current?.invalidateSize(), 300);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: isFullscreen ? '100dvh' : 'calc(100dvh - 60px - 72px)',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
        background: '#F2F2F7',
      }}
    >
      {/* ── Header ── */}
      {!isFullscreen && (
        <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-2xl shadow-[0_4px_20px_rgba(26,92,56,0.25)] flex-shrink-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-4">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1 active:opacity-60 transition-opacity">
              <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
            </button>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-green-300/70" />
              <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest">Ubicación</p>
            </div>
            <h1 className="text-[18px] font-black text-white tracking-tight">Marca tu parcela</h1>
            <p className="text-[12px] font-medium text-white/40 mt-0.5">Dibuja el contorno de tu terreno en el mapa</p>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <div className="flex-1 relative min-h-0">
        <MapContainer
          ref={mapRef}
          center={[center.lat, center.lng]}
          zoom={poligonoExistente ? 13 : 5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
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
          <DibujarPoligonoUP
            poligonoInicial={poligonoExistente ?? undefined}
            onPoligonoCompleto={(coords2, centroide, ha) => {
              setPoligono(coords2);
              setCoords(centroide);
              setAreaCalc(ha);
              setCoincideArea(null);
            }}
            onPoligonoEliminado={() => { setPoligono(null); setAreaCalc(null); setCoincideArea(null); }}
          />
        </MapContainer>

        {/* Search bar — floats top-left, won't block drawing */}
        <div className="absolute top-3 left-3 right-16 sm:right-auto sm:w-80 z-[1000]">
          <NominatimSearch
            placeholder="Buscar ejido, localidad..."
            onSelect={(lat, lng) => { setCoords({ lat, lng }); mapRef.current?.flyTo([lat, lng], 15); }}
          />
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-[1000] w-9 h-9 flex items-center justify-center
                     bg-white/80 backdrop-blur-lg rounded-xl shadow-md
                     active:scale-90 transition-transform"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          <Maximize2 size={16} className="text-zinc-700" />
        </button>

        {/* Back button in fullscreen */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 left-[calc(100%-170px)] sm:left-auto sm:right-14 z-[1000]
                       flex items-center gap-1 px-3 py-2 bg-black/50 backdrop-blur-lg rounded-xl
                       text-white text-xs font-semibold active:opacity-70 transition-opacity"
          >
            <ChevronLeft size={14} /> Salir
          </button>
        )}
      </div>

      {/* ── Bottom panel ── */}
      {!isFullscreen && (
        <div className="px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-xl border-t border-zinc-200/80 space-y-2 flex-shrink-0">
          {areaCalc && coincideArea === null && (
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Área calculada: {areaCalc} ha. ¿Es correcto?</p>
              <div className="flex gap-2">
                <button onClick={() => setCoincideArea(true)}
                  className="flex-1 border-2 border-[#1A5C38] text-[#1A5C38] py-2 rounded-xl text-sm font-semibold
                             active:scale-[0.97] transition-transform">
                  Sí, correcto
                </button>
                <button onClick={() => setCoincideArea(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-semibold
                             active:scale-[0.97] transition-transform">
                  No
                </button>
              </div>
            </div>
          )}
          {coincideArea === false && (
            <div className="flex items-center gap-2">
              <input type="number" min="0.1" step="0.1"
                value={areaReal} onChange={e => setAreaReal(e.target.value)}
                placeholder="Hectáreas reales"
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-center
                           focus:border-[#1A5C38] focus:outline-none transition-colors" />
              <span className="text-gray-500 text-sm font-medium">ha</span>
            </div>
          )}
          <button onClick={guardar} disabled={(!coords && !poligono) || loading}
            className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-3.5 rounded-2xl text-[15px] font-semibold
                       disabled:opacity-40 active:scale-[0.98] transition-all duration-200
                       shadow-[0_4px_16px_rgba(26,92,56,0.2)]">
            {loading ? 'Guardando...' : poligono ? 'Guardar polígono' : 'Dibuja tu parcela con el botón verde'}
          </button>
          <button onClick={() => navigate('/productor')}
            className="w-full text-zinc-400 py-1.5 text-sm hover:text-zinc-500 transition-colors">
            Ahora no
          </button>
        </div>
      )}
    </div>
  );
}
