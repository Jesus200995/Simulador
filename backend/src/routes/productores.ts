import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/productores/buscar?q=<nombre_o_curp>&bodega_id=<id>
// C-17: Producer autocomplete for transaction form
router.get('/buscar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, bodega_id } = req.query;

  if (!q || String(q).trim().length < 3) {
    res.status(400).json({ error: 'Parámetro q debe tener al menos 3 caracteres' });
    return;
  }

  try {
    const termino = `%${String(q).toUpperCase().trim()}%`;
    const params: any[] = [termino];
    let extra = '';

    // Si se da bodega_id, priorizamos productores que ya tienen transacción en esa bodega
    if (bodega_id) {
      params.push(bodega_id);
      extra = `OR p.producer_id IN (
        SELECT DISTINCT producer_id FROM transacciones WHERE bodega_id = $${params.length} AND producer_id IS NOT NULL
      )`;
    }

    const result = await pool.query(
      `SELECT
         p.producer_id,
         p.nombre_completo,
         COALESCE(p.municipio_nombre, p.municipality_name, '') AS municipio,
         RIGHT(COALESCE(p.curp, ''), 4) AS curp_parcial
       FROM producer p
       WHERE (
         UPPER(p.nombre_completo) LIKE $1
         OR UPPER(COALESCE(p.curp, '')) LIKE $1
         ${extra}
       )
       ORDER BY p.nombre_completo
       LIMIT 10`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
