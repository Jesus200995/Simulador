import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, CircleDot, MapPinned, Check, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PinInput from '../../components/productor/PinInput';
import NominatimSearch from '../../components/productor/NominatimSearch';

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
  { clave: 'produccion_bienestar', nombre: 'Produccion para el Bienestar' },
  { clave: 'precios_garantia', nombre: 'Precios de Garantia' },
  { clave: 'maiz_blanco_precio_justo', nombre: 'Maiz Blanco / Precio Justo' },
  { clave: 'maiz_es_raiz', nombre: 'Plan El Maiz es la Raiz' },
  { clave: 'cosechando_soberania', nombre: 'Cosechando Soberania' },
  { clave: 'sembrando_vida', nombre: 'Sembrando Vida' },
];

const MAIZ_ICONS: Record<string, string> = { blanco: 'bg-zinc-100', amarillo: 'bg-amber-100', criollo: 'bg-emerald-100' };

// Normalizar: MAYUSCULAS sin tildes/acentos
function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export default function RegistroNuevoPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);
  const [paso, setPaso] = useState(1);
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

  const [telefono, setTelefono] = useState('');
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

  const togglePrograma = (clave: string) => {
    setProgramas(prev =>
      prev.includes(clave) ? prev.filter(p => p !== clave) : [...prev, clave]
    );
  };

  const handlePinChange = (val: string) => {
    if (pinStep === 'crear') {
      setPin(val);
      if (val.length === 4) setTimeout(() => setPinStep('confirmar'), 300);
    } else {
      setConfirmPin(val);
      if (val.length === 4) {
        if (val !== pin) {
          setError('Los PIN no coinciden.');
          setPin(''); setConfirmPin(''); setPinStep('crear');
        }
      }
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
          telefono, pin: confirmPin, programas_beneficiario: programas,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrar'); return; }
      navigate('/login', { state: { mensaje: data.mensaje } });
    } catch {
      setError('Error de conexion.');
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    switch (paso) {
      case 1: return nombres && apPaterno && curp.length === 18;
      case 2: return estadoUp && municipioUp;
      case 3: return !!tipoMaiz;
      case 4: return true;
      case 5: return telefono.length === 10 && confirmPin.length === 4 && confirmPin === pin;
      default: return false;
    }
  };

  const inputCls = 'w-full bg-zinc-50 ring-1 ring-zinc-200 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-[#1A5C38] focus:outline-none transition-shadow';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex items-center px-4 sm:px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate('/activar')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronLeft size={22} className="text-zinc-600" />
        </button>
        <div className="flex-1 flex justify-center gap-1.5">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-1.5 w-8 sm:w-10 rounded-full transition-all duration-300
              ${n <= paso ? 'bg-[#1A5C38]' : 'bg-zinc-200'}`} />
          ))}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 sm:px-8 py-6 sm:py-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {paso === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Tus datos personales</h2>
              <p className="text-sm text-zinc-500">Escribelos como aparecen en tu INE</p>
              <input value={nombres} onChange={e => setNombres(normalizeText(e.target.value))}
                placeholder="Nombre(s)" className={inputCls} />
              <input value={apPaterno} onChange={e => setApPaterno(normalizeText(e.target.value))}
                placeholder="Apellido paterno" className={inputCls} />
              <input value={apMaterno} onChange={e => setApMaterno(normalizeText(e.target.value))}
                placeholder="Apellido materno" className={inputCls} />
              <div>
                <input value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={18} placeholder="CURP (18 caracteres)"
                  className={`${inputCls} font-mono tracking-wider`} />
                <p className="text-xs text-zinc-400 mt-1 text-right">{curp.length}/18</p>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Donde esta tu parcela?</h2>
              <p className="text-sm text-zinc-500">Estado y municipio de tu unidad productiva</p>
              <select value={estadoUp}
                onChange={e => {
                  setEstadoUp(e.target.value);
                  const sel = estados.find(s => s.state_id === e.target.value);
                  setEstadoUpNombre(sel?.name || '');
                  setMunicipioUp('');
                }}
                className={`${inputCls} bg-white`}>
                <option value="">Selecciona estado</option>
                {estados.map(s => <option key={s.state_id} value={s.state_id}>{s.name}</option>)}
              </select>
              <select value={municipioUp}
                onChange={e => setMunicipioUp(e.target.value)}
                disabled={!estadoUp}
                className={`${inputCls} bg-white disabled:opacity-40`}>
                <option value="">Selecciona municipio</option>
                {municipios.map(m => <option key={m.municipality_id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Que siembras principalmente?</h2>
              <p className="text-sm text-zinc-500">Selecciona el tipo de maiz</p>
              {[
                { valor: 'blanco', etiqueta: 'Maiz Blanco' },
                { valor: 'amarillo', etiqueta: 'Maiz Amarillo' },
                { valor: 'criollo', etiqueta: 'Maiz Criollo' },
              ].map(t => (
                <button key={t.valor} onClick={() => setTipoMaiz(t.valor)}
                  className={`w-full ring-1 rounded-2xl py-5 px-5 flex items-center gap-4 text-left transition-all duration-200
                    ${tipoMaiz === t.valor ? 'ring-2 ring-[#1A5C38] bg-emerald-50' : 'ring-zinc-200 bg-white hover:bg-zinc-50'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${MAIZ_ICONS[t.valor]}`}>
                    <Wheat size={24} className={tipoMaiz === t.valor ? 'text-[#1A5C38]' : 'text-zinc-500'} />
                  </div>
                  <p className="text-lg font-semibold text-zinc-800">{t.etiqueta}</p>
                  {tipoMaiz === t.valor && <Check size={20} className="text-[#1A5C38] ml-auto" />}
                </button>
              ))}
            </div>
          )}

          {paso === 4 && (
            <div className="space-y-3 -mx-5 sm:-mx-8">
              <div className="px-5 sm:px-8">
                <h2 className="text-lg font-bold text-zinc-900">Marca tu parcela en el mapa</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Toca el punto donde esta tu terreno. Puedes buscar con la lupa.
                </p>
              </div>
              <div className="relative" style={{ height: '340px' }}>
                <MapContainer
                  ref={mapRef}
                  center={[23.6345, -102.5528]}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ClickHandler onMapClick={(lat, lng) => setCoords({ lat, lng })} />
                  {coords && <Marker position={[coords.lat, coords.lng]} />}
                </MapContainer>
                <div className="absolute top-3 left-3 right-3 z-[1000]">
                  <NominatimSearch
                    placeholder="Buscar ejido, carretera, localidad..."
                    onSelect={(lat, lng) => {
                      setCoords({ lat, lng });
                      mapRef.current?.flyTo([lat, lng], 15);
                    }}
                  />
                </div>
              </div>
              <div className="px-5 sm:px-8">
                {coords ? (
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                    <MapPinned size={14} /> Ubicacion marcada: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">Puedes omitir este paso si no encuentras tu parcela</p>
                )}
              </div>
            </div>
          )}

          {paso === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Ultimos datos</h2>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Telefono (10 digitos)</label>
                <input value={telefono}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  type="tel" maxLength={10} placeholder="55 1234 5678"
                  className={`${inputCls} text-lg font-mono`} />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-1">
                  {pinStep === 'crear' ? 'Crea tu PIN de 4 numeros' : 'Confirma tu PIN'}
                </p>
                <p className="text-xs text-zinc-400 mb-3">Este es tu codigo secreto para entrar a la app</p>
                <PinInput
                  value={pinStep === 'crear' ? pin : confirmPin}
                  onChange={handlePinChange}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-2">Recibes alguno de estos apoyos?</p>
                <p className="text-xs text-zinc-400 mb-3">Opcional - puedes seleccionar varios</p>
                <div className="space-y-2">
                  {PROGRAMAS.map(p => (
                    <button key={p.clave}
                      onClick={() => togglePrograma(p.clave)}
                      className={`w-full text-left px-4 py-3 rounded-xl ring-1 text-sm transition-all duration-200 flex items-center gap-2
                        ${programas.includes(p.clave) ? 'ring-2 ring-[#1A5C38] bg-emerald-50 text-emerald-800 font-medium' : 'ring-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
                      <CircleDot size={14} className={programas.includes(p.clave) ? 'text-[#1A5C38]' : 'text-zinc-300'} />
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-8 py-4 border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto">
          {paso < 5 ? (
            <button onClick={() => { setError(''); setPaso(paso + 1); }}
              disabled={!canAdvance()}
              className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                         disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
              Continuar
            </button>
          ) : (
            <button onClick={enviarRegistro}
              disabled={!canAdvance() || loading}
              className="w-full bg-[#1A5C38] hover:bg-[#15482d] text-white py-4 rounded-2xl text-base font-semibold
                         disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
              {loading ? 'Enviando...' : 'Crear mi cuenta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
