import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PinInput from '../../components/productor/PinInput';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function CrearPinPage() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'crear' | 'confirmar'>('crear');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registroExitoso, setRegistroExitoso] = useState(false);
  interface ActivacionData { producer_id: number; nombres: string; apellido: string; }
  const [activacion, setActivacion] = useState<ActivacionData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = sessionStorage.getItem('activacion');
    if (!data) { navigate('/activar'); return; }
    const parsed = JSON.parse(data) as ActivacionData;
    setActivacion(parsed);
  }, [navigate]);

  const handlePinChange = (val: string) => {
    if (step === 'crear') {
      setPin(val);
      if (val.length === 4) {
        setTimeout(() => setStep('confirmar'), 300);
      }
    } else {
      setConfirmPin(val);
      if (val.length === 4) {
        if (val === pin) {
          activarCuenta(val);
        } else {
          setError('Los PIN no coinciden. Intenta de nuevo.');
          setConfirmPin('');
          setPin('');
          setStep('crear');
        }
      }
    }
  };

  const activarCuenta = async (finalPin: string) => {
    setLoading(true);
    setError('');
    if (!activacion) return;
    try {
      const res = await fetch(`${BASE}/productor/auth/activar-cuenta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producer_id: activacion.producer_id, pin: finalPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al activar la cuenta.');
        setPin(''); setConfirmPin(''); setStep('crear');
        return;
      }

      sessionStorage.removeItem('activacion');
      // El usuario inicia sesión con su CURP + PIN desde el modal de éxito
      // (mismo flujo que Tipo B), por eso no se auto-loguea aquí.
      setRegistroExitoso(true);
    } catch {
      setError('Error de conexión.');
      setPin(''); setConfirmPin(''); setStep('crear');
    } finally {
      setLoading(false);
    }
  };

  if (!activacion) return null;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 sm:py-4">
        <button
          onClick={() => { setStep('crear'); setPin(''); setConfirmPin(''); navigate('/activar'); }}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <ChevronLeft size={13} className="text-white/70" />
        </button>
        {/* Stepper 2/2 */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
              <CheckCircle size={12} className="text-white" />
            </div>
            <span className="text-xs text-white/40 font-semibold hidden sm:block">Buscar</span>
          </div>
          <div className="w-6 sm:w-10 h-px bg-white/40" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#1A5C38]">2</span>
            </div>
            <span className="text-xs text-white font-semibold hidden sm:block">Crear PIN</span>
          </div>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-10">
        <div className="w-full max-w-sm animate-auth-in text-center">

          {/* Avatar / greeting */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1A5C38] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-900/40">
            <span className="text-xs sm:text-3xl font-black text-white">
              {activacion.nombres?.charAt(0) ?? '?'}
            </span>
          </div>

          <h1 className="text-xs sm:text-3xl font-bold text-white tracking-tight mb-1">
            ¡Hola, {activacion.nombres?.split(' ')[0]}!
          </h1>
          <p className="text-white/50 text-xs sm:text-xs mb-6 sm:mb-8 leading-relaxed">
            {step === 'crear'
              ? 'Crea un PIN de 4 dígitos para acceder a tu cuenta'
              : 'Repite tu PIN para confirmar'}
          </p>

          {/* Step label */}
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-6">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 'crear' ? 'bg-green-400' : 'bg-white/30'}`} />
            <span className="text-xs text-white/60 font-medium">
              {step === 'crear' ? 'Paso 1: Elige tu PIN' : 'Paso 2: Confirma tu PIN'}
            </span>
          </div>

          {error && (
            <div className="mb-5 mx-auto p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl
                            text-red-300 text-xs flex items-start gap-2 text-left">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-white/60 py-8">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs sm:text-xs">Activando tu cuenta...</span>
            </div>
          ) : (
            <div className={step === 'confirmar' ? 'animate-slide-left' : ''}>
              <PinInput
                value={step === 'crear' ? pin : confirmPin}
                onChange={handlePinChange}
                dark
                error={!!error}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de activación exitosa */}
      {registroExitoso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-5">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            {/* Ícono de éxito */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-[#1A5C38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Título */}
            <h2 className="text-xs font-bold text-gray-900 mb-2">
              ¡Cuenta activada!
            </h2>

            {/* Mensaje */}
            <p className="text-gray-600 mb-2">
              Tu cuenta SIMAC ha sido activada correctamente.
            </p>
            <p className="text-gray-500 text-xs mb-8">
              Ya puedes iniciar sesión con tu CURP y PIN de 4 dígitos.
            </p>

            {/* Botón */}
            <button
              onClick={() => navigate('/login-productor')}
              className="w-full bg-[#1A5C38] text-white py-4 rounded-xl font-semibold text-xs hover:bg-green-800 transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
