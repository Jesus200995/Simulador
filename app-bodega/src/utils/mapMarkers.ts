/**
 * Shared premium map marker factory — Apple 2026 style
 * Uses the EXACT shape from AlertasAdminPage.tsx (teardrop with hole),
 * but with different colors and a subtle contour (stroke).
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

/**
 * Creates an ultra-performant teardrop pin marker (identical to AlertasPage shape & size).
 * Sized at a uniform 28px with crisp white outline contours.
 * @param variant   Color theme
 * @param size      Outer size (default 28)
 * @param selected  If true, could change styling but here we stick to the core shape
 */
export function createPremiumMarker(
  variant: MarkerVariant = 'green',
  size = 28,
  selected = false
): L.DivIcon {
  const c = VARIANTS[variant];
  
  // Mismo diseño exacto que AlertasAdminPage, pero con stroke para "contorno"
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${c.start}" stroke="${c.border}" stroke-width="1.2" width="${size}" height="${size}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size + 2],
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


