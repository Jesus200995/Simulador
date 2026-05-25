import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, Search, UserPlus, LogIn, AlertCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ActivarCuentaPage() {
  const [curp, setCurp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleBuscar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/buscar-curp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp }),
      });
      const data = await res.json();

      if (!data.encontrado) {
        setError('Tu CURP no esta en el padron.');
        return;
      }
      if (data.ya_tiene_cuenta) {
        navigate('/login', { state: { mensaje: 'Ya tienes cuenta activa. Inicia sesion.' } });
        return;
      }
      sessionStorage.setItem('activacion', JSON.stringify({
        producer_id: data.producer_id,
        nombres: data.nombres,
        apellido: data.apellido,
      }));
      navigate('/activar/pin');
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-5 sm:px-8 py-10">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-[#1A5C38] rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/20">
            <Wheat size={28} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Plan Nacional Maiz</h1>
          <p className="text-zinc-500 text-sm sm:text-base mt-1.5">Activa tu cuenta de productor</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm ring-1 ring-zinc-100">
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
            Escribe tu CURP
          </label>
          <p className="text-xs text-zinc-400 mb-4">
            Son 18 caracteres. Los encuentras en tu credencial del INE o acta de nacimiento.
          </p>
          <input
            type="text"
            value={curp}
            onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={18}
            placeholder="AAAA000000AAAAAA00"
            className="w-full bg-zinc-50 ring-1 ring-zinc-200 rounded-xl px-4 py-4 text-lg
                       font-mono tracking-widest focus:ring-2 focus:ring-[#1A5C38] focus:outline-none
                       transition-shadow"
          />
          <p className="text-xs text-zinc-400 mt-1.5 text-right">{curp.length}/18</p>

          {error && (
            <div className="mt-3 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleBuscar}
            disabled={curp.length !== 18 || loading}
            className="mt-5 w-full bg-[#1A5C38] hover:bg-[#15482d] text-white rounded-xl py-4 text-base
                       font-semibold disabled:opacity-40 active:scale-[0.98] transition-all duration-200
                       flex items-center justify-center gap-2"
          >
            <Search size={18} />
            {loading ? 'Buscando...' : 'Buscar mi registro'}
          </button>
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="border-t border-zinc-200 pt-6">
            <p className="text-zinc-500 text-sm">No apareces en el padron?</p>
            <button
              onClick={() => navigate('/registro-nuevo')}
              className="mt-2 text-[#1A5C38] font-semibold text-sm flex items-center gap-1.5 mx-auto hover:underline"
            >
              <UserPlus size={16} /> Registrate aqui
            </button>
          </div>

          <div className="space-y-2">
            <button onClick={() => navigate('/login-productor')}
              className="text-[#1A5C38] text-sm font-semibold flex items-center gap-1.5 mx-auto hover:underline">
              <LogIn size={16} /> Ya tengo PIN - Entrar con CURP
            </button>
            <button onClick={() => navigate('/login')}
              className="text-zinc-400 text-sm hover:text-zinc-500 transition-colors block mx-auto">
              Iniciar sesion con correo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
