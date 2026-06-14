import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Wheat, CircleDot, Check,
  AlertCircle, User, MapPin, Sprout, Map, Phone, Loader2,
  Undo2, Pencil, Trash2, CheckCircle2, Plus, KeyRound, ShieldCheck,
} from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PinInput from '../../components/productor/PinInput';
import NominatimSearch from '../../components/productor/NominatimSearch';
import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';
import type { DibujarPoligonoHandle, DrawMode } from '../../components/productor/DibujarPoligonoUP';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PROGRAMAS = [
  { clave: 'fertilizantes_bienestar', nombre: 'Fertilizantes para el Bienestar' },
  { clave: 'produccion_bienestar', nombre: 'Producción para el Bienestar' },
  { clave: 'precios_garantia', nombre: 'Precios de Garantía' },
  { clave: 'maiz_blanco_precio_justo', nombre: 'Maíz Blanco / Precio Justo' },
  { clave: 'maiz_es_raiz', nombre: 'Plan El Maíz es la Raíz' },
  { clave: 'cosechando_soberania', nombre: 'Cosechando Soberanía' },
  { clave: 'sembrando_vida', nombre: 'Sembrando Vida' },
];

const PASOS_INFO = [
  { icon: User,     label: 'Datos' },
  { icon: MapPin,   label: 'Ubicación' },
  { icon: Sprout,   label: 'Cultivo' },
  { icon: Map,      label: 'Parcela' },
  { icon: Phone,    label: 'Contacto' },
  { icon: KeyRound, label: 'PIN' },
];
const TOTAL_PASOS = PASOS_INFO.length;

function normalizeText(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

const inputCls =
  'w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-base text-white ' +
  'placeholder-white/30 focus:ring-2 focus:ring-white/50 focus:outline-none transition-all';

const selectCls =
  'w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-base text-white ' +
  'focus:ring-2 focus:ring-white/50 focus:outline-none transition-all appearance-none';

export default function RegistroNuevoPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);
  const dibujarRef = useRef<DibujarPoligonoHandle>(null);

  const [paso, setPaso] = useState(1);
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Datos personales
  const [nombres, setNombres] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [curp, setCurp] = useState('');

  // Ubicación
  const [estados, setEstados] = useState<{ state_id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ municipality_id: string; name: string }[]>([]);
  const [estadoUp, setEstadoUp] = useState('');
  const [estadoUpNombre, setEstadoUpNombre] = useState('');
  const [municipioUp, setMunicipioUp] = useState('');

  // Cultivo
  const [tipoMaiz, setTipoMaiz] = useState('');

  // Mapa / parcela
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [poligono, setPoligono] = useState<[number, number][] | null>(null);
  const [areaCalc, setAreaCalc] = useState<number | null>(null);
  const [areaReal, setAreaReal] = useState('');
  const [coincideArea, setCoincideArea] = useState<boolean | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('idle');
  const [pointCount, setPointCount] = useState(0);
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [geoDetectado, setGeoDetectado] = useState<{ estado: string; municipio: string } | null>(null);
  const [detectandoGeo, setDetectandoGeo] = useState(false);

  // Detecta estado/municipio EXACTOS según dónde quedó marcada la parcela
  const detectarUbicacion = async (lat: number, lng: number) => {
    setDetectandoGeo(true);
    try {
      const r = await fetch(`${BASE}/productor/geo/reverse?lat=${lat}&lng=${lng}`);
      const d = await r.json();
      if (d.estado || d.municipio) {
        setGeoDetectado({ estado: d.estado || '', municipio: d.municipio || '' });
        // Autocompletar los campos del paso 2 con la ubicación real de la parcela
        if (d.estado) setEstadoUpNombre(d.estado);
        if (d.municipio) setMunicipioUp(d.municipio);
        if (d.state_id) setEstadoUp(d.state_id);
      }
    } catch { /* silencioso: el backend igual lo resuelve al guardar */ }
    finally { setDetectandoGeo(false); }
  };

  // Contacto
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [programas, setProgramas] = useState<string[]>([]);

  // PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'crear' | 'confirmar'>('crear');
  const [pinError, setPinError] = useState(false);

  const pinConfirmado = pin.length === 4 && confirmPin.length === 4 && pin === confirmPin;

  useEffect(() => {
    fetch(`${BASE}/auth/states`)
      .then(r => r.json())
      .then(d => setEstados(d.states || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!estadoUp) return;
    fetch(`${BASE}/auth/municipalities?state_id=${estadoUp}`)
      .then(r => r.json())
      .then(d => setMunicipios(d.municipalities || []))
      .catch(() => {});
  }, [estadoUp]);

  const irAPaso = (nuevoPaso: number) => {
    setAnimDir(nuevoPaso > paso ? 'left' : 'right');
    setError('');
    setPaso(nuevoPaso);
  };

  const handleBack = () => {
    if (paso > 1) irAPaso(paso - 1);
    else navigate('/');
  };

  const togglePrograma = (clave: string) => {
    setProgramas(prev =>
      prev.includes(clave) ? prev.filter(p => p !== clave) : [...prev, clave]
    );
  };

  const handlePinChange = (val: string) => {
    setPinError(false);
    if (pinStep === 'crear') {
      setPin(val);
      if (val.length === 4) setTimeout(() => setPinStep('confirmar'), 250);
    } else {
      setConfirmPin(val);
      if (val.length === 4 && val !== pin) {
        setPinError(true);
        setTimeout(() => { setConfirmPin(''); setPinError(false); }, 600);
      }
    }
  };

  const reiniciarPin = () => {
    setPin(''); setConfirmPin(''); setPinStep('crear'); setPinError(false);
  };

  const canAdvance = () => {
    switch (paso) {
      case 1: return !!(nombres && apPaterno && curp.length === 18);
      case 2: return !!(estadoUp && municipioUp);
      case 3: return !!tipoMaiz;
      case 4: return true;
      case 5: return telefono.length === 10;
      default: return false;
    }
  };

  const enviarRegistro = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/registro-nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curp, nombres, apellido_paterno: apPaterno, apellido_materno: apMaterno,
          estado_up: estadoUpNombre, municipio_up: municipioUp,
          tipo_maiz: tipoMaiz,
          lat: coords?.lat ?? null, lng: coords?.lng ?? null,
          poligono: poligono ?? null,
          area_calc_ha: areaCalc || null,
          area_real_ha: (coincideArea === false && areaReal) ? Number(areaReal) : areaCalc,
          coincide_area: coincideArea,
          telefono, pin: confirmPin, programas_beneficiario: programas,
          correo: correo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar');
        // Overlap de polígono: regresar al mapa (paso 4) para que el productor redibuje
        if (res.status === 409 && data.up_conflicto) setPaso(4);
        return;
      }
      setRegistroExitoso(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── PASO 4 — Mapa full-screen con mira + botón ────────────────────────────
  if (paso === 4) {
    const puntosNecesarios = Math.max(0, 3 - pointCount);
    const puedeTerminar = pointCount >= 3;
    const dibujando = drawMode === 'drawing' || (drawMode === 'idle' && !poligono);
    const miraVisible = dibujando;

    return (
      <div
        className="fixed inset-0 flex flex-col bg-[#0c2e1a]"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/5">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          <div className="flex-1 min-w-0">
            {drawMode === 'idle' && !poligono && (
              <>
                <p className="text-white font-bold text-sm leading-tight">REGISTRO INICIAL DE PARCELAS Y PRODUCCIÓN</p>
                <p className="text-white/45 text-xs">Dibuja el contorno de tu parcela. Toca cada esquina para agregar un punto.</p>
              </>
            )}
            {drawMode === 'drawing' && (
              <>
                <p className="text-green-300 font-bold text-sm leading-tight">
                  {pointCount} punto{pointCount !== 1 ? 's' : ''} marcado{pointCount !== 1 ? 's' : ''}
                </p>
                <p className="text-white/45 text-xs">
                  {puedeTerminar ? 'Ya puedes finalizar' : `Faltan ${puntosNecesarios} para cerrar`}
                </p>
              </>
            )}
            {drawMode === 'idle' && poligono && (
              <>
                <p className="text-white font-bold text-sm leading-tight">Parcela dibujada</p>
                <p className="text-white/45 text-xs">{areaCalc} ha calculadas</p>
              </>
            )}
            {drawMode === 'editing' && (
              <>
                <p className="text-amber-300 font-bold text-sm leading-tight">Editando parcela</p>
                <p className="text-white/45 text-xs">Arrastra los puntos para ajustar</p>
              </>
            )}
          </div>

          {/* Stepper mini */}
          <div className="flex gap-1 flex-shrink-0">
            {Array.from({ length: TOTAL_PASOS }, (_, i) => i + 1).map(n => (
              <div key={n} className={`h-1 w-3 rounded-full transition-colors ${n <= paso ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative min-h-0">
          {/* Mira central — el punto verde marca EXACTAMENTE el centro del mapa */}
          {miraVisible && (
            <div className="absolute left-1/2 top-1/2 z-[600] pointer-events-none -translate-x-1/2 -translate-y-1/2">
              {/* anillo de pulso */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#34d079]/40 animate-crosshair-ring" />
              {/* ticks de precisión */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-7 bg-white/70 rounded-full" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[1.5px] w-7 bg-white/70 rounded-full" />
              {/* punto central exacto */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#34d079] ring-[3px] ring-white shadow-[0_1px_5px_rgba(0,0,0,0.55)]" />
            </div>
          )}

          {/* Hint flotante de edición (no se encima con el buscador) */}
          {drawMode === 'editing' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[700] pointer-events-none w-[calc(100%-1.5rem)] max-w-sm">
              <div className="bg-amber-900/85 backdrop-blur-md rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
                <Pencil size={13} className="text-amber-300 flex-shrink-0" />
                <p className="text-white/95 text-xs font-medium">Arrastra los puntos para ajustar</p>
              </div>
            </div>
          )}

          <MapContainer
            ref={mapRef}
            center={coords ? [coords.lat, coords.lng] : [23.6345, -102.5528]}
            zoom={coords ? 15 : 5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              opacity={0.6}
            />
            <DibujarPoligonoUP
              ref={dibujarRef}
              onPoligonoCompleto={(c, centroide, ha) => {
                setPoligono(c);
                setCoords(centroide);
                setAreaCalc(ha);
                setCoincideArea(null);
                setAreaReal('');
                detectarUbicacion(centroide.lat, centroide.lng);
              }}
              onPoligonoEliminado={() => {
                setPoligono(null);
                setAreaCalc(null);
                setCoincideArea(null);
                setAreaReal('');
                setGeoDetectado(null);
              }}
              onModeChange={setDrawMode}
              onPointCountChange={setPointCount}
            />
          </MapContainer>

          {/* Buscador de lugar — arriba, centrado */}
          {dibujando && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-[1000]">
              <NominatimSearch
                placeholder="Buscar ejido, localidad..."
                onSelect={(lat, lng) => mapRef.current?.flyTo([lat, lng], 16)}
              />
            </div>
          )}

          {/* Zoom manual */}
          <div className="absolute right-3 bottom-3 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-11 h-11 bg-black/60 backdrop-blur-md rounded-xl text-white text-xl font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >+</button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-11 h-11 bg-black/60 backdrop-blur-md rounded-xl text-white text-xl font-bold flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >−</button>
          </div>
        </div>

        {/* Footer contextual */}
        <div className="flex-shrink-0 bg-black/65 backdrop-blur-md border-t border-white/10 px-4 pt-3 pb-3">

          {/* Ubicación detectada automáticamente según la parcela */}
          {drawMode === 'idle' && poligono && (detectandoGeo || geoDetectado) && (
            <div className="max-w-md mx-auto mb-2.5">
              <div className="bg-white/10 ring-1 ring-white/15 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                <MapPin size={15} className="text-green-300 flex-shrink-0" />
                {detectandoGeo ? (
                  <p className="text-white/70 text-xs">Detectando estado y municipio…</p>
                ) : (
                  <p className="text-white/90 text-xs leading-tight">
                    <span className="text-white/50">Ubicación detectada: </span>
                    <span className="font-semibold">{geoDetectado?.municipio}</span>
                    {geoDetectado?.municipio && geoDetectado?.estado ? ', ' : ''}
                    <span className="font-semibold">{geoDetectado?.estado}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MODO: dibujando (idle sin polígono o drawing) */}
          {dibujando && (
            <div className="max-w-md mx-auto space-y-2.5">
              <p className="text-center text-white/55 text-xs px-2">
                {pointCount === 0
                  ? 'Toca el mapa en cada esquina de tu parcela. También puedes centrar la mira y usar el botón.'
                  : 'Toca la siguiente esquina, o centra la mira y agrega el punto.'}
              </p>
              <button
                onClick={() => dibujarRef.current?.addPoint()}
                className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white py-4 rounded-2xl text-base font-bold
                           flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-green-900/30"
              >
                <Plus size={20} strokeWidth={2.6} />
                {pointCount === 0 ? 'Agregar primer punto' : 'Agregar punto'}
              </button>

              {/* Modo caminata: capturar la esquina con el GPS del celular */}
              <button
                onClick={() => {
                  setCapturandoGPS(true);
                  setGpsMsg(null);
                  dibujarRef.current?.addPointGPS((info) => {
                    setCapturandoGPS(false);
                    if (!info.ok) {
                      setGpsMsg(info.error);
                    } else if (info.accuracy > 30) {
                      setGpsMsg(`Punto registrado, pero la señal GPS es débil (±${Math.round(info.accuracy)} m). Espera unos segundos para mejor precisión.`);
                    } else {
                      setGpsMsg(`📍 Punto registrado con buena precisión (±${Math.round(info.accuracy)} m).`);
                    }
                  });
                }}
                disabled={capturandoGPS}
                className="w-full bg-white/10 ring-1 ring-white/20 text-white py-3.5 rounded-2xl text-sm font-semibold
                           flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {capturandoGPS ? '⏳ Obteniendo ubicación…' : '🚶 Estoy en la esquina — usar mi GPS'}
              </button>
              {gpsMsg && (
                <p className="text-center text-[11px] text-white/70 bg-white/5 rounded-lg px-3 py-2">{gpsMsg}</p>
              )}

              {pointCount > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => dibujarRef.current?.undoVertex()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 ring-1 ring-white/15
                               text-white/80 py-3 rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
                  >
                    <Undo2 size={16} /> Deshacer
                  </button>
                  <button
                    onClick={() => dibujarRef.current?.finishDraw()}
                    disabled={!puedeTerminar}
                    className="flex-[1.4] flex items-center justify-center gap-1.5 bg-white text-[#1A5C38] py-3 rounded-xl text-sm font-bold
                               disabled:opacity-30 active:scale-[0.97] transition-all"
                  >
                    <CheckCircle2 size={17} />
                    {puedeTerminar ? `Finalizar (${pointCount})` : `Faltan ${puntosNecesarios}`}
                  </button>
                </div>
              )}

              {pointCount === 0 && (
                <button
                  onClick={() => irAPaso(5)}
                  className="w-full text-white/40 text-sm py-2 text-center hover:text-white/60 transition-colors"
                >
                  Omitir — completar mi ubicación después
                </button>
              )}
            </div>
          )}

          {/* MODO: polígono listo, confirmando área */}
          {drawMode === 'idle' && poligono && coincideArea === null && (
            <div className="max-w-md mx-auto space-y-3">
              <div className="bg-green-500/12 ring-1 ring-green-400/25 rounded-2xl p-4">
                <p className="text-sm font-semibold text-white mb-1">
                  Área calculada: <span className="text-green-300 font-bold text-base">{areaCalc} ha</span>
                </p>
                <p className="text-xs text-white/45 mb-3">¿El área calculada coincide con tu parcela?</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setCoincideArea(true)}
                    className="flex-1 bg-green-500/20 ring-1 ring-green-400/30 text-green-300 py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
                  >
                    ✓ Sí, es correcta
                  </button>
                  <button
                    onClick={() => setCoincideArea(false)}
                    className="flex-1 bg-white/8 ring-1 ring-white/12 text-white/60 py-3 rounded-xl font-semibold text-sm active:scale-[0.97] transition-all"
                  >
                    No, difiere
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => dibujarRef.current?.startEdit()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 ring-1 ring-white/15
                             text-white/80 py-3 rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
                >
                  <Pencil size={14} /> Ajustar forma
                </button>
                <button
                  onClick={() => dibujarRef.current?.clear()}
                  className="flex-1 flex items-center justify-center gap-1.5 text-red-400/70 py-3 rounded-xl text-sm font-medium
                             hover:text-red-400 active:scale-[0.97] transition-all"
                >
                  <Trash2 size={14} /> Redibujar
                </button>
              </div>
            </div>
          )}

          {/* Corrección de área */}
          {drawMode === 'idle' && poligono && coincideArea === false && (
            <div className="max-w-md mx-auto space-y-3">
              <div>
                <label className="block text-xs text-white/50 font-medium mb-2">¿Cuántas hectáreas tiene tu parcela?</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="0.1" max="5000" step="0.1"
                    value={areaReal}
                    onChange={e => setAreaReal(e.target.value)}
                    placeholder={String(areaCalc ?? '0.0')}
                    inputMode="decimal"
                    className="flex-1 bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-xl font-bold text-white
                               text-center focus:ring-2 focus:ring-white/40 focus:outline-none"
                  />
                  <span className="text-white/50 font-bold text-lg">ha</span>
                </div>
              </div>
              <button
                onClick={() => irAPaso(5)}
                disabled={!areaReal}
                className="w-full bg-white text-[#1A5C38] py-4 rounded-2xl text-base font-bold
                           disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Confirmar y continuar →
              </button>
            </div>
          )}

          {/* Área confirmada */}
          {drawMode === 'idle' && poligono && coincideArea === true && (
            <div className="max-w-md mx-auto">
              <button
                onClick={() => irAPaso(5)}
                className="w-full bg-white text-[#1A5C38] py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-all"
              >
                Confirmar y continuar →
              </button>
            </div>
          )}

          {/* MODO: editando */}
          {drawMode === 'editing' && (
            <div className="max-w-md mx-auto flex gap-2.5">
              <button
                onClick={() => dibujarRef.current?.cancelEdit()}
                className="flex-1 bg-white/10 ring-1 ring-white/15 text-white/70 py-3.5 rounded-2xl text-sm font-semibold active:scale-[0.97] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => { dibujarRef.current?.saveEdit(); setCoincideArea(null); }}
                className="flex-1 bg-green-500 text-white py-3.5 rounded-2xl text-sm font-bold
                           flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
              >
                <CheckCircle2 size={17} /> Guardar cambios
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PASOS 1-3, 5 y 6 ──────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header — stepper */}
      <div className="flex-shrink-0 flex items-center px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} className="text-white/70" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-1 px-2">
          {PASOS_INFO.map((info, i) => {
            const n = i + 1;
            const Icon = info.icon;
            const active = n === paso;
            const done = n < paso;
            return (
              <div key={n} className="flex items-center gap-1">
                <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? 'w-7 h-7 sm:w-8 sm:h-8 bg-white shadow-md'
                    : 'w-5 h-5 sm:w-6 sm:h-6 ' + (done ? 'bg-white/40' : 'bg-white/15')
                }`}>
                  {done
                    ? <Check size={11} className="text-white" />
                    : <Icon size={active ? 14 : 10} className={active ? 'text-[#1A5C38]' : 'text-white/50'} />
                  }
                </div>
                {n < TOTAL_PASOS && (
                  <div className={`h-px w-2 sm:w-3 transition-colors duration-300 ${done ? 'bg-white/50' : 'bg-white/15'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-[34px] text-right flex-shrink-0">
          <span className="text-xs text-white/35 font-mono">{paso}/{TOTAL_PASOS}</span>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`max-w-sm mx-auto px-5 py-4 sm:py-6 pb-6 ${animDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Paso 1: Datos personales ── */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tus datos</h2>
                <p className="text-white/50 text-sm sm:text-base mt-1">Como aparecen en tu INE o acta de nacimiento</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">Nombre(s)</label>
                <input value={nombres}
                  onChange={e => setNombres(normalizeText(e.target.value))}
                  placeholder="Ej. JUAN CARLOS"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">Apellido paterno</label>
                <input value={apPaterno}
                  onChange={e => setApPaterno(normalizeText(e.target.value))}
                  placeholder="Ej. GARCIA"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">Apellido materno</label>
                <input value={apMaterno}
                  onChange={e => setApMaterno(normalizeText(e.target.value))}
                  placeholder="Ej. LOPEZ"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">CURP</label>
                <input value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={18} placeholder="AAAA000000AAAAAA00"
                  autoCapitalize="characters"
                  className={`${inputCls} font-mono tracking-widest`}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-white/30">Está en tu credencial INE</span>
                  <span className={`text-xs font-mono ${curp.length === 18 ? 'text-green-400' : 'text-white/30'}`}>{curp.length}/18</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 2: Ubicación ── */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tu parcela</h2>
                <p className="text-white/50 text-sm sm:text-base mt-1">Estado y municipio donde produces</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">Estado</label>
                <select value={estadoUp}
                  onChange={e => {
                    setEstadoUp(e.target.value);
                    const sel = estados.find(s => s.state_id === e.target.value);
                    setEstadoUpNombre(sel?.name || '');
                    setMunicipioUp('');
                  }}
                  className={selectCls}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#0c2e1a' }}>Selecciona estado</option>
                  {estados.map(s => (
                    <option key={s.state_id} value={s.state_id} style={{ background: '#0c2e1a' }}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">Municipio</label>
                <select value={municipioUp}
                  onChange={e => setMunicipioUp(e.target.value)}
                  disabled={!estadoUp}
                  className={`${selectCls} disabled:opacity-30`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#0c2e1a' }}>
                    {estadoUp ? 'Selecciona municipio' : 'Primero elige el estado'}
                  </option>
                  {municipios.map(m => (
                    <option key={m.municipality_id} value={m.name} style={{ background: '#0c2e1a' }}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Paso 3: Tipo de maíz ── */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tu cultivo</h2>
                <p className="text-white/50 text-sm sm:text-base mt-1">¿Qué tipo de maíz siembras principalmente?</p>
              </div>
              {[
                { valor: 'blanco',   etiqueta: 'Maíz Blanco',   desc: 'Tortillas, tamales y nixtamal' },
                { valor: 'amarillo', etiqueta: 'Maíz Amarillo',  desc: 'Forraje, industria y exportación' },
                { valor: 'criollo',  etiqueta: 'Maíz Criollo',   desc: 'Variedades nativas y tradicionales' },
              ].map(t => (
                <button key={t.valor} onClick={() => setTipoMaiz(t.valor)}
                  className={`w-full ring-1 rounded-2xl py-4 px-4 flex items-center gap-4 text-left transition-all duration-200 active:scale-[0.98]
                    ${tipoMaiz === t.valor
                      ? 'ring-2 ring-white bg-white/15'
                      : 'ring-white/15 bg-white/5 hover:bg-white/10'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    tipoMaiz === t.valor ? 'bg-white' : 'bg-white/10'
                  }`}>
                    <Wheat size={22} className={tipoMaiz === t.valor ? 'text-[#1A5C38]' : 'text-white/50'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-bold transition-colors ${tipoMaiz === t.valor ? 'text-white' : 'text-white/70'}`}>
                      {t.etiqueta}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{t.desc}</p>
                  </div>
                  {tipoMaiz === t.valor && (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-[#1A5C38]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Paso 5: Contacto + Programas ── */}
          {paso === 5 && (
            <div className="space-y-5">
              <div className="mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tu contacto</h2>
                <p className="text-white/50 text-sm sm:text-base mt-1">Para que las bodegas puedan avisarte</p>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <input value={telefono}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  type="tel" maxLength={10} placeholder="55 1234 5678"
                  inputMode="tel"
                  className={`${inputCls} font-mono text-lg tracking-wider`}
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-mono ${telefono.length === 10 ? 'text-green-400' : 'text-white/30'}`}>
                    {telefono.length}/10
                  </span>
                </div>
              </div>

              {/* Correo */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                  Correo <span className="text-white/30 normal-case font-normal text-xs">(opcional)</span>
                </label>
                <input type="email" value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className={inputCls}
                  autoCapitalize="off" autoCorrect="off" inputMode="email"
                />
              </div>

              {/* Programas */}
              <div>
                <p className="text-sm font-semibold text-white/70 mb-1">¿Recibes algún apoyo gubernamental?</p>
                <p className="text-xs text-white/30 mb-3">Opcional — puedes seleccionar varios</p>
                <div className="space-y-2">
                  {PROGRAMAS.map(p => (
                    <button key={p.clave} onClick={() => togglePrograma(p.clave)}
                      className={`w-full text-left px-4 py-3 rounded-xl ring-1 text-sm transition-all duration-150 active:scale-[0.98]
                        flex items-center gap-2.5
                        ${programas.includes(p.clave)
                          ? 'ring-2 ring-white/50 bg-white/15 text-white font-medium'
                          : 'ring-white/10 text-white/50 hover:bg-white/5'}`}>
                      <CircleDot size={14} className={programas.includes(p.clave) ? 'text-green-400' : 'text-white/20'} />
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 6: PIN (paso dedicado) ── */}
          {paso === 6 && (
            <div className="text-center">
              {/* Ícono */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shadow-xl transition-colors duration-300 ${
                  pinConfirmado ? 'bg-green-500 shadow-green-900/40' : 'bg-white/12 ring-1 ring-white/15'
                }`}>
                  {pinConfirmado
                    ? <ShieldCheck size={30} className="text-white" />
                    : <KeyRound size={28} className="text-white" />}
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {pinConfirmado ? '¡PIN listo!' : pinStep === 'crear' ? 'Crea tu PIN' : 'Confirma tu PIN'}
              </h2>
              <p className="text-white/50 text-sm sm:text-base mt-1.5 mb-5 px-2 leading-relaxed">
                {pinConfirmado
                  ? 'Usarás este PIN cada vez que entres a SIMAC.'
                  : pinStep === 'crear'
                  ? 'Elige 4 dígitos fáciles de recordar. No los compartas con nadie.'
                  : 'Vuelve a escribir los mismos 4 dígitos para confirmar.'}
              </p>

              {/* Indicador de sub-paso */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  pinStep === 'crear' && !pinConfirmado ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pin.length === 4 ? 'bg-green-400' : 'bg-white/30'}`} />
                  1· Elige
                </div>
                <div className="w-4 h-px bg-white/20" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  pinStep === 'confirmar' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pinConfirmado ? 'bg-green-400' : 'bg-white/30'}`} />
                  2· Confirma
                </div>
              </div>

              {pinError && (
                <div className="mb-4 mx-auto max-w-xs p-2.5 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-xs flex items-center justify-center gap-2">
                  <AlertCircle size={14} /> Los PIN no coinciden. Intenta de nuevo.
                </div>
              )}
              {pinConfirmado && (
                <div className="mb-4 mx-auto max-w-xs p-2.5 bg-green-500/15 ring-1 ring-green-400/30 rounded-xl text-green-300 text-xs flex items-center justify-center gap-2">
                  <Check size={14} /> PIN confirmado correctamente
                </div>
              )}

              <PinInput
                value={pinStep === 'crear' ? pin : confirmPin}
                onChange={handlePinChange}
                dark
                error={pinError}
                success={pinConfirmado}
              />

              {(pin.length > 0 || confirmPin.length > 0) && (
                <button onClick={reiniciarPin}
                  className="mt-5 text-white/40 text-xs hover:text-white/60 transition-colors">
                  Reiniciar PIN
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botón de acción */}
      <div className="flex-shrink-0 px-5 py-4 bg-black/20 backdrop-blur-md border-t border-white/5">
        <div className="max-w-sm mx-auto">
          {paso === 6 ? (
            <button
              onClick={enviarRegistro}
              disabled={!pinConfirmado || loading}
              className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                         py-4 rounded-2xl text-base font-bold
                         disabled:opacity-25 active:scale-[0.98] transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin text-[#1A5C38]" /> Creando cuenta...</>
                : 'Crear mi cuenta →'}
            </button>
          ) : (
            <button
              onClick={() => irAPaso(paso + 1)}
              disabled={!canAdvance()}
              className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                         py-4 rounded-2xl text-base font-bold
                         disabled:opacity-25 active:scale-[0.98] transition-all duration-200"
            >
              Continuar
            </button>
          )}
        </div>
      </div>

      {/* Modal de registro exitoso */}
      {registroExitoso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-[#1A5C38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-600 mb-2">Tu cuenta ha sido creada correctamente en SIMAC.</p>
            <p className="text-gray-500 text-sm mb-8">Ya puedes iniciar sesión con tu CURP y PIN de 4 dígitos.</p>
            <button
              onClick={() => navigate('/login-productor')}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-800 transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
