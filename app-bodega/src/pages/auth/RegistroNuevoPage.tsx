import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft, Check, CheckCircle2, MapPin, Undo2, Footprints, Loader2, Plus, Search, UserCheck, Map, KeyRound
} from 'lucide-react';
import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';
import type { DibujarPoligonoHandle, DrawMode } from '../../components/productor/DibujarPoligonoUP';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface DatosPadron {
  curp: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  correo: string | null;
  estado_padron: string | null;
  municipio_padron: string | null;
  localidad_padron: string | null;
}

interface UPRegistrada {
  poligono: [number, number][] | null;
  coords: { lat: number; lng: number } | null;
  areaCalc: number | null;
  estado: string;
  municipio: string;
}

export default function RegistroNuevoPage() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1
  const [curp, setCurp] = useState('');

  // Paso 2
  const [datosPadron, setDatosPadron] = useState<DatosPadron | null>(null);
  const [telefonoEditable, setTelefonoEditable] = useState('');

  // Pasos 3-5 — UPs
  const [ups, setUps] = useState<UPRegistrada[]>([]);
  const [upActual, setUpActual] = useState<{ estado: string; municipio: string }>({ estado: '', municipio: '' });
  const [estados, setEstados] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [estadoId, setEstadoId] = useState('');
  const [enDibujo, setEnDibujo] = useState(false);
  const [preguntandoOtraUP, setPreguntandoOtraUP] = useState(false);

  // Mapa
  const dibujarRef = useRef<DibujarPoligonoHandle>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('idle');
  const [pointCount, setPointCount] = useState(0);
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([23.6, -102.5]);
  const [mapReady, setMapReady] = useState(false);

  // Paso 6 — PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const validarCURP = (c: string) =>
    /^[A-Z]{4}[0-9]{6}[A-Z0-9]{6}[0-9]{2}$/.test(c.toUpperCase().trim());

  const consultarCURP = async () => {
    if (!validarCURP(curp)) {
      setError('El formato de la CURP no es válido.');
      return;
    }
    setCargando(true); setError(null);
    try {
      const res = await fetch(`${BASE}/productor/auth/consultar-curp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp: curp.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo verificar la CURP.'); return; }
      setDatosPadron(data.datos);
      setTelefonoEditable(data.datos.telefono || '');
      setPaso(2);
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally { setCargando(false); }
  };

  const cargarEstados = async () => {
    try {
      const r = await fetch(`${BASE}/auth/states`);
      const d = await r.json();
      setEstados(Array.isArray(d) ? d : d.states || []);
    } catch { /* ignore */ }
  };

  const cargarMunicipios = async (sid: string) => {
    try {
      const r = await fetch(`${BASE}/auth/municipalities?state_id=${sid}`);
      const d = await r.json();
      setMunicipios(Array.isArray(d) ? d : d.municipalities || []);
    } catch { setMunicipios([]); }
  };

  useEffect(() => {
    if (paso === 4 && enDibujo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}, { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [paso, enDibujo]);

  const onUPDibujada = (poly: [number, number][], centro: { lat: number; lng: number }, area: number) => {
    setUps(prev => [...prev, {
      poligono: poly, coords: centro, areaCalc: area,
      estado: upActual.estado, municipio: upActual.municipio,
    }]);
    setEnDibujo(false); setPointCount(0); setGpsMsg(null); setPreguntandoOtraUP(true);
  };

  const registrar = async () => {
    if (pin !== confirmPin) { setError('Los PINs no coinciden.'); return; }
    if (pin.length !== 4) { setError('El PIN debe ser de 4 dígitos.'); return; }

    setCargando(true); setError(null);
    try {
      const res = await fetch(`${BASE}/productor/auth/registro-nuevo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curp: curp.toUpperCase().trim(),
          nombres: datosPadron?.nombres,
          apellido_paterno: datosPadron?.apellido_paterno,
          apellido_materno: datosPadron?.apellido_materno,
          fecha_nacimiento: datosPadron?.fecha_nacimiento,
          genero: datosPadron?.genero,
          telefono: telefonoEditable,
          correo: datosPadron?.correo,
          pin,
          ups: ups.map(up => ({
            lat: up.coords?.lat ?? null,
            lng: up.coords?.lng ?? null,
            poligono: up.poligono ?? null,
            area_calc_ha: up.areaCalc,
            area_real_ha: up.areaCalc,
            coincide_area: true,
            estado_up: up.estado,
            municipio_up: up.municipio,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrar.'); return; }
      setPaso(99);
    } finally { setCargando(false); }
  };

  const handleBack = () => {
    if (paso === 6) setPaso(5);
    else if (paso === 5) {
      const lastUP = ups[ups.length - 1];
      if (lastUP) setUpActual({ estado: lastUP.estado, municipio: lastUP.municipio });
      setUps(prev => prev.slice(0, -1));
      setPaso(3);
    }
    else if (paso === 4 && enDibujo) {
      setEnDibujo(false); setPaso(3);
    }
    else if (paso === 3) {
      if (ups.length > 0) setPaso(5);
      else setPaso(2);
    }
    else if (paso === 2) setPaso(1);
    else navigate(-1);
  };

  // --- STYLES ---
  const inputCls = 'w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-2.5 sm:py-3.5 text-sm sm:text-base tracking-wide text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all';
  const labelCls = 'block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 sm:mb-1.5';
  const btnCls = 'w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] rounded-xl py-3 sm:py-4 text-sm sm:text-base font-bold disabled:opacity-30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2';

  // --- MAPA (Paso 4) ---
  if (paso === 4 && enDibujo) {
    const puedeTerminar = pointCount >= 3;
    return (
      <div 
        className="h-[100dvh] flex flex-col overflow-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-[#0c2e1a] px-4 py-3 flex items-center gap-3 z-10 shadow-md">
          <button onClick={handleBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-bold text-green-300 uppercase tracking-wider">Geolocalización</p>
            <p className="text-xs text-white/80 mt-0.5">Parcela {ups.length + 1} — {upActual.municipio}, {upActual.estado}</p>
          </div>
        </div>
        <div className="flex-1 relative">
          <MapContainer center={center} zoom={mapReady ? 16 : 5} style={{ height: '100%', width: '100%' }} whenReady={() => setMapReady(true)}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" />
            <DibujarPoligonoUP
              ref={dibujarRef}
              onModeChange={setDrawMode}
              onPointCountChange={setPointCount}
              onPoligonoCompleto={onUPDibujada}
              onPoligonoEliminado={() => {}}
            />
          </MapContainer>

          <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto space-y-2.5 animate-auth-in">
            <p className="text-center text-xs text-white bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 font-medium ring-1 ring-white/10">
              {pointCount === 0
                ? 'Toca el mapa en cada esquina de tu parcela para marcarla.'
                : 'Toca la siguiente esquina. Cuando termines, pulsa Finalizar.'}
            </p>
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
              className="w-full bg-[#1A5C38]/90 backdrop-blur-md ring-1 ring-white/20 text-white py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              {capturandoGPS
                ? (<><Loader2 size={16} className="animate-spin" /> Obteniendo ubicación…</>)
                : (<><Footprints size={16} /> Estoy en la esquina — usar mi GPS</>)}
            </button>
            {gpsMsg && <p className="text-center text-[11px] text-green-200 bg-[#1A5C38]/80 backdrop-blur-md rounded-xl px-3 py-1.5 ring-1 ring-green-400/30">{gpsMsg}</p>}
            {pointCount > 0 && (
              <div className="flex gap-2">
                <button onClick={() => dibujarRef.current?.undoVertex()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-white py-3.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all">
                  <Undo2 size={16} /> Deshacer
                </button>
                <button onClick={() => dibujarRef.current?.finishDraw()} disabled={!puedeTerminar}
                  className="flex-[1.4] flex items-center justify-center gap-1.5 bg-green-500 text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-green-900/50">
                  <CheckCircle2 size={17} /> {puedeTerminar ? `Finalizar (${pointCount})` : `Faltan ${Math.max(0, 3 - pointCount)}`}
                </button>
              </div>
            )}
            {drawMode === 'editing' && (
              <button onClick={() => dibujarRef.current?.saveEdit()}
                className="w-full bg-green-500 text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-green-900/50 active:scale-[0.98] transition-all">
                Guardar ajustes
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Helper para saber el "paso visual" en el header (1 al 4)
  const getVisualStep = () => {
    if (paso === 1) return 1;
    if (paso === 2) return 2;
    if (paso >= 3 && paso <= 5) return 3;
    if (paso === 6) return 4;
    return 4;
  };

  const visualStep = getVisualStep();

  return (
    <div 
      className="relative h-[100dvh] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background idéntico a Login */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header con Stepper */}
      {paso < 99 && (
        <div className="relative z-10 flex items-center px-4 py-3 sm:py-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <ChevronLeft size={22} className="text-white/70" />
          </button>
          
          <div className="flex-1 flex justify-center items-center px-2">
            <div className="flex w-full max-w-[200px] sm:max-w-[280px] justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-green-400 -translate-y-1/2 rounded-full transition-all duration-500" 
                style={{ width: `${((visualStep - 1) / 3) * 100}%` }} 
              />
              
              {[1, 2, 3, 4].map(num => (
                <div key={num} className={`relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 ${visualStep >= num ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-[#0c2e1a] ring-2 ring-white/20'}`}>
                  {visualStep > num ? (
                    <Check size={14} className="text-[#1A5C38] font-bold" strokeWidth={3} />
                  ) : (
                    <span className={`text-[10px] sm:text-xs font-bold ${visualStep === num ? 'text-[#1A5C38]' : 'text-white/40'}`}>{num}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="w-9" />
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-6 sm:pb-10 pt-2 sm:pt-4 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Paso 1 — CURP */}
          {paso === 1 && (
            <div className="animate-auth-in">
              <div className="text-center mb-5 sm:mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-white/20 shadow-lg shadow-black/20">
                  <UserCheck size={32} className="text-green-300" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Nuevo Registro</h1>
                <p className="text-white/50 text-sm sm:text-base mt-2">Verificaremos tu identidad en SADER</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20">
                <label className={labelCls}>Ingresa tu CURP</label>
                <input
                  type="text" value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="AAAA000000AAAAAA00"
                  maxLength={18}
                  className={`${inputCls} font-mono uppercase text-center text-lg sm:text-xl`}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[11px] text-white/40">18 caracteres obligatorios</p>
                  <p className="text-[11px] font-mono text-white/40">{curp.length}/18</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-200 text-sm flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span> <span>{error}</span>
                  </div>
                )}

                <button onClick={consultarCURP} disabled={curp.length !== 18 || cargando} className={`mt-4 sm:mt-5 ${btnCls}`}>
                  {cargando ? (<><Loader2 size={18} className="animate-spin" /> Conectando con SADER…</>) : (<><Search size={18} /> Verificar Identidad</>)}
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <button onClick={() => navigate('/login-productor')} className="text-sm font-semibold text-green-300 hover:text-white transition-colors">
                  ¿Ya estás registrado? Inicia sesión
                </button>
              </div>
            </div>
          )}

          {/* Paso 2 — Datos Padron */}
          {paso === 2 && datosPadron && (
            <div className="animate-auth-in">
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Datos Encontrados</h1>
                <p className="text-green-300 text-sm mt-1.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Identidad verificada
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
                <div className="space-y-3">
                  {[
                    { label: 'Nombre', valor: `${datosPadron.nombres} ${datosPadron.apellido_paterno} ${datosPadron.apellido_materno}` },
                    { label: 'CURP', valor: datosPadron.curp },
                    { label: 'Ubicación', valor: `${datosPadron.municipio_padron || '—'}, ${datosPadron.estado_padron || '—'}` },
                  ].map(item => (
                    <div key={item.label} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                      <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium text-white mt-0.5">{item.valor}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className={labelCls}>Teléfono de contacto</label>
                  <input type="tel" value={telefonoEditable} onChange={e => setTelefonoEditable(e.target.value.replace(/\D/g, ''))}
                    placeholder="10 dígitos" maxLength={10} className={inputCls} />
                </div>

                <button onClick={() => { cargarEstados(); setPaso(3); }} className={`mt-2 ${btnCls}`}>
                  <Check size={18} /> Confirmar y Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 3 — Ubicación UP */}
          {paso === 3 && (
            <div className="animate-auth-in">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 ring-1 ring-white/20">
                  <MapPin size={26} className="text-green-300" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Ubicación de Parcela</h1>
                <p className="text-white/50 text-sm mt-1.5">¿En qué estado y municipio se encuentra?</p>
              </div>

              {datosPadron?.estado_padron && ups.length === 0 && (
                <div className="bg-green-500/20 ring-1 ring-green-400/30 rounded-2xl p-4 mb-4 backdrop-blur-md">
                  <p className="text-sm text-green-100 text-center leading-relaxed">
                    Tu domicilio registrado es <strong className="text-white">{datosPadron.municipio_padron}, {datosPadron.estado_padron}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setUpActual({ estado: datosPadron.estado_padron || '', municipio: datosPadron.municipio_padron || '' });
                      setEnDibujo(true); setPaso(4);
                    }}
                    className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    Mi parcela está ahí
                  </button>
                </div>
              )}

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20">
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Estado</label>
                    <select value={estadoId}
                      onChange={e => {
                        const sel = estados.find(s => String(s.state_id) === e.target.value);
                        setEstadoId(e.target.value);
                        setUpActual({ estado: sel?.name || sel?.state_name || '', municipio: '' });
                        setMunicipios([]);
                        if (e.target.value) cargarMunicipios(e.target.value);
                      }}
                      className={`${inputCls} appearance-none [&>option]:text-gray-900`}
                    >
                      <option value="">Selecciona estado...</option>
                      {estados.map(s => <option key={s.state_id} value={s.state_id}>{s.name || s.state_name}</option>)}
                    </select>
                  </div>

                  {estadoId && (
                    <div className="animate-auth-in">
                      <label className={labelCls}>Municipio</label>
                      <select value={upActual.municipio || ''}
                        onChange={e => setUpActual(prev => ({ ...prev, municipio: e.target.value }))}
                        className={`${inputCls} appearance-none [&>option]:text-gray-900`}
                      >
                        <option value="">Selecciona municipio...</option>
                        {municipios.map(m => <option key={m.municipality_id} value={m.name || m.municipality_name}>{m.name || m.municipality_name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {error && <div className="mt-4 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-200 text-sm"><p>{error}</p></div>}

                <button
                  onClick={() => {
                    if (!upActual.estado || !upActual.municipio) { setError('Selecciona estado y municipio.'); return; }
                    setError(null); setEnDibujo(true); setPaso(4);
                  }}
                  disabled={!upActual.estado || !upActual.municipio}
                  className={`mt-4 sm:mt-6 ${btnCls}`}
                >
                  <Map size={18} /> Continuar al Mapa
                </button>
              </div>
            </div>
          )}

          {/* Paso 5 — ¿Otra UP? */}
          {preguntandoOtraUP && paso !== 99 && (
            <div className="animate-auth-in">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-2 ring-green-400/50">
                  <Check size={32} className="text-green-300" strokeWidth={3} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Parcela Registrada</h1>
                <p className="text-white/70 text-sm mt-1.5">Has registrado {ups.length} {ups.length === 1 ? 'parcela' : 'parcelas'}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20 mb-2 sm:mb-4">
                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                  {ups.map((up, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                      <div className="w-8 h-8 rounded-lg bg-[#1A5C38] flex items-center justify-center text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{up.municipio}</p>
                        <p className="text-xs text-white/50">{up.estado} {up.areaCalc && `· ${up.areaCalc} ha`}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="font-semibold text-white text-center mb-4 text-lg">¿Tienes otra parcela?</h2>
                <div className="space-y-3">
                  <button onClick={() => {
                    setPreguntandoOtraUP(false); setUpActual({ estado: '', municipio: '' }); setEstadoId(''); setMunicipios([]); setPaso(3);
                  }} className="w-full bg-white/10 hover:bg-white/20 active:bg-white/15 ring-1 ring-white/20 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                    <Plus size={18} /> Sí, agregar otra
                  </button>
                  <button onClick={() => { setPreguntandoOtraUP(false); setPaso(6); }} className={btnCls}>
                    No, continuar a crear PIN
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 6 — PIN */}
          {paso === 6 && !preguntandoOtraUP && (
            <div className="animate-auth-in">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 ring-1 ring-white/20">
                  <KeyRound size={26} className="text-green-300" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Crea tu NIP</h1>
                <p className="text-white/50 text-sm mt-1.5">Lo usarás como contraseña junto con tu CURP</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20">
                <div className="space-y-5">
                  <div>
                    <label className={`${labelCls} text-center`}>NIP (4 dígitos)</label>
                    <input type="password" inputMode="numeric" value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••" maxLength={4}
                      className={`${inputCls} text-center text-3xl tracking-[1em] indent-[1em]`} />
                  </div>
                  <div>
                    <label className={`${labelCls} text-center`}>Confirma tu NIP</label>
                    <input type="password" inputMode="numeric" value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••" maxLength={4}
                      className={`${inputCls} text-center text-3xl tracking-[1em] indent-[1em]`} />
                  </div>
                </div>

                {error && <div className="mt-5 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-200 text-sm text-center"><p>{error}</p></div>}

                <button onClick={registrar} disabled={pin.length !== 4 || confirmPin.length !== 4 || cargando} className={`mt-6 ${btnCls}`}>
                  {cargando ? (<><Loader2 size={18} className="animate-spin" /> Registrando…</>) : (<><CheckCircle2 size={20} /> Finalizar Registro</>)}
                </button>
              </div>
            </div>
          )}

          {/* Paso 99 — Éxito (ahora integrado al flujo en lugar de modal para ser más estético) */}
          {paso === 99 && (
            <div className="animate-auth-in text-center pt-8">
              <div className="w-24 h-24 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(74,222,128,0.4)] animate-bounce">
                <Check size={48} className="text-[#061510]" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">¡Registro Exitoso!</h2>
              <p className="text-green-100/80 mb-10 text-lg">Tu cuenta ha sido creada correctamente.</p>
              
              <button onClick={() => navigate('/login-productor')}
                className="w-full bg-white hover:bg-gray-50 active:scale-[0.98] text-[#1A5C38] py-4 rounded-2xl font-bold text-lg transition-all shadow-xl">
                Iniciar Sesión
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
