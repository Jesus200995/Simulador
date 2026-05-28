import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface Props {
  poligonoInicial?: [number, number][];
  onPoligonoCompleto: (
    coordenadas: [number, number][],
    centroide: { lat: number; lng: number },
    areaHa: number
  ) => void;
  onPoligonoEliminado: () => void;
}

type Mode = 'idle' | 'drawing' | 'editing';

export default function DibujarPoligonoUP({
  poligonoInicial,
  onPoligonoCompleto,
  onPoligonoEliminado,
}: Props) {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const drawHandlerRef = useRef<any>(null);
  const editHandlerRef = useRef<any>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [hasPolygon, setHasPolygon] = useState(false);

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

  // Initialize drawnItems and load existing polygon
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    if (poligonoInicial && poligonoInicial.length >= 3) {
      const latlngs = poligonoInicial.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      const poly = L.polygon(latlngs, {
        color: '#22C55E',
        fillColor: '#22C55E',
        fillOpacity: 0.15,
        weight: 2.5,
        dashArray: '',
      });
      drawnItems.addLayer(poly);
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });
      setHasPolygon(true);
    }

    // Listen for draw events
    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      setHasPolygon(true);
      setMode('idle');
      processLayer(e.layer);
    });

    map.on((L as any).Draw.Event.DELETED, () => {
      setHasPolygon(false);
      setMode('idle');
      onPoligonoEliminado();
    });

    map.on((L as any).Draw.Event.EDITSTOP, () => {
      setMode('idle');
      // re-process edited polygon
      drawnItems.eachLayer((layer: any) => {
        if (layer.getLatLngs) processLayer(layer);
      });
    });

    return () => {
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED);
      map.off((L as any).Draw.Event.DELETED);
      map.off((L as any).Draw.Event.EDITSTOP);
    };
  }, [map]);

  const startDraw = () => {
    if (drawHandlerRef.current) {
      drawHandlerRef.current.disable();
    }
    const handler = new (L as any).Draw.Polygon(map, {
      allowIntersection: false,
      showArea: false,
      shapeOptions: {
        color: '#22C55E',
        fillColor: '#22C55E',
        fillOpacity: 0.15,
        weight: 2.5,
      },
      drawError: {
        color: '#ef4444',
        message: 'Los lados no pueden cruzarse.',
      },
    });
    drawHandlerRef.current = handler;
    handler.enable();
    setMode('drawing');
  };

  const finishDraw = () => {
    if (drawHandlerRef.current) {
      drawHandlerRef.current.completeShape?.();
    }
  };

  const cancelDraw = () => {
    if (drawHandlerRef.current) {
      drawHandlerRef.current.disable();
      drawHandlerRef.current = null;
    }
    setMode('idle');
  };

  const undoVertex = () => {
    if (drawHandlerRef.current) {
      drawHandlerRef.current.deleteLastVertex?.();
    }
  };

  const startEdit = () => {
    const drawnItems = drawnItemsRef.current;
    editHandlerRef.current = new (L as any).EditToolbar.Edit(map, {
      featureGroup: drawnItems,
    });
    editHandlerRef.current.enable();
    setMode('editing');
  };

  const saveEdit = () => {
    if (editHandlerRef.current) {
      editHandlerRef.current.save();
      editHandlerRef.current.disable();
      editHandlerRef.current = null;
    }
    drawnItemsRef.current.eachLayer((layer: any) => {
      if (layer.getLatLngs) processLayer(layer);
    });
    setMode('idle');
  };

  const cancelEdit = () => {
    if (editHandlerRef.current) {
      editHandlerRef.current.revertLayers();
      editHandlerRef.current.disable();
      editHandlerRef.current = null;
    }
    setMode('idle');
  };

  const deletePolygon = () => {
    drawnItemsRef.current.clearLayers();
    setHasPolygon(false);
    setMode('idle');
    onPoligonoEliminado();
  };

  return (
    <>
      {/* ─── IDLE TOOLBAR ─── */}
      {mode === 'idle' && (
        <div className="simac-map-toolbar">
          <button
            onClick={startDraw}
            className="simac-tool-btn simac-tool-primary"
            title="Dibujar parcela"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            <span>Dibujar</span>
          </button>

          {hasPolygon && (
            <>
              <div className="simac-tool-divider" />
              <button
                onClick={startEdit}
                className="simac-tool-btn"
                title="Editar parcela"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Editar</span>
              </button>
              <button
                onClick={deletePolygon}
                className="simac-tool-btn simac-tool-danger"
                title="Eliminar parcela"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Borrar</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── DRAWING MODE TOOLBAR ─── */}
      {mode === 'drawing' && (
        <div className="simac-map-toolbar simac-toolbar-active">
          <div className="simac-toolbar-indicator" />
          <span className="simac-toolbar-label">Dibujando parcela</span>
          <div className="simac-tool-divider" />
          <button onClick={undoVertex} className="simac-tool-btn" title="Deshacer punto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
          <button onClick={finishDraw} className="simac-tool-btn simac-tool-success" title="Finalizar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Listo</span>
          </button>
          <button onClick={cancelDraw} className="simac-tool-btn simac-tool-muted" title="Cancelar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ─── EDITING MODE TOOLBAR ─── */}
      {mode === 'editing' && (
        <div className="simac-map-toolbar simac-toolbar-active">
          <div className="simac-toolbar-indicator simac-indicator-edit" />
          <span className="simac-toolbar-label">Editando parcela</span>
          <div className="simac-tool-divider" />
          <button onClick={saveEdit} className="simac-tool-btn simac-tool-success" title="Guardar cambios">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Guardar</span>
          </button>
          <button onClick={cancelEdit} className="simac-tool-btn simac-tool-muted" title="Cancelar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Cancelar</span>
          </button>
        </div>
      )}
    </>
  );
}
