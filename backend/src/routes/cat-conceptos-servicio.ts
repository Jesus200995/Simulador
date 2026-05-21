import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/cat-conceptos-servicio
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT * FROM cat_conceptos_servicio WHERE estatus = 'aprobado' ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/cat-conceptos-servicio/proponer
router.post('/proponer', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { nombre, unidad_default } = req.body;
  if (!nombre) { res.status(400).json({ error: 'nombre requerido' }); return; }

  const unidad = ['MXN/ton', 'MXN/ton/mes', 'MXN/viaje'].includes(unidad_default)
    ? unidad_default
    : 'MXN/ton';

  try {
    const result = await pool.query(
      `INSERT INTO cat_conceptos_servicio (nombre, unidad_default, estatus, propuesto_por)
       VALUES ($1, $2, 'pendiente', $3) RETURNING *`,
      [nombre, unidad, userId]
    );
    res.status(201).json({
      ok: true,
      concepto: result.rows[0],
      mensaje: 'Tu propuesta fue enviada. Te notificaremos cuando el admin la apruebe.'
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/cat-conceptos-servicio/:id/aprobar (admin)
router.patch('/:id/aprobar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!['admin', 'responsable'].includes(req.user!.rol)) {
    res.status(403).json({ error: 'Sin permiso' });
    return;
  }
  try {
    const result = await pool.query(
      "UPDATE cat_conceptos_servicio SET estatus = 'aprobado' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Concepto no encontrado' }); return; }
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
