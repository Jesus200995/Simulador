import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/mis-inventarios — Inventarios registrados por el usuario autenticado
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(`
      SELECT
        i.*,
        b.nombre as bodega_nombre,
        b.municipio,
        b.estado
      FROM inventarios i
      JOIN bodegas b ON i.bodega_id = b.id
      WHERE i.usuario_id = $1
      ORDER BY i.fecha_registro DESC
    `, [userId]);

    res.json({ inventarios: result.rows });
  } catch (error) {
    console.error('Error al obtener mis inventarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
