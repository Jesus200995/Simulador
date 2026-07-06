import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Mail, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function RecuperarPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/auth/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al procesar'); return; }
      setEnviado(true);
      // Si no hay SMTP configurado, el backend retorna el URL para el admin
      if (data.reset_url) setResetUrl(data.reset_url);
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  const copiarUrl = async () => {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[#f5f7fa]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div className="relative flex items-center px-4 py-3 sm:py-4 bg-white border-b border-slate-100">
        <button onClick={() => navigate('/login')} className="p-2 -ml-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors">
          <ChevronLeft size={22} className="text-slate-600" />
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-sm font-semibold text-slate-700">Recuperar contraseña</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8">
        <div className="w-full max-w-sm">

          {!enviado ? (
            <>
              {/* Icono */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#0a3c20] rounded-[20px] flex items-center justify-center shadow-lg">
                  <Building2 size={28} className="text-white" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">¿Olvidaste tu contraseña?</h1>
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
                Ingresa el correo con el que te registraste y te enviaremos un enlace para restablecerla.
              </p>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#0a3c20]/30 focus:border-[#0a3c20] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!email.trim() || loading}
                  className="w-full bg-[#0a3c20] hover:bg-[#0f4f29] active:bg-[#07291a] text-white rounded-xl py-3.5 text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar enlace'}
                </button>
              </div>

              <p className="text-slate-400 text-xs text-center mt-5">
                Si no tienes acceso a tu correo, contacta al administrador.
              </p>
            </>
          ) : (
            <>
              {/* Estado enviado */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={44} className="text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                  {resetUrl ? 'Enlace generado' : '¡Correo enviado!'}
                </h1>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  {resetUrl
                    ? 'No hay servicio de correo configurado. Copia el enlace y compártelo de forma segura con el usuario.'
                    : `Revisá la bandeja de entrada de ${email}. El enlace expira en 1 hora.`
                  }
                </p>

                {/* URL visible cuando no hay SMTP — solo para contexto admin interno */}
                {resetUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-2">Enlace de restablecimiento</p>
                    <p className="text-amber-900 text-xs font-mono break-all leading-relaxed">{resetUrl}</p>
                    <button
                      onClick={copiarUrl}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      {copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar enlace</>}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#0a3c20] hover:bg-[#0f4f29] text-white rounded-xl py-3.5 text-sm font-bold active:scale-[0.98] transition-all"
                >
                  Volver al inicio de sesión
                </button>
                <button
                  onClick={() => { setEnviado(false); setResetUrl(null); setEmail(''); }}
                  className="mt-3 w-full bg-white border border-slate-200 text-slate-600 rounded-xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
                >
                  Intentar con otro correo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
