import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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

  return (
    <div className="flex flex-col overflow-y-auto" style={{ height: 'calc(100dvh - 60px - 72px)' }}>
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-2xl shadow-[0_4px_20px_rgba(26,92,56,0.25)] flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-0.5 text-green-200/80 text-[13px] font-medium mb-1 active:opacity-60 transition-opacity">
            <ChevronLeft size={16} strokeWidth={2.5} className="-ml-1" /> Volver
          </button>
          <p className="text-[11px] font-semibold text-green-300/70 uppercase tracking-widest mb-1">Ubicacion</p>
          <h1 className="text-[18px] font-black text-white tracking-tight">Marca tu parcela</h1>
          <p className="text-[12px] font-medium text-white/40 mt-0.5">Toca el mapa donde esta tu terreno</p>
        </div>
      </div>

      <div className="flex-1 relative min-h-[300px] flex-shrink-0">
        <MapContainer ref={mapRef} center={[center.lat, center.lng]} zoom={poligonoExistente ? 13 : 5}
          style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
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
        <div className="absolute top-3 left-3 max-w-[calc(100%-80px)] w-72 sm:w-80 z-[1000]">
          <NominatimSearch placeholder="Buscar ejido, localidad..."
            onSelect={(lat, lng) => { setCoords({ lat, lng }); mapRef.current?.flyTo([lat, lng], 15); }} />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-zinc-200 space-y-2 flex-shrink-0">
        {areaCalc && coincideArea === null && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <p className="text-sm font-semibold text-gray-800 mb-2">Area calculada: {areaCalc} ha. &iquest;Es correcto?</p>
            <div className="flex gap-2">
              <button onClick={() => setCoincideArea(true)}
                className="flex-1 border-2 border-[#1A5C38] text-[#1A5C38] py-2 rounded-xl text-sm font-semibold">
                Si, correcto
              </button>
              <button onClick={() => setCoincideArea(false)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-semibold">
                No
              </button>
            </div>
          </div>
        )}
        {coincideArea === false && (
          <div className="flex items-center gap-2">
            <input type="number" min="0.1" step="0.1"
              value={areaReal} onChange={e => setAreaReal(e.target.value)}
              placeholder="Hectareas reales" className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-center focus:border-[#1A5C38] focus:outline-none" />
            <span className="text-gray-500">ha</span>
          </div>
        )}
        <button onClick={guardar} disabled={(!coords && !poligono) || loading}
          className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                     disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
          {loading ? 'Guardando...' : poligono ? 'Guardar poligono' : 'Usa las herramientas para dibujar tu parcela'}
        </button>
        <button onClick={() => navigate('/productor')}
          className="w-full text-zinc-400 py-2 text-sm hover:text-zinc-500 transition-colors">
          Ahora no
        </button>
      </div>
    </div>
  );
}
