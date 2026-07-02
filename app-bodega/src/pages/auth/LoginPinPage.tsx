import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, AlertCircle, Loader2, UserPlus, KeyRound, Building2, ChevronRight, HelpCircle } from 'lucide-react';
import PinInput from '../../components/productor/PinInput';
import { useAuthStore } from '../../store/auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function LoginPinPage() {
  const [curp, setCurp] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'curp' | 'pin'>('curp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarSoporte, setMostrarSoporte] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleContinuar = () => {
    if (curp.length !== 18) return;
    setError('');
    setStep('pin');
  };

  const handlePinChange = async (val: string) => {
    setPin(val);
    if (val.length < 4) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp, pin: val }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'PIN incorrecto');
        setPin('');
        return;
      }

      const token = data.token;
      setAuth(token, {
        userId: data.user.id,
        email: '',
        rol: 'productor',
        nombre_completo: `${data.user.nombres ?? ''} ${data.user.apellido_paterno ?? ''}`.trim(),
      });

      // Verificar completitud: polígono → ciclo → dashboard
      try {
        const upsData = await fetch(`${BASE}/mis-ups`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());

        const up = upsData.ups?.[0] ?? upsData[0];
        const tienePoligono = up?.area_ha_calc != null;

        if (!tienePoligono) {
          navigate('/productor/ubicacion', { state: { desde: 'login', siguiente: '/productor/ciclo' } });
          return;
        }

        const ciclosData = await fetch(`${BASE}/ups/${up.up_id}/cycles`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json());
        const ciclos = ciclosData.cycles ?? ciclosData;

        if (!ciclos?.length) {
          localStorage.setItem('ciclo_pendiente', '1');
          navigate('/productor/ciclo', { state: { desde: 'login' } });
          return;
        }
      } catch { /* si falla la verificación, ir al dashboard */ }

      navigate('/productor');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020e0c] via-[#091f1b] to-[#1e5b4f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 sm:py-4 pt-safe">
        <button
          onClick={() => step === 'pin' ? (setStep('curp'), setPin(''), setError('')) : navigate('/')}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        {/* Step indicator */}
        <div className="flex-1 flex justify-center gap-2">
          <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 'curp' ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 'pin' ? 'bg-white' : 'bg-white/30'}`} />
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-8">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1e5b4f] rounded-[18px] sm:rounded-[20px] flex items-center justify-center shadow-xl shadow-green-900/40">
              {step === 'curp'
                ? <Wheat size={24} className="text-white sm:hidden" />
                : <KeyRound size={24} className="text-white sm:hidden" />
              }
              {step === 'curp'
                ? <Wheat size={28} className="text-white hidden sm:block" />
                : <KeyRound size={28} className="text-white hidden sm:block" />
              }
            </div>
          </div>

          {step === 'curp' ? (
            <div className="animate-slide-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-1.5 tracking-tight">
                Iniciar sesión
              </h1>
              <p className="text-white/50 text-sm sm:text-base text-center mb-6 sm:mb-8">
                Escribe tu CURP de 18 caracteres
              </p>

              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
                <label className="block text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
                  CURP
                </label>
                <input
                  type="text"
                  value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={18}
                  placeholder="AAAA000000AAAAAA00"
                  autoCapitalize="characters"
                  className="w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 sm:py-4
                             text-base sm:text-lg font-mono tracking-widest text-white placeholder-white/25
                             focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-white/30">Está en tu credencial INE o acta de nacimiento</span>
                  <span className="text-xs text-white/40 font-mono">{curp.length}/18</span>
                </div>

                <button
                  onClick={handleContinuar}
                  disabled={curp.length !== 18}
                  className="mt-4 sm:mt-5 w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1e5b4f]
                             rounded-xl py-3.5 sm:py-4 text-sm sm:text-base font-bold
                             disabled:opacity-30 active:scale-[0.98] transition-all duration-200"
                >
                  Continuar
                </button>
              </div>

              {/* Otras opciones de productor */}
              <div className="mt-6 sm:mt-7">
                <p className="text-white/40 text-xs text-center mb-2.5">¿No tienes cuenta todavía?</p>
                <div className="space-y-2.5">
                  <button onClick={() => navigate('/registro-nuevo')}
                    className="w-full flex items-center gap-3 bg-white/8 ring-1 ring-white/12 hover:bg-white/12 rounded-xl p-3 text-left active:scale-[0.98] transition-all">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <UserPlus size={17} className="text-green-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">Soy nuevo, registrarme</p>
                      <p className="text-white/40 text-xs mt-0.5 leading-snug">No estás en el padrón</p>
                    </div>
                    <ChevronRight size={16} className="text-white/30 shrink-0" />
                  </button>
                </div>
                <div className="border-t border-white/10 mt-4 pt-4 text-center">
                  <button onClick={() => navigate('/bienvenida', { state: { menu: 'bodega' } })}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-300 hover:text-green-200 transition-colors">
                    <Building2 size={15} /> ¿Eres bodega o industria? Ver opciones
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-slide-left text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                Ingresa tu PIN
              </h1>
              <p className="text-white/50 text-sm sm:text-base mb-6 sm:mb-8">
                PIN de 4 dígitos de tu cuenta
              </p>

              {error && (
                <div className="mb-5 mx-auto max-w-xs p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl
                                text-red-300 text-sm flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-2 text-white/60 py-8">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm sm:text-base">Verificando...</span>
                </div>
              ) : (
                <PinInput value={pin} onChange={handlePinChange} dark error={!!error} />
              )}

              {/* Enlace de recuperación de acceso */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMostrarSoporte(true)}
                  className="text-[13px] text-green-300 underline underline-offset-2 font-medium active:opacity-60 transition-opacity"
                >
                  ¿No puedes entrar? Solicita ayuda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet de soporte */}
      {mostrarSoporte && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setMostrarSoporte(false)}>
          <div className="bg-white w-full rounded-t-[20px] px-5 pt-5 pb-8 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />

            <div className="flex items-center gap-2">
              <HelpCircle size={20} className="text-[#1e5b4f]" />
              <h2 className="font-bold text-slate-800 text-[16px]">¿Olvidaste tu PIN?</h2>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed">
              Comunícate con tu técnico de campo o con nuestra línea de soporte.
              Ellos pueden ayudarte a recuperar el acceso a tu cuenta.
            </p>

            {/* PLACEHOLDER — Sustituir por el número oficial de soporte cuando sea definido por el equipo del proyecto. */}
            <a
              href="https://wa.me/521XXXXXXXXXX?text=Hola%2C%20olvid%C3%A9%20mi%20PIN%20de%20SIMAC%20y%20necesito%20ayuda%20para%20recuperar%20mi%20acceso"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-[14px] px-4 py-3 active:scale-95 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.847L.057 23.885a.75.75 0 00.921.921l6.04-1.471A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.49-5.2-1.347l-.373-.214-3.865.941.941-3.863-.214-.374A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <div>
                {/* PLACEHOLDER — reemplazar XXXXXXXXXX por el número real */}
                <p className="font-bold text-slate-800 text-[14px]">WhatsApp de soporte</p>
                <p className="text-[12px] text-slate-500">+52 1 XX XXXX XXXX</p>
              </div>
            </a>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Horario de atención: lunes a viernes de 9:00 a 17:00 hrs
            </p>

            <button
              type="button"
              onClick={() => setMostrarSoporte(false)}
              className="w-full border border-slate-200 text-slate-600 font-medium text-[14px] py-3 rounded-[14px] active:scale-95 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
