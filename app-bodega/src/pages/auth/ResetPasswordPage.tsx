import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Validaciones de la contraseña en tiempo real
  const tiene8 = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneNumero = /[0-9]/.test(password);
  const coinciden = password === confirmar && confirmar.length > 0;
  const passwordValida = tiene8 && tieneMayuscula && tieneNumero;

  useEffect(() => {
    if (!token) return;
    const verificar = async () => {
      try {
        const res = await fetch(`${BASE}/auth/verificar-token-reset/${token}`);
        const data = await res.json();
        if (!res.ok || !data.valido) {
          setTokenError(data.error || 'El enlace no es válido o ya expiró.');
        } else {
          setTokenValido(true);
          setNombreUsuario(data.nombre || '');
        }
      } catch {
        setTokenError('Error al verificar el enlace.');
      } finally {
        setVerificando(false);
      }
    };
    verificar();
  }, [token]);

  const handleGuardar = async () => {
    if (!passwordValida || !coinciden) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/auth/nuevo-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al actualizar'); return; }
      setExito(true);
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  const Regla = ({ ok, texto }: { ok: boolean; texto: string }) => (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-green-600' : 'text-slate-400'}`}>
      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${ok ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
        {ok && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {texto}
    </div>
  );

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[#f5f7fa]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#0a3c20] rounded-lg flex items-center justify-center">
          <KeyRound size={16} className="text-white" />
        </div>
        <span className="ml-2 text-sm font-bold text-slate-800">SIMAC</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8">
        <div className="w-full max-w-sm">

          {/* Verificando */}
          {verificando && (
            <div className="text-center py-12">
              <Loader2 size={32} className="animate-spin text-[#0a3c20] mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Verificando enlace...</p>
            </div>
          )}

          {/* Token inválido */}
          {!verificando && !tokenValido && (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Enlace inválido</h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{tokenError}</p>
              <button
                onClick={() => navigate('/recuperar-password')}
                className="w-full bg-[#0a3c20] text-white rounded-xl py-3.5 text-sm font-bold active:scale-[0.98] transition-all"
              >
                Solicitar nuevo enlace
              </button>
            </div>
          )}

          {/* Formulario nueva contraseña */}
          {!verificando && tokenValido && !exito && (
            <div>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 bg-[#0a3c20] rounded-[18px] flex items-center justify-center shadow-lg">
                  <KeyRound size={24} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">Nueva contraseña</h1>
              {nombreUsuario && (
                <p className="text-slate-500 text-sm text-center mb-6">Hola, <strong>{nombreUsuario}</strong>. Elige una contraseña segura.</p>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={mostrarPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#0a3c20]/30 focus:border-[#0a3c20] focus:outline-none transition-all"
                    />
                    <button type="button" onClick={() => setMostrarPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Reglas */}
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    <Regla ok={tiene8} texto="Mínimo 8 caracteres" />
                    <Regla ok={tieneMayuscula} texto="1 letra mayúscula" />
                    <Regla ok={tieneNumero} texto="1 número" />
                    <Regla ok={coinciden} texto="Contraseñas iguales" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Confirmar contraseña</label>
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${confirmar.length > 0 && !coinciden ? 'border-red-300 focus:ring-red-300/30 focus:ring-2' : 'border-slate-200 focus:ring-2 focus:ring-[#0a3c20]/30 focus:border-[#0a3c20]'}`}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}

                <button
                  onClick={handleGuardar}
                  disabled={!passwordValida || !coinciden || loading}
                  className="w-full bg-[#0a3c20] hover:bg-[#0f4f29] text-white rounded-xl py-3.5 text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar contraseña'}
                </button>
              </div>
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">¡Contraseña actualizada!</h1>
              <p className="text-slate-500 text-sm mb-8">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#0a3c20] text-white rounded-xl py-3.5 text-sm font-bold active:scale-[0.98] transition-all"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
