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

/* ── Canvas corn animation ── */
/* ── Canvas ambient swarm animation ── */
class Perlin {
  private grad3 = [
    { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 }
  ];

  private p = [
    0x97, 0xa0, 0x89, 0x5b, 0x5a, 0x0f, 0x83, 0x0d, 0xc9, 0x5f, 0x60, 0x35, 0xc2, 0xe9, 0x07, 0xe1, 
    0x8c, 0x24, 0x67, 0x1e, 0x45, 0x8e, 0x08, 0x63, 0x25, 0xf0, 0x15, 0x0a, 0x17, 0xbe, 0x06, 0x94, 
    0xf7, 0x78, 0xea, 0x4b, 0x00, 0x1a, 0xc5, 0x3e, 0x5e, 0xfc, 0xdb, 0xcb, 0x75, 0x23, 0x0b, 0x20, 
    0x39, 0xb1, 0x21, 0x58, 0xed, 0x95, 0x38, 0x57, 0xae, 0x14, 0x7d, 0x88, 0xab, 0xa8, 0x44, 0xaf, 
    0x4a, 0xa5, 0x47, 0x86, 0x8b, 0x30, 0x1b, 0xa6, 0x4d, 0x92, 0x9e, 0xe7, 0x53, 0x6f, 0xe5, 0x7a, 
    0x3c, 0xd3, 0x85, 0xe6, 0xdc, 0x69, 0x5c, 0x29, 0x37, 0x2e, 0xf5, 0x28, 0xf4, 0x66, 0x8f, 0x36, 
    0x41, 0x19, 0x3f, 0xa1, 0x01, 0xd8, 0x50, 0x49, 0xd1, 0x4c, 0x84, 0xbb, 0xd0, 0x59, 0x12, 0xa9, 
    0xc8, 0xc4, 0x87, 0x82, 0x74, 0xbc, 0x9f, 0x56, 0xa4, 0x64, 0x6d, 0xc6, 0xad, 0xba, 0x03, 0x40, 
    0x34, 0xd9, 0xe2, 0xfa, 0x7c, 0x7b, 0x05, 0xca, 0x26, 0x93, 0x76, 0x7e, 0xff, 0x52, 0x55, 0xd4, 
    0xcf, 0xce, 0x3b, 0xe3, 0x2f, 0x10, 0x3a, 0x11, 0xb6, 0xbd, 0x1c, 0x2a, 0xdf, 0xb7, 0xaa, 0xd5, 
    0x77, 0xf8, 0x98, 0x02, 0x2c, 0x9a, 0xa3, 0x46, 0xdd, 0x99, 0x65, 0x9b, 0xa7, 0x2b, 0xac, 0x09, 
    0x81, 0x16, 0x27, 0xfd, 0x13, 0x62, 0x6c, 0x6e, 0x4f, 0x71, 0xe0, 0xe8, 0xb2, 0xb9, 0x70, 0x68, 
    0xda, 0xf6, 0x61, 0xe4, 0xfb, 0x22, 0xf2, 0xc1, 0xee, 0xd2, 0x90, 0x0c, 0xbf, 0xb3, 0xa2, 0xf1, 
    0x51, 0x33, 0x91, 0xeb, 0xf9, 0x0e, 0xef, 0x6b, 0x31, 0xc0, 0xd6, 0x1f, 0xb5, 0xc7, 0x6a, 0x9d, 
    0xb8, 0x54, 0xcc, 0xb0, 0x73, 0x79, 0x32, 0x2d, 0x7f, 0x04, 0x96, 0xfe, 0x8a, 0xec, 0xcd, 0x5d, 
    0xde, 0x72, 0x43, 0x1d, 0x18, 0x48, 0xf3, 0x8d, 0x80, 0xc3, 0x4e, 0x42, 0xd7, 0x3d, 0x9c, 0xb4
  ];

  private permutation = new Array<number>(512);
  private gradP = new Array<{ x: number; y: number; z: number }>(512);
  private F3 = 1 / 3;
  private G3 = 1 / 6;

  constructor() {
    this.init();
  }

  private init() {
    const shuffle = Array.from({ length: 256 }, (_, i) => this.p[i]);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffle[i];
      shuffle[i] = shuffle[j];
      shuffle[j] = temp;
    }
    for (let i = 0; i < 256; i++) {
      const randval = shuffle[i];
      this.permutation[i] = this.permutation[i + 256] = randval;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[randval % this.grad3.length];
    }
  }

  simplex3d(x: number, y: number, z: number): number {
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    let i1 = 0, j1 = 0, k1 = 0;
    let i2 = 0, j2 = 0, k2 = 0;

    const s = (x + y + z) * this.F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * this.G3;
    const x0 = x - i + t;
    const y0 = y - j + t;
    const z0 = z - k + t;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }

    const x1 = x0 - i1 + this.G3;
    const y1 = y0 - j1 + this.G3;
    const z1 = z0 - k1 + this.G3;

    const x2 = x0 - i2 + 2 * this.G3;
    const y2 = y0 - j2 + 2 * this.G3;
    const z2 = z0 - k2 + 2 * this.G3;

    const x3 = x0 - 1 + 3 * this.G3;
    const y3 = y0 - 1 + 3 * this.G3;
    const z3 = z0 - 1 + 3 * this.G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    const gi0 = this.gradP[ii + this.permutation[jj + this.permutation[kk]]];
    const gi1 = this.gradP[ii + i1 + this.permutation[jj + j1 + this.permutation[kk + k1]]];
    const gi2 = this.gradP[ii + i2 + this.permutation[jj + j2 + this.permutation[kk + k2]]];
    const gi3 = this.gradP[ii + 1 + this.permutation[jj + 1 + this.permutation[kk + 1]]];

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;

    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0 + gi0.z * z0);
    }
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1 + gi1.z * z1);
    }
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2 + gi2.z * z2);
    }
    if (t3 >= 0) {
      t3 *= t3;
      n3 = t3 * t3 * (gi3.x * x3 + gi3.y * y3 + gi3.z * z3);
    }

    return 32 * (n0 + n1 + n2 + n3);
  }
}

class AmbientParticle {
  x: number = 0;
  y: number = 0;
  tx: number = 0;
  ty: number = 0;
  vx: number = 0;
  vy: number = 0;
  life: number = 0;
  age: number = 0;
  bounds: { x: number; y: number };

  constructor(bounds: { x: number; y: number }) {
    this.bounds = bounds;
    this.reset();
  }

  reset() {
    this.x = this.tx = Math.random() * this.bounds.x;
    this.y = this.ty = Math.random() * this.bounds.y;
    this.vx = 1;
    this.vy = 1;
    this.life = 1000 + Math.random() * 9000;
    this.age = 0;
  }

  step(
    noiseGen: Perlin,
    monitor: { position: { x: number; y: number }; state: { left: boolean; middle: boolean; right: boolean } }
  ) {
    if (this.age++ > this.life) {
      this.reset();
      return;
    }

    const xx = this.x / 200;
    const yy = this.y / 200;
    const zz = Date.now() / 5000;
    const a = Math.random() * Math.PI * 2;
    const rnd = Math.random() / 4;

    this.vx += rnd * Math.sin(a) + noiseGen.simplex3d(xx, yy, -zz);
    this.vy += rnd * Math.cos(a) + noiseGen.simplex3d(xx, yy, zz);

    if (monitor.state.left) {
      const dx = monitor.position.x - this.x;
      const dy = monitor.position.y - this.y;
      this.vx += dx * 0.00085;
      this.vy += dy * 0.00085;
    }

    if (monitor.state.right) {
      const dx = this.x - monitor.position.x;
      const dy = this.y - monitor.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 225) {
        this.vx += dx * 0.02;
        this.vy += dy * 0.02;
      }
    }

    if (monitor.state.middle) {
      const dx = this.x - monitor.position.x;
      const dy = this.y - monitor.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 225) {
        this.vx *= (dist / 225);
        this.vy *= (dist / 225);
      }
    }

    this.tx = this.x;
    this.ty = this.y;
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.94;
    this.vy *= 0.94;

    if (this.x > this.bounds.x) {
      this.x = 0;
      this.tx = this.x;
    } else if (this.x < 0) {
      this.x = this.bounds.x;
      this.tx = this.x;
    }

    if (this.y > this.bounds.y) {
      this.y = 0;
      this.ty = this.y;
    } else if (this.y < 0) {
      this.y = this.bounds.y;
      this.ty = this.y;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.moveTo(this.tx, this.ty);
    ctx.lineTo(this.x, this.y);
  }
}

function CornCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    let animId: number;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const bounds = { x: W, y: H };
    const noiseGen = new Perlin();

    const monitor = {
      position: { x: 0, y: 0 },
      state: { left: false, middle: false, right: false }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      monitor.position.x = e.clientX - rect.left;
      monitor.position.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) monitor.state.left = true;
      if (e.button === 1) monitor.state.middle = true;
      if (e.button === 2) monitor.state.right = true;
    };

    const handleMouseUp = () => {
      monitor.state.left = false;
      monitor.state.middle = false;
      monitor.state.right = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        monitor.state.left = true;
        const rect = canvas.getBoundingClientRect();
        monitor.position.x = e.touches[0].clientX - rect.left;
        monitor.position.y = e.touches[0].clientY - rect.top;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        monitor.position.x = e.touches[0].clientX - rect.left;
        monitor.position.y = e.touches[0].clientY - rect.top;
      }
    };

    const handleTouchEnd = () => {
      monitor.state.left = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    const particleCount = 4000;
    const particles = Array.from({ length: particleCount }, () => new AmbientParticle(bounds));

    let tick = 0;
    let hue = 0;

    function draw() {
      // 1. Transparent trail fade via destination-out
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.085)';
      ctx.fillRect(0, 0, W, H);

      // 2. Draw ambient radial sky gradient underneath particles
      ctx.globalCompositeOperation = 'destination-over';
      const skyGrad = ctx.createRadialGradient(W * 0.5, -H * 0.1, 0, W * 0.5, H * 0.4, W * 0.85);
      skyGrad.addColorStop(0, 'rgba(26,92,56,0.18)');
      skyGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 3. Draw particles in 'lighter' composite mode with color rotation
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      particles.forEach(p => {
        p.step(noiseGen, monitor);
        p.render(ctx);
      });
      ctx.strokeStyle = `hsla(${hue}, 75%, 50%, 0.55)`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      hue = (hue + 0.5) % 360;
      tick++;
      animId = requestAnimationFrame(draw);
    }

    draw();

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      bounds.x = W;
      bounds.y = H;
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
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
    <div className="relative min-h-[100dvh] flex overflow-hidden bg-[#092213]">

      {/* ── LEFT PANEL — corn illustration (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden">
        {/* Rye background image loaded locally */}
        <img
          src="/background-rye.jpg"
          alt="Campos de centeno"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.45] saturate-[0.6]"
        />
        {/* Deep green gradient background (on top to filter the image green) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05160d]/65 via-[#0b2b18]/70 to-[#124225]/70 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#05160d]/25 via-[#0b2b18]/30 to-[#124225]/25" />
        {/* Top vignette */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
        {/* Right fade — blends into right panel */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#092213] to-transparent z-10 pointer-events-none" />

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
          {/* Rye background image loaded locally */}
          <img
            src="/background-rye.jpg"
            alt="Campos de centeno"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.42] saturate-[0.6]"
          />
          {/* Deep green gradient overlay (on top to filter the image green) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#092213]/65 via-[#0b2b18]/70 to-[#144728]/75 mix-blend-color" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#092213]/25 via-[#0b2b18]/30 to-[#144728]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,197,94,0.10),transparent)]" />
          {/* Mobile canvas too */}
          <CornCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-[#092213]/70 via-transparent to-[#092213]/80" />
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
              <div className="relative bg-[#133c23]/90 backdrop-blur-xl hover:bg-[#194a2b]/90 active:bg-[#0e2c1a]/90 rounded-[calc(1rem-1px)] p-5 text-left transition-colors duration-200">
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
