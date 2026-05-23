import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/oferta/municipios — datos AGREGADOS por municipio
// NUNCA devuelve datos individuales de productores
router.get('/municipios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tipo_maiz } = req.query;

  try {
    // cycle table has no 'activo' column; filter by recent cycle_year instead
    let where = `WHERE cy.cycle_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 1`;
    const params: any[] = [];

    if (tipo_maiz) {
      // cycle_crop.crop contains the crop name (e.g. 'maiz'); tipo_maiz is an extra hint
      params.push(tipo_maiz);
      where += ` AND (cc.variety_id = $${params.length} OR $${params.length}::text = 'all')`;
    }

    const result = await pool.query(
      `SELECT
         COALESCE(u.municipality_name, u.municipality_id, 'Sin municipio') AS municipio,
         COALESCE(u.state_name, u.state_id, 'Sin estado') AS estado,
         COUNT(DISTINCT p.producer_id) AS productores_disponibles,
         COALESCE(SUM(cc.yield_expected), 0)::numeric(12,2) AS toneladas_estimadas,
         'esta_semana' AS ventana_predominante
       FROM up u
       JOIN producer p ON p.producer_id = u.producer_id
       JOIN cycle cy ON cy.up_id = u.up_id
       LEFT JOIN cycle_crop cc ON cc.cycle_id = cy.cycle_id AND cc.crop = 'maiz'
       ${where}
       GROUP BY u.municipality_name, u.municipality_id, u.state_name, u.state_id
       HAVING COUNT(DISTINCT p.producer_id) > 0
       ORDER BY productores_disponibles DESC
       LIMIT 50`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
