import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Undo2, CheckCircle2, Footprints, Loader2, ChevronDown } from 'lucide-react';
import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';
import type { DibujarPoligonoHandle, DrawMode } from '../../components/productor/DibujarPoligonoUP';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function AgregarUPPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('simac_token') || '';
  const dibujarRef = useRef<DibujarPoligonoHandle>(null);

  const [nombreUP, setNombreUP] = useState('');
  const [estadoUp, setEstadoUp] = useState('');
  const [municipioUp, setMunicipioUp] = useState('');
  const [estadoId, setEstadoId] = useState('');
  const [estados, setEstados] = useState<{ state_id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ municipality_id: string; name: string }[]>([]);

  // Catálogo de estados (mismo endpoint que el registro inicial)
  useEffect(() => {
    fetch(`${BASE}/auth/states`)
      .then(r => r.json())
      .then(d => setEstados(d.states || (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

  // Municipios filtrados por estado seleccionado
  useEffect(() => {
    if (!estadoId) { setMunicipios([]); return; }
    fetch(`${BASE}/auth/municipalities?state_id=${estadoId}`)
      .then(r => r.json())
      .then(d => setMunicipios(d.municipalities || (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, [estadoId]);
  const [paso, setPaso] = useState<'info' | 'mapa'>('info');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setDrawMode] = useState<DrawMode>('idle');
  const [pointCount, setPointCount] = useState(0);
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([23.6, -102.5]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const guardar = async (
    poligono: [number, number][] | null,
    coords: { lat: number; lng: number } | null,
    areaCalc: number | null
  ) => {
    if (!estadoUp || !municipioUp) { setError('Selecciona el estado y municipio de tu parcela.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/productor/ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre_up: nombreUP || undefined,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          poligono: poligono ?? null,
          area_calc_ha: areaCalc,
          area_real_ha: areaCalc,
          coincide_area: true,
          estado_up: estadoUp,
          municipio_up: municipioUp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar la parcela.');
        if (res.status === 409) setPaso('mapa');
        return;
      }
      navigate('/productor/perfil', {
        state: { mensaje: `Parcela "${data.up.up_name}" registrada correctamente` },
      });
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const puedeTerminar = pointCount >= 3;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-[1100]">
        <button onClick={() => paso === 'mapa' ? setPaso('info') : navigate(-1)} className="p-2 rounded-lg hover:bg-[#eef8f2]">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-gray-900">Agregar parcela</h1>
          <p className="text-xs text-gray-500">Nueva unidad productiva</p>
        </div>
      </div>

      {paso === 'info' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la parcela (opcional)</label>
            <input type="text" value={nombreUP} onChange={e => setNombreUP(e.target.value)}
              placeholder="Ej: Parcela Norte, El Potrero, etc."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
              <div className="relative">
                <select
                  value={estadoId}
                  onChange={e => {
                    const sel = estados.find(s => s.state_id === e.target.value);
                    setEstadoId(e.target.value);
                    setEstadoUp(sel?.name || '');
                    setMunicipios([]);
                    setMunicipioUp('');
                  }}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
                >
                  <option value="">Selecciona tu estado</option>
                  {estados.map(s => <option key={s.state_id} value={s.state_id}>{s.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Municipio *</label>
              <div className="relative">
                <select
                  value={municipioUp}
                  onChange={e => setMunicipioUp(e.target.value)}
                  disabled={!estadoId}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5C38] disabled:bg-[#f4fbf7] disabled:text-gray-400"
                >
                  <option value="">{estadoId ? 'Selecciona tu municipio' : 'Primero elige el estado'}</option>
                  {municipios.map(m => <option key={m.municipality_id} value={m.name}>{m.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>
          )}

          <button onClick={() => setPaso('mapa')} disabled={!estadoUp || !municipioUp}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-semibold disabled:opacity-40">
            Continuar → Dibujar en mapa
          </button>
          <button onClick={() => guardar(null, null, null)} disabled={!estadoUp || !municipioUp || enviando}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm disabled:opacity-40">
            {enviando ? 'Guardando…' : 'Guardar sin dibujar (usar municipio como ubicación)'}
          </button>
        </div>
      )}

      {paso === 'mapa' && (
        <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
          <p className="text-xs text-center text-gray-500 py-2 bg-white">REGISTRO INICIAL DE PARCELAS Y PRODUCCIÓN</p>

          <div className="relative" style={{ height: 'calc(100% - 34px)' }}>
            <MapContainer center={center} zoom={mapReady ? 16 : 5} style={{ height: '100%', width: '100%' }}
              whenReady={() => setMapReady(true)}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="© Esri" />
              <DibujarPoligonoUP
                ref={dibujarRef}
                onModeChange={setDrawMode}
                onPointCountChange={setPointCount}
                onPoligonoCompleto={(coords, centroide, area) => {
                  guardar(coords, centroide, area);
                }}
                onPoligonoEliminado={() => {}}
              />
            </MapContainer>

            {/* Controles */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto space-y-2.5">
              <p className="text-center text-[11px] text-white bg-black/40 rounded-lg px-3 py-1.5">
                {pointCount === 0
                  ? 'Toca el mapa en cada esquina de tu parcela para marcarla.'
                  : 'Toca la siguiente esquina. Cuando termines, pulsa Finalizar.'}
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-700 text-xs">{error}</p></div>
              )}

              <button
                onClick={() => {
                  setCapturandoGPS(true); setGpsMsg(null);
                  dibujarRef.current?.addPointGPS((info) => {
                    setCapturandoGPS(false);
                    if (!info.ok) setGpsMsg(info.error);
                    else if (info.accuracy > 30) setGpsMsg(`Punto registrado, señal GPS débil (±${Math.round(info.accuracy)} m).`);
                    else setGpsMsg(`Punto registrado (±${Math.round(info.accuracy)} m).`);
                  });
                }}
                disabled={capturandoGPS}
                className="w-full bg-white/90 ring-1 ring-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {capturandoGPS
                  ? (<><Loader2 size={16} className="animate-spin" /> Obteniendo ubicación…</>)
                  : (<><Footprints size={16} /> Estoy en la esquina — usar mi GPS</>)}
              </button>
              {gpsMsg && <p className="text-center text-[11px] text-gray-600 bg-white/90 rounded-lg px-3 py-1.5">{gpsMsg}</p>}

              {pointCount > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => dibujarRef.current?.undoVertex()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 ring-1 ring-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold">
                    <Undo2 size={16} /> Deshacer
                  </button>
                  <button onClick={() => dibujarRef.current?.finishDraw()} disabled={!puedeTerminar || enviando}
                    className="flex-[1.4] flex items-center justify-center gap-1.5 bg-[#1A5C38] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40">
                    <CheckCircle2 size={17} />
                    {enviando ? 'Guardando…' : puedeTerminar ? `Finalizar (${pointCount})` : `Faltan ${Math.max(0, 3 - pointCount)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
