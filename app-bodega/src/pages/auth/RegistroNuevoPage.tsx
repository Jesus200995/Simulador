import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Wheat, CircleDot, Check,
  AlertCircle, User, MapPin, Sprout, Map, Phone, Loader2,
  PenLine, Undo2, Pencil, Trash2, CheckCircle2,
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
  { icon: User,   label: 'Datos' },
  { icon: MapPin, label: 'Ubicación' },
  { icon: Sprout, label: 'Cultivo' },
  { icon: Map,    label: 'Parcela' },
  { icon: Phone,  label: 'Contacto' },
];

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

  // Contacto / PIN
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'crear' | 'confirmar'>('crear');
  const [programas, setProgramas] = useState<string[]>([]);

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
    if (error) setError('');
    if (pinStep === 'crear') {
      setPin(val);
      if (val.length === 4) setTimeout(() => setPinStep('confirmar'), 300);
    } else {
      setConfirmPin(val);
      if (val.length === 4 && val !== pin) {
        setError('Los PIN no coinciden. Inténtalo de nuevo.');
        setConfirmPin('');
      }
    }
  };

  const reiniciarPin = () => {
    setPin(''); setConfirmPin(''); setPinStep('crear'); setError('');
  };

  const canAdvance = () => {
    switch (paso) {
      case 1: return !!(nombres && apPaterno && curp.length === 18);
      case 2: return !!(estadoUp && municipioUp);
      case 3: return !!tipoMaiz;
      case 4: return true;
      case 5: return telefono.length === 10 && confirmPin.length === 4 && confirmPin === pin;
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
          lat: coords?.lat || null, lng: coords?.lng || null,
          poligono: poligono || null,
          area_calc_ha: areaCalc || null,
          area_real_ha: (coincideArea === false && areaReal) ? Number(areaReal) : areaCalc,
          coincide_area: coincideArea,
          telefono, pin: confirmPin, programas_beneficiario: programas,
          correo: correo || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrar'); return; }
      navigate('/login-productor', { state: { mensaje: data.mensaje } });
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── PASO 4 — Mapa full-screen ─────────────────────────────────────────────
  if (paso === 4) {
    const puntosNecesarios = Math.max(0, 3 - pointCount);
    const puedeTerminar = pointCount >= 3;
    const parcelaLista = !!poligono && drawMode === 'idle';
    const areaConfirmada = parcelaLista && coincideArea !== null && (coincideArea === true || (coincideArea === false && !!areaReal));

    return (
      <div
        className="fixed inset-0 flex flex-col bg-[#0c2e1a]"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/05">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          <div className="flex-1 min-w-0">
            {drawMode === 'idle' && !poligono && (
              <>
                <p className="text-white font-bold text-sm leading-tight">Dibuja tu parcela</p>
                <p className="text-white/40 text-xs">Toca el botón verde para comenzar</p>
              </>
            )}
            {drawMode === 'drawing' && (
              <>
                <p className="text-green-300 font-bold text-sm leading-tight">Marcando puntos...</p>
                <p className="text-white/40 text-xs">
                  {pointCount} punto{pointCount !== 1 ? 's' : ''} marcado{pointCount !== 1 ? 's' : ''}
                  {puedeTerminar ? ' — ya puedes finalizar' : ` — ${puntosNecesarios} más para terminar`}
                </p>
              </>
            )}
            {drawMode === 'idle' && poligono && (
              <>
                <p className="text-white font-bold text-sm leading-tight">Parcela dibujada</p>
                <p className="text-white/40 text-xs">{areaCalc} ha calculadas</p>
              </>
            )}
            {drawMode === 'editing' && (
              <>
                <p className="text-amber-300 font-bold text-sm leading-tight">Editando parcela</p>
                <p className="text-white/40 text-xs">Arrastra los puntos para ajustar</p>
              </>
            )}
          </div>

          {/* Stepper mini */}
          <div className="flex gap-1 flex-shrink-0">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`h-1 w-4 rounded-full transition-colors ${n <= paso ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative min-h-0">
          {/* Overlay instrucción inicial */}
          {drawMode === 'idle' && !poligono && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
              <div className="bg-black/65 backdrop-blur-sm rounded-2xl px-6 py-5 mx-8 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center mx-auto mb-3">
                  <PenLine size={24} className="text-green-300" />
                </div>
                <p className="text-white font-bold text-sm mb-1.5">Dibuja los límites de tu parcela</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Toca "Comenzar a dibujar" abajo,<br />luego toca el mapa para marcar cada esquina
                </p>
              </div>
            </div>
          )}

          {/* Banner de instrucción durante dibujo */}
          {drawMode === 'drawing' && (
            <div className="absolute top-3 left-3 right-3 z-[500] pointer-events-none">
              <div className="bg-black/75 backdrop-blur-md rounded-2xl px-4 py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">
                    {puedeTerminar
                      ? 'Toca "Finalizar parcela" cuando termines de marcar todos los puntos'
                      : `Toca el mapa para marcar puntos — necesitas ${puntosNecesarios} más`}
                  </p>
                  {puedeTerminar && (
                    <p className="text-white/40 text-xs mt-0.5">También puedes tocar el primer punto para cerrar</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Banner edición */}
          {drawMode === 'editing' && (
            <div className="absolute top-3 left-3 right-3 z-[500] pointer-events-none">
              <div className="bg-amber-900/80 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3">
                <Pencil size={14} className="text-amber-300 flex-shrink-0" />
                <p className="text-white/90 text-xs font-medium">
                  Arrastra los puntos azules para ajustar la forma de tu parcela
                </p>
              </div>
            </div>
          )}

          <MapContainer
            ref={mapRef}
            center={coords ? [coords.lat, coords.lng] : [23.6345, -102.5528]}
            zoom={coords ? 14 : 5}
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
              }}
              onPoligonoEliminado={() => {
                setPoligono(null);
                setAreaCalc(null);
                setCoincideArea(null);
                setAreaReal('');
              }}
              onModeChange={setDrawMode}
              onPointCountChange={setPointCount}
            />
          </MapContainer>

          {/* Buscador de lugar */}
          <div className="absolute top-3 left-3 max-w-[calc(100%-2rem)] w-72 sm:w-80 z-[1000]">
            <NominatimSearch
              placeholder="Buscar ejido, localidad..."
              onSelect={(lat, lng) => mapRef.current?.flyTo([lat, lng], 15)}
            />
          </div>

          {/* Botón zoom-in manual visible */}
          <div className="absolute right-3 bottom-4 z-[1000] flex flex-col gap-2">
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
        <div className="flex-shrink-0 bg-black/65 backdrop-blur-md border-t border-white/08 px-4 pt-4 pb-3">

          {/* MODO: idle, sin polígono */}
          {drawMode === 'idle' && !poligono && (
            <div className="space-y-2.5">
              <button
                onClick={() => dibujarRef.current?.startDraw()}
                className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white py-4 rounded-2xl text-base font-bold
                           flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-green-900/30"
              >
                <PenLine size={20} />
                Comenzar a dibujar
              </button>
              <button
                onClick={() => irAPaso(5)}
                className="w-full text-white/35 text-sm py-2 text-center hover:text-white/55 transition-colors"
              >
                Omitir — completar después
              </button>
            </div>
          )}

          {/* MODO: dibujando */}
          {drawMode === 'drawing' && (
            <div className="space-y-2.5">
              <button
                onClick={() => dibujarRef.current?.finishDraw()}
                disabled={!puedeTerminar}
                className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white py-4 rounded-2xl text-base font-bold
                           disabled:opacity-35 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all
                           shadow-lg shadow-green-900/30"
              >
                {puedeTerminar
                  ? <><CheckCircle2 size={20} /> Finalizar parcela ({pointCount} puntos)</>
                  : `Marca ${puntosNecesarios} punto${puntosNecesarios !== 1 ? 's' : ''} más para continuar`
                }
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => dibujarRef.current?.undoVertex()}
                  disabled={pointCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 ring-1 ring-white/15
                             text-white/80 py-3 rounded-xl text-sm font-semibold disabled:opacity-30 active:scale-[0.97] transition-all"
                >
                  <Undo2 size={16} /> Deshacer
                </button>
                <button
                  onClick={() => dibujarRef.current?.cancelDraw()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/05 ring-1 ring-white/10
                             text-white/40 py-3 rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* MODO: idle, polígono listo, confirmando área */}
          {drawMode === 'idle' && poligono && coincideArea === null && (
            <div className="space-y-3">
              <div className="bg-amber-500/12 ring-1 ring-amber-400/25 rounded-2xl p-4">
                <p className="text-sm font-semibold text-white mb-1">
                  Área calculada: <span className="text-amber-300 font-bold text-base">{areaCalc} ha</span>
                </p>
                <p className="text-xs text-white/40 mb-3">¿El área calculada es correcta?</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setCoincideArea(true)}
                    className="flex-1 bg-green-500/20 ring-1 ring-green-400/30 text-green-300 py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
                  >
                    ✓ Sí, es correcta
                  </button>
                  <button
                    onClick={() => setCoincideArea(false)}
                    className="flex-1 bg-white/08 ring-1 ring-white/12 text-white/60 py-3 rounded-xl font-semibold text-sm active:scale-[0.97] transition-all"
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
                  onClick={() => dibujarRef.current?.deletePolygon()}
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
            <div className="space-y-3">
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

          {/* Área confirmada — listo para continuar */}
          {drawMode === 'idle' && poligono && coincideArea === true && (
            <button
              onClick={() => irAPaso(5)}
              className="w-full bg-white text-[#1A5C38] py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-all"
            >
              Confirmar y continuar →
            </button>
          )}

          {/* MODO: editando */}
          {drawMode === 'editing' && (
            <div className="flex gap-2.5">
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

  // ── PASOS 1-3 y 5 ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.08),transparent)]" />
      </div>

      {/* Header — fijo */}
      <div className="flex-shrink-0 flex items-center px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} className="text-white/70" />
        </button>

        {/* Stepper con íconos */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2">
          {PASOS_INFO.map((info, i) => {
            const n = i + 1;
            const Icon = info.icon;
            const active = n === paso;
            const done = n < paso;
            return (
              <div key={n} className="flex items-center gap-1 sm:gap-1.5">
                <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? 'w-7 h-7 sm:w-8 sm:h-8 bg-white shadow-md'
                    : done
                    ? 'w-5 h-5 sm:w-6 sm:h-6 bg-white/40'
                    : 'w-5 h-5 sm:w-6 sm:h-6 bg-white/15'
                }`}>
                  {done
                    ? <Check size={10} className="text-white sm:hidden" />
                    : <Icon size={active ? 14 : 10} className={active ? 'text-[#1A5C38]' : 'text-white/50'} />
                  }
                  {done && <Check size={12} className="text-white hidden sm:block" />}
                </div>
                {n < 5 && (
                  <div className={`h-px w-3 sm:w-4 transition-colors duration-300 ${done ? 'bg-white/50' : 'bg-white/15'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-[36px] text-right flex-shrink-0">
          <span className="text-xs text-white/35 font-mono">{paso}/5</span>
        </div>
      </div>

      {/* Contenido scrollable — min-h-0 es clave para que no desborde */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`max-w-sm mx-auto px-5 py-4 sm:py-6 pb-6 ${animDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>

          {error && !error.includes('PIN') && (
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

          {/* ── Paso 5: Contacto + PIN + Programas ── */}
          {paso === 5 && (
            <div className="space-y-5">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Últimos datos</h2>
                <p className="text-white/50 text-sm sm:text-base mt-1">Ya casi terminas</p>
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

              {/* PIN */}
              <div className="bg-white/8 ring-1 ring-white/10 rounded-2xl p-4 text-center">
                <p className="text-sm sm:text-base font-bold text-white mb-1">
                  {pinStep === 'crear' ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu PIN'}
                </p>
                <p className="text-xs text-white/40 mb-4">
                  {pinStep === 'crear'
                    ? 'Lo usarás cada vez que entres a la app.'
                    : 'Escribe los mismos 4 dígitos para confirmar.'}
                </p>
                {error && error.includes('PIN') && (
                  <div className="mb-3 p-2 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-xs">
                    {error}
                  </div>
                )}
                <PinInput
                  value={pinStep === 'crear' ? pin : confirmPin}
                  onChange={handlePinChange}
                />
                {(pin.length > 0 || confirmPin.length > 0) && (
                  <button onClick={reiniciarPin}
                    className="mt-3 text-white/40 text-xs hover:text-white/60 transition-colors">
                    Reiniciar PIN
                  </button>
                )}
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
        </div>
      </div>

      {/* Botón de acción — siempre pegado al fondo */}
      <div className="flex-shrink-0 px-5 py-4 bg-black/20 backdrop-blur-md border-t border-white/05">
        <div className="max-w-sm mx-auto space-y-2">
          {paso < 5 ? (
            <button
              onClick={() => irAPaso(paso + 1)}
              disabled={!canAdvance()}
              className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                         py-4 rounded-2xl text-base font-bold
                         disabled:opacity-25 active:scale-[0.98] transition-all duration-200"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={enviarRegistro}
              disabled={!canAdvance() || loading}
              className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                         py-4 rounded-2xl text-base font-bold
                         disabled:opacity-25 active:scale-[0.98] transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin text-[#1A5C38]" /> Enviando...</>
                : 'Crear mi cuenta →'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
