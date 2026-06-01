import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, AlertCircle, Loader2, UserPlus, KeyRound } from 'lucide-react';
import PinInput from '../../components/productor/PinInput';
import { useAuthStore } from '../../store/auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function LoginPinPage() {
  const [curp, setCurp] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'curp' | 'pin'>('curp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
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
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1A5C38] rounded-[18px] sm:rounded-[20px] flex items-center justify-center shadow-xl shadow-green-900/40">
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
                  className="mt-4 sm:mt-5 w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                             rounded-xl py-3.5 sm:py-4 text-sm sm:text-base font-bold
                             disabled:opacity-30 active:scale-[0.98] transition-all duration-200"
                >
                  Continuar
                </button>
              </div>

              {/* Links */}
              <div className="mt-6 sm:mt-8 space-y-3 text-center">
                <div className="border-t border-white/10 pt-5">
                  <p className="text-white/40 text-xs sm:text-sm mb-2">¿Primera vez?</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center">
                    <button
                      onClick={() => navigate('/activar')}
                      className="flex items-center gap-1.5 text-sm font-semibold text-green-300 hover:text-green-200 transition-colors"
                    >
                      <UserPlus size={15} />
                      Activar cuenta del padrón
                    </button>
                    <span className="hidden sm:block text-white/20">·</span>
                    <button
                      onClick={() => navigate('/registro-nuevo')}
                      className="text-sm font-semibold text-white/50 hover:text-white/70 transition-colors"
                    >
                      Registrarme como nuevo
                    </button>
                  </div>
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
                <PinInput value={pin} onChange={handlePinChange} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
