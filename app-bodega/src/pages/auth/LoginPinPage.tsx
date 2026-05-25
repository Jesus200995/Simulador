import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
      setError('Error de conexión.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => step === 'pin' ? setStep('curp') : navigate('/login')} className="p-1">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-[#1A5C38] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">M</span>
        </div>

        {step === 'curp' ? (
          <div className="w-full max-w-sm">
            <h1 className="text-xl font-bold text-gray-800 text-center mb-2">Entrar con CURP</h1>
            <p className="text-gray-500 text-sm text-center mb-6">Escribe tu CURP de 18 caracteres</p>

            <input
              type="text" value={curp}
              onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={18} placeholder="AAAA000000AAAAAA00"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg
                         font-mono tracking-widest focus:border-[#1A5C38] focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{curp.length}/18</p>

            <button onClick={() => setStep('pin')} disabled={curp.length !== 18}
              className="mt-4 w-full bg-[#1A5C38] text-white rounded-xl py-4 text-lg
                         font-semibold disabled:opacity-40 active:scale-95 transition-transform">
              Continuar
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-2">Ingresa tu PIN</h1>
            <p className="text-gray-500 text-sm mb-6">Tu PIN de 4 números</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-gray-500">Verificando...</p>
            ) : (
              <PinInput value={pin} onChange={handlePinChange} />
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/activar')} className="text-[#1A5C38] text-sm font-semibold">
            ¿No tienes cuenta? Activa aquí
          </button>
        </div>
      </div>
    </div>
  );
}
