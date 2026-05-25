import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        setError('Tu CURP no está en el padrón.');
        return;
      }
      if (data.ya_tiene_cuenta) {
        navigate('/login', { state: { mensaje: 'Ya tienes cuenta activa. Inicia sesión.' } });
        return;
      }
      sessionStorage.setItem('activacion', JSON.stringify({
        producer_id: data.producer_id,
        nombres: data.nombres,
        apellido: data.apellido,
      }));
      navigate('/activar/pin');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#1A5C38] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-2xl font-bold">M</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Plan Nacional Maíz</h1>
        <p className="text-gray-500 text-sm mt-1">Activa tu cuenta</p>
      </div>

      <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escribe tu CURP
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Son 18 caracteres. Los encuentras en tu credencial del INE o acta de nacimiento.
        </p>
        <input
          type="text"
          value={curp}
          onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={18}
          placeholder="AAAA000000AAAAAA00"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg
                     font-mono tracking-widest focus:border-[#1A5C38] focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{curp.length}/18</p>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleBuscar}
          disabled={curp.length !== 18 || loading}
          className="mt-4 w-full bg-[#1A5C38] text-white rounded-xl py-4 text-lg
                     font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? 'Buscando...' : 'Buscar mi registro'}
        </button>

        <div className="mt-8 text-center border-t pt-6">
          <p className="text-gray-500 text-sm">¿Eres productor nuevo y no apareces?</p>
          <button
            onClick={() => navigate('/registro-nuevo')}
            className="mt-2 text-[#1A5C38] font-semibold text-sm underline"
          >
            Regístrate aquí
          </button>
        </div>

        <div className="mt-4 text-center space-y-2">
          <button onClick={() => navigate('/login-productor')}
            className="text-[#1A5C38] text-sm font-semibold">
            Ya tengo PIN — Entrar con CURP
          </button>
          <br />
          <button onClick={() => navigate('/login')}
            className="text-gray-400 text-sm">
            Iniciar sesión con correo
          </button>
        </div>
      </div>
    </div>
  );
}
