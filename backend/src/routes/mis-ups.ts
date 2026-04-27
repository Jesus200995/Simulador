import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/mis-ups
// Returns UPs for the logged-in productor
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Find producer record linked to this user
    const producerResult = await pool.query(
      'SELECT producer_id, curp, nombres, apellido_paterno, apellido_materno FROM producer WHERE usuario_id = $1',
      [userId]
    );

    if (producerResult.rows.length === 0) {
      res.json({ ups: [], producer: null });
      return;
    }

    const producer = producerResult.rows[0];

    const upsResult = await pool.query(
      `SELECT u.*,
        ST_AsGeoJSON(u.geom)::json AS geom_geojson,
        ST_X(ST_PointOnSurface(u.geom)) AS centroid_lng,
        ST_Y(ST_PointOnSurface(u.geom)) AS centroid_lat,
        (
          SELECT json_build_object(
            'cycle_id', c.cycle_id,
            'cycle_year', c.cycle_year,
            'cycle_type', c.cycle_type
          )
          FROM cycle c WHERE c.up_id = u.up_id
          ORDER BY c.cycle_year DESC, c.cycle_id DESC
          LIMIT 1
        ) AS ultimo_ciclo
       FROM up u
       WHERE u.producer_id = $1
       ORDER BY u.created_at DESC`,
      [producer.producer_id]
    );

    res.json({ ups: upsResult.rows, producer });
  } catch (error) {
    console.error('Error al obtener mis UPs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/mis-ups/:up_id — detail with cycles, crops, seguimiento
router.get('/:up_id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { up_id } = req.params;

    const producerResult = await pool.query(
      'SELECT producer_id FROM producer WHERE usuario_id = $1',
      [userId]
    );
    if (producerResult.rows.length === 0) {
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }
    const producer_id = producerResult.rows[0].producer_id;

    const upResult = await pool.query(
      `SELECT u.*,
        ST_AsGeoJSON(u.geom)::json AS geom_geojson,
        ST_X(ST_PointOnSurface(u.geom)) AS centroid_lng,
        ST_Y(ST_PointOnSurface(u.geom)) AS centroid_lat
       FROM up u
       WHERE u.up_id = $1 AND u.producer_id = $2`,
      [up_id, producer_id]
    );

    if (upResult.rows.length === 0) {
      res.status(404).json({ error: 'UP no encontrada' });
      return;
    }

    const [cyclesResult, visitasResult, incidenciasResult, estimacionResult, cosechaResult, alertasResult] = await Promise.all([
      pool.query(
        `SELECT c.*, json_agg(
           json_build_object(
             'cycle_crop_id', cc.cycle_crop_id,
             'crop', cc.crop,
             'variety_id', cc.variety_id,
             'area_sown_ha', cc.area_sown_ha,
             'planting_date', cc.planting_date,
             'estimated_harvest_date', cc.estimated_harvest_date
           ) ORDER BY cc.cycle_crop_id
         ) FILTER (WHERE cc.cycle_crop_id IS NOT NULL) AS crops
         FROM cycle c
         LEFT JOIN cycle_crop cc ON cc.cycle_id = c.cycle_id
         WHERE c.up_id = $1
         GROUP BY c.cycle_id
         ORDER BY c.cycle_year DESC, c.cycle_id DESC`,
        [up_id]
      ),
      pool.query(
        `SELECT * FROM seguimiento_visitas WHERE up_id = $1 ORDER BY fecha_visita DESC LIMIT 20`,
        [up_id]
      ),
      pool.query(
        `SELECT * FROM seguimiento_incidencias WHERE up_id = $1 ORDER BY fecha DESC LIMIT 20`,
        [up_id]
      ),
      pool.query(
        `SELECT * FROM estimacion_cosecha WHERE up_id = $1 ORDER BY fecha_estimacion DESC LIMIT 10`,
        [up_id]
      ),
      pool.query(
        `SELECT * FROM cosecha_real WHERE up_id = $1 ORDER BY fecha_cosecha DESC LIMIT 10`,
        [up_id]
      ),
      pool.query(
        `SELECT * FROM alertas WHERE up_id = $1 ORDER BY fecha_alerta DESC LIMIT 20`,
        [up_id]
      ),
    ]);

    res.json({
      up: upResult.rows[0],
      cycles: cyclesResult.rows,
      seguimiento: {
        visitas: visitasResult.rows,
        incidencias: incidenciasResult.rows,
        estimaciones: estimacionResult.rows,
        cosechas: cosechaResult.rows,
      },
      alertas: alertasResult.rows,
    });
  } catch (error) {
    console.error('Error al obtener detalle UP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/mis-ups/:up_id — edit allowed fields
router.patch('/:up_id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { up_id } = req.params;
    const { up_name, up_type, production_system, water_regime, state_name, municipality_name } = req.body;

    const producerResult = await pool.query(
      'SELECT producer_id FROM producer WHERE usuario_id = $1',
      [userId]
    );
    if (producerResult.rows.length === 0) {
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }
    const producer_id = producerResult.rows[0].producer_id;

    const result = await pool.query(
      `UPDATE up SET
         up_name = COALESCE($1, up_name),
         up_type = COALESCE($2, up_type),
         production_system = COALESCE($3, production_system),
         water_regime = COALESCE($4, water_regime),
         state_name = COALESCE($5, state_name),
         municipality_name = COALESCE($6, municipality_name),
         updated_at = NOW()
       WHERE up_id = $7 AND producer_id = $8
       RETURNING *`,
      [up_name, up_type, production_system, water_regime, state_name, municipality_name, up_id, producer_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'UP no encontrada o no autorizada' });
      return;
    }

    res.json({ up: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar UP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
