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

const ICONS: Record<MarkerVariant, string> = {
  // Silueta de bodega/silo ultra-pequeña y nítida centrada en (12, 9)
  green: `
    <path 
      d="M7.5 10.5v3a0.5 0.5 0 000.5 0.5h8a0.5 0.5 0 000.5-0.5v-3M5.5 10.5l6.5-4 6.5 4M12 8.5v5" 
      stroke="#ffffff" 
      stroke-width="1.2" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none" 
    />
  `,
  
  // Reloj de espera ultra-pequeño y nítido centrado en (12, 9)
  amber: `
    <circle cx="12" cy="9" r="4" stroke="#ffffff" stroke-width="1.2" fill="none" />
    <path d="M12 6.5V9h2" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none" />
  `,
  
  // Usuario ultra-pequeño y nítido centrado en (12, 9)
  blue: `
    <circle cx="12" cy="7.2" r="2.2" fill="#ffffff" />
    <path d="M8 12.8c0-1.8 1.8-3 4-3s4 1.2 4 3v0.4H8v-0.4z" fill="#ffffff" />
  `,
  
  // Signo de exclamación ultra-pequeño y nítido centrado en (12, 9)
  red: `
    <path d="M12 5.5v4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="12" cy="11.5" r="0.75" fill="#ffffff" />
  `,
  
  // Cruz limpia ultra-pequeña y nítida centrada en (12, 9)
  gray: `
    <path d="M9 6l6 6M15 6L9 12" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
  `,
  
  // Mini círculo para blanco
  white: `
    <circle cx="12" cy="9" r="3" fill="#8E8E93" />
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
  
  <!-- Precision vector micro-icon centered at (12, 9) -->
  ${ICONS[variant] || ''}
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


