import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Campo {
  nombre_completo: string;
  email: string;
  password: string;
  confirmar: string;
  codigo: string; // Código de acceso corporativo
}

export default function RegistroAdminPage() {
  const [form, setForm] = useState<Campo>({
    nombre_completo: '',
    email: '',
    password: '',
    confirmar: '',
    codigo: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  function set(field: keyof Campo, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  }

  const pwdStrength = () => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Muy segura'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.nombre_completo.trim()) return setError('El nombre completo es obligatorio.');
    if (!form.email.trim()) return setError('El correo es obligatorio.');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.');
    if (!form.codigo.trim()) return setError('El código de acceso corporativo es obligatorio.');

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/registro-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: form.nombre_completo.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          codigo_acceso: form.codigo.trim(),
          rol: 'admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear cuenta. Verifica el código de acceso.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-[#0b1117] flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-teal-500/10 blur-[100px]" />
        </div>
        <div className="relative z-10 text-center max-w-sm w-full px-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="text-emerald-400" size={28} />
          </div>
          <h2 className="text-[22px] font-black text-white mb-2">Cuenta creada</h2>
          <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
            Tu cuenta administrativa ha sido registrada. Ya puedes iniciar sesión en el panel.
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-3 text-[14px] font-bold active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-950/50"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const s = pwdStrength();

  return (
    <div className="relative min-h-screen bg-[#0b1117] overflow-hidden flex flex-col items-center justify-center py-8 px-4">

      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full bg-[#1A5C38]/15 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] rounded-full bg-[#1B4F8A]/15 blur-[110px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-teal-500/8 blur-[90px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">

        {/* Logo block */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl mb-4">
            <ShieldAlert className="text-emerald-400" size={22} />
          </div>
          <h2 className="text-[24px] sm:text-[28px] font-black text-white tracking-tight leading-none">SIMAC Admin</h2>
          <p className="text-[11px] sm:text-[12px] text-gray-500 font-medium mt-1.5 tracking-wide">
            Registro de Acceso Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[24px] sm:rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

          <div className="px-5 sm:px-7 pt-6 pb-2">
            <h1 className="text-[17px] sm:text-[19px] font-extrabold text-white tracking-tight">Nueva cuenta de administrador</h1>
            <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1">Requiere código de acceso corporativo autorizado</p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 sm:px-7 pt-4 pb-6 space-y-4">

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Nombre completo
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={e => set('nombre_completo', e.target.value)}
                  required
                  placeholder="Lic. Juan Pérez García"
                  className="w-full pl-9 pr-4 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Correo corporativo
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="nombre@simac.gob.mx"
                  className="w-full pl-9 pr-4 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-9 pr-10 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= s ? strengthColor[s] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[9px] font-bold ${s >= 3 ? 'text-emerald-400' : s === 2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {strengthLabel[s]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmar}
                  onChange={e => set('confirmar', e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className={`w-full pl-9 pr-10 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none transition-all duration-200 ${
                    form.confirmar && form.confirmar !== form.password
                      ? 'border-red-500/40 focus:ring-1 focus:ring-red-500/20'
                      : 'border-white/[0.07] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmar && form.confirmar !== form.password && (
                <p className="text-[10px] text-red-400 font-semibold mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Código de acceso */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Código de acceso corporativo
              </label>
              <div className="relative">
                <ShieldAlert size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={form.codigo}
                  onChange={e => set('codigo', e.target.value)}
                  required
                  placeholder="Código proporcionado por el responsable"
                  className="w-full pl-9 pr-4 py-3 sm:py-3.5 bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.07] rounded-xl text-[13px] sm:text-[14px] text-white placeholder-gray-600 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15 transition-all duration-200"
                />
              </div>
              <p className="text-[10px] text-gray-600 flex items-center gap-1">
                <AlertCircle size={10} />
                Solo personal autorizado por el responsable puede registrarse
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3 text-red-400 text-[12px] leading-relaxed">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!!form.confirmar && form.password !== form.confirmar)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl py-3 sm:py-3.5 text-[13px] sm:text-[14px] font-bold active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-950/50 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creando cuenta…
                </span>
              ) : (
                'Crear cuenta administrativa'
              )}
            </button>

            {/* Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-[11px] sm:text-[12px]">
              <Link
                to="/admin/login"
                className="text-gray-500 hover:text-white transition-colors duration-200 border-b border-gray-700 hover:border-white leading-tight"
              >
                Ya tengo cuenta — Iniciar sesión
              </Link>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-400 transition-colors duration-200 leading-tight"
              >
                Portal público
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[9px] sm:text-[10px] text-gray-600 max-w-xs leading-relaxed mx-auto px-4">
          SIMAC — Sistema de Información de Mercados Agropecuarios Consolidados. Uso exclusivo del personal autorizado del Plan Nacional Maíz 2026.
        </p>
      </div>
    </div>
  );
}
