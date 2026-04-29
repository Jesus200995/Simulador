import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/home/stats
// Returns role-aware home dashboard stats.
// Shape: { stats: { productores, seguimientos, alertas, bodegas, extras... }, role }
// =============================================
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.rol;

    // Helper: count seguimiento across the 4 tables for a given producer-id filter
    async function countSeguimiento(filter: string, params: any[]): Promise<{ total: number; pendientes: number }> {
      const [v, i, e, c] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM seguimiento_visitas WHERE ${filter}`, params),
        pool.query(`SELECT COUNT(*)::int AS c FROM seguimiento_incidencias WHERE ${filter}`, params),
        pool.query(`SELECT COUNT(*)::int AS c FROM estimacion_cosecha WHERE ${filter}`, params),
        pool.query(`SELECT COUNT(*)::int AS c FROM cosecha_real WHERE ${filter}`, params),
      ]);
      const total = v.rows[0].c + i.rows[0].c + e.rows[0].c + c.rows[0].c;
      // "Pendientes" = active cycles without any seguimiento yet (rough estimate)
      return { total, pendientes: 0 };
    }

    // ── PRODUCTOR ──────────────────────────────────────────────
    if (role === 'productor') {
      const producerRow = await pool.query(
        'SELECT producer_id, state_name, municipality_name FROM producer WHERE usuario_id = $1',
        [userId]
      );

      if (producerRow.rows.length === 0) {
        // User without producer record yet
        res.json({
          role,
          stats: {
            productores: 0, productores_label: 'Mis UPs',
            seguimientos: 0,
            seguimientos_pendientes: 0,
            alertas: 0,
            bodegas: 0,
            recientes: [],
          },
        });
        return;
      }

      const producerId = producerRow.rows[0].producer_id;
      const stateName: string | null = producerRow.rows[0].state_name;

      const [upsCount, segData, alertasCount, ciclosActivos, bodegasCount, recent] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM up WHERE producer_id = $1`, [producerId]),
        countSeguimiento('producer_id = $1', [producerId]),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM alertas
           WHERE producer_id = $1 AND estado_alerta IN ('pendiente','confirmada')`,
          [producerId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM cycle c
           JOIN up u ON u.up_id = c.up_id
           WHERE u.producer_id = $1`,
          [producerId]
        ),
        // Bodegas en el mismo estado (cercanas) — fallback to total if state not set
        stateName
          ? pool.query(
              `SELECT COUNT(*)::int AS c FROM bodegas WHERE estado ILIKE $1`,
              [stateName]
            )
          : pool.query(`SELECT COUNT(*)::int AS c FROM bodegas`),
        pool.query(
          `SELECT a.id, a.tipo_alerta AS titulo, a.nivel_alerta AS nivel, a.fecha_alerta AS fecha,
                  a.estado_alerta AS estado
           FROM alertas a
           WHERE a.producer_id = $1
           ORDER BY a.fecha_alerta DESC LIMIT 5`,
          [producerId]
        ),
      ]);

      res.json({
        role,
        stats: {
          productores: upsCount.rows[0].c,
          productores_label: 'Mis UPs',
          seguimientos: segData.total,
          seguimientos_pendientes: Math.max(0, ciclosActivos.rows[0].c - segData.total),
          alertas: alertasCount.rows[0].c,
          bodegas: bodegasCount.rows[0].c,
          bodegas_label: stateName ? 'En tu estado' : 'En tu región',
          recientes: recent.rows,
        },
      });
      return;
    }

    // ── SUPERVISOR ──────────────────────────────────────────────
    if (role === 'supervisor') {
      const linked = await pool.query(
        `SELECT producer_id FROM supervisor_productores WHERE supervisor_id = $1`,
        [userId]
      );
      const producerIds = linked.rows.map((r) => r.producer_id);

      if (producerIds.length === 0) {
        res.json({
          role,
          stats: {
            productores: 0,
            productores_label: 'En cartera',
            seguimientos: 0, seguimientos_pendientes: 0,
            alertas: 0,
            bodegas: 0, bodegas_label: 'Total',
            recientes: [],
          },
        });
        return;
      }

      const [segData, alertasRow, bodegasRow, recientes] = await Promise.all([
        countSeguimiento('producer_id = ANY($1::bigint[])', [producerIds]),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM alertas
           WHERE producer_id = ANY($1::bigint[])
             AND estado_alerta IN ('pendiente','confirmada')`,
          [producerIds]
        ),
        pool.query(`SELECT COUNT(*)::int AS c FROM bodegas`),
        pool.query(
          `SELECT a.id, a.tipo_alerta AS titulo, a.nivel_alerta AS nivel,
                  a.fecha_alerta AS fecha, a.estado_alerta AS estado
           FROM alertas a
           WHERE a.producer_id = ANY($1::bigint[])
           ORDER BY a.fecha_alerta DESC LIMIT 5`,
          [producerIds]
        ),
      ]);

      res.json({
        role,
        stats: {
          productores: producerIds.length,
          productores_label: 'En cartera',
          seguimientos: segData.total,
          seguimientos_pendientes: 0,
          alertas: alertasRow.rows[0].c,
          bodegas: bodegasRow.rows[0].c,
          bodegas_label: 'Total',
          recientes: recientes.rows,
        },
      });
      return;
    }

    // ── BODEGUERO / RESPONSABLE ─────────────────────────────────
    if (role === 'bodeguero' || role === 'responsable') {
      const [misBodegas, misInventarios, totalBodegas] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS c FROM bodegas WHERE creado_por = $1`,
          [userId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM inventarios WHERE usuario_id = $1`,
          [userId]
        ).catch(() => ({ rows: [{ c: 0 }] } as any)),
        pool.query(`SELECT COUNT(*)::int AS c FROM bodegas`),
      ]);

      res.json({
        role,
        stats: {
          productores: misBodegas.rows[0].c,
          productores_label: 'Mis bodegas',
          seguimientos: misInventarios.rows[0].c,
          seguimientos_label: 'Inventarios',
          seguimientos_pendientes: 0,
          alertas: 0,
          alertas_hidden: true,
          bodegas: totalBodegas.rows[0].c,
          bodegas_label: 'En sistema',
          recientes: [],
        },
      });
      return;
    }

    // ── ADMIN ───────────────────────────────────────────────────
    if (role === 'admin') {
      const [productoresRow, ciclosRow, alertasRow, bodegasRow, recientes, recientesProd, preciosRow, inventariosRow, usuariosRow] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM producer`),
        pool.query(`SELECT COUNT(*)::int AS c FROM cycle`),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM alertas
           WHERE estado_alerta IN ('pendiente','confirmada')`
        ),
        pool.query(`SELECT COUNT(*)::int AS c FROM bodegas`),
        pool.query(
          `SELECT a.id, a.tipo_alerta AS titulo, a.nivel_alerta AS nivel,
                  a.fecha_alerta AS fecha, a.estado_alerta AS estado
           FROM alertas a
           ORDER BY a.fecha_alerta DESC LIMIT 5`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM producer
           WHERE created_at >= NOW() - INTERVAL '7 days'`
        ).catch(() => ({ rows: [{ c: 0 }] } as any)),
        pool.query(`SELECT COUNT(*)::int AS c FROM precios_maiz`).catch(() => ({ rows: [{ c: 0 }] } as any)),
        pool.query(`SELECT COUNT(*)::int AS c FROM inventarios`).catch(() => ({ rows: [{ c: 0 }] } as any)),
        pool.query(`SELECT COUNT(*)::int AS c FROM usuarios WHERE activo = true`).catch(() => ({ rows: [{ c: 0 }] } as any)),
      ]);

      // Seguimiento total (sum of 4 tables)
      const segTotals = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM seguimiento_visitas`),
        pool.query(`SELECT COUNT(*)::int AS c FROM seguimiento_incidencias`),
        pool.query(`SELECT COUNT(*)::int AS c FROM estimacion_cosecha`),
        pool.query(`SELECT COUNT(*)::int AS c FROM cosecha_real`),
      ]);
      const seguimientos = segTotals.reduce((acc, r) => acc + r.rows[0].c, 0);

      res.json({
        role,
        stats: {
          productores: productoresRow.rows[0].c,
          productores_label: 'Total',
          productores_recientes: recientesProd.rows[0].c,
          seguimientos,
          seguimientos_pendientes: 0,
          ciclos: ciclosRow.rows[0].c,
          alertas: alertasRow.rows[0].c,
          bodegas: bodegasRow.rows[0].c,
          bodegas_label: 'En sistema',
          precios: preciosRow.rows[0].c,
          inventarios: inventariosRow.rows[0].c,
          usuarios: usuariosRow.rows[0].c,
          recientes: recientes.rows,
        },
      });
      return;
    }

    res.json({ role, stats: { productores: 0, seguimientos: 0, alertas: 0, bodegas: 0, recientes: [] } });
  } catch (error) {
    console.error('Error en /home/stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/home/dashboard — KPIs + state table for the main map dashboard
// =============================================
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const curYear = new Date().getFullYear();
    const prevYear = curYear - 1;

    const [kpiRow, stockRow, precioRow, porEstado, prodActual, prodAnterior, ups30d] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*)::int FROM producer) AS productores,
        (SELECT COUNT(*)::int FROM up) AS ups,
        (SELECT COUNT(*)::int FROM alertas WHERE estado_alerta IN ('pendiente','confirmada')) AS alertas_activas,
        (SELECT COUNT(*)::int FROM bodegas WHERE estatus='aprobada' AND activo=true) AS bodegas_activas
      `),
      pool.query(`
        SELECT COALESCE(SUM(i.volumen_almacenamiento),0)::numeric(12,2) AS stock
        FROM inventarios i
        JOIN (SELECT bodega_id, MAX(fecha) AS mf FROM inventarios GROUP BY bodega_id) lf
          ON lf.bodega_id = i.bodega_id AND lf.mf = i.fecha
        JOIN bodegas b ON b.id = i.bodega_id
        WHERE b.estatus='aprobada' AND b.activo=true
      `),
      pool.query(`
        SELECT COALESCE(AVG(precio),0)::numeric(10,2) AS precio_promedio
        FROM precios
        WHERE tipo_precio='observado' AND fecha >= NOW() - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT
          u.state_name AS estado,
          COUNT(DISTINCT u.up_id)::int AS ups,
          COALESCE(SUM(ec.produccion_estimada_ton),0)::numeric(10,2) AS produccion_ton,
          COALESCE((
            SELECT SUM(b.capacidad_toneladas) FROM bodegas b
            WHERE b.estado ILIKE u.state_name AND b.estatus='aprobada'
          ),0)::numeric(10,2) AS capacidad_ton,
          COALESCE((
            SELECT SUM(i2.volumen_almacenamiento)
            FROM inventarios i2
            JOIN bodegas b ON b.id = i2.bodega_id
            JOIN (SELECT bodega_id, MAX(fecha) AS mf FROM inventarios GROUP BY bodega_id) lf2
              ON lf2.bodega_id = i2.bodega_id AND lf2.mf = i2.fecha
            WHERE b.estado ILIKE u.state_name AND b.estatus='aprobada'
          ),0)::numeric(10,2) AS stock_ton,
          COUNT(DISTINCT a.id)::int AS alertas_activas
        FROM up u
        LEFT JOIN estimacion_cosecha ec ON ec.up_id = u.up_id
        LEFT JOIN alertas a ON a.up_id = u.up_id AND a.estado_alerta='pendiente'
        WHERE u.state_name IS NOT NULL
        GROUP BY u.state_name
        ORDER BY produccion_ton DESC
        LIMIT 25
      `),
      pool.query(`
        SELECT COALESCE(SUM(ec.produccion_estimada_ton),0)::numeric(12,2) AS total
        FROM estimacion_cosecha ec
        JOIN cycle c ON c.cycle_id = ec.ciclo_id
        WHERE c.cycle_year = $1
      `, [curYear]),
      pool.query(`
        SELECT COALESCE(SUM(ec.produccion_estimada_ton),0)::numeric(12,2) AS total
        FROM estimacion_cosecha ec
        JOIN cycle c ON c.cycle_id = ec.ciclo_id
        WHERE c.cycle_year = $1
      `, [prevYear]),
      pool.query(`
        SELECT COUNT(*)::int AS c FROM up
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
    ]);

    const k = kpiRow.rows[0];
    const totalProd = porEstado.rows.reduce((s: number, r: any) => s + parseFloat(r.produccion_ton), 0);
    const prodA = parseFloat(prodActual.rows[0].total);
    const prodP = parseFloat(prodAnterior.rows[0].total);
    const deltaProd = prodP > 0 ? Math.round(((prodA - prodP) / prodP) * 1000) / 10 : null;

    const stateRows = porEstado.rows.map((r: any) => ({
      ...r,
      pct_produccion: totalProd > 0 ? Math.round((parseFloat(r.produccion_ton) / totalProd) * 100) : 0,
      cobertura_pct: parseFloat(r.capacidad_ton) > 0
        ? Math.min(100, Math.round((parseFloat(r.stock_ton) / parseFloat(r.capacidad_ton)) * 100))
        : 0,
    }));

    res.json({
      kpis: {
        productores: k.productores,
        ups: k.ups,
        bodegas_activas: k.bodegas_activas,
        stock_ton: parseFloat(stockRow.rows[0].stock),
        alertas_activas: k.alertas_activas,
        precio_promedio_parcela: parseFloat(precioRow.rows[0].precio_promedio),
        delta_produccion: deltaProd,
        ups_nuevas_mes: ups30d.rows[0].c,
      },
      por_estado: stateRows,
      total_produccion_ton: totalProd,
    });
  } catch (error) {
    console.error('Error /home/dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/home/mapa — GeoJSON for map layers
// =============================================
router.get('/mapa', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [states, bodegas] = await Promise.all([
      pool.query(`
        SELECT
          gs.name AS estado,
          ST_AsGeoJSON(ST_Simplify(gs.geom, 0.03))::json AS geometry,
          COALESCE((
            SELECT SUM(ec.produccion_estimada_ton) FROM estimacion_cosecha ec
            JOIN up u ON u.up_id = ec.up_id WHERE u.state_name ILIKE gs.name
          ),0)::numeric(10,2) AS produccion_ton,
          COALESCE((
            SELECT COUNT(*)::int FROM alertas a
            JOIN up u ON u.up_id = a.up_id
            WHERE u.state_name ILIKE gs.name AND a.estado_alerta='pendiente'
          ),0) AS alertas_count,
          COALESCE((
            SELECT COUNT(*)::int FROM bodegas b
            WHERE b.estado ILIKE gs.name AND b.estatus='aprobada'
          ),0)::int AS bodegas_count
        FROM geo_state gs
        WHERE gs.geom IS NOT NULL
      `),
      pool.query(`
        SELECT id, nombre, estado, municipio, capacidad_toneladas, latitud, longitud
        FROM bodegas
        WHERE estatus='aprobada' AND activo=true
          AND latitud IS NOT NULL AND longitud IS NOT NULL
        LIMIT 300
      `),
    ]);

    const maxProd = Math.max(...states.rows.map((r: any) => parseFloat(r.produccion_ton) || 0), 1);
    const maxAlert = Math.max(...states.rows.map((r: any) => parseInt(r.alertas_count) || 0), 1);

    const estadosGeoJSON = {
      type: 'FeatureCollection',
      features: states.rows
        .filter((r: any) => r.geometry != null)
        .map((r: any) => ({
          type: 'Feature',
          properties: {
            estado: r.estado,
            produccion_ton: parseFloat(r.produccion_ton),
            alertas_count: parseInt(r.alertas_count),
            bodegas_count: parseInt(r.bodegas_count),
            intensidad_prod: maxProd > 0 ? parseFloat(r.produccion_ton) / maxProd : 0,
            intensidad_alerta: maxAlert > 0 ? parseInt(r.alertas_count) / maxAlert : 0,
          },
          geometry: r.geometry,
        })),
    };

    const bodegasGeoJSON = {
      type: 'FeatureCollection',
      features: bodegas.rows
        .filter((b: any) => b.latitud != null && b.longitud != null)
        .map((b: any) => ({
          type: 'Feature',
          properties: {
            id: b.id,
            nombre: b.nombre,
            estado: b.estado,
            municipio: b.municipio,
            capacidad: b.capacidad_toneladas,
          },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(b.longitud), parseFloat(b.latitud)],
          },
        })),
    };

    res.json({ estados: estadosGeoJSON, bodegas: bodegasGeoJSON });
  } catch (error) {
    console.error('Error /home/mapa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
