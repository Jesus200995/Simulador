import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/precios-maiz — Precios de referencia del maíz
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT id, tipo, precio, unidad, tendencia, fecha_actualizacion
      FROM precios_maiz
      ORDER BY tipo ASC
    `);

    const precios = result.rows;

    const promedio = precios.length > 0
      ? Math.round(precios.reduce((sum: number, p: any) => sum + Number(p.precio), 0) / precios.length)
      : 0;

    // Tendencia general: mayoría
    const tendencias = precios.map((p: any) => p.tendencia).filter(Boolean);
    const conteo: Record<string, number> = {};
    tendencias.forEach((t: string) => { conteo[t] = (conteo[t] || 0) + 1; });
    const tendencia_general = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || 'estable';

    res.json({ precios, promedio, tendencia_general });
  } catch (error) {
    console.error('Error al obtener precios de maiz:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
