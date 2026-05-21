import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function bodegaOnly(req: AuthRequest, res: Response, next: Function) {
  if (!req.user || !['bodega', 'admin', 'responsable'].includes(req.user.rol)) {
    res.status(403).json({ error: 'Acceso restringido a usuarios bodega' });
    return;
  }
  next();
}

// POST /api/bodeguero/bodegas/solicitar
router.post('/bodegas/solicitar', authMiddleware, bodegaOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { bodega_id } = req.body;
  const userId = req.user!.userId;

  if (!bodega_id) { res.status(400).json({ error: 'bodega_id requerido' }); return; }

  try {
    const bodegaCheck = await pool.query('SELECT id, estatus FROM bodegas WHERE id = $1', [bodega_id]);
    if (bodegaCheck.rows.length === 0) { res.status(404).json({ error: 'Bodega no encontrada' }); return; }

    const bodega = bodegaCheck.rows[0];
    const estatus = bodega.estatus === 'aprobada' ? 'aprobada' : 'pendiente';

    const result = await pool.query(
      `INSERT INTO bodeguero_bodegas (usuario_id, bodega_id, estatus)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, bodega_id) DO UPDATE SET estatus = EXCLUDED.estatus
       RETURNING *`,
      [userId, bodega_id, estatus]
    );

    res.json({ ok: true, asociacion: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bodeguero/mis-bodegas
router.get('/mis-bodegas', authMiddleware, bodegaOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const result = await pool.query(
      `SELECT b.id, b.nombre, b.municipio, b.estado, b.capacidad_ton,
              b.latitud, b.longitud, b.localidad,
              b.semaforo_compra, b.semaforo_updated_at,
              b.es_ventanilla, b.estatus,
              bb.estatus AS asociacion_estatus,
              COALESCE(inv.volumen_almacenamiento, 0) AS stock_actual,
              CASE WHEN b.capacidad_ton > 0
                   THEN ROUND((COALESCE(inv.volumen_almacenamiento,0) / b.capacidad_ton::NUMERIC) * 100, 1)
                   ELSE 0 END AS ocupacion_pct
       FROM bodeguero_bodegas bb
       JOIN bodegas b ON b.id = bb.bodega_id
       LEFT JOIN LATERAL (
         SELECT volumen_almacenamiento
         FROM inventarios
         WHERE bodega_id = b.id
         ORDER BY fecha DESC LIMIT 1
       ) inv ON TRUE
       WHERE bb.usuario_id = $1 AND bb.estatus = 'aprobada'
       ORDER BY b.nombre`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
