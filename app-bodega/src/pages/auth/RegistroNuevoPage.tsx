import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
  { clave: 'produccion_bienestar', nombre: 'Producción para el Bienestar' },
  { clave: 'precios_garantia', nombre: 'Precios de Garantía' },
  { clave: 'maiz_blanco_precio_justo', nombre: 'Maíz Blanco / Precio Justo' },
  { clave: 'maiz_es_raiz', nombre: 'Plan El Maíz es la Raíz' },
  { clave: 'cosechando_soberania', nombre: 'Cosechando Soberanía' },
  { clave: 'sembrando_vida', nombre: 'Sembrando Vida' },
];

export default function RegistroNuevoPage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paso 1
  const [nombres, setNombres] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [curp, setCurp] = useState('');

  // Paso 2
  const [estados, setEstados] = useState<{ state_id: string; name: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ municipality_id: string; name: string }[]>([]);
  const [estadoUp, setEstadoUp] = useState('');
  const [estadoUpNombre, setEstadoUpNombre] = useState('');
  const [municipioUp, setMunicipioUp] = useState('');

  // Paso 3
  const [tipoMaiz, setTipoMaiz] = useState('');

  // Paso 4 — mapa
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Paso 5
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
      setError('Error de conexión.');
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate('/activar')}
          className="p-1"><ChevronLeft size={24} className="text-gray-600" /></button>
        <div className="flex-1 flex justify-center gap-1.5">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-1.5 w-8 rounded-full transition-all
              ${n <= paso ? 'bg-[#1A5C38]' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* PASO 1: Datos personales */}
        {paso === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Tus datos personales</h2>
            <p className="text-sm text-gray-500">Escríbelos como aparecen en tu INE</p>
            <input value={nombres} onChange={e => setNombres(e.target.value)}
              placeholder="Nombre(s)" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#1A5C38] focus:outline-none" />
            <input value={apPaterno} onChange={e => setApPaterno(e.target.value)}
              placeholder="Apellido paterno" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#1A5C38] focus:outline-none" />
            <input value={apMaterno} onChange={e => setApMaterno(e.target.value)}
              placeholder="Apellido materno" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#1A5C38] focus:outline-none" />
            <div>
              <input value={curp}
                onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={18} placeholder="CURP (18 caracteres)"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base font-mono tracking-wider focus:border-[#1A5C38] focus:outline-none" />
              <p className="text-xs text-gray-400 mt-1 text-right">{curp.length}/18</p>
            </div>
          </div>
        )}

        {/* PASO 2: Estado y municipio */}
        {paso === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">¿Dónde está tu parcela?</h2>
            <p className="text-sm text-gray-500">Estado y municipio de tu unidad productiva</p>
            <select value={estadoUp}
              onChange={e => {
                setEstadoUp(e.target.value);
                const sel = estados.find(s => s.state_id === e.target.value);
                setEstadoUpNombre(sel?.name || '');
                setMunicipioUp('');
              }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#1A5C38] focus:outline-none bg-white">
              <option value="">Selecciona estado</option>
              {estados.map(s => <option key={s.state_id} value={s.state_id}>{s.name}</option>)}
            </select>
            <select value={municipioUp}
              onChange={e => setMunicipioUp(e.target.value)}
              disabled={!estadoUp}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#1A5C38] focus:outline-none bg-white disabled:opacity-40">
              <option value="">Selecciona municipio</option>
              {municipios.map(m => <option key={m.municipality_id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        )}

        {/* PASO 3: Cultivo */}
        {paso === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">¿Qué siembras principalmente?</h2>
            <p className="text-sm text-gray-500">Selecciona el tipo de maíz</p>
            {[
              { valor: 'blanco', etiqueta: 'Maíz Blanco', emoji: '⬜' },
              { valor: 'amarillo', etiqueta: 'Maíz Amarillo', emoji: '🟡' },
              { valor: 'criollo', etiqueta: 'Maíz Criollo', emoji: '🌽' },
            ].map(t => (
              <button key={t.valor} onClick={() => setTipoMaiz(t.valor)}
                className={`w-full border-2 rounded-2xl py-5 px-5 flex items-center gap-4 text-left transition-all
                  ${tipoMaiz === t.valor ? 'border-[#1A5C38] bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="text-4xl">{t.emoji}</span>
                <p className="text-lg font-semibold text-gray-800">{t.etiqueta}</p>
              </button>
            ))}
          </div>
        )}

        {/* PASO 4: Mapa */}
        {paso === 4 && (
          <div className="space-y-3 -mx-5">
            <div className="px-5">
              <p className="text-base font-semibold text-gray-800">Marca tu parcela en el mapa</p>
              <p className="text-sm text-gray-500 mt-1">
                Toca el punto donde está tu terreno. Puedes buscar con la lupa.
              </p>
            </div>
            <div className="relative" style={{ height: '320px' }}>
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
            <div className="px-5">
              {coords ? (
                <p className="text-sm text-green-600">✓ Ubicación marcada: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
              ) : (
                <p className="text-sm text-gray-400">Puedes omitir este paso si no encuentras tu parcela</p>
              )}
            </div>
          </div>
        )}

        {/* PASO 5: Teléfono, PIN, programas */}
        {paso === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Últimos datos</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (10 dígitos)</label>
              <input value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                type="tel" maxLength={10} placeholder="55 1234 5678"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-lg font-mono focus:border-[#1A5C38] focus:outline-none" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {pinStep === 'crear' ? 'Crea tu PIN de 4 números' : 'Confirma tu PIN'}
              </p>
              <p className="text-xs text-gray-400 mb-3">Este es tu código secreto para entrar a la app</p>
              <PinInput
                value={pinStep === 'crear' ? pin : confirmPin}
                onChange={handlePinChange}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">¿Recibes alguno de estos apoyos?</p>
              <p className="text-xs text-gray-400 mb-3">Opcional — puedes seleccionar varios</p>
              <div className="space-y-2">
                {PROGRAMAS.map(p => (
                  <button key={p.clave}
                    onClick={() => togglePrograma(p.clave)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all
                      ${programas.includes(p.clave) ? 'border-[#1A5C38] bg-green-50 text-green-800 font-medium' : 'border-gray-200 text-gray-700'}`}>
                    {programas.includes(p.clave) ? '✓ ' : ''}{p.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer button */}
      <div className="px-5 py-4 border-t bg-white">
        {paso < 5 ? (
          <button onClick={() => { setError(''); setPaso(paso + 1); }}
            disabled={!canAdvance()}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-bold
                       disabled:opacity-40 active:scale-95 transition-transform">
            Continuar
          </button>
        ) : (
          <button onClick={enviarRegistro}
            disabled={!canAdvance() || loading}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-bold
                       disabled:opacity-40 active:scale-95 transition-transform">
            {loading ? 'Enviando...' : 'Crear mi cuenta'}
          </button>
        )}
      </div>
    </div>
  );
}
