import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/catalogos-productor - Todos los catálogos del módulo Productor
// =============================================
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const catalogs = await pool.query(
      `SELECT catalog, code, label FROM cat_catalog WHERE is_active = true ORDER BY catalog, sort_order, label`
    );

    const varieties = await pool.query(
      `SELECT crop, code, label FROM cat_crop_variety WHERE is_active = true ORDER BY crop, sort_order, label`
    );

    const states = await pool.query(
      `SELECT state_id, name FROM geo_state ORDER BY name`
    );

    // Group catalogs by type
    const grouped: Record<string, { code: string; label: string }[]> = {};
    for (const row of catalogs.rows) {
      if (!grouped[row.catalog]) grouped[row.catalog] = [];
      grouped[row.catalog].push({ code: row.code, label: row.label });
    }

    // Group varieties by crop
    const varietiesByCrop: Record<string, { code: string; label: string }[]> = {};
    for (const row of varieties.rows) {
      if (!varietiesByCrop[row.crop]) varietiesByCrop[row.crop] = [];
      varietiesByCrop[row.crop].push({ code: row.code, label: row.label });
    }

    res.json({
      catalogs: grouped,
      varieties: varietiesByCrop,
      states: states.rows,
    });
  } catch (error) {
    console.error('Error obteniendo catálogos productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/catalogos-productor/municipalities?state_id=XX
// =============================================
router.get('/municipalities', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { state_id } = req.query;

    if (!state_id) {
      res.status(400).json({ error: 'Se requiere state_id' });
      return;
    }

    const result = await pool.query(
      `SELECT municipality_id, name FROM geo_municipality WHERE state_id = $1 ORDER BY name`,
      [state_id]
    );

    res.json({ municipalities: result.rows });
  } catch (error) {
    console.error('Error obteniendo municipios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
