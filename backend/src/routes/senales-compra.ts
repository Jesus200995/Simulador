import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/senales-compra
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { bodega_id, tipo_maiz } = req.query;
  try {
    let where = 'WHERE sc.activa = TRUE';
    const params: any[] = [];
    if (bodega_id) { params.push(bodega_id); where += ` AND sc.bodega_id = $${params.length}`; }
    if (tipo_maiz) { params.push(tipo_maiz); where += ` AND sc.tipo_maiz = $${params.length}`; }

    const result = await pool.query(
      `SELECT sc.*, b.nombre AS bodega_nombre, b.municipio, b.estado
       FROM senales_compra sc
       JOIN bodegas b ON b.id = sc.bodega_id
       ${where}
       ORDER BY sc.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/senales-compra
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { bodega_id, tipo_maiz, variedad_code, volumen_ton, precio_ofrecido, radio_km, vigencia } = req.body;

  if (!bodega_id || !tipo_maiz || !precio_ofrecido || !vigencia) {
    res.status(400).json({ error: 'Campos requeridos: bodega_id, tipo_maiz, precio_ofrecido, vigencia' });
    return;
  }

  try {
    // Validar máx 5 señales activas por bodega
    const count = await pool.query(
      'SELECT COUNT(*) FROM senales_compra WHERE bodega_id = $1 AND activa = TRUE',
      [bodega_id]
    );
    if (parseInt(count.rows[0].count) >= 5) {
      res.status(400).json({ error: 'Ya tienes 5 señales activas. Cancela una antes de publicar una nueva.' });
      return;
    }

    // Calcular fecha_vencimiento en SQL
    const fechaExpr = vigencia === 'esta_semana'
      ? `date_trunc('week', CURRENT_DATE) + INTERVAL '6 days'`
      : `CURRENT_DATE + INTERVAL '15 days'`;

    const result = await pool.query(
      `INSERT INTO senales_compra
         (bodega_id, usuario_id, tipo_maiz, variedad_code, volumen_ton, precio_ofrecido, radio_km, vigencia, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (${fechaExpr}))
       RETURNING *`,
      [bodega_id, userId, tipo_maiz, variedad_code || null, volumen_ton || null, precio_ofrecido, radio_km || 50, vigencia]
    );

    const senal = result.rows[0];

    // Notificar productores (best-effort)
    try {
      const bodega = await pool.query('SELECT nombre FROM bodegas WHERE id = $1', [bodega_id]);
      const msg = `🔔 Bodega ${bodega.rows[0]?.nombre} busca ${volumen_ton || '?'} ton de ${tipo_maiz} a $${precio_ofrecido}/ton.`;
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
         SELECT id, 'senal_compra', $1, $2, 'senales_compra'
         FROM usuarios WHERE rol IN ('productor','tecnico') AND activo = TRUE`,
        [msg, senal.id]
      );
    } catch (_) { /* best-effort */ }

    res.status(201).json(senal);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/senales-compra/:id (desactivar)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  try {
    const result = await pool.query(
      `UPDATE senales_compra SET activa = FALSE WHERE id = $1 AND usuario_id = $2 RETURNING id`,
      [req.params.id, userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Señal no encontrada o sin permiso' }); return; }
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/senales-compra/:id/interes
router.post('/:id/interes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senal = await pool.query(
      `UPDATE senales_compra SET interesados_count = interesados_count + 1
       WHERE id = $1 AND activa = TRUE RETURNING *`,
      [req.params.id]
    );
    if (senal.rows.length === 0) { res.status(404).json({ error: 'Señal no encontrada o inactiva' }); return; }

    const s = senal.rows[0];
    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
         VALUES ($1, 'interes_senal', $2, $3, 'senales_compra')`,
        [s.usuario_id, `Un productor respondió a tu señal. Ya tienes ${s.interesados_count} interesados.`, s.id]
      );
    } catch (_) { /* best-effort */ }

    res.json({ ok: true, interesados_count: s.interesados_count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
