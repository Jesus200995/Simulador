import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wheat, Building2, ChevronRight, X, LogIn, ShieldCheck, UserPlus } from 'lucide-react';

type Menu = null | 'productor' | 'bodega';

interface Opcion {
  icon: typeof LogIn;
  title: string;
  desc: string;
  to: string;
  accent?: boolean;
}

const OPCIONES: Record<'productor' | 'bodega', { titulo: string; subtitulo: string; items: Opcion[] }> = {
  productor: {
    titulo: 'Soy Productor',
    subtitulo: 'Elige la opción según tu caso',
    items: [
      { icon: LogIn,       title: 'Ya tengo cuenta',        desc: 'Entra con tu CURP y tu PIN de 4 dígitos.', to: '/login-productor', accent: true },
      { icon: ShieldCheck, title: 'Activar mi cuenta',      desc: 'Ya estás en el padrón del Plan Maíz. Crea tu PIN con tu CURP.', to: '/activar' },
      { icon: UserPlus,    title: 'Soy nuevo, registrarme', desc: 'No estás en el padrón. Crea tu cuenta desde cero con tu CURP.', to: '/registro-nuevo' },
    ],
  },
  bodega: {
    titulo: 'Soy Bodega / Industria',
    subtitulo: 'Elige una opción',
    items: [
      { icon: LogIn,    title: 'Ya tengo cuenta',     desc: 'Entra con tu correo electrónico y contraseña.', to: '/login', accent: true },
      { icon: UserPlus, title: 'Crear cuenta nueva',  desc: 'Registra tu bodega o industria por primera vez.', to: '/registro' },
    ],
  },
};

/* ── Canvas corn animation — Golden Hour Field ── */
function CornCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    // Simple noise helper (value noise)
    function noise(x: number, y: number): number {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      const r = (n: number) => { let v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
      const a = r(ix + iy * 57), b = r(ix + 1 + iy * 57), c = r(ix + (iy + 1) * 57), d = r(ix + 1 + (iy + 1) * 57);
      return a + ux * (b - a) + uy * (c - a) + ux * uy * (a - b - c + d);
    }

    // ── Pollen particles (warm gold/amber)
    const pollen = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 0.5,
      vy: -(Math.random() * 0.4 + 0.08),
      vx: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.15,
      hue: 38 + Math.random() * 22,   // warm gold → amber
      phase: Math.random() * Math.PI * 2,
    }));

    // ── Stalk layer system (background → foreground)
    interface StalkLayer { xr: number; hr: number; a: number; w: number; tint: string; leafTint: string; cobVis: boolean; idx: number }

    const layers: StalkLayer[] = [
      // Far background (blurry, muted)
      ...Array.from({ length: 14 }, (_, i) => ({
        xr: (i / 13) * 1.05 - 0.025, hr: 0.30 + Math.random() * 0.12, a: 0.22 + Math.random() * 0.1,
        w: 1.2, tint: '#3d7a55', leafTint: '#2e6045', cobVis: false, idx: i,
      })),
      // Mid layer
      ...Array.from({ length: 11 }, (_, i) => ({
        xr: (i / 10) * 1.05 - 0.025, hr: 0.45 + Math.random() * 0.15, a: 0.45 + Math.random() * 0.15,
        w: 2.2, tint: '#2d7048', leafTint: '#236038', cobVis: false, idx: i + 14,
      })),
      // Foreground (full detail)
      ...Array.from({ length: 9 }, (_, i) => ({
        xr: (i / 8) * 1.05 - 0.025, hr: 0.60 + Math.random() * 0.18, a: 0.80 + Math.random() * 0.20,
        w: 3.8, tint: '#1e5c36', leafTint: '#1a5030', cobVis: true, idx: i + 25,
      })),
    ];

    function drawStalk(s: StalkLayer, tick: number) {
      const x = s.xr * W;
      const baseY = H + 10;
      const totalH = s.hr * H;
      const noiseVal = noise(s.xr * 3.5 + tick * 0.002, tick * 0.001 + s.idx * 0.5);
      const sway = (noiseVal - 0.5) * 24 * s.w * 0.7;

      ctx.save();
      ctx.globalAlpha = s.a;

      // Stalk
      const cp1x = x + sway * 0.2, cp1y = baseY - totalH * 0.35;
      const cp2x = x + sway * 0.7, cp2y = baseY - totalH * 0.72;
      const tipX  = x + sway,       tipY  = baseY - totalH;

      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
      const stalkGrad = ctx.createLinearGradient(x, baseY, tipX, tipY);
      stalkGrad.addColorStop(0, s.tint);
      stalkGrad.addColorStop(0.6, s.tint);
      stalkGrad.addColorStop(1, '#a8c878');
      ctx.strokeStyle = stalkGrad;
      ctx.lineWidth = s.w;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tassel at tip
      if (s.cobVis) {
        for (let t = 0; t < 7; t++) {
          const angle = -Math.PI / 2 + (t - 3) * 0.22 + Math.sin(tick * 0.008 + t) * 0.08;
          const tLen = 18 + t * 2.5;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX + Math.cos(angle) * tLen, tipY + Math.sin(angle) * tLen - 4);
          ctx.strokeStyle = `rgba(190,210,120,${s.a * 0.8})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Leaves (3 pairs along stalk)
      const leafConfigs = [
        { t: 0.25, side: 1,  len: s.cobVis ? 68 : 42, curve: s.cobVis ? 22 : 14 },
        { t: 0.48, side: -1, len: s.cobVis ? 74 : 46, curve: s.cobVis ? 26 : 16 },
        { t: 0.70, side: 1,  len: s.cobVis ? 55 : 35, curve: s.cobVis ? 18 : 11 },
      ];

      leafConfigs.forEach(({ t, side, len, curve }) => {
        // Point on bezier at parameter t
        const bt = t;
        const bx = Math.pow(1-bt,3)*x + 3*Math.pow(1-bt,2)*bt*cp1x + 3*(1-bt)*bt*bt*cp2x + Math.pow(bt,3)*tipX;
        const by = Math.pow(1-bt,3)*baseY + 3*Math.pow(1-bt,2)*bt*cp1y + 3*(1-bt)*bt*bt*cp2y + Math.pow(bt,3)*tipY;

        const windLeaf = Math.sin(tick * 0.009 + s.idx * 0.7 + t * 3) * 8;
        const ex = bx + side * (len + windLeaf) * 0.55;
        const ey = by - curve * 0.5 + windLeaf * 0.3;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.bezierCurveTo(
          bx + side * len * 0.45, by - curve + windLeaf * 0.4,
          ex + side * 8, ey + curve * 0.3,
          bx + side * len * 0.1, by + 5
        );

        const lg = ctx.createLinearGradient(bx, by - curve, bx + side * len, by + curve);
        lg.addColorStop(0, `rgba(30,90,50,${s.a * 0.95})`);
        lg.addColorStop(0.5, `rgba(50,130,70,${s.a * 0.80})`);
        lg.addColorStop(1, `rgba(80,160,90,${s.a * 0.40})`);
        ctx.fillStyle = lg;
        ctx.fill();

        // Leaf vein
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + side * len * 0.5, by - curve * 0.3 + windLeaf * 0.2);
        ctx.strokeStyle = `rgba(20,70,35,${s.a * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Corn cob (foreground layer only)
      if (s.cobVis) {
        const cobT = 0.52;
        const cobX = Math.pow(1-cobT,3)*x + 3*Math.pow(1-cobT,2)*cobT*cp1x + 3*(1-cobT)*cobT*cobT*cp2x + Math.pow(cobT,3)*tipX;
        const cobY = Math.pow(1-cobT,3)*baseY + 3*Math.pow(1-cobT,2)*cobT*cp1y + 3*(1-cobT)*cobT*cobT*cp2y + Math.pow(cobT,3)*tipY;

        ctx.save();
        ctx.translate(cobX + 20 * (s.idx % 2 === 0 ? 1 : -1), cobY);
        ctx.rotate(0.28 * (s.idx % 2 === 0 ? 1 : -1));

        // Husk (back)
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.bezierCurveTo(28, -44, 46, -6, 26, 16);
        ctx.bezierCurveTo(12, 24, -6, 6, 0, -30);
        const huskGrad = ctx.createLinearGradient(-4, -30, 26, 16);
        huskGrad.addColorStop(0, `rgba(38,100,55,${s.a * 0.90})`);
        huskGrad.addColorStop(1, `rgba(24,72,38,${s.a * 0.70})`);
        ctx.fillStyle = huskGrad;
        ctx.fill();

        // Cob body
        const cobGrad = ctx.createLinearGradient(-10, -24, 10, 24);
        cobGrad.addColorStop(0,   `rgba(235,185,40,${s.a})`);
        cobGrad.addColorStop(0.3, `rgba(255,210,60,${s.a})`);
        cobGrad.addColorStop(0.7, `rgba(240,195,45,${s.a})`);
        cobGrad.addColorStop(1,   `rgba(190,145,20,${s.a})`);
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 24, 0, 0, Math.PI * 2);
        ctx.fillStyle = cobGrad;
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.ellipse(-2, -6, 2.5, 10, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,235,140,${s.a * 0.45})`;
        ctx.fill();

        // Kernel rows
        for (let row = -4; row <= 4; row++) {
          for (let col = -1; col <= 1; col++) {
            const kx = col * 5 + (row % 2) * 2.5;
            const ky = row * 5.5;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 2, 2.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(185,135,18,${s.a * 0.6})`;
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(kx - 0.7, ky - 0.7, 0.8, 0.9, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,220,100,${s.a * 0.4})`;
            ctx.fill();
          }
        }

        // Husk front tip
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.bezierCurveTo(-22, -48, -38, -10, -20, 14);
        ctx.bezierCurveTo(-10, 22, 2, 4, 0, -30);
        const hFront = ctx.createLinearGradient(-22, -32, -10, 14);
        hFront.addColorStop(0, `rgba(48,120,64,${s.a * 0.85})`);
        hFront.addColorStop(1, `rgba(30,85,44,${s.a * 0.65})`);
        ctx.fillStyle = hFront;
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    // ── Light rays (volumetric sun beams)
    function drawLightRays(tick: number) {
      const cx = W * 0.62, cy = H * 0.08;
      const numRays = 8;
      ctx.save();
      for (let i = 0; i < numRays; i++) {
        const angle = -0.55 + (i / (numRays - 1)) * 1.1;
        const pulse = 0.5 + 0.5 * Math.sin(tick * 0.018 + i * 0.7);
        const rayAlpha = 0.04 + pulse * 0.06;
        const rayLen = H * (1.2 + pulse * 0.3);
        const ex = cx + Math.sin(angle) * rayLen;
        const ey = cy + Math.cos(angle) * rayLen;
        const rg = ctx.createLinearGradient(cx, cy, ex, ey);
        rg.addColorStop(0, `rgba(255,220,120,${rayAlpha})`);
        rg.addColorStop(0.4, `rgba(255,190,80,${rayAlpha * 0.6})`);
        rg.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(angle) * 6, cy + Math.sin(angle) * 6);
        ctx.lineTo(ex - Math.cos(angle) * 40, ey + Math.sin(angle) * 40);
        ctx.lineTo(ex + Math.cos(angle) * 40, ey - Math.sin(angle) * 40);
        ctx.lineTo(cx + Math.cos(angle) * 6, cy - Math.sin(angle) * 6);
        ctx.closePath();
        ctx.fillStyle = rg;
        ctx.fill();
      }
      ctx.restore();
    }

    let tick = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ── Sky — warm golden hour (less dark, warm amber/teal gradient)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.00, '#1a3a28');   // deep teal-green at top
      skyGrad.addColorStop(0.30, '#2d5e3e');   // forest green
      skyGrad.addColorStop(0.55, '#4a7c3f');   // warmer olive-green
      skyGrad.addColorStop(0.72, '#7a6030');   // golden horizon
      skyGrad.addColorStop(0.84, '#c48c3a');   // amber glow
      skyGrad.addColorStop(0.93, '#1a3a1a');   // dark ground transition
      skyGrad.addColorStop(1.00, '#0d1f0e');   // very dark base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Sun glow on horizon
      const sunGrad = ctx.createRadialGradient(W * 0.62, H * 0.72, 0, W * 0.62, H * 0.72, W * 0.55);
      sunGrad.addColorStop(0.00, 'rgba(255,220,100,0.28)');
      sunGrad.addColorStop(0.25, 'rgba(255,170,60,0.14)');
      sunGrad.addColorStop(0.55, 'rgba(200,120,30,0.06)');
      sunGrad.addColorStop(1.00, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Atmosphere haze band near horizon
      const hazeGrad = ctx.createLinearGradient(0, H * 0.62, 0, H * 0.80);
      hazeGrad.addColorStop(0, 'rgba(200,160,80,0.0)');
      hazeGrad.addColorStop(0.5, 'rgba(200,160,80,0.12)');
      hazeGrad.addColorStop(1, 'rgba(200,160,80,0.0)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, H * 0.62, W, H * 0.18);

      // ── Volumetric light rays
      drawLightRays(tick);

      // ── Background stalks (far, muted)
      layers.slice(0, 14).forEach(s => drawStalk(s, tick));

      // ── Mid-ground mist
      const mistGrad = ctx.createLinearGradient(0, H * 0.60, 0, H * 0.78);
      mistGrad.addColorStop(0, 'rgba(60,100,50,0.0)');
      mistGrad.addColorStop(0.5, 'rgba(40,80,35,0.18)');
      mistGrad.addColorStop(1, 'rgba(20,50,20,0.0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, H * 0.60, W, H * 0.18);

      // ── Mid stalks
      layers.slice(14, 25).forEach(s => drawStalk(s, tick));

      // ── Foreground stalks (full detail)
      layers.slice(25).forEach(s => drawStalk(s, tick));

      // ── Ground
      const groundGrad = ctx.createLinearGradient(0, H * 0.78, 0, H);
      groundGrad.addColorStop(0, 'rgba(10,30,12,0)');
      groundGrad.addColorStop(0.5, 'rgba(6,20,8,0.70)');
      groundGrad.addColorStop(1, 'rgba(2,8,3,0.95)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      // ── Pollen particles
      pollen.forEach(p => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(tick * 0.014 + p.phase) * 0.22;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const pulse = 0.55 + 0.45 * Math.sin(tick * 0.022 + p.phase);
        ctx.save();
        ctx.globalAlpha = p.alpha * pulse;
        // Glow aura
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4.5);
        glow.addColorStop(0, `hsla(${p.hue},90%,72%,0.9)`);
        glow.addColorStop(0.5, `hsla(${p.hue},80%,65%,0.3)`);
        glow.addColorStop(1, `hsla(${p.hue},70%,60%,0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = `hsla(${p.hue},95%,80%,1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── Subtle vignette overlay
      const vigGrad = ctx.createRadialGradient(W*0.5, H*0.5, H*0.25, W*0.5, H*0.5, H*0.85);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      tick++;
      animId = requestAnimationFrame(draw);
    }

    draw();

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ── Main page ── */
export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuInicial = (location.state as { menu?: Menu } | null)?.menu ?? null;
  const [menu, setMenu] = useState<Menu>(menuInicial);
  const [visible, setVisible] = useState(false);
  const data = menu ? OPCIONES[menu] : null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const closeMenu = () => setMenu(null);

  return (
    <div className="relative min-h-[100dvh] flex overflow-hidden bg-[#0d1f0e]">

      {/* ── LEFT PANEL — corn illustration (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden">
        {/* Warm teal-green gradient background — matches golden hour canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a28] via-[#2d5e3e] to-[#0d1f0e]" />
        {/* Top vignette */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
        {/* Right fade — blends into right panel */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#040f08] to-transparent z-10 pointer-events-none" />

        {/* Canvas animation */}
        <CornCanvas />

        {/* Overlay content */}
        <div className="relative z-20 flex flex-col h-full px-10 py-10">
          {/* Top badge */}
          <div
            className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 w-fit"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-10px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300/90 tracking-widest uppercase">Plan Nacional Maíz 2026</span>
          </div>

          {/* Bottom text */}
          <div className="mt-auto">
            <div
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s' }}
            >
              <h2 className="text-[38px] xl:text-[46px] font-black text-white leading-tight tracking-tight">
                El campo mexicano<br />
                <span className="text-emerald-400">conectado</span> al mercado
              </h2>
              <p className="text-white/45 text-[15px] font-medium mt-3 leading-relaxed max-w-md">
                Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — login options ── */}
      <div className="flex-1 flex flex-col min-h-[100dvh] lg:min-h-auto relative">
        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a28] via-[#2d5e3e] to-[#0d1f0e]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(196,140,58,0.15),transparent)]" />
          {/* Mobile canvas too */}
          <CornCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f0e]/60 via-transparent to-[#0d1f0e]/75" />
        </div>

        {/* Right panel content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-16 lg:bg-[#040f08]/0">

          {/* Logo */}
          <div
            className="flex flex-col items-center mb-8 lg:mb-10"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-16px) scale(0.95)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
          >
            <div className="w-[72px] h-[72px] lg:w-20 lg:h-20 rounded-[22px] lg:rounded-[26px] bg-white/10 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-4">
              <img
                src="/icono.png"
                alt="SIMAC"
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-[14px]"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h1 className="text-[34px] lg:text-[38px] font-black text-white tracking-[-1px] leading-none">
              SIMAC
            </h1>
            <p className="text-[13px] text-emerald-400/70 font-semibold mt-1.5 tracking-[0.12em] uppercase text-center">
              Plan Nacional Maíz 2026
            </p>
          </div>

          {/* Subtitle */}
          <div
            className="mb-6 text-center"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.08s' }}
          >
            <p className="text-white/50 text-[15px] font-medium">¿Cómo deseas ingresar?</p>
          </div>

          {/* Cards */}
          <div className="w-full max-w-[360px] space-y-3">

            {/* Productor */}
            <button
              onClick={() => setMenu('productor')}
              className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(20px)',
                transition: 'opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(26,92,56,0.2) 100%)',
              }}
            >
              <div className="relative bg-[#0d2a18]/90 backdrop-blur-xl hover:bg-[#112f1c]/90 active:bg-[#0a1f12]/90 rounded-[calc(1rem-1px)] p-5 text-left transition-colors duration-200">
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-[calc(1rem-1px)]" />
                <div className="flex items-center gap-4 relative">
                  <div className="w-13 h-13 bg-gradient-to-br from-[#1A5C38] to-[#0f3821] rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(26,92,56,0.6)] shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Wheat size={24} className="text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[17px] leading-tight">Soy Productor</p>
                    <p className="text-white/45 text-[13px] mt-0.5 leading-snug">Iniciar sesión, activar o registrar tu cuenta</p>
                  </div>
                  <ChevronRight size={18} className="text-emerald-500/60 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </div>
              </div>
            </button>

            {/* Bodega / Industria */}
            <button
              onClick={() => setMenu('bodega')}
              className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(20px)',
                transition: 'opacity 0.5s ease 0.18s, transform 0.5s ease 0.18s',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
              }}
            >
              <div className="relative bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] active:bg-white/[0.03] rounded-[calc(1rem-1px)] p-5 text-left transition-colors duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-[calc(1rem-1px)]" />
                <div className="flex items-center gap-4 relative">
                  <div className="w-13 h-13 bg-white/10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Building2 size={24} className="text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-bold text-[17px] leading-tight">Soy Bodega / Industria</p>
                    <p className="text-white/35 text-[13px] mt-0.5 leading-snug">Iniciar sesión o registrar tu bodega</p>
                  </div>
                  <ChevronRight size={18} className="text-white/25 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p
            className="mt-8 text-center text-[10px] text-white/18 max-w-[260px] leading-relaxed"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.28s' }}
          >
            Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México
          </p>
        </div>
      </div>

      {/* ── Bottom sheet / Dialog de opciones ── */}
      {data && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease forwards' }}
            onClick={closeMenu}
          />

          {/* Sheet — bottom on mobile, centered dialog on desktop */}
          <div
            className="
              relative bg-white rounded-t-[28px] lg:rounded-[28px]
              px-5 pt-3 pb-8 lg:pb-6
              shadow-[0_-10px_60px_rgba(0,0,0,0.5)] lg:shadow-[0_24px_80px_rgba(0,0,0,0.4)]
              max-h-[90dvh] overflow-y-auto
              w-full lg:max-w-[420px]
            "
            style={{ animation: 'sheetUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
          >
            {/* Handle (mobile only) */}
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5 lg:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-[21px] font-black text-gray-900 tracking-tight">{data.titulo}</h2>
                <p className="text-gray-400 text-[13px] mt-0.5">{data.subtitulo}</p>
              </div>
              <button
                onClick={closeMenu}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 active:scale-90 transition-all shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mt-5">
              {data.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border
                      ${item.accent
                        ? 'bg-[#1A5C38] border-[#1A5C38] shadow-lg shadow-green-900/25 hover:bg-[#155030]'
                        : 'bg-[#f5fbf7] border-gray-100 hover:bg-[#edf8f2] hover:border-gray-200'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.accent ? 'bg-white/15' : 'bg-white shadow-sm border border-gray-100'}`}>
                      <Icon size={20} className={item.accent ? 'text-white' : 'text-[#1A5C38]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[15px] leading-tight ${item.accent ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                      <p className={`text-[12px] mt-0.5 leading-snug ${item.accent ? 'text-green-100/75' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                    <ChevronRight size={17} className={`shrink-0 ${item.accent ? 'text-white/55' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Back */}
            <button
              onClick={closeMenu}
              className="w-full mt-4 py-3 text-gray-400 text-[13px] font-semibold hover:text-gray-600 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
