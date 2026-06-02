import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

export type DrawMode = 'idle' | 'drawing' | 'editing';

export interface DibujarPoligonoHandle {
  /** Agrega un vértice en el centro actual del mapa (la mira). */
  addPoint: () => void;
  /** Quita el último vértice agregado. */
  undoVertex: () => void;
  /** Cierra el polígono (requiere ≥3 vértices) y calcula área/centroide. */
  finishDraw: () => void;
  /** Borra todo y reinicia. */
  clear: () => void;
  /** Activa el modo de edición (arrastrar vértices). */
  startEdit: () => void;
  /** Guarda la edición y recalcula. */
  saveEdit: () => void;
  /** Cancela la edición y revierte a la forma previa. */
  cancelEdit: () => void;
}

interface Props {
  poligonoInicial?: [number, number][];
  onPoligonoCompleto: (
    coordenadas: [number, number][],
    centroide: { lat: number; lng: number },
    areaHa: number
  ) => void;
  onPoligonoEliminado: () => void;
  onModeChange?: (mode: DrawMode) => void;
  onPointCountChange?: (count: number) => void;
}

const GREEN = '#34d079';
const GREEN_DARK = '#16a34a';

/**
 * Dibujo de parcela tipo "mira + botón": el usuario navega/hace zoom libremente
 * sin riesgo de agregar puntos por error. Cada vértice se agrega SOLO al tocar
 * el botón (que llama a addPoint()), tomando el centro visible del mapa.
 */
const DibujarPoligonoUP = forwardRef<DibujarPoligonoHandle, Props>(
  ({ poligonoInicial, onPoligonoCompleto, onPoligonoEliminado, onModeChange, onPointCountChange }, ref) => {
    const map = useMap();
    const groupRef = useRef(new L.FeatureGroup());
    const verticesRef = useRef<[number, number][]>([]);
    const modeRef = useRef<DrawMode>('idle');
    const polyLayerRef = useRef<L.Layer | null>(null);
    const markerLayersRef = useRef<L.Marker[]>([]);
    const backupRef = useRef<[number, number][] | null>(null);

    const setMode = useCallback((m: DrawMode) => {
      modeRef.current = m;
      onModeChange?.(m);
    }, [onModeChange]);

    const emitCount = useCallback(() => {
      onPointCountChange?.(verticesRef.current.length);
    }, [onPointCountChange]);

    const computeAndEmit = useCallback(() => {
      const v = verticesRef.current;
      if (v.length < 3) return;
      const ring = [...v.map(([la, ln]) => [ln, la]), [v[0][1], v[0][0]]];
      const poly = turf.polygon([ring]);
      const areaHa = parseFloat((turf.area(poly) / 10000).toFixed(4));
      const c = turf.centroid(poly).geometry.coordinates; // [lng, lat]
      onPoligonoCompleto(
        v.map(([la, ln]) => [la, ln] as [number, number]),
        { lat: c[1], lng: c[0] },
        areaHa
      );
    }, [onPoligonoCompleto]);

    const vertexIcon = (index: number, editing: boolean) => {
      const size = editing ? 20 : 13;
      const color = index === 0 ? GREEN_DARK : GREEN;
      return L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)${editing ? ';cursor:grab' : ''}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    };

    const redrawPoly = useCallback(() => {
      const g = groupRef.current;
      if (polyLayerRef.current) { g.removeLayer(polyLayerRef.current); polyLayerRef.current = null; }
      const v = verticesRef.current;
      if (v.length >= 3 && modeRef.current !== 'drawing') {
        polyLayerRef.current = L.polygon(v as L.LatLngTuple[], {
          color: GREEN, fillColor: GREEN, fillOpacity: 0.22, weight: 3,
        });
      } else if (v.length >= 2) {
        polyLayerRef.current = L.polyline(v as L.LatLngTuple[], {
          color: GREEN, weight: 3, dashArray: '7 7',
        });
      }
      if (polyLayerRef.current) g.addLayer(polyLayerRef.current);
    }, []);

    // Reconstrucción total: limpia TODO el grupo y vuelve a dibujar polígono +
    // marcadores desde cero. A prueba de duplicados (incl. StrictMode en dev).
    const fullRedraw = useCallback(() => {
      const g = groupRef.current;
      g.clearLayers();
      polyLayerRef.current = null;
      markerLayersRef.current = [];

      const v = verticesRef.current;
      // Polígono / línea
      if (v.length >= 3 && modeRef.current !== 'drawing') {
        polyLayerRef.current = L.polygon(v as L.LatLngTuple[], {
          color: GREEN, fillColor: GREEN, fillOpacity: 0.22, weight: 3,
        });
      } else if (v.length >= 2) {
        polyLayerRef.current = L.polyline(v as L.LatLngTuple[], {
          color: GREEN, weight: 3, dashArray: '7 7',
        });
      }
      if (polyLayerRef.current) g.addLayer(polyLayerRef.current);

      // Marcadores de vértice
      const editing = modeRef.current === 'editing';
      v.forEach(([lat, lng], i) => {
        const m = L.marker([lat, lng], { icon: vertexIcon(i, editing), draggable: editing, keyboard: false });
        if (editing) {
          m.on('drag', (e: L.LeafletEvent) => {
            const ll = (e.target as L.Marker).getLatLng();
            verticesRef.current[i] = [ll.lat, ll.lng];
            redrawPoly(); // durante el arrastre solo se actualiza el contorno
          });
        }
        markerLayersRef.current.push(m);
        g.addLayer(m);
      });
    }, [redrawPoly]);

    useEffect(() => {
      const g = groupRef.current;
      map.addLayer(g);

      if (poligonoInicial && poligonoInicial.length >= 3) {
        verticesRef.current = poligonoInicial.map(([la, ln]) => [la, ln] as [number, number]);
        setMode('idle');
        fullRedraw();
        const b = L.latLngBounds(verticesRef.current as L.LatLngTuple[]);
        map.fitBounds(b, { padding: [50, 50] });
      }

      return () => {
        // Defensa: evita el crash "reading 'baseVal'" de Leaflet si el mapa se
        // desmonta con un arrastre colgado (Draggable.finishDrag sobre un
        // _lastTarget inválido). Limpiamos el estado antes de que React desmonte.
        try {
          const dr = (map as unknown as { dragging?: { _draggable?: { _lastTarget?: unknown; _moving?: boolean } } }).dragging?._draggable;
          if (dr) { dr._lastTarget = null; dr._moving = false; }
        } catch { /* noop */ }
        markerLayersRef.current = [];
        polyLayerRef.current = null;
        g.clearLayers();
        map.removeLayer(g);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    const addPoint = useCallback(() => {
      if (modeRef.current === 'idle' && verticesRef.current.length === 0) setMode('drawing');
      else if (modeRef.current === 'idle') setMode('drawing');
      const c = map.getCenter();
      verticesRef.current.push([c.lat, c.lng]);
      fullRedraw();
      emitCount();
    }, [map, setMode, fullRedraw, emitCount]);

    const undoVertex = useCallback(() => {
      verticesRef.current.pop();
      if (verticesRef.current.length === 0) setMode('drawing');
      fullRedraw();
      emitCount();
    }, [setMode, fullRedraw, emitCount]);

    const finishDraw = useCallback(() => {
      if (verticesRef.current.length < 3) return;
      setMode('idle');
      fullRedraw();
      computeAndEmit();
    }, [setMode, fullRedraw, computeAndEmit]);

    const clear = useCallback(() => {
      verticesRef.current = [];
      backupRef.current = null;
      setMode('idle');
      fullRedraw();
      emitCount();
      onPoligonoEliminado();
    }, [setMode, fullRedraw, emitCount, onPoligonoEliminado]);

    const startEdit = useCallback(() => {
      backupRef.current = verticesRef.current.map(([la, ln]) => [la, ln] as [number, number]);
      setMode('editing');
      fullRedraw();
    }, [setMode, fullRedraw]);

    const saveEdit = useCallback(() => {
      backupRef.current = null;
      setMode('idle');
      fullRedraw();
      computeAndEmit();
    }, [setMode, fullRedraw, computeAndEmit]);

    const cancelEdit = useCallback(() => {
      if (backupRef.current) verticesRef.current = backupRef.current;
      backupRef.current = null;
      setMode('idle');
      fullRedraw();
    }, [setMode, fullRedraw]);

    useImperativeHandle(ref, () => ({
      addPoint, undoVertex, finishDraw, clear, startEdit, saveEdit, cancelEdit,
    }));

    return null;
  }
);

DibujarPoligonoUP.displayName = 'DibujarPoligonoUP';
export default DibujarPoligonoUP;
