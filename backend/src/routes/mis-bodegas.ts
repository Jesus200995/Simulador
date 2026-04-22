import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/mis-bodegas — Bodegas registradas por el usuario autenticado
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(`
      SELECT
        b.*,
        r.nombre as region_nombre,
        COUNT(i.id)::int as total_inventarios,
        MAX(i.fecha_registro) as ultimo_inventario
      FROM bodegas b
      LEFT JOIN regiones r ON b.region_id = r.id
      LEFT JOIN inventarios i ON i.bodega_id = b.id
      WHERE b.creado_por = $1
      GROUP BY b.id, r.nombre
      ORDER BY b.fecha_creacion DESC
    `, [userId]);

    res.json({ bodegas: result.rows });
  } catch (error) {
    console.error('Error al obtener mis bodegas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


export default router;
