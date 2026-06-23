import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Download, Eye, MapPin, Calendar, User, FileText,
  ShieldCheck, Camera, X, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, AlertTriangle, RefreshCw,
} from 'lucide-react';

const BASE        = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const UPLOADS_BASE = BASE.replace('/api', '');
const HDR         = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Aviso {
  producer_id: number;
  curp: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  phone: string | null;
  aviso_privacidad_aceptado: boolean;
  aviso_privacidad_fecha: string | null;
  aviso_privacidad_lat: number | null;
  aviso_privacidad_lng: number | null;
  aviso_privacidad_version: string | null;
  aviso_privacidad_foto_url: string | null;
  estado_validacion: string;
  created_at: string;
}

const fmtFecha = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const nombreCompleto = (a: Aviso) =>
  [a.nombres, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(' ');

const fotoURL = (url: string | null) =>
  url ? `${UPLOADS_BASE}/uploads/${url}` : null;

// ── Generador de PDF vía ventana de impresión ────────────────────────────────
function generarPDF(aviso: Aviso) {
  const foto    = fotoURL(aviso.aviso_privacidad_foto_url);
  const nombre  = nombreCompleto(aviso);
  const fecha   = fmtFecha(aviso.aviso_privacidad_fecha);
  const coords  = aviso.aviso_privacidad_lat && aviso.aviso_privacidad_lng
    ? `${aviso.aviso_privacidad_lat.toFixed(6)}, ${aviso.aviso_privacidad_lng.toFixed(6)}`
    : 'No disponible';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Aviso de Privacidad — ${nombre}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #0e5c33; padding-bottom: 16px; margin-bottom: 24px; }
    .logo-box { width: 48px; height: 48px; background: #0e5c33; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-box span { color: #fff; font-weight: 900; font-size: 14px; letter-spacing: 1px; }
    .header-text h1 { font-size: 18px; font-weight: 800; color: #0e5c33; }
    .header-text p  { font-size: 10px; color: #666; margin-top: 3px; text-transform: uppercase; letter-spacing: 1px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid #86efac; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .field { margin-bottom: 8px; }
    .field label { font-size: 9px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 2px; text-transform: uppercase; }
    .field value { font-size: 12px; font-weight: 600; color: #1e293b; display: block; }
    .foto-section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 20px; display: flex; gap: 16px; align-items: flex-start; }
    .foto-box { width: 120px; height: 120px; border-radius: 10px; border: 2px solid #e2e8f0; overflow: hidden; flex-shrink: 0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
    .foto-box img { width: 100%; height: 100%; object-fit: cover; }
    .foto-info { flex: 1; }
    .foto-info h3 { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
    .foto-info p { font-size: 10px; color: #64748b; line-height: 1.5; }
    .legal { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-bottom: 20px; }
    .legal h3 { font-size: 11px; font-weight: 700; color: #15803d; margin-bottom: 6px; }
    .legal p { font-size: 9px; color: #166534; line-height: 1.6; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 9px; color: #94a3b8; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-box"><span>SIMAC</span></div>
    <div class="header-text">
      <h1>Constancia de Aceptación — Aviso de Privacidad</h1>
      <p>Sistema de Información de Mercados Agrícolas del Maíz · Plan Nacional Maíz 2026</p>
    </div>
  </div>

  <div class="badge">Aviso aceptado · Versión ${aviso.aviso_privacidad_version || '1.0'}</div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Datos del Productor</div>
      <div class="field"><label>Nombre completo</label><value>${nombre}</value></div>
      <div class="field"><label>CURP</label><value>${aviso.curp}</value></div>
      <div class="field"><label>Teléfono</label><value>${aviso.phone || '—'}</value></div>
    </div>
    <div class="card">
      <div class="card-title">Datos de la Aceptación</div>
      <div class="field"><label>Fecha y hora</label><value>${fecha}</value></div>
      <div class="field"><label>Coordenadas GPS</label><value>${coords}</value></div>
      <div class="field"><label>Versión del aviso</label><value>${aviso.aviso_privacidad_version || '1.0'}</value></div>
    </div>
  </div>

  <div class="foto-section">
    <div class="foto-box">
      ${foto
        ? `<img src="${foto}" alt="Verificación biométrica" crossorigin="anonymous"/>`
        : '<span style="font-size:10px;color:#94a3b8;text-align:center;padding:8px">Sin fotografía</span>'
      }
    </div>
    <div class="foto-info">
      <h3>Verificación Biométrica del Titular</h3>
      <p>La fotografía adjunta fue capturada en el dispositivo del productor en el momento exacto de la aceptación del aviso de privacidad, como constancia de la identidad del titular de la cuenta.</p>
      <p style="margin-top:8px;color:#0e5c33;font-weight:600;">ID Productor: #${aviso.producer_id} · Estado: ${aviso.estado_validacion}</p>
    </div>
  </div>

  <div class="legal">
    <h3>Fundamento Legal</h3>
    <p>
      Esta constancia acredita que el productor identificado con CURP <strong>${aviso.curp}</strong> aceptó
      voluntariamente el Aviso de Privacidad emitido por la Secretaría de Agricultura y Desarrollo Rural (SADER),
      de conformidad con los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de los
      Particulares (LFPDPPP), y demás normatividad aplicable. La aceptación fue registrada electrónicamente con
      marca de tiempo, coordenadas GPS y verificación biométrica facial del titular.
    </p>
  </div>

  <div class="footer">
    <p>Generado el ${new Date().toLocaleString('es-MX')} · SIMAC — Plan Nacional Maíz 2026</p>
    <p>Documento generado automáticamente · No requiere firma física</p>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ── Modal detalle ─────────────────────────────────────────────────────────────
function ModalDetalle({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  const foto   = fotoURL(aviso.aviso_privacidad_foto_url);
  const nombre = nombreCompleto(aviso);
  const coords = aviso.aviso_privacidad_lat && aviso.aviso_privacidad_lng
    ? `${aviso.aviso_privacidad_lat.toFixed(6)}, ${aviso.aviso_privacidad_lng.toFixed(6)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <ShieldCheck size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-none">Aviso de Privacidad</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{aviso.curp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generarPDF(aviso)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors"
            >
              <Download size={12} /> PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Foto + datos */}
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
              {foto
                ? <img src={foto} alt="Verificación" className="w-full h-full object-cover" />
                : <Camera size={22} className="text-gray-300" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-[15px] leading-tight">{nombre}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-1">{aviso.curp}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  aviso.estado_validacion === 'activo'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <CheckCircle2 size={10} /> {aviso.estado_validacion}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  v{aviso.aviso_privacidad_version || '1.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Datos de aceptación */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Datos de la aceptación</p>
            <Row icon={<Calendar size={13} className="text-emerald-500" />} label="Fecha y hora" value={fmtFecha(aviso.aviso_privacidad_fecha)} />
            <Row icon={<MapPin size={13} className="text-emerald-500" />} label="Coordenadas GPS" value={coords || 'No disponible'} mono={!!coords} />
            <Row icon={<User size={13} className="text-emerald-500" />} label="Teléfono" value={aviso.phone || '—'} />
          </div>

          {/* Verificación biométrica */}
          {foto && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Camera size={12} className="text-gray-400" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verificación biométrica del titular</p>
              </div>
              <img src={foto} alt="Verificación biométrica" className="w-full object-cover max-h-64" />
            </div>
          )}

          {/* Nota legal */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-[10px] text-emerald-700 leading-relaxed">
              Este productor aceptó el aviso de privacidad de conformidad con la LFPDPPP. La aceptación
              fue registrada con marca de tiempo, coordenadas GPS y verificación biométrica.
              ID Productor: <strong>#{aviso.producer_id}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-[12px] font-semibold text-gray-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AvisosPrivacidadAdminPage() {
  const [avisos, setAvisos]           = useState<Aviso[]>([]);
  const [total, setTotal]             = useState(0);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [busqueda, setBusqueda]       = useState('');
  const [pagina, setPagina]           = useState(1);
  const [seleccionado, setSeleccionado] = useState<Aviso | null>(null);
  const POR_PAG = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async (q: string, pag: number) => {
    setCargando(true);
    setError(null);
    try {
      const offset = (pag - 1) * POR_PAG;
      const res = await fetch(
        `${BASE}/admin/avisos-privacidad?q=${encodeURIComponent(q)}&limit=${POR_PAG}&offset=${offset}`,
        { headers: HDR() }
      );
      if (!res.ok) throw new Error('Error al cargar avisos');
      const data = await res.json();
      setAvisos(data.avisos);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(busqueda, pagina);
  }, [pagina]);

  const onBusqueda = (val: string) => {
    setBusqueda(val);
    setPagina(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => cargar(val, 1), 300);
  };

  const totalPags = Math.ceil(total / POR_PAG);

  return (
    <>
      {seleccionado && <ModalDetalle aviso={seleccionado} onClose={() => setSeleccionado(null)} />}

      <div className="space-y-5 h-full flex flex-col">

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard
            icon={<ShieldCheck size={18} className="text-emerald-500" />}
            label="Total de avisos aceptados"
            value={total}
            color="emerald"
          />
          <MetricCard
            icon={<Camera size={18} className="text-blue-500" />}
            label="Con verificación biométrica"
            value={avisos.filter(a => a.aviso_privacidad_foto_url).length}
            suffix={`/ ${avisos.length}`}
            color="blue"
          />
          <MetricCard
            icon={<MapPin size={18} className="text-violet-500" />}
            label="Con coordenadas GPS"
            value={avisos.filter(a => a.aviso_privacidad_lat).length}
            suffix={`/ ${avisos.length}`}
            color="violet"
          />
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={busqueda}
            onChange={e => onBusqueda(e.target.value)}
            placeholder="Buscar por nombre, CURP…"
            className="flex-1 text-[14px] text-gray-700 placeholder-gray-400 bg-transparent outline-none"
          />
          {cargando && <Loader2 size={15} className="text-emerald-500 animate-spin flex-shrink-0" />}
          {busqueda && !cargando && (
            <button onClick={() => onBusqueda('')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={15} />
            </button>
          )}
          <button onClick={() => cargar(busqueda, pagina)} className="text-gray-400 hover:text-emerald-600 transition-colors ml-1">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Tabla / lista */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
          {error ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-red-500">
              <AlertTriangle size={16} /> <span className="text-sm">{error}</span>
            </div>
          ) : avisos.length === 0 && !cargando ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 py-16">
              <FileText size={36} strokeWidth={1.5} />
              <p className="text-sm font-medium">
                {busqueda ? 'Sin resultados para la búsqueda' : 'Aún no hay avisos de privacidad registrados'}
              </p>
            </div>
          ) : (
            <>
              {/* Header tabla */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                {['Productor', 'Fecha de aceptación', 'GPS', 'Foto', 'Acciones'].map(h => (
                  <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              {/* Filas */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {cargando
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : avisos.map(aviso => (
                    <FilaAviso
                      key={aviso.producer_id}
                      aviso={aviso}
                      onVer={() => setSeleccionado(aviso)}
                      onPDF={() => generarPDF(aviso)}
                    />
                  ))
                }
              </div>

              {/* Paginación */}
              {totalPags > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {(pagina - 1) * POR_PAG + 1}–{Math.min(pagina * POR_PAG, total)} de {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="text-[11px] font-bold text-gray-700">{pagina} / {totalPags}</span>
                    <button
                      onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                      disabled={pagina === totalPags}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, suffix, color }: {
  icon: React.ReactNode; label: string; value: number; suffix?: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue:    'bg-blue-50 border-blue-100',
    violet:  'bg-violet-50 border-violet-100',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color] || colors.emerald}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p></div>
      <p className="text-2xl font-black text-gray-900">
        {value} {suffix && <span className="text-sm font-semibold text-gray-400">{suffix}</span>}
      </p>
    </div>
  );
}

function FilaAviso({ aviso, onVer, onPDF }: { aviso: Aviso; onVer: () => void; onPDF: () => void }) {
  const foto   = fotoURL(aviso.aviso_privacidad_foto_url);
  const nombre = nombreCompleto(aviso);
  const coords = aviso.aviso_privacidad_lat && aviso.aviso_privacidad_lng;

  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors group">
      {/* Productor */}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">{nombre}</p>
        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{aviso.curp}</p>
      </div>

      {/* Fecha */}
      <div className="min-w-0">
        <p className="text-[11px] text-gray-700 font-medium">{fmtFecha(aviso.aviso_privacidad_fecha)}</p>
        <p className="text-[9px] text-gray-400 mt-0.5">v{aviso.aviso_privacidad_version || '1.0'}</p>
      </div>

      {/* GPS */}
      <div>
        {coords
          ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={9} /> Capturado</span>
          : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"><X size={9} /> No disp.</span>
        }
      </div>

      {/* Foto */}
      <div>
        {foto
          ? (
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200">
              <img src={foto} alt="foto" className="w-full h-full object-cover" />
            </div>
          )
          : <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"><Camera size={13} className="text-gray-300" /></div>
        }
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onVer}
          title="Ver detalle"
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-500 flex items-center justify-center transition-colors"
        >
          <Eye size={13} />
        </button>
        <button
          onClick={onPDF}
          title="Descargar PDF"
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 flex items-center justify-center transition-colors"
        >
          <Download size={13} />
        </button>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 px-5 py-3.5 items-center animate-pulse">
      <div className="space-y-1.5"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="h-5 bg-gray-100 rounded-full w-20" />
      <div className="w-9 h-9 bg-gray-100 rounded-lg" />
      <div className="flex gap-1.5"><div className="w-7 h-7 bg-gray-100 rounded-lg" /><div className="w-7 h-7 bg-gray-100 rounded-lg" /></div>
    </div>
  );
}
