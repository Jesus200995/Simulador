import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, CheckCircle, AlertCircle, Clock, FileText, RefreshCw,
  Info, Settings2, Bell, Check, X, Loader2, Activity, MapPin,
  BarChart3, Zap, Shield, Database, FileUp, Cpu
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
  completado_en?: string;
}

interface Parametro {
  id: number;
  nivel_riesgo: string;
  radio_km: number;
}

const NIVEL_CFG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  alto:  { color: 'text-red-600',     bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500',    label: 'Alto' },
  medio: { color: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Medio' },
  bajo:  { color: 'text-emerald-600', bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500',label: 'Bajo' },
};

/* ─── Modal de progreso ───────────────────────────────────────────── */
type ModalFase = 'subiendo' | 'procesando' | 'completado' | 'error';

interface ModalState {
  visible: boolean;
  fase: ModalFase;
  archivo: string;
  uploadPct: number;
  cargaId: number | null;
  resultado: Carga | null;
  errorMsg: string | null;
}

function ModalProgreso({ state, onClose }: { state: ModalState; onClose: () => void }) {
  if (!state.visible) return null;

  const { fase, archivo, uploadPct, resultado, errorMsg } = state;
  const puedesCerrar = fase === 'completado' || fase === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={puedesCerrar ? onClose : undefined}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn .18s ease' }} />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'slideUp .22s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 flex items-center gap-3 ${
          fase === 'completado' ? 'bg-emerald-50' :
          fase === 'error'      ? 'bg-red-50'     : 'bg-gray-50'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            fase === 'subiendo'    ? 'bg-blue-100'    :
            fase === 'procesando'  ? 'bg-amber-100'   :
            fase === 'completado'  ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {fase === 'subiendo'   && <FileUp   size={18} className="text-blue-600" />}
            {fase === 'procesando' && <Cpu      size={18} className="text-amber-600 animate-pulse" />}
            {fase === 'completado' && <CheckCircle size={18} className="text-emerald-600" />}
            {fase === 'error'      && <AlertCircle size={18} className="text-red-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-black leading-tight ${
              fase === 'completado' ? 'text-emerald-800' :
              fase === 'error'      ? 'text-red-800'     : 'text-gray-800'
            }`}>
              {fase === 'subiendo'   && 'Subiendo archivo…'}
              {fase === 'procesando' && 'Procesando datos…'}
              {fase === 'completado' && '¡Carga completada!'}
              {fase === 'error'      && 'Error al procesar'}
            </p>
            <p className="text-[10.5px] text-gray-400 truncate mt-0.5">{archivo}</p>
          </div>
          {puedesCerrar && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ml-1">
              <X size={13} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* ── Fase: subiendo ── */}
          {fase === 'subiendo' && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-gray-500">Transferencia</span>
                  <span className="text-[11px] font-black text-blue-600">{uploadPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center">No cierres esta ventana mientras se sube el archivo</p>
            </>
          )}

          {/* ── Fase: procesando ── */}
          {fase === 'procesando' && (
            <>
              {/* Barra animada indeterminada */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-gray-500">Procesando puntos SENASICA</span>
                  <Loader2 size={11} className="text-amber-500 animate-spin" />
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-indeterminate" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: FileText,  label: 'Leyendo CSV',           done: true },
                  { icon: Database,  label: 'Deduplicando por municipio', done: true },
                  { icon: MapPin,    label: 'Calculando UPs cercanas', done: false },
                  { icon: Bell,      label: 'Enviando notificaciones', done: false },
                ].map(s => (
                  <div key={s.label} className={`flex items-center gap-2 p-2 rounded-lg border text-[10.5px] ${
                    s.done ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}>
                    {s.done
                      ? <Check size={10} className="text-emerald-500 shrink-0" />
                      : <Loader2 size={10} className="animate-spin shrink-0 text-amber-400" />}
                    <span className="font-medium leading-snug">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10.5px] text-gray-400 text-center">
                Puedes seguir usando el sistema. Te avisaremos cuando termine.
              </p>
            </>
          )}

          {/* ── Fase: completado ── */}
          {fase === 'completado' && resultado && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Puntos leídos',   value: resultado.total_puntos?.toLocaleString('es-MX') ?? '—', icon: Activity,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
                  { label: 'UPs afectadas',    value: resultado.total_ups_afectadas?.toLocaleString('es-MX') ?? '0', icon: Shield, color: 'text-[#002f2a]', bg: 'bg-emerald-50' },
                  { label: 'Notificaciones',   value: resultado.total_notificaciones?.toLocaleString('es-MX') ?? '0', icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50'  },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 text-center ${s.bg}`}>
                    <s.icon size={14} className={`${s.color} mx-auto mb-1.5`} />
                    <p className={`text-[22px] font-black ${s.color} leading-none`}>{s.value}</p>
                    <p className="text-[9.5px] text-gray-500 mt-1 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full bg-[#002f2a] hover:bg-[#1e5b4f] text-white font-bold text-[12.5px] py-2.5 rounded-xl transition-colors active:scale-[0.98]"
              >
                Entendido
              </button>
            </>
          )}

          {/* ── Fase: error ── */}
          {fase === 'error' && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[11px] text-red-700 leading-relaxed break-words">
                  {errorMsg || 'Ocurrió un error inesperado al procesar el archivo.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold text-[12.5px] py-2.5 rounded-xl transition-colors active:scale-[0.98]"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(24px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes indeterminate {
          0%   { width:0%;   margin-left:0% }
          50%  { width:60%;  margin-left:20% }
          100% { width:0%;   margin-left:100% }
        }
        .animate-indeterminate { animation: indeterminate 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────── */
export default function SenasicaAdminPage() {
  const [archivo, setArchivo]       = useState<File | null>(null);
  const [historial, setHistorial]   = useState<Carga[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [tab, setTab]               = useState<'cargar' | 'historial' | 'parametros'>('cargar');
  const [guardado, setGuardado]     = useState<string | null>(null);
  const [drag, setDrag]             = useState(false);
  const fileRef   = useRef<HTMLInputElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const token     = localStorage.getItem('simac_token') ?? '';

  const [modal, setModal] = useState<ModalState>({
    visible: false, fase: 'subiendo', archivo: '', uploadPct: 0,
    cargaId: null, resultado: null, errorMsg: null
  });

  const cargarDatos = useCallback(() => {
    setCargando(true);
    Promise.all([
      fetch(`${BASE}/senasica/historial`,  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${BASE}/senasica/parametros`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([h, p]) => {
      setHistorial(h.cargas ?? []);
      setParametros(p.parametros ?? []);
    }).catch(() => {}).finally(() => setCargando(false));
  }, [token]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  /* Polling del estado de la carga */
  const iniciarPolling = useCallback((cargaId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/senasica/estado/${cargaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data: Carga = await r.json();
        if (data.estado === 'completado') {
          clearInterval(pollRef.current!);
          setModal(m => ({ ...m, fase: 'completado', resultado: data }));
          cargarDatos();
        } else if (data.estado === 'error') {
          clearInterval(pollRef.current!);
          setModal(m => ({ ...m, fase: 'error', errorMsg: data.error_detalle || 'Error desconocido' }));
          cargarDatos();
        }
      } catch { /* reintentar */ }
    }, 1500);
  }, [token, cargarDatos]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* Subir con XHR para tener progreso real */
  const handleSubir = useCallback(() => {
    if (!archivo) return;

    setModal({ visible: true, fase: 'subiendo', archivo: archivo.name,
               uploadPct: 0, cargaId: null, resultado: null, errorMsg: null });

    const fd = new FormData();
    fd.append('archivo', archivo);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setModal(m => ({ ...m, uploadPct: Math.round((e.loaded / e.total) * 100) }));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        let data: any = {};
        try { data = JSON.parse(xhr.responseText); } catch {}
        const cargaId = data.cargaId;
        setModal(m => ({ ...m, fase: 'procesando', cargaId }));
        setArchivo(null);
        if (fileRef.current) fileRef.current.value = '';
        if (cargaId) iniciarPolling(cargaId);
      } else {
        let msg = 'Error al procesar el archivo';
        try { msg = JSON.parse(xhr.responseText)?.error || msg; } catch {}
        setModal(m => ({ ...m, fase: 'error', errorMsg: msg }));
      }
    };

    xhr.onerror = () => setModal(m => ({ ...m, fase: 'error', errorMsg: 'Error de conexión. Intenta de nuevo.' }));

    xhr.open('POST', `${BASE}/senasica/cargar-csv`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(fd);
  }, [archivo, token, iniciarPolling]);

  const handleActualizarRadio = async (nivel: string, radio: number) => {
    try {
      await fetch(`${BASE}/senasica/parametros/${nivel}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ radio_km: radio })
      });
      setGuardado(nivel);
      setTimeout(() => setGuardado(null), 2000);
    } catch { /**/ }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setArchivo(f);
  };

  const closeModal = () => {
    setModal(m => ({ ...m, visible: false }));
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const TABS: { key: 'cargar' | 'historial' | 'parametros'; label: string; icon: any; badge?: number }[] = [
    { key: 'cargar',     label: 'Cargar CSV',      icon: Upload },
    { key: 'historial',  label: 'Historial',        icon: Clock,    badge: historial.length || undefined },
    { key: 'parametros', label: 'Radios de alerta', icon: Settings2 },
  ];

  const procesando = historial.some(h => h.estado === 'procesando');

  return (
    <div className="flex flex-col gap-3 h-full">
      <ModalProgreso state={modal} onClose={closeModal} />

      {/* ── Tab Bar ── */}
      <div className="bg-[#e6f0ef] flex-shrink-0 rounded-b-2xl border border-[#002f2a]/30 border-t-0 overflow-hidden">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-1">
            {TABS.map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${
                  tab === key ? 'bg-[#002f2a] text-white shadow-sm' : 'text-[#002f2a] hover:bg-[#cce8e5]'
                }`}>
                <Icon size={11} />{label}
                {badge ? <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20 text-white' : 'bg-[#002f2a]/10 text-[#002f2a]'}`}>{badge}</span> : null}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${procesando ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-semibold text-[#002f2a]/60">{procesando ? 'Procesando' : 'Activo'}</span>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── TAB CARGAR CSV ── */}
          {tab === 'cargar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

              {/* Instrucciones */}
              <div className="flex flex-col gap-3">
                <div className="bg-[#e6f0ef] border border-[#002f2a]/10 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Info size={12} className="text-[#002f2a]" />
                    <span className="text-[11.5px] font-black text-[#002f2a] tracking-tight">Instrucciones de carga</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: FileText,  text: 'Un CSV por plaga — ej: Gusano cogollero-Riego.csv' },
                      { icon: Activity,  text: 'Columnas detectadas automáticamente por nombre (CVEGEO, X, Y, RIESGO…)' },
                      { icon: Database,  text: 'Deduplica por municipio — soporta millones de filas' },
                      { icon: Bell,      text: 'Los productores reciben notificación según su parcela' },
                      { icon: Zap,       text: 'Sin límite de tamaño — archivos de 300 MB son válidos' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-lg bg-[#002f2a]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={10} className="text-[#002f2a]" />
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {historial.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Cargas',         value: historial.length,                                                   icon: Upload },
                      { label: 'Completadas',    value: historial.filter(h => h.estado === 'completado').length,            icon: CheckCircle },
                      { label: 'Notificaciones', value: historial.reduce((s, h) => s + (h.total_notificaciones || 0), 0),   icon: Bell },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                        <s.icon size={12} className="text-[#002f2a] mx-auto mb-1" />
                        <p className="text-[16px] font-black text-gray-900">{s.value.toLocaleString('es-MX')}</p>
                        <p className="text-[9.5px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drop zone + botón */}
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-6 transition-all duration-200 cursor-pointer min-h-[140px]
                    ${drag   ? 'border-[#002f2a] bg-[#e6f0ef] scale-[1.01]' :
                      archivo ? 'border-[#002f2a]/50 bg-[#e6f0ef]/30 hover:bg-[#e6f0ef]/50' :
                                'border-gray-200 hover:border-[#002f2a]/40 hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${archivo ? 'bg-[#002f2a] shadow-md' : 'bg-gray-100'}`}>
                    <Upload size={18} className={archivo ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="text-center">
                    <p className="text-[12.5px] font-bold text-gray-700">
                      {archivo ? archivo.name : 'Arrastra el CSV aquí o toca para seleccionar'}
                    </p>
                    {archivo
                      ? <p className="text-[11px] text-gray-400 mt-0.5">{(archivo.size / 1024 / 1024).toFixed(1)} MB</p>
                      : <p className="text-[11px] text-gray-400 mt-0.5">Formato .csv · Sin límite de tamaño</p>
                    }
                  </div>
                  {archivo && (
                    <button
                      onClick={e => { e.stopPropagation(); setArchivo(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    ><X size={10} /> Quitar archivo</button>
                  )}
                  <input ref={fileRef} type="file" accept=".csv" className="hidden"
                    onChange={e => { setArchivo(e.target.files?.[0] ?? null); }} />
                </div>

                <button
                  onClick={handleSubir}
                  disabled={!archivo}
                  className="w-full bg-[#002f2a] hover:bg-[#1e5b4f] active:scale-[0.98] text-white font-bold text-[12.5px] py-2.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <Upload size={13} /> Subir y procesar CSV
                </button>
              </div>
            </div>
          )}

          {/* ── TAB HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-gray-400 font-medium">{historial.length} cargas registradas</p>
                <button onClick={cargarDatos} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#002f2a] transition-colors">
                  <RefreshCw size={11} className={cargando ? 'animate-spin' : ''} /> Actualizar
                </button>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[12px]">Cargando historial…</span>
                </div>
              ) : historial.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FileText size={22} className="text-gray-300" />
                  </div>
                  <p className="text-[12px] font-bold text-gray-400">Sin cargas registradas</p>
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
                          <s.icon size={10} className="text-[#002f2a] shrink-0" />
                          <div>
                            <p className="font-black text-[13px] text-gray-900 leading-none">{(s.value || 0).toLocaleString('es-MX')}</p>
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
                </div>
              ) : parametros.map(p => {
                const cfg = NIVEL_CFG[p.nivel_riesgo] ?? NIVEL_CFG.bajo;
                return (
                  <div key={p.id} className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}>
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

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={11} className="text-gray-400" />
                  <p className="text-[10.5px] font-bold text-gray-500">Referencia</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { nivel: 'alto',  desc: 'Dispersión real máxima documentada del gusano cogollero' },
                    { nivel: 'medio', desc: 'Zona de vigilancia cercana' },
                    { nivel: 'bajo',  desc: 'Solo productores más cercanos — informativo' },
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
