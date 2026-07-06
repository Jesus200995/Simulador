import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wheat, Phone, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type Step = 'curp' | 'telefono' | 'nuevo_nip' | 'exito';

export default function RecuperarNipPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('curp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [curp, setCurp] = useState('');
  const [telefonoEnmascarado, setTelefonoEnmascarado] = useState<string | null>(null);
  const [ultimos4, setUltimos4] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [nuevoNip, setNuevoNip] = useState('');
  const [confirmarNip, setConfirmarNip] = useState('');

  const stepNums: Record<Step, number> = { curp: 1, telefono: 2, nuevo_nip: 3, exito: 3 };
  const stepActual = stepNums[step];

  const handleBack = () => {
    setError('');
    if (step === 'telefono') { setStep('curp'); setUltimos4(''); }
    else if (step === 'nuevo_nip') { setStep('telefono'); setNuevoNip(''); setConfirmarNip(''); }
    else navigate('/login-productor');
  };

  // Paso 1: verificar CURP
  const handleVerificarCurp = async () => {
    if (curp.length !== 18) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/recuperar-nip/verificar-curp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al verificar'); return; }
      setChallengeToken(data.challenge_token || '');
      setTelefonoEnmascarado(data.telefono_enmascarado);
      setStep('telefono');
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  // Paso 2: confirmar últimos 4 dígitos
  const handleConfirmarTelefono = async () => {
    if (ultimos4.length !== 4) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/recuperar-nip/confirmar-telefono`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_token: challengeToken, ultimos4 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Los dígitos no coinciden'); return; }
      setResetToken(data.reset_token);
      setStep('nuevo_nip');
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  // Paso 3: guardar nuevo NIP
  const handleNuevoNip = async () => {
    if (nuevoNip.length !== 4 || confirmarNip.length !== 4) return;
    if (nuevoNip !== confirmarNip) { setError('Los NIPs no coinciden'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/productor/auth/recuperar-nip/nuevo-nip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, nuevo_pin: nuevoNip }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al actualizar'); return; }
      setStep('exito');
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061510] via-[#0c2e1a] to-[#1A5C38]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,rgba(52,208,121,0.1),transparent)]" />
      </div>

      {/* Header */}
      {step !== 'exito' && (
        <div className="relative flex items-center px-4 py-3 sm:py-4">
          <button onClick={handleBack} className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors">
            <ChevronLeft size={22} className="text-white/70" />
          </button>
          <div className="flex-1 flex justify-center gap-1.5">
            {[1, 2, 3].map(n => (
              <div key={n} className={`h-1 rounded-full transition-all duration-300 ${n === stepActual ? 'w-8 bg-white' : n < stepActual ? 'w-8 bg-green-400' : 'w-5 bg-white/25'}`} />
            ))}
          </div>
          <div className="w-9" />
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pb-8">
        <div className="w-full max-w-sm">

          {/* Icono */}
          {step !== 'exito' && (
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-[#1A5C38] rounded-[18px] flex items-center justify-center shadow-xl shadow-green-900/40">
                {step === 'curp' && <Wheat size={24} className="text-white" />}
                {step === 'telefono' && <Phone size={24} className="text-white" />}
                {step === 'nuevo_nip' && <KeyRound size={24} className="text-white" />}
              </div>
            </div>
          )}

          {/* ── PASO 1: CURP ── */}
          {step === 'curp' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-1.5">Recuperar NIP</h1>
              <p className="text-white/50 text-sm text-center mb-6">Ingresa tu CURP para continuar</p>
              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">CURP</label>
                <input
                  type="text"
                  value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={18}
                  placeholder="AAAA000000AAAAAA00"
                  autoCapitalize="characters"
                  className="w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-base font-mono tracking-widest text-white placeholder-white/25 focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
                />
                <div className="flex justify-end mt-1"><span className="text-xs text-white/40 font-mono">{curp.length}/18</span></div>
                {error && (
                  <div className="mt-3 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-sm flex gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
                <button
                  onClick={handleVerificarCurp}
                  disabled={curp.length !== 18 || loading}
                  className="mt-4 w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] rounded-xl py-3.5 text-sm font-bold disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verificando...</> : 'Continuar'}
                </button>
              </div>
              <p className="text-white/30 text-xs text-center mt-5">
                Recuerda que tu CURP está en tu credencial INE o acta de nacimiento.
              </p>
            </div>
          )}

          {/* ── PASO 2: TELÉFONO ── */}
          {step === 'telefono' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-1.5">Verifica tu teléfono</h1>
              <p className="text-white/50 text-sm text-center mb-2">
                Ingresa los últimos 4 dígitos de tu teléfono registrado
              </p>
              {telefonoEnmascarado && (
                <p className="text-green-300 text-center text-sm font-mono font-bold mb-6">{telefonoEnmascarado}</p>
              )}
              {!telefonoEnmascarado && (
                <p className="text-white/40 text-center text-xs mb-6">No se encontró teléfono registrado. Contacta a soporte.</p>
              )}
              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Últimos 4 dígitos</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={ultimos4}
                  onChange={e => setUltimos4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="1234"
                  className="w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-xl font-mono tracking-[0.4em] text-white text-center placeholder-white/25 focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
                />
                {error && (
                  <div className="mt-3 p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-sm flex gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
                <button
                  onClick={handleConfirmarTelefono}
                  disabled={ultimos4.length !== 4 || loading}
                  className="mt-4 w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] rounded-xl py-3.5 text-sm font-bold disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verificando...</> : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: NUEVO NIP ── */}
          {step === 'nuevo_nip' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-1.5">Nuevo NIP</h1>
              <p className="text-white/50 text-sm text-center mb-6">Elige un NIP de 4 dígitos para tu cuenta</p>
              <div className="bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Nuevo NIP</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={nuevoNip}
                    onChange={e => setNuevoNip(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    placeholder="••••"
                    className="w-full bg-white/10 ring-1 ring-white/20 rounded-xl px-4 py-3.5 text-xl font-mono tracking-[0.5em] text-white text-center placeholder-white/25 focus:ring-2 focus:ring-white/40 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Confirmar NIP</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmarNip}
                    onChange={e => setConfirmarNip(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    placeholder="••••"
                    className={`w-full bg-white/10 ring-1 rounded-xl px-4 py-3.5 text-xl font-mono tracking-[0.5em] text-white text-center placeholder-white/25 focus:outline-none transition-all ${confirmarNip.length === 4 && confirmarNip !== nuevoNip ? 'ring-red-400/60' : 'ring-white/20 focus:ring-white/40'}`}
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl text-red-300 text-sm flex gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}
                <button
                  onClick={handleNuevoNip}
                  disabled={nuevoNip.length !== 4 || confirmarNip.length !== 4 || loading}
                  className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] rounded-xl py-3.5 text-sm font-bold disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar nuevo NIP'}
                </button>
              </div>
            </div>
          )}

          {/* ── ÉXITO ── */}
          {step === 'exito' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={44} className="text-green-400" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">¡NIP actualizado!</h1>
              <p className="text-white/60 text-sm mb-8">Ya puedes iniciar sesión con tu nuevo NIP.</p>
              <button
                onClick={() => navigate('/login-productor', { state: { curp } })}
                className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#1A5C38] rounded-xl py-4 text-sm font-bold active:scale-[0.98] transition-all"
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
