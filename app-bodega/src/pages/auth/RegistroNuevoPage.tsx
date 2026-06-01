import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Wheat, CircleDot, MapPinned, Check,
  AlertCircle, User, MapPin, Sprout, Map, Phone, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PinInput from '../../components/productor/PinInput';
import NominatimSearch from '../../components/productor/NominatimSearch';
import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

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
  { icon: User,    label: 'Datos' },
  { icon: MapPin,  label: 'Ubicación' },
  { icon: Sprout,  label: 'Cultivo' },
  { icon: Map,     label: 'Parcela' },
  { icon: Phone,   label: 'Contacto' },
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
  const [paso, setPaso] = useState(1);
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombres, setNombres] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [curp, setCurp] = useState('');

  const [estados, setEstados] = useState<{ state_id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ municipality_id: string; name: string }[]>([]);
  const [estadoUp, setEstadoUp] = useState('');
  const [estadoUpNombre, setEstadoUpNombre] = useState('');
  const [municipioUp, setMunicipioUp] = useState('');

  const [tipoMaiz, setTipoMaiz] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [poligono, setPoligono] = useState<[number, number][] | null>(null);
  const [areaCalc, setAreaCalc] = useState<number | null>(null);
  const [areaReal, setAreaReal] = useState('');
  const [coincideArea, setCoincideArea] = useState<boolean | null>(null);

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

  // ── PASO 4 — Mapa full-screen con estilo oscuro ───────────────────────────
  if (paso === 4) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0c2e1a]" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* Header del mapa */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-black/40 backdrop-blur-md">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-sm sm:text-base">Dibuja tu parcela</p>
            <p className="text-white/50 text-xs">Traza los límites de tu terreno</p>
          </div>
          {/* Stepper mini */}
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`h-1 w-4 rounded-full transition-colors ${n <= paso ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative min-h-0">
          <MapContainer
            ref={mapRef}
            center={coords ? [coords.lat, coords.lng] : [23.6345, -102.5528]}
            zoom={coords ? 13 : 5}
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
              onPoligonoCompleto={(c, centroide, ha) => {
                setPoligono(c); setCoords(centroide); setAreaCalc(ha); setCoincideArea(null);
              }}
              onPoligonoEliminado={() => { setPoligono(null); setAreaCalc(null); setCoincideArea(null); }}
            />
          </MapContainer>
          <div className="absolute top-3 left-3 max-w-[calc(100%-80px)] w-64 sm:w-80 z-[1000]">
            <NominatimSearch
              placeholder="Buscar ejido, localidad..."
              onSelect={(lat, lng) => mapRef.current?.flyTo([lat, lng], 15)}
            />
          </div>
        </div>

        {/* Footer del mapa */}
        <div className="flex-shrink-0 bg-black/60 backdrop-blur-md px-4 py-4 space-y-3">
          {areaCalc && coincideArea === null && (
            <div className="bg-amber-500/15 ring-1 ring-amber-400/30 rounded-2xl p-4">
              <p className="text-sm font-semibold text-white mb-3">
                Área calculada: <span className="text-amber-300 font-bold">{areaCalc} ha</span> ¿Es correcto?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCoincideArea(true)}
                  className="flex-1 bg-white/15 ring-1 ring-white/30 text-white py-2.5 rounded-xl font-semibold text-sm">
                  ✓ Sí, correcto
                </button>
                <button onClick={() => setCoincideArea(false)}
                  className="flex-1 bg-white/08 ring-1 ring-white/15 text-white/70 py-2.5 rounded-xl font-semibold text-sm">
                  No, tengo más/menos
                </button>
              </div>
            </div>
          )}
          {coincideArea === false && (
            <div className="flex items-center gap-3">
              <input type="number" min="0.1" max="500" step="0.1"
                value={areaReal}
                onChange={e => setAreaReal(e.target.value)}
                placeholder={String(areaCalc ?? '0.0')}
                className="flex-1 bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3 text-lg font-bold
                           text-white text-center focus:ring-2 focus:ring-white/40 focus:outline-none"
              />
              <span className="text-white/60 font-medium">ha</span>
            </div>
          )}

          {areaCalc && (
            <button
              onClick={() => { setPoligono(null); setAreaCalc(null); setCoincideArea(null); setAreaReal(''); }}
              className="w-full text-center text-red-400/80 text-sm py-1"
            >
              Redibujar parcela
            </button>
          )}

          <button
            onClick={() => irAPaso(5)}
            disabled={!poligono || (coincideArea === null && !!areaCalc)}
            className="w-full bg-white hover:bg-white/90 text-[#1A5C38] py-4 rounded-2xl text-base font-bold
                       disabled:opacity-30 active:scale-[0.98] transition-all duration-200"
          >
            {poligono ? 'Confirmar y continuar →' : 'Dibuja tu parcela para continuar'}
          </button>
          <button onClick={() => irAPaso(5)}
            className="w-full text-white/40 text-sm py-1 hover:text-white/60 transition-colors">
            Omitir — completar después
          </button>
        </div>
      </div>
    );
  }

  // ── PASOS 1-3 y 5 ──────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Background fijo */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.08),transparent)]" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 py-3 sm:py-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <ChevronLeft size={22} className="text-white/70" />
        </button>

        {/* Stepper con iconos */}
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
                    ? 'w-7 h-7 sm:w-8 sm:h-8 bg-white'
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

        {/* Paso X/5 */}
        <div className="text-right min-w-[40px]">
          <span className="text-xs text-white/40 font-mono">{paso}/5</span>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className={`max-w-sm mx-auto px-5 py-4 sm:py-6 ${animDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}>

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
                      : 'ring-white/15 bg-white/05 hover:bg-white/10'}`}>
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
            <div className="space-y-5 pb-4">
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
              <div className="bg-white/08 ring-1 ring-white/10 rounded-2xl p-4 text-center">
                <p className="text-sm sm:text-base font-bold text-white mb-1">
                  {pinStep === 'crear' ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu PIN'}
                </p>
                <p className="text-xs text-white/40 mb-4">
                  {pinStep === 'crear'
                    ? 'Lo usarás cada vez que entres a la app.'
                    : 'Escribe los mismos 4 dígitos para confirmar.'}
                </p>
                {error && error.includes('PIN') && (
                  <div className="mb-3 p-2 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-xs text-center">
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
                          : 'ring-white/10 text-white/50 hover:bg-white/05'}`}>
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

      {/* Botón de acción fijo abajo */}
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

          {paso === 4 && (
            <button onClick={() => irAPaso(5)}
              className="w-full text-white/40 py-2 text-sm text-center hover:text-white/60 transition-colors">
              Omitir mapa — completar después
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
