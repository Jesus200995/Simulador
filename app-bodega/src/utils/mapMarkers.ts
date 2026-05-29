/**
 * Shared premium map marker factory — Apple 2026 style
 * Uses GPU-accelerated CSS effects, rich linear gradients, and highly distinct
 * premium outline symbols (Warehouse for approved, Clock for pending, Cross for rejected).
 */
import L from 'leaflet';

export type MarkerVariant = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'white';

interface MarkerConfig {
  start: string;
  end: string;
  border: string;
}

const VARIANTS: Record<MarkerVariant, MarkerConfig> = {
  green:  { start: '#10B981', end: '#059669', border: '#ffffff' }, // Verde esmeralda fuerte (Aprobada)
  amber:  { start: '#FF9500', end: '#D97706', border: '#ffffff' }, // Ámbar/naranja fuerte (Pendiente)
  blue:   { start: '#3B82F6', end: '#1D4ED8', border: '#ffffff' }, // Azul iOS (Ubicación/Productor)
  red:    { start: '#EF4444', end: '#B91C1C', border: '#ffffff' }, // Rojo fuerte (Alerta)
  gray:   { start: '#6B7280', end: '#374151', border: '#ffffff' }, // Gris carbón premium (Rechazada)
  white:  { start: '#FFFFFF', end: '#E5E7EB', border: '#9CA3AF' }, // Blanco
};

const ICONS: Record<MarkerVariant, (color: string) => string> = {
  // Silueta de bodega/silo sobre círculo blanco central en (12, 9)
  green: (color) => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <path 
      d="M9.5 10v2.5h5V10m-6 0l3.5-2.5 3.5 2.5" 
      stroke="${color}" 
      stroke-width="1.1" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none" 
    />
  `,
  
  // Reloj de espera sobre círculo blanco central en (12, 9)
  amber: (color) => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <circle cx="12" cy="9" r="2.8" stroke="${color}" stroke-width="0.9" fill="none" />
    <path d="M12 7.3V9h1.3" stroke="${color}" stroke-width="0.9" stroke-linecap="round" fill="none" />
  `,
  
  // Usuario sobre círculo blanco central en (12, 9)
  blue: (color) => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <circle cx="12" cy="8.2" r="1.5" fill="${color}" />
    <path d="M9.5 12c0-1.2 1-2 2.5-2s2.5 0.8 2.5 2" stroke="${color}" stroke-width="0.9" stroke-linecap="round" fill="none" />
  `,
  
  // Signo de exclamación sobre círculo blanco central en (12, 9)
  red: (color) => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <path d="M12 6.8v2.6" stroke="${color}" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="12" cy="11.2" r="0.6" fill="${color}" />
  `,
  
  // Cruz limpia sobre círculo blanco central en (12, 9)
  gray: (color) => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <path d="M10 7l4 4m0-4l-4 4" stroke="${color}" stroke-width="1.2" stroke-linecap="round" />
  `,
  
  // Círculo pequeño para blanco
  white: () => `
    <circle cx="12" cy="9" r="4.5" fill="#ffffff" />
    <circle cx="12" cy="9" r="2.5" fill="#8E8E93" />
  `
};

/**
 * Creates an ultra-performant compact teardrop pin marker (identical to AlertasPage size).
 * Sized at a uniform 28px with crisp white outline contours and inside distinct symbols.
 * @param variant   Color theme
 * @param size      Outer size (default 28)
 * @param selected  If true, displays a subtle target selector glow behind
 */
export function createPremiumMarker(
  variant: MarkerVariant = 'green',
  size = 28,
  selected = false
): L.DivIcon {
  const c = VARIANTS[variant];
  const s = size;
  
  const w = s;
  const h = s;
  
  const cx = w / 2;
  const cy = h;
  const id = `lg-${variant}`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 24 24" style="overflow: visible;">
  <defs>
    <!-- Linear gradient for deep contrast modern colors -->
    <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c.start}"/>
      <stop offset="100%" stop-color="${c.end}"/>
    </linearGradient>
  </defs>
  
  <!-- Subtle selection glow circle behind pin -->
  ${selected ? `<circle cx="12" cy="9" r="10.5" fill="none" stroke="${c.start}" stroke-width="1.8" opacity="0.5" />` : ''}
  
  <!-- Classic teardrop pin from AlertasPage with sharp outline contour -->
  <path 
    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
    fill="url(#${id})" 
    stroke="${c.border}" 
    stroke-width="1.2" 
    stroke-linejoin="round"
  />
  
  <!-- Precision vector micro-icon centered at (12, 9) inside white circle -->
  ${ICONS[variant] ? ICONS[variant](c.start) : ''}
</svg>`.trim();

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker-premium',
    iconSize: [w, h],
    iconAnchor: [cx, cy],
    popupAnchor: [0, -h + 2],
  });
}

/** Helper: variant from bodega estatus */
export function variantFromEstatus(estatus: string): MarkerVariant {
  if (estatus === 'aprobada') return 'green';
  if (estatus === 'pendiente') return 'amber';
  if (estatus === 'rechazada') return 'gray';
  return 'green';
}

/** Helper: variant from semaforo color */
export function variantFromSemaforo(sem: string): MarkerVariant {
  if (sem === 'verde') return 'green';
  if (sem === 'amarillo') return 'amber';
  if (sem === 'rojo') return 'red';
  return 'green';
}


