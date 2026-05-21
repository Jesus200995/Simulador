import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/oferta/municipios — datos AGREGADOS por municipio
// NUNCA devuelve datos individuales de productores
router.get('/municipios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tipo_maiz } = req.query;

  try {
    let where = `WHERE cy.activo = TRUE`;
    const params: any[] = [];

    if (tipo_maiz) {
      params.push(tipo_maiz);
      where += ` AND cc.tipo_maiz = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         u.municipio_nombre AS municipio,
         u.estado_nombre AS estado,
         COUNT(DISTINCT p.producer_id) AS productores_disponibles,
         COALESCE(SUM(cc.rendimiento_estimado_ton), 0) AS toneladas_estimadas,
         'esta_semana' AS ventana_predominante
       FROM up u
       JOIN producer p ON p.producer_id = u.producer_id
       JOIN cycle cy ON cy.up_id = u.up_id
       LEFT JOIN cycle_crop cc ON cc.cycle_id = cy.cycle_id
       ${where}
       GROUP BY u.municipio_nombre, u.estado_nombre
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
