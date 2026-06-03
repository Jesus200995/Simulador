import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, AlertCircle, Loader2, UserPlus, LogIn, Building2, ChevronRight } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ActivarCuentaPage() {
  const [curp, setCurp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleBuscar = async () => {
    if (curp.length !== 18 || loading) return;
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
        setError('Tu CURP no está en el padrón. Puedes registrarte como nuevo productor.');
        return;
      }
      if (data.ya_tiene_cuenta) {
        navigate('/login-productor', { state: { mensaje: 'Ya tienes cuenta activa. Ingresa tu PIN.' } });
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 sm:py-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        {/* Stepper 1/2 */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#1A5C38]">1</span>
            </div>
            <span className="text-xs text-white font-semibold hidden sm:block">Buscar</span>
          </div>
          <div className="w-6 sm:w-10 h-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/50">2</span>
            </div>
            <span className="text-xs text-white/40 font-semibold hidden sm:block">Crear PIN</span>
          </div>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-10">
        <div className="w-full max-w-sm animate-auth-in">

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Activar cuenta
            </h1>
            <p className="text-white/50 text-sm sm:text-base mt-1.5">
              Busca tu registro en el padrón de productores
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
            <label className="block text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
              Tu CURP
            </label>
            <p className="text-xs text-white/30 mb-3 leading-relaxed">
              18 caracteres. Lo encuentras en tu credencial INE o acta de nacimiento.
            </p>
            <input
              type="text"
              value={curp}
              onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={18}
              placeholder="AAAA000000AAAAAA00"
              autoCapitalize="characters"
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              className="w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 sm:py-4
                         text-base sm:text-lg font-mono tracking-widest text-white placeholder-white/25
                         focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
            />
            <div className="flex justify-end mt-1.5">
              <span className="text-xs text-white/30 font-mono">{curp.length}/18</span>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl
                              text-red-300 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleBuscar}
              disabled={curp.length !== 18 || loading}
              className="mt-4 sm:mt-5 w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38]
                         rounded-xl py-3.5 sm:py-4 text-sm sm:text-base font-bold
                         disabled:opacity-30 active:scale-[0.98] transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Buscando...</>
                : <><Search size={17} /> Buscar mi registro</>
              }
            </button>
          </div>

          {/* Otras opciones de productor */}
          <div className="mt-6 sm:mt-7">
            <p className="text-white/40 text-xs text-center mb-2.5">¿Prefieres otra opción?</p>
            <div className="space-y-2.5">
              <button onClick={() => navigate('/login-productor')}
                className="w-full flex items-center gap-3 bg-white/8 ring-1 ring-white/12 hover:bg-white/12 rounded-xl p-3 text-left active:scale-[0.98] transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <LogIn size={17} className="text-green-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight">Ya tengo cuenta</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-snug">Entra con tu CURP y tu PIN</p>
                </div>
                <ChevronRight size={16} className="text-white/30 shrink-0" />
              </button>
              <button onClick={() => navigate('/registro-nuevo')}
                className="w-full flex items-center gap-3 bg-white/8 ring-1 ring-white/12 hover:bg-white/12 rounded-xl p-3 text-left active:scale-[0.98] transition-all">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <UserPlus size={17} className="text-green-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight">Soy nuevo, registrarme</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-snug">No apareces en el padrón</p>
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
      </div>
    </div>
  );
}
