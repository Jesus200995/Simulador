import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft, Check, CheckCircle2, MapPin, Undo2, Footprints, Loader2, Plus,
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

  // ── Paso 1: Consultar CURP en el padrón SADER ──────────────────
  const consultarCURP = async () => {
    if (!validarCURP(curp)) {
      setError('El formato de la CURP no es válido. Verifica los 18 caracteres.');
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

  // ── Cargar estados (mismo endpoint del sistema) ────────────────
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

  // Centrar el mapa con GPS al entrar al dibujo
  useEffect(() => {
    if (paso === 4 && enDibujo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}, { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [paso, enDibujo]);

  // ── UP dibujada ────────────────────────────────────────────────
  const onUPDibujada = (
    poly: [number, number][],
    centro: { lat: number; lng: number },
    area: number
  ) => {
    setUps(prev => [...prev, {
      poligono: poly, coords: centro, areaCalc: area,
      estado: upActual.estado, municipio: upActual.municipio,
    }]);
    setEnDibujo(false);
    setPointCount(0);
    setGpsMsg(null);
    setPreguntandoOtraUP(true);
  };

  // ── Paso 6: Registro final ─────────────────────────────────────
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
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally { setCargando(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]';

  // ── Paso 4 — Mapa full-screen ──────────────────────────────────
  if (paso === 4 && enDibujo) {
    const puedeTerminar = pointCount >= 3;
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => { setEnDibujo(false); setPaso(3); }} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">REGISTRO INICIAL DE PARCELAS Y PRODUCCIÓN</p>
            <p className="text-xs text-gray-500 mt-0.5">Parcela {ups.length + 1} — {upActual.municipio}, {upActual.estado}</p>
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

          <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto space-y-2.5">
            <p className="text-center text-[11px] text-white bg-black/40 rounded-lg px-3 py-1.5">
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
              className="w-full bg-white/90 ring-1 ring-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {capturandoGPS
                ? (<><Loader2 size={16} className="animate-spin" /> Obteniendo ubicación…</>)
                : (<><Footprints size={16} /> Estoy en la esquina — usar mi GPS</>)}
            </button>
            {gpsMsg && <p className="text-center text-[11px] text-white bg-black/40 rounded-lg px-3 py-1.5">{gpsMsg}</p>}
            {pointCount > 0 && (
              <div className="flex gap-2">
                <button onClick={() => dibujarRef.current?.undoVertex()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 ring-1 ring-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold">
                  <Undo2 size={16} /> Deshacer
                </button>
                <button onClick={() => dibujarRef.current?.finishDraw()} disabled={!puedeTerminar}
                  className="flex-[1.4] flex items-center justify-center gap-1.5 bg-[#1A5C38] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40">
                  <CheckCircle2 size={17} /> {puedeTerminar ? `Finalizar (${pointCount})` : `Faltan ${Math.max(0, 3 - pointCount)}`}
                </button>
              </div>
            )}
            {drawMode === 'editing' && (
              <button onClick={() => dibujarRef.current?.saveEdit()}
                className="w-full bg-[#1A5C38] text-white py-3 rounded-xl text-sm font-bold">
                Guardar ajustes
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      {paso < 99 && (
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => paso > 1 ? setPaso(paso - 1) : navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-sm">Registro de productor</h1>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 6].map(p => (
                <div key={p} className={`h-1 flex-1 rounded-full ${paso >= p ? 'bg-[#1A5C38]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paso 1 — CURP */}
      {paso === 1 && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ingresa tu CURP</h2>
            <p className="text-sm text-gray-500 mb-4">Verificaremos tu información en el padrón de SADER</p>
            <input
              type="text" value={curp}
              onChange={e => setCurp(e.target.value.toUpperCase())}
              placeholder="Ej: VAMJ761015HSRLRS03"
              maxLength={18}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
            />
            <p className="text-xs text-gray-400 mt-1">{curp.length}/18 caracteres</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
          <button onClick={consultarCURP} disabled={curp.length !== 18 || cargando}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-40 flex items-center justify-center gap-2">
            {cargando ? (<><Loader2 size={18} className="animate-spin" /> Verificando…</>) : 'Verificar CURP'}
          </button>
          <button onClick={() => navigate('/login-productor')} className="w-full text-center text-sm text-gray-500 py-2">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      )}

      {/* Paso 2 — Confirmar datos del padrón */}
      {paso === 2 && datosPadron && (
        <div className="p-4 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Encontrado en el padrón SADER</p>
              <p className="text-xs text-green-600 mt-0.5">Confirma que estos son tus datos</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            {[
              { label: 'Nombre', valor: `${datosPadron.nombres} ${datosPadron.apellido_paterno} ${datosPadron.apellido_materno}` },
              { label: 'CURP', valor: datosPadron.curp },
              { label: 'Estado (padrón)', valor: datosPadron.estado_padron || '—' },
              { label: 'Municipio (padrón)', valor: datosPadron.municipio_padron || '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{item.valor}</span>
              </div>
            ))}
            <div className="py-2">
              <label className="block text-sm text-gray-500 mb-1">Teléfono (puedes actualizarlo)</label>
              <input type="tel" value={telefonoEditable} onChange={e => setTelefonoEditable(e.target.value)}
                placeholder="10 dígitos" maxLength={10} className={inputCls} />
            </div>
          </div>
          <button onClick={() => { cargarEstados(); setPaso(3); }}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-bold">
            Sí, son mis datos
          </button>
        </div>
      )}

      {/* Paso 3 — Ubicación de la UP */}
      {paso === 3 && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1">¿Dónde está tu parcela{ups.length > 0 ? ` ${ups.length + 1}` : ''}?</h2>
            <p className="text-sm text-gray-500 mb-4">Indica el estado y municipio de la parcela</p>

            {datosPadron?.estado_padron && ups.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-800">
                  Tu domicilio en el padrón es <strong>{datosPadron.municipio_padron}, {datosPadron.estado_padron}</strong>.
                  ¿Tu parcela está ahí?
                </p>
                <button
                  onClick={() => {
                    setUpActual({ estado: datosPadron.estado_padron || '', municipio: datosPadron.municipio_padron || '' });
                    setEnDibujo(true); setPaso(4);
                  }}
                  className="mt-2 text-sm font-medium text-blue-700 underline"
                >
                  Sí, usar este estado y municipio
                </button>
              </div>
            )}

            <select value={estadoId}
              onChange={e => {
                const sel = estados.find(s => String(s.state_id) === e.target.value);
                setEstadoId(e.target.value);
                setUpActual({ estado: sel?.name || sel?.state_name || '', municipio: '' });
                setMunicipios([]);
                if (e.target.value) cargarMunicipios(e.target.value);
              }}
              className={`${inputCls} mb-3`}
            >
              <option value="">Selecciona el estado</option>
              {estados.map(s => (
                <option key={s.state_id} value={s.state_id}>{s.name || s.state_name}</option>
              ))}
            </select>

            {estadoId && (
              <select value={upActual.municipio || ''}
                onChange={e => setUpActual(prev => ({ ...prev, municipio: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecciona el municipio</option>
                {municipios.map(m => (
                  <option key={m.municipality_id} value={m.name || m.municipality_name}>{m.name || m.municipality_name}</option>
                ))}
              </select>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}

          <button
            onClick={() => {
              if (!upActual.estado || !upActual.municipio) { setError('Selecciona estado y municipio.'); return; }
              setError(null); setEnDibujo(true); setPaso(4);
            }}
            disabled={!upActual.estado || !upActual.municipio}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-bold disabled:opacity-40"
          >
            Continuar — Dibujar parcela
          </button>
        </div>
      )}

      {/* Paso 5 — ¿Otra UP? */}
      {preguntandoOtraUP && paso !== 99 && (
        <div className="p-4 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Parcela {ups.length} registrada</p>
            <p className="text-xs text-green-600 mt-1">{ups[ups.length - 1]?.municipio}, {ups[ups.length - 1]?.estado}</p>
          </div>

          {ups.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 mb-3">Parcelas registradas ({ups.length}):</p>
              {ups.map((up, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-700">
                    {up.municipio}, {up.estado}
                    {up.areaCalc && <span className="text-gray-400 ml-1">· {up.areaCalc} ha</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1 text-center">¿Tienes otra parcela que registrar?</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Si tienes más parcelas agrégalas ahora</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setPreguntandoOtraUP(false);
                  setUpActual({ estado: '', municipio: '' });
                  setEstadoId(''); setMunicipios([]);
                  setPaso(3);
                }}
                className="w-full border-2 border-[#1A5C38] text-[#1A5C38] py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Sí, tengo otra parcela
              </button>
              <button
                onClick={() => { setPreguntandoOtraUP(false); setPaso(6); }}
                className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-bold"
              >
                No, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 6 — PIN */}
      {paso === 6 && !preguntandoOtraUP && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-1">Crea tu PIN de acceso</h2>
            <p className="text-sm text-gray-500 mb-4">4 dígitos que usarás para iniciar sesión con tu CURP</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PIN (4 dígitos)</label>
                <input type="password" inputMode="numeric" value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••" maxLength={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Confirma tu PIN</label>
                <input type="password" inputMode="numeric" value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••" maxLength={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1A5C38]" />
              </div>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
          <button onClick={registrar} disabled={pin.length !== 4 || confirmPin.length !== 4 || cargando}
            className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-40 flex items-center justify-center gap-2">
            {cargando ? (<><Loader2 size={18} className="animate-spin" /> Registrando…</>) : (<><Check size={20} /> Completar registro</>)}
          </button>
        </div>
      )}

      {/* Paso 99 — Éxito */}
      {paso === 99 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-[#1A5C38]" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-600 mb-1">Tu cuenta SIMAC está lista.</p>
            <p className="text-gray-500 text-sm mb-8">Inicia sesión con tu CURP y PIN de 4 dígitos.</p>
            <button onClick={() => navigate('/login-productor')}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-xl font-semibold text-lg">
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
