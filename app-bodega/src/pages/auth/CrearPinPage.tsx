import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PinInput from '../../components/productor/PinInput';
import { useAuthStore } from '../../store/auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function CrearPinPage() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'crear' | 'confirmar'>('crear');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  interface ActivacionData { producer_id: number; nombres: string; apellido: string; }
  const [activacion, setActivacion] = useState<ActivacionData | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const data = sessionStorage.getItem('activacion');
    if (!data) { navigate('/activar'); return; }
    const parsed = JSON.parse(data) as ActivacionData;
    const timer = requestAnimationFrame(() => setActivacion(parsed));
    return () => cancelAnimationFrame(timer);
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
      if (!res.ok) { setError(data.error || 'Error al activar'); setPin(''); setConfirmPin(''); setStep('crear'); return; }

      sessionStorage.removeItem('activacion');
      setAuth(data.token, {
        userId: data.user.id,
        email: '',
        rol: 'productor',
        nombre_completo: `${activacion.nombres} ${activacion.apellido}`,
      });
      navigate('/productor');
    } catch {
      setError('Error de conexion.');
      setPin(''); setConfirmPin(''); setStep('crear');
    } finally {
      setLoading(false);
    }
  };

  if (!activacion) return null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-5 sm:px-8 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#1A5C38]" />
          </div>
          <p className="text-zinc-900 font-bold text-xl sm:text-2xl">
            Hola, {activacion.nombres}
          </p>
          <p className="text-zinc-500 text-sm sm:text-base mt-1.5">
            {step === 'crear'
              ? 'Crea un PIN de 4 numeros para entrar a tu cuenta'
              : 'Repite tu PIN para confirmar'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-red-700 text-sm
                          flex items-start gap-2 text-left max-w-sm mx-auto">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-zinc-500">
            <Loader2 size={20} className="animate-spin" />
            <span>Activando tu cuenta...</span>
          </div>
        ) : (
          <PinInput
            value={step === 'crear' ? pin : confirmPin}
            onChange={handlePinChange}
          />
        )}
      </div>
    </div>
  );
}
