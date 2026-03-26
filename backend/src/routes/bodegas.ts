import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/bodegas/catalogos - Regiones, Estados, Municipios
// =============================================
router.get('/catalogos', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const regiones = await pool.query('SELECT id, nombre FROM regiones ORDER BY nombre');
    const estados = await pool.query(
      'SELECT DISTINCT estado, region_id FROM bodegas WHERE estado IS NOT NULL ORDER BY estado'
    );
    const municipios = await pool.query(
      'SELECT DISTINCT municipio, estado FROM bodegas WHERE municipio IS NOT NULL ORDER BY municipio'
    );
    res.json({
      regiones: regiones.rows,
      estados: estados.rows,
      municipios: municipios.rows,
    });
  } catch (error) {
    console.error('Error al obtener catalogos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/bodegas - Filtrar bodegas + KPI agregado
// =============================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { region_id, estado, municipio, q } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (region_id) {
      conditions.push(`b.region_id = $${idx++}`);
      params.push(Number(region_id));
    }
    if (estado) {
      conditions.push(`b.estado = $${idx++}`);
      params.push(estado);
    }
    if (municipio) {
      conditions.push(`b.municipio = $${idx++}`);
      params.push(municipio);
    }
    if (q) {
      conditions.push(`(b.nombre ILIKE $${idx} OR b.clave ILIKE $${idx} OR b.estado ILIKE $${idx} OR b.municipio ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const bodegasQuery = `
      SELECT b.*, r.nombre as region_nombre
      FROM bodegas b
      LEFT JOIN regiones r ON b.region_id = r.id
      ${where}
      ORDER BY b.nombre ASC
    `;

    const kpiQuery = `
      SELECT
        COUNT(*)::int as total_bodegas,
        COALESCE(SUM(b.toneladas_total), 0)::float as total_toneladas,
        COALESCE(SUM(b.toneladas_nacional), 0)::float as total_nacional,
        COALESCE(SUM(b.toneladas_importacion), 0)::float as total_importacion
      FROM bodegas b
      ${where}
    `;

    const [bodegasResult, kpiResult] = await Promise.all([
      pool.query(bodegasQuery, params),
      pool.query(kpiQuery, params),
    ]);

    res.json({
      bodegas: bodegasResult.rows,
      kpi: kpiResult.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener bodegas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/bodegas/:id - Detalle de bodega
// =============================================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, r.nombre as region_nombre
       FROM bodegas b
       LEFT JOIN regiones r ON b.region_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bodega no encontrada' });
      return;
    }

    res.json({ bodega: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener bodega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
