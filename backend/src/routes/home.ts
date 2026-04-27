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

    // ── PRODUCTOR / TECNICO ─────────────────────────────────────
    if (role === 'productor' || role === 'tecnico') {
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
      const [productoresRow, ciclosRow, alertasRow, bodegasRow, recientes, recientesProd] = await Promise.all([
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

export default router;
