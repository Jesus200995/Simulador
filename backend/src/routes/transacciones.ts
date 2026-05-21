import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/transacciones
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { bodega_id, fecha_inicio, fecha_fin, tipo_maiz } = req.query;

  try {
    const isAdmin = ['admin', 'responsable'].includes(user.rol);
    let where = isAdmin ? 'WHERE 1=1' : 'WHERE t.usuario_bodeguero = $1';
    const params: any[] = isAdmin ? [] : [user.userId];

    if (bodega_id) { params.push(bodega_id); where += ` AND t.bodega_id = $${params.length}`; }
    if (tipo_maiz) { params.push(tipo_maiz); where += ` AND t.tipo_maiz = $${params.length}`; }
    if (fecha_inicio) { params.push(fecha_inicio); where += ` AND t.fecha >= $${params.length}`; }
    if (fecha_fin) { params.push(fecha_fin); where += ` AND t.fecha <= $${params.length}`; }

    const result = await pool.query(
      `SELECT t.*, b.nombre AS bodega_nombre,
              COALESCE(p.nombre_completo, t.nombre_productor_libre) AS nombre_productor
       FROM transacciones t
       JOIN bodegas b ON b.id = t.bodega_id
       LEFT JOIN producer p ON p.producer_id = t.producer_id
       ${where}
       ORDER BY t.fecha DESC, t.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/transacciones
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { bodega_id, producer_id, nombre_productor_libre, tipo_maiz, variedad_code, volumen_ton, precio_ton, fecha, notas } = req.body;

  if (!bodega_id || !tipo_maiz || !volumen_ton || !precio_ton || !fecha) {
    res.status(400).json({ error: 'Campos requeridos: bodega_id, tipo_maiz, volumen_ton, precio_ton, fecha' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO transacciones
         (bodega_id, usuario_bodeguero, producer_id, nombre_productor_libre,
          tipo_maiz, variedad_code, volumen_ton, precio_ton, fecha, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [bodega_id, userId, producer_id || null, nombre_productor_libre || null,
       tipo_maiz, variedad_code || null, volumen_ton, precio_ton, fecha, notas || null]
    );

    const tx = result.rows[0];

    // Notificar al productor si tiene usuario (best-effort)
    if (producer_id) {
      try {
        const [bodegaR, prodR] = await Promise.all([
          pool.query('SELECT nombre FROM bodegas WHERE id = $1', [bodega_id]),
          pool.query('SELECT u.id FROM usuarios u JOIN producer p ON p.email = u.email WHERE p.producer_id = $1 LIMIT 1', [producer_id]),
        ]);
        if (prodR.rows.length > 0) {
          const msg = `La Bodega ${bodegaR.rows[0]?.nombre} registró una compra tuya: ${volumen_ton} ton a $${precio_ton}/ton. ¿Es correcto?`;
          await pool.query(
            `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
             VALUES ($1, 'confirmacion_transaccion', $2, $3, 'transacciones')`,
            [prodR.rows[0].id, msg, tx.id]
          );
        }
      } catch (_) { /* best-effort */ }
    }

    res.status(201).json(tx);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/transacciones/:id/confirmar
router.patch('/:id/confirmar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { confirmacion } = req.body;
  if (!['confirmada', 'discrepancia'].includes(confirmacion)) {
    res.status(400).json({ error: "confirmacion debe ser 'confirmada' o 'discrepancia'" });
    return;
  }

  const peso = confirmacion === 'confirmada' ? 0.75 : 0;

  try {
    const result = await pool.query(
      `UPDATE transacciones SET confirmacion_productor = $1, peso_precio_sistema = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [confirmacion, peso, req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Transacción no encontrada' }); return; }
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
