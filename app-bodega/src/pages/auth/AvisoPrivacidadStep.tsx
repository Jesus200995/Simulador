import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Shield, MapPin, CheckCircle2, Camera, Loader2,
  RefreshCw, AlertTriangle, Check, FileText, Eye,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AVISO_VERSION = '1.0';

export interface AvisoData {
  aceptado: true;
  fecha: string;
  lat: number | null;
  lng: number | null;
  fotoUrl: string;
  version: string;
}

interface Props {
  nombreTitular: string;
  onAceptar: (datos: AvisoData) => void;
  onBack: () => void;
}

type FaseAviso = 'texto' | 'verificacion';
type GpsStatus = 'idle' | 'capturing' | 'ok' | 'error';
type CamStatus = 'idle' | 'requesting' | 'active' | 'captured' | 'uploading' | 'ok' | 'fallback' | 'error';

export default function AvisoPrivacidadStep({ nombreTitular, onAceptar, onBack }: Props) {
  const [fase, setFase] = useState<FaseAviso>('texto');

  // GPS
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Cámara / verificación biométrica
  const [camStatus, setCamStatus] = useState<CamStatus>('idle');
  const [camError, setCamError] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null); // path en servidor
  const [fotoPreview, setFotoPreview] = useState<string | null>(null); // blob URL para preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aceptando
  const [aceptando, setAceptando] = useState(false);

  const puedeAceptar = gpsStatus === 'ok' && (camStatus === 'ok') && !aceptando;

  // ── GPS ──────────────────────────────────────────────
  const capturarGPS = useCallback(() => {
    setGpsStatus('capturing');
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('ok');
      },
      (err) => {
        setGpsStatus('error');
        setGpsError(
          err.code === 1
            ? 'Permiso de ubicación denegado. Actívalo en la configuración de tu dispositivo.'
            : 'No se pudo obtener la ubicación. Verifica tu señal GPS.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  // Auto-captura GPS al entrar en la fase de verificación
  useEffect(() => {
    if (fase === 'verificacion' && gpsStatus === 'idle') {
      capturarGPS();
    }
  }, [fase, gpsStatus, capturarGPS]);

  // Limpiar stream de cámara al desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── CÁMARA ───────────────────────────────────────────
  const iniciarCamara = async () => {
    setCamStatus('requesting');
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamStatus('active');
    } catch {
      // Fallback: input file con captura nativa
      setCamStatus('fallback');
    }
  };

  const detenerCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const tomarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Recortar cuadrado centrado
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    detenerCamara();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const preview = URL.createObjectURL(blob);
      setFotoPreview(preview);
      setCamStatus('captured');
      subirFoto(blob);
    }, 'image/jpeg', 0.85);
  };

  const subirFoto = async (blob: Blob) => {
    setCamStatus('uploading');
    try {
      const form = new FormData();
      form.append('foto', blob, 'verificacion.jpg');
      const res = await fetch(`${BASE}/productor/auth/upload-verificacion`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
      setFotoUrl(data.path);
      setCamStatus('ok');
    } catch (e: any) {
      setCamError(e.message || 'No se pudo subir la imagen. Intenta de nuevo.');
      setCamStatus('error');
    }
  };

  const retomar = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
    setFotoUrl(null);
    setCamStatus('idle');
    setCamError(null);
  };

  // Fallback: file input (cámara nativa del SO)
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFotoPreview(preview);
    setCamStatus('captured');
    subirFoto(file);
  };

  // ── ACEPTAR ──────────────────────────────────────────
  const handleAceptar = async () => {
    if (!puedeAceptar || !fotoUrl) return;
    setAceptando(true);
    onAceptar({
      aceptado: true,
      fecha: new Date().toISOString(),
      lat: gpsCoords?.lat ?? null,
      lng: gpsCoords?.lng ?? null,
      fotoUrl,
      version: AVISO_VERSION,
    });
  };

  // ────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────
  const pageCls = 'relative min-h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]';

  return (
    <div className={pageCls} style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <button
          onClick={fase === 'verificacion' ? () => setFase('texto') : onBack}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">
            {fase === 'texto' ? 'Aviso de Privacidad' : 'Verificación de Identidad'}
          </p>
          <p className="text-[12px] text-white/60 mt-0.5">
            {fase === 'texto' ? 'Léelo completo antes de continuar' : 'Requerida para completar tu registro'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center ring-1 ring-green-400/30">
          {fase === 'texto' ? <FileText size={16} className="text-green-300" /> : <Shield size={16} className="text-green-300" />}
        </div>
      </div>

      {/* ── FASE 1: TEXTO DEL AVISO ── */}
      {fase === 'texto' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-white/80 text-[13px] leading-relaxed">

            <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-4">
              <h2 className="text-white font-bold text-base mb-1">AVISO DE PRIVACIDAD SIMPLIFICADO</h2>
              <p className="text-green-300 text-[11px] font-semibold uppercase tracking-wider">
                Versión {AVISO_VERSION} — Secretaría de Agricultura y Desarrollo Rural
              </p>
            </div>

            <Section title="Identidad del Responsable">
              La <strong className="text-white">Secretaría de Agricultura y Desarrollo Rural (SADER)</strong>, con domicilio en Municipio Libre 377, Col. Santa Cruz Atoyac, Alcaldía Benito Juárez, C.P. 03310, Ciudad de México, es la responsable del tratamiento de tus datos personales, en términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normatividad aplicable.
            </Section>

            <Section title="Datos que Recabamos">
              Con motivo del registro en la plataforma de administración de bodegas y comercialización de maíz, recabamos los siguientes datos personales:
              <ul className="mt-2 space-y-1.5 pl-4">
                <ListItem>Datos de identificación: nombre completo, CURP, sexo, fecha de nacimiento.</ListItem>
                <ListItem>Datos de contacto: teléfono, correo electrónico.</ListItem>
                <ListItem>Datos de ubicación: coordenadas GPS del lugar donde aceptas este aviso y ubicación de tus unidades de producción.</ListItem>
                <ListItem>Datos biométricos: fotografía de verificación de identidad del titular de la cuenta, capturada al momento del registro.</ListItem>
                <ListItem>Datos patrimoniales: superficie, ubicación y características de tus parcelas agrícolas.</ListItem>
              </ul>
            </Section>

            <Section title="Finalidades del Tratamiento">
              <strong className="text-white">Finalidades primarias</strong> (necesarias para el servicio):
              <ul className="mt-1.5 space-y-1 pl-4">
                <ListItem>Verificar tu identidad como productor agrícola ante los padrones de SADER.</ListItem>
                <ListItem>Gestionar tu cuenta de acceso a la plataforma.</ListItem>
                <ListItem>Registrar y administrar tus unidades de producción (parcelas).</ListItem>
                <ListItem>Facilitar la comercialización de tus cosechas con bodegas registradas.</ListItem>
                <ListItem>Cumplir con obligaciones legales en materia agrícola y de protección de datos.</ListItem>
              </ul>
              <br />
              <strong className="text-white">Finalidades secundarias</strong> (puedes oponerte):
              <ul className="mt-1.5 space-y-1 pl-4">
                <ListItem>Envío de notificaciones sobre programas de apoyo agrícola.</ListItem>
                <ListItem>Estadísticas sobre producción agrícola regional.</ListItem>
              </ul>
            </Section>

            <Section title="Transferencias de Datos">
              Tus datos podrán compartirse con:
              <ul className="mt-2 space-y-1.5 pl-4">
                <ListItem><strong className="text-white">Instancias gubernamentales</strong> como ASERCA, SAGARPA y dependencias de la APF, cuando sea requerido por ley.</ListItem>
                <ListItem><strong className="text-white">Bodegas y acopiadoras</strong> con las que decidas realizar operaciones de venta, únicamente los datos necesarios para la transacción.</ListItem>
              </ul>
              No se realizarán transferencias distintas sin tu consentimiento expreso.
            </Section>

            <Section title="Uso de Datos de Ubicación y Fotografía">
              La captura de tus coordenadas GPS y fotografía al momento de aceptar este aviso tiene como finalidad exclusiva <strong className="text-white">acreditar la identidad del titular y el lugar y momento de la aceptación</strong>, con fines de validez jurídica. Estos datos se almacenan de forma segura y solo son accesibles por personal autorizado de SADER.
            </Section>

            <Section title="Derechos ARCO">
              Tienes derecho de <strong className="text-white">Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> sobre tus datos. Para ejercerlos, envía una solicitud a:
              <div className="mt-2 bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                <p>📧 privacidad@agricultura.gob.mx</p>
                <p className="mt-0.5">📍 Municipio Libre 377, Col. Santa Cruz Atoyac, CDMX</p>
              </div>
              Tu solicitud será atendida en un plazo máximo de <strong className="text-white">20 días hábiles</strong>.
            </Section>

            <Section title="Medidas de Seguridad">
              Implementamos medidas administrativas, físicas y técnicas para proteger tus datos contra daño, pérdida, alteración o acceso no autorizado, de conformidad con el Reglamento de la LFPDPPP.
            </Section>

            <Section title="Cambios al Aviso">
              Cualquier modificación a este aviso será notificada a través de la plataforma. La versión vigente siempre estará disponible en la pantalla de inicio de sesión.
            </Section>

            <div className="bg-amber-500/10 ring-1 ring-amber-400/30 rounded-2xl p-4 text-[12px] text-amber-200">
              <p className="font-bold mb-1">⚠️ Importante</p>
              <p>Al presionar <em>"Acepto y Continúo"</em> en el siguiente paso, confirmas haber leído y entendido este aviso, y autorizas el tratamiento de tus datos conforme a lo aquí descrito. Esta aceptación queda registrada con tu fotografía, ubicación GPS y marca de tiempo.</p>
            </div>

            <div className="h-4" /> {/* espacio inferior */}
          </div>

          {/* Botón continuar */}
          <div className="px-5 py-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <button
              onClick={() => setFase('verificacion')}
              className="w-full bg-white hover:bg-white/90 active:scale-[0.98] text-[#1A5C38] rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/30"
            >
              <Eye size={18} /> He leído el aviso — Continuar
            </button>
          </div>
        </div>
      )}

      {/* ── FASE 2: VERIFICACIÓN ── */}
      {fase === 'verificacion' && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* GPS */}
          <div className={`rounded-2xl p-4 ring-1 transition-all ${
            gpsStatus === 'ok' ? 'bg-green-500/10 ring-green-400/30' :
            gpsStatus === 'error' ? 'bg-red-500/10 ring-red-400/30' :
            'bg-white/5 ring-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ${
                gpsStatus === 'ok' ? 'bg-green-500/20 ring-green-400/30' :
                gpsStatus === 'error' ? 'bg-red-500/20 ring-red-400/30' :
                'bg-white/10 ring-white/15'
              }`}>
                {gpsStatus === 'capturing'
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : gpsStatus === 'ok'
                    ? <CheckCircle2 size={18} className="text-green-400" />
                    : <MapPin size={18} className={gpsStatus === 'error' ? 'text-red-400' : 'text-white/60'} />
                }
              </div>
              <div>
                <p className="text-white font-semibold text-[14px]">Ubicación de la aceptación</p>
                <p className={`text-[12px] ${
                  gpsStatus === 'ok' ? 'text-green-300' :
                  gpsStatus === 'error' ? 'text-red-300' : 'text-white/50'
                }`}>
                  {gpsStatus === 'idle' ? 'Solicitando permisos…' :
                   gpsStatus === 'capturing' ? 'Obteniendo ubicación GPS…' :
                   gpsStatus === 'ok' ? `${gpsCoords!.lat.toFixed(5)}, ${gpsCoords!.lng.toFixed(5)}` :
                   gpsError || 'Error de ubicación'}
                </p>
              </div>
            </div>
            {gpsStatus === 'error' && (
              <button onClick={capturarGPS} className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-red-300 hover:text-white transition-colors">
                <RefreshCw size={13} /> Reintentar ubicación
              </button>
            )}
          </div>

          {/* Verificación biométrica (selfie disfrazada) */}
          <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                {camStatus === 'ok'
                  ? <CheckCircle2 size={18} className="text-green-400" />
                  : <Camera size={18} className="text-white/60" />
                }
              </div>
              <div>
                <p className="text-white font-semibold text-[14px]">Verificación biométrica del titular</p>
                <p className="text-[11px] text-white/50">Requerida para validez jurídica del consentimiento</p>
              </div>
            </div>

            {/* Preview foto capturada */}
            {fotoPreview && (
              <div className="relative mb-3">
                <img
                  src={fotoPreview}
                  alt="Verificación"
                  className="w-full aspect-square object-cover rounded-xl ring-2 ring-green-400/40"
                />
                {camStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="text-white animate-spin" />
                    <p className="text-white text-xs font-medium">Guardando verificación…</p>
                  </div>
                )}
                {camStatus === 'ok' && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            )}

            {/* Video preview */}
            {camStatus === 'active' && (
              <div className="relative mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-square object-cover rounded-xl ring-1 ring-white/20"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 rounded-xl ring-inset ring-2 ring-white/10 pointer-events-none" />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />

            {camStatus === 'error' && camError && (
              <div className="mb-3 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl flex items-start gap-2 text-red-200 text-[12px]">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {camError}
              </div>
            )}

            {/* Input file fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={onFileChange}
            />

            {/* Botones según estado */}
            {camStatus === 'idle' && (
              <button
                onClick={iniciarCamara}
                className="w-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Camera size={16} /> Iniciar verificación biométrica
              </button>
            )}

            {camStatus === 'requesting' && (
              <div className="flex items-center justify-center gap-2 py-3 text-white/60 text-sm">
                <Loader2 size={16} className="animate-spin" /> Solicitando acceso a cámara…
              </div>
            )}

            {camStatus === 'active' && (
              <button
                onClick={tomarFoto}
                className="w-full bg-white text-[#1A5C38] py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
              >
                <Camera size={17} /> Capturar
              </button>
            )}

            {camStatus === 'fallback' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Camera size={16} /> Tomar foto con cámara
              </button>
            )}

            {(camStatus === 'ok' || camStatus === 'error') && (
              <button
                onClick={retomar}
                className="w-full mt-2 text-[12px] text-white/50 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw size={12} /> Volver a capturar
              </button>
            )}
          </div>

          {/* Botón Aceptar */}
          <div className="pt-2 pb-4">
            <button
              onClick={handleAceptar}
              disabled={!puedeAceptar}
              className="w-full bg-white hover:bg-white/90 active:scale-[0.98] text-[#1A5C38] rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/30 disabled:opacity-30 disabled:cursor-not-allowed text-[15px]"
            >
              {aceptando
                ? <><Loader2 size={18} className="animate-spin" /> Registrando aceptación…</>
                : <><CheckCircle2 size={18} /> Acepto el Aviso de Privacidad</>
              }
            </button>

            {!puedeAceptar && !aceptando && (
              <p className="text-center text-[11px] text-white/40 mt-2">
                {gpsStatus !== 'ok' && 'Esperando ubicación GPS · '}
                {camStatus !== 'ok' && 'Verifica tu identidad para continuar'}
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Helpers de layout ───────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-white font-bold text-[13px] uppercase tracking-wide border-b border-white/10 pb-1">{title}</h3>
      <div className="text-white/70 text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-green-400 flex-shrink-0 mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  );
}
