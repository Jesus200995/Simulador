import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, AlertCircle, Loader2, UserPlus } from 'lucide-react';
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

      setAuth(data.token, {
        userId: data.user.id,
        email: '',
        rol: 'productor',
        nombre_completo: `${data.user.nombres} ${data.user.apellido_paterno}`,
      });
      navigate('/productor');
    } catch {
      setError('Error de conexion.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex items-center px-4 sm:px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <button onClick={() => step === 'pin' ? setStep('curp') : navigate('/login')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
          <ChevronLeft size={22} className="text-zinc-600" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10">
        <div className="w-full max-w-md">
          <div className="w-16 h-16 bg-[#1A5C38] rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
            <Wheat size={28} className="text-white" />
          </div>

          {step === 'curp' ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm ring-1 ring-zinc-100">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 text-center mb-1.5">Entrar con CURP</h1>
              <p className="text-zinc-500 text-sm text-center mb-6">Escribe tu CURP de 18 caracteres</p>

              <input
                type="text" value={curp}
                onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={18} placeholder="AAAA000000AAAAAA00"
                className="w-full bg-zinc-50 ring-1 ring-zinc-200 rounded-xl px-4 py-4 text-lg
                           font-mono tracking-widest focus:ring-2 focus:ring-[#1A5C38] focus:outline-none transition-shadow"
              />
              <p className="text-xs text-zinc-400 mt-1.5 text-right">{curp.length}/18</p>

              <button onClick={() => setStep('pin')} disabled={curp.length !== 18}
                className="mt-5 w-full bg-[#1A5C38] hover:bg-[#15482d] text-white rounded-xl py-4 text-base
                           font-semibold disabled:opacity-40 active:scale-[0.98] transition-all duration-200">
                Continuar
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1.5">Ingresa tu PIN</h1>
              <p className="text-zinc-500 text-sm mb-8">Tu PIN de 4 numeros</p>

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
                  <span>Verificando...</span>
                </div>
              ) : (
                <PinInput value={pin} onChange={handlePinChange} />
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => navigate('/activar')}
              className="text-[#1A5C38] text-sm font-semibold flex items-center gap-1.5 mx-auto hover:underline">
              <UserPlus size={16} /> No tienes cuenta? Activa aqui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
