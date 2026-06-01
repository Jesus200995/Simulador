import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

export type DrawMode = 'idle' | 'drawing' | 'editing';

export interface DibujarPoligonoHandle {
  startDraw: () => void;
  finishDraw: () => void;
  undoVertex: () => void;
  cancelDraw: () => void;
  startEdit: () => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  deletePolygon: () => void;
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

const DibujarPoligonoUP = forwardRef<DibujarPoligonoHandle, Props>(
  ({ poligonoInicial, onPoligonoCompleto, onPoligonoEliminado, onModeChange, onPointCountChange }, ref) => {
    const map = useMap();
    const drawnItemsRef = useRef(new L.FeatureGroup());
    const drawHandlerRef = useRef<any>(null);
    const editHandlerRef = useRef<any>(null);

    const updateMode = useCallback((m: DrawMode) => {
      onModeChange?.(m);
    }, [onModeChange]);

    const processLayer = useCallback((layer: any) => {
      const latlngs: [number, number][] = layer.getLatLngs()[0].map(
        (p: L.LatLng) => [p.lat, p.lng] as [number, number]
      );
      const turfPolygon = turf.polygon([[
        ...latlngs.map(([lat, lng]) => [lng, lat]),
        [latlngs[0][1], latlngs[0][0]],
      ]]);
      const areaHa = parseFloat((turf.area(turfPolygon) / 10000).toFixed(4));
      const centroide = layer.getBounds().getCenter();
      onPoligonoCompleto(latlngs, { lat: centroide.lat, lng: centroide.lng }, areaHa);
    }, [onPoligonoCompleto]);

    useEffect(() => {
      const drawnItems = drawnItemsRef.current;
      map.addLayer(drawnItems);

      if (poligonoInicial && poligonoInicial.length >= 3) {
        const latlngs = poligonoInicial.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
        const poly = L.polygon(latlngs, {
          color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.2, weight: 3,
        });
        drawnItems.addLayer(poly);
        map.fitBounds(poly.getBounds(), { padding: [40, 40] });
      }

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        updateMode('idle');
        onPointCountChange?.(0);
        processLayer(e.layer);
      });

      map.on((L as any).Draw.Event.DELETED, () => {
        updateMode('idle');
        onPoligonoEliminado();
      });

      map.on((L as any).Draw.Event.EDITSTOP, () => {
        updateMode('idle');
        drawnItems.eachLayer((layer: any) => {
          if (layer.getLatLngs) processLayer(layer);
        });
      });

      map.on((L as any).Draw.Event.DRAWVERTEX, () => {
        const count = drawHandlerRef.current?._markers?.length ?? 0;
        onPointCountChange?.(count);
      });

      return () => {
        if (drawHandlerRef.current) { drawHandlerRef.current.disable(); drawHandlerRef.current = null; }
        if (editHandlerRef.current) { editHandlerRef.current.disable(); editHandlerRef.current = null; }
        map.removeLayer(drawnItems);
        map.off((L as any).Draw.Event.CREATED);
        map.off((L as any).Draw.Event.DELETED);
        map.off((L as any).Draw.Event.EDITSTOP);
        map.off((L as any).Draw.Event.DRAWVERTEX);
      };
    }, [map]);

    const startDraw = useCallback(() => {
      if (drawHandlerRef.current) drawHandlerRef.current.disable();
      drawnItemsRef.current.clearLayers();
      onPointCountChange?.(0);
      const handler = new (L as any).Draw.Polygon(map, {
        allowIntersection: false,
        showArea: false,
        shapeOptions: { color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.2, weight: 3 },
        drawError: { color: '#ef4444', message: 'Los lados no pueden cruzarse.' },
      });
      drawHandlerRef.current = handler;
      handler.enable();
      updateMode('drawing');
    }, [map, updateMode]);

    const finishDraw = useCallback(() => {
      drawHandlerRef.current?.completeShape?.();
    }, []);

    const undoVertex = useCallback(() => {
      drawHandlerRef.current?.deleteLastVertex?.();
      const count = drawHandlerRef.current?._markers?.length ?? 0;
      onPointCountChange?.(count);
    }, []);

    const cancelDraw = useCallback(() => {
      if (drawHandlerRef.current) { drawHandlerRef.current.disable(); drawHandlerRef.current = null; }
      updateMode('idle');
      onPointCountChange?.(0);
    }, [updateMode]);

    const startEdit = useCallback(() => {
      editHandlerRef.current = new (L as any).EditToolbar.Edit(map, { featureGroup: drawnItemsRef.current });
      editHandlerRef.current.enable();
      updateMode('editing');
    }, [map, updateMode]);

    const saveEdit = useCallback(() => {
      if (editHandlerRef.current) {
        editHandlerRef.current.save();
        editHandlerRef.current.disable();
        editHandlerRef.current = null;
      }
      drawnItemsRef.current.eachLayer((layer: any) => { if (layer.getLatLngs) processLayer(layer); });
      updateMode('idle');
    }, [updateMode, processLayer]);

    const cancelEdit = useCallback(() => {
      if (editHandlerRef.current) {
        editHandlerRef.current.revertLayers();
        editHandlerRef.current.disable();
        editHandlerRef.current = null;
      }
      updateMode('idle');
    }, [updateMode]);

    const deletePolygon = useCallback(() => {
      drawnItemsRef.current.clearLayers();
      updateMode('idle');
      onPoligonoEliminado();
    }, [updateMode, onPoligonoEliminado]);

    useImperativeHandle(ref, () => ({
      startDraw, finishDraw, undoVertex, cancelDraw,
      startEdit, saveEdit, cancelEdit, deletePolygon,
    }));

    return null;
  }
);

DibujarPoligonoUP.displayName = 'DibujarPoligonoUP';
export default DibujarPoligonoUP;
