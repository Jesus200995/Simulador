import { useState, useRef, useEffect } from 'react';
import {
  Upload, CheckCircle, AlertCircle, Clock, FileText, Leaf, RefreshCw,
  Info, Settings2, Bell, Check, X, Loader2, Activity, MapPin,
  BarChart3, Zap, Shield, Database
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

const NIVEL_CFG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  alto:  { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500',    label: 'Alto' },
  medio: { color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Medio' },
  bajo:  { color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500',label: 'Bajo' },
};

export default function SenasicaAdminPage() {
  const [archivo, setArchivo]       = useState<File | null>(null);
  const [subiendo, setSubiendo]     = useState(false);
  const [resultado, setResultado]   = useState<any | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [historial, setHistorial]   = useState<Carga[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [tab, setTab]               = useState<'cargar' | 'historial' | 'parametros'>('cargar');
  const [guardado, setGuardado]     = useState<string | null>(null);
  const [drag, setDrag]             = useState(false);
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
    }).catch(() => {}).finally(() => setCargando(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleSubir = async () => {
    if (!archivo) return;
    setSubiendo(true); setErrorMsg(null); setResultado(null);
    const fd = new FormData();
    fd.append('archivo', archivo);
    try {
      const res  = await fetch(`${BASE}/senasica/cargar-csv`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Error al procesar'); }
      else { setResultado(data.resumen); setArchivo(null); if (fileRef.current) fileRef.current.value = ''; cargarDatos(); }
    } catch { setErrorMsg('Error de conexión. Intenta de nuevo.'); }
    finally { setSubiendo(false); }
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) { setArchivo(f); setResultado(null); setErrorMsg(null); }
  };

  const TABS: { key: 'cargar' | 'historial' | 'parametros'; label: string; icon: any; badge?: number }[] = [
    { key: 'cargar',     label: 'Cargar CSV',      icon: Upload },
    { key: 'historial',  label: 'Historial',        icon: Clock,    badge: historial.length || undefined },
    { key: 'parametros', label: 'Radios de alerta', icon: Settings2 },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Header compacto ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] flex items-center justify-center shadow-sm">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-black text-gray-900 tracking-tight">Alertas Fitosanitarias SENASICA</h1>
            <p className="text-[10.5px] text-gray-400 mt-0.5">Carga CSV · Notificaciones geoespaciales automáticas</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-gray-400">Activo</span>
        </div>
      </div>

      {/* ── Tabs + Contenido ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-1 pt-1 gap-1">
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-bold rounded-t-xl border-b-2 transition-all duration-150 ${
                tab === key
                  ? 'border-[#1A5C38] text-[#1A5C38] bg-white'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-white/60'
              }`}
            >
              <Icon size={12} />
              {label}
              {badge ? (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-[#eef8f2] text-[#1A5C38]' : 'bg-gray-100 text-gray-500'
                }`}>{badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── TAB CARGAR CSV ── */}
          {tab === 'cargar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

              {/* Columna izquierda: instrucciones */}
              <div className="flex flex-col gap-3">
                <div className="bg-[#eef8f2] border border-[#1A5C38]/10 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Info size={12} className="text-[#1A5C38]" />
                    <span className="text-[11.5px] font-black text-[#1A5C38] tracking-tight">Instrucciones de carga</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: FileText,  text: 'Un CSV por plaga — ej: Gusano cogollero-Riego.csv' },
                      { icon: Activity,  text: 'Columnas: CVEGEO, CVE_ENT, CVE_MUN, CULTIVO, X, Y, HECTAREAS, RIESGO' },
                      { icon: Database,  text: 'Cada carga reemplaza alertas anteriores de la misma fuente' },
                      { icon: Bell,      text: 'Los productores reciben notificación según su parcela' },
                      { icon: Zap,       text: 'Soporta archivos hasta 250 MB' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-lg bg-[#1A5C38]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={10} className="text-[#1A5C38]" />
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats rápidos si hay historial */}
                {historial.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Cargas',       value: historial.length,                                              icon: Upload },
                      { label: 'Completadas',  value: historial.filter(h => h.estado === 'completado').length,       icon: CheckCircle },
                      { label: 'Notificaciones', value: historial.reduce((s, h) => s + (h.total_notificaciones || 0), 0), icon: Bell },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                        <s.icon size={12} className="text-[#1A5C38] mx-auto mb-1" />
                        <p className="text-[16px] font-black text-gray-900">{s.value}</p>
                        <p className="text-[9.5px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna derecha: carga */}
              <div className="flex flex-col gap-3">
                {/* Drop zone */}
                <div
                  onClick={() => !subiendo && fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-6 transition-all duration-200 cursor-pointer min-h-[140px]
                    ${subiendo    ? 'opacity-50 cursor-not-allowed border-gray-200' :
                      drag        ? 'border-[#1A5C38] bg-[#eef8f2] scale-[1.01]' :
                      archivo     ? 'border-[#1A5C38]/50 bg-[#eef8f2]/30 hover:bg-[#eef8f2]/50' :
                                    'border-gray-200 hover:border-[#1A5C38]/40 hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    archivo ? 'bg-[#1A5C38] shadow-md' : 'bg-gray-100'
                  }`}>
                    <Upload size={18} className={archivo ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="text-center">
                    <p className="text-[12.5px] font-bold text-gray-700">
                      {archivo ? archivo.name : 'Arrastra el CSV aquí o toca para seleccionar'}
                    </p>
                    {archivo && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{(archivo.size / 1024 / 1024).toFixed(1)} MB</p>
                    )}
                    {!archivo && (
                      <p className="text-[10.5px] text-gray-400 mt-0.5">Formato .csv · Máx 250 MB</p>
                    )}
                  </div>
                  {archivo && (
                    <button
                      onClick={e => { e.stopPropagation(); setArchivo(null); setResultado(null); setErrorMsg(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={10} /> Quitar archivo
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept=".csv" className="hidden"
                    onChange={e => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); setErrorMsg(null); }} />
                </div>

                {/* Botón subir */}
                <button
                  onClick={handleSubir}
                  disabled={!archivo || subiendo}
                  className="w-full bg-[#1A5C38] hover:bg-[#154d2f] active:scale-[0.98] text-white font-bold text-[12.5px] py-2.5
                             rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 shadow-sm"
                >
                  {subiendo ? (
                    <><Loader2 size={13} className="animate-spin" /> Procesando... puede tardar varios minutos</>
                  ) : (
                    <><Upload size={13} /> Subir y procesar CSV</>
                  )}
                </button>

                {/* Resultado */}
                {resultado && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-600" />
                      <p className="text-[12px] font-bold text-emerald-700">Archivo procesado correctamente</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Puntos',         value: resultado.puntos_procesados, icon: MapPin },
                        { label: 'UPs afectadas',  value: resultado.ups_afectadas,     icon: Shield },
                        { label: 'Notificaciones', value: resultado.notificaciones,    icon: Bell },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-lg p-2.5 text-center border border-emerald-100">
                          <s.icon size={11} className="text-[#1A5C38] mx-auto mb-1" />
                          <p className="text-[20px] font-black text-[#1A5C38]">{s.value}</p>
                          <p className="text-[9.5px] text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-red-700 font-medium">{errorMsg}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-gray-400 font-medium">{historial.length} cargas registradas</p>
                <button onClick={cargarDatos} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#1A5C38] transition-colors">
                  <RefreshCw size={11} className={cargando ? 'animate-spin' : ''} /> Actualizar
                </button>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[12px]">Cargando historial...</span>
                </div>
              ) : historial.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileText size={22} className="text-gray-300" />
                  </div>
                  <p className="text-[12px] font-bold text-gray-400">Sin cargas registradas</p>
                  <p className="text-[11px] text-gray-300">Sube tu primer archivo CSV de SENASICA</p>
                </div>
              ) : historial.map(c => (
                <div key={c.id} className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-3 space-y-2 transition-all duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <FileText size={12} className="text-gray-400" />
                      </div>
                      <p className="font-bold text-gray-800 text-[11.5px] truncate">{c.nombre_archivo}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      c.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                      c.estado === 'error'      ? 'bg-red-100 text-red-600'         :
                                                  'bg-amber-100 text-amber-600'}`}>
                      {c.estado === 'completado' ? <><Check size={9} /> Completado</> :
                       c.estado === 'error'      ? <><X size={9} /> Error</> :
                                                   <><Loader2 size={9} className="animate-spin" /> Procesando</>}
                    </span>
                  </div>

                  {c.estado === 'completado' && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Puntos', value: c.total_puntos,         icon: Activity },
                        { label: 'UPs',    value: c.total_ups_afectadas,  icon: MapPin },
                        { label: 'Notifs', value: c.total_notificaciones, icon: Bell },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-lg p-2 border border-gray-100 flex items-center gap-1.5">
                          <s.icon size={10} className="text-[#1A5C38] shrink-0" />
                          <div>
                            <p className="font-black text-[13px] text-gray-900 leading-none">{s.value}</p>
                            <p className="text-[9px] text-gray-400">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {c.estado === 'error' && c.error_detalle && (
                    <p className="text-[10px] text-red-600 bg-red-50 rounded-lg p-2 break-all leading-relaxed">
                      {c.error_detalle.slice(0, 200)}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Clock size={9} />
                    {new Date(c.created_at).toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    <span className="text-gray-200">·</span>
                    {c.subido_por || 'Admin'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB PARÁMETROS ── */}
          {tab === 'parametros' && (
            <div className="space-y-3 max-w-md mx-auto">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Settings2 size={12} className="text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Ajusta el radio de notificación por nivel de riesgo. Los cambios aplican en la siguiente carga de CSV.
                </p>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[11px]">Cargando...</span>
                </div>
              ) : parametros.map(p => {
                const cfg = NIVEL_CFG[p.nivel_riesgo] ?? NIVEL_CFG.bajo;
                return (
                  <div key={p.id} className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border} transition-all duration-150`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <p className={`text-[12.5px] font-black ${cfg.color} capitalize tracking-tight`}>Riesgo {cfg.label}</p>
                      </div>
                      {guardado === p.nivel_riesgo && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
                          <Check size={10} /> Guardado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <input
                          type="number"
                          defaultValue={p.radio_km}
                          min={1} max={500}
                          onBlur={e => handleActualizarRadio(p.nivel_riesgo, Number(e.target.value))}
                          className="w-16 px-2.5 py-1.5 text-[13px] font-black text-center outline-none"
                        />
                        <span className="text-[10px] text-gray-400 pr-2.5 font-medium">km</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={10} className={cfg.color} />
                        <p className="text-[10.5px] text-gray-500">Radio de notificación</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Leyenda */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={11} className="text-gray-400" />
                  <p className="text-[10.5px] font-bold text-gray-500">Referencia de distancias</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { nivel: 'alto',  km: 50, desc: 'Dispersión real máxima documentada del gusano cogollero' },
                    { nivel: 'medio', km: 25, desc: 'Zona de vigilancia cercana' },
                    { nivel: 'bajo',  km: 10, desc: 'Solo productores más cercanos — informativo' },
                  ].map(r => {
                    const c = NIVEL_CFG[r.nivel];
                    return (
                      <div key={r.nivel} className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.dot} mt-1 shrink-0`} />
                        <p className="text-[10px] text-gray-500 leading-snug">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
