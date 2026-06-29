import { useState, useRef, useEffect } from 'react';
import {
  Upload, CheckCircle, AlertCircle, Clock, FileText, Leaf, RefreshCw,
  Info, Settings2, Bell, Check, X, Loader2, Activity
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL ?? '';

interface Carga {
  id: number;
  nombre_archivo: string;
  subido_por: string;
  total_puntos: number;
  total_ups_afectadas: number;
  total_notificaciones: number;
  estado: 'procesando' | 'completado' | 'error';
  error_detalle?: string;
  created_at: string;
}

interface Parametro {
  id: number;
  nivel_riesgo: string;
  radio_km: number;
}

export default function SenasicaAdminPage() {
  const [archivo, setArchivo]       = useState<File | null>(null);
  const [subiendo, setSubiendo]     = useState(false);
  const [resultado, setResultado]   = useState<any | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [historial, setHistorial]   = useState<Carga[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [tab, setTab]               = useState<'cargar' | 'historial' | 'parametros'>('cargar');
  const [guardado, setGuardado]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const token   = localStorage.getItem('token') ?? '';

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      fetch(`${BASE}/senasica/historial`,  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${BASE}/senasica/parametros`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([h, p]) => {
      setHistorial(h.cargas ?? []);
      setParametros(p.parametros ?? []);
    }).catch(() => {})
    .finally(() => setCargando(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleSubir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res  = await fetch(`${BASE}/senasica/cargar-csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al procesar el archivo');
      } else {
        setResultado(data.resumen);
        setArchivo(null);
        if (fileRef.current) fileRef.current.value = '';
        cargarDatos();
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleActualizarRadio = async (nivel: string, radio: number) => {
    try {
      await fetch(`${BASE}/senasica/parametros/${nivel}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ radio_km: radio })
      });
      setGuardado(nivel);
      setTimeout(() => setGuardado(null), 2000);
    } catch { /* silencioso */ }
  };

  const nivelColor = (nivel: string) =>
    nivel === 'alto' ? 'bg-red-500' : nivel === 'medio' ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#eef8f2] flex items-center justify-center">
          <Leaf size={18} className="text-[#1A5C38]" />
        </div>
        <div>
          <h1 className="text-[15px] font-black text-gray-900">Alertas Fitosanitarias SENASICA</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Carga de archivos CSV · Notificaciones automáticas a productores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'cargar',     label: 'Cargar CSV' },
            { key: 'historial',  label: `Historial${historial.length ? ` (${historial.length})` : ''}` },
            { key: 'parametros', label: 'Radios de alerta' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-[12px] font-bold border-b-2 transition-colors ${
                tab === t.key ? 'border-[#1A5C38] text-[#1A5C38]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ── TAB: CARGAR CSV ── */}
          {tab === 'cargar' && (
            <div className="space-y-4 max-w-xl mx-auto">

              {/* Instrucciones */}
              <div className="bg-[#eef8f2] border border-[#1A5C38]/15 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={13} className="text-[#1A5C38]" />
                  <p className="text-[12px] font-bold text-[#1A5C38]">Instrucciones de carga</p>
                </div>
                <ul className="text-[11.5px] text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-2"><FileText size={11} className="text-[#1A5C38] mt-0.5 shrink-0" /> Sube un CSV por plaga (ej: <em>Gusano cogollero-Riego.csv</em>)</li>
                  <li className="flex items-start gap-2"><Activity size={11} className="text-[#1A5C38] mt-0.5 shrink-0" /> Columnas: CVEGEO, CVE_ENT, CVE_MUN, CULTIVO, X (lng), Y (lat), HECTAREAS, RIESGO</li>
                  <li className="flex items-start gap-2"><RefreshCw size={11} className="text-[#1A5C38] mt-0.5 shrink-0" /> Cada carga reemplaza las alertas anteriores de la misma fuente</li>
                  <li className="flex items-start gap-2"><Bell size={11} className="text-[#1A5C38] mt-0.5 shrink-0" /> Los productores reciben notificación automática según su parcela</li>
                  <li className="flex items-start gap-2"><Upload size={11} className="text-[#1A5C38] mt-0.5 shrink-0" /> Tamaño máximo: 250 MB</li>
                </ul>
              </div>

              {/* Zona de carga */}
              <div
                onClick={() => !subiendo && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all
                  ${subiendo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#1A5C38] hover:bg-[#eef8f2]/40'}
                  ${archivo ? 'border-[#1A5C38]/40 bg-[#eef8f2]/20' : 'border-gray-200'}`}
              >
                <Upload size={28} className={archivo ? 'text-[#1A5C38]' : 'text-gray-300'} />
                <div className="text-center">
                  <p className="text-[13px] font-bold text-gray-700">
                    {archivo ? archivo.name : 'Selecciona el archivo CSV'}
                  </p>
                  {archivo && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {(archivo.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                  {!archivo && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Arrastra o toca para seleccionar</p>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); setError(null); }}
                />
              </div>

              {/* Botón */}
              <button
                onClick={handleSubir}
                disabled={!archivo || subiendo}
                className="w-full bg-[#1A5C38] hover:bg-[#154d2f] text-white font-bold text-[13px] py-3
                           rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {subiendo ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Procesando archivo... puede tardar varios minutos
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Subir y procesar CSV
                  </>
                )}
              </button>

              {/* Resultado exitoso */}
              {resultado && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <p className="text-emerald-700 font-bold text-[13px] flex items-center gap-2">
                    <CheckCircle size={16} /> Archivo procesado correctamente
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Puntos procesados', value: resultado.puntos_procesados },
                      { label: 'UPs afectadas',      value: resultado.ups_afectadas },
                      { label: 'Notificaciones',     value: resultado.notificaciones }
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                        <p className="text-[22px] font-black text-[#1A5C38]">{s.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-[12px] font-medium flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={cargarDatos} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#1A5C38] transition">
                  <RefreshCw size={11} className={cargando ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>

              {cargando ? (
                <p className="text-center text-gray-400 text-[12px] py-8">Cargando historial...</p>
              ) : historial.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-[12px] text-gray-400">No hay cargas registradas aún</p>
                </div>
              ) : historial.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <p className="font-bold text-gray-800 text-[12px] truncate">{c.nombre_archivo}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      c.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                      c.estado === 'error'      ? 'bg-red-100 text-red-700'         :
                                                  'bg-amber-100 text-amber-700'}`}>
                      {c.estado === 'completado' ? <><Check size={10} /> Completado</> :
                       c.estado === 'error'      ? <><X size={10} /> Error</> :
                                                   <><Loader2 size={10} className="animate-spin" /> Procesando</>}
                    </span>
                  </div>

                  {c.estado === 'completado' && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Puntos', value: c.total_puntos },
                        { label: 'UPs',    value: c.total_ups_afectadas },
                        { label: 'Notifs', value: c.total_notificaciones }
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-100">
                          <p className="font-black text-[16px] text-[#1A5C38]">{s.value}</p>
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {c.estado === 'error' && c.error_detalle && (
                    <p className="text-[10.5px] text-red-600 bg-red-50 rounded-lg p-2 break-all">
                      {c.error_detalle.slice(0, 300)}
                    </p>
                  )}

                  <p className="text-[10.5px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(c.created_at).toLocaleString('es-MX')} · {c.subido_por || 'Admin'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: PARÁMETROS ── */}
          {tab === 'parametros' && (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                <Settings2 size={13} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11.5px] text-amber-700">
                  Radio de notificación por nivel de riesgo. Actualiza sin tocar código cuando SENASICA defina las distancias oficiales.
                </p>
              </div>

              {cargando ? (
                <p className="text-center text-gray-400 text-[12px] py-8">Cargando...</p>
              ) : parametros.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full ${nivelColor(p.nivel_riesgo)}`} />
                    <p className="font-bold text-gray-800 text-[13px] capitalize">Riesgo {p.nivel_riesgo}</p>
                    {guardado === p.nivel_riesgo && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold ml-auto">
                        <Check size={10} /> Guardado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      defaultValue={p.radio_km}
                      min={1} max={500}
                      onBlur={e => handleActualizarRadio(p.nivel_riesgo, Number(e.target.value))}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] font-bold
                                 text-center outline-none focus:border-[#1A5C38] transition"
                    />
                    <span className="text-[12px] text-gray-500">kilómetros</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
