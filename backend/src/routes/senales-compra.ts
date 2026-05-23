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
  const { bodega_id, tipo_maiz, variedad_code, volumen_ton, precio_ofrecido, radio_km,
          vigencia, vigencia_inicio, vigencia_fin } = req.body;

  if (!bodega_id || !tipo_maiz || !precio_ofrecido) {
    res.status(400).json({ error: 'Campos requeridos: bodega_id, tipo_maiz, precio_ofrecido' });
    return;
  }

  try {
    // Validar máx 5 requerimientos activos por bodega
    const count = await pool.query(
      'SELECT COUNT(*) FROM senales_compra WHERE bodega_id = $1 AND activa = TRUE',
      [bodega_id]
    );
    if (parseInt(count.rows[0].count) >= 5) {
      res.status(400).json({ error: 'Ya tienes 5 requerimientos activos. Cancela uno antes de publicar un nuevo.' });
      return;
    }

    // Calcular fecha_vencimiento: usar vigencia_fin si se proporciona, si no según vigencia
    let fechaVenc: string;
    if (vigencia_fin) {
      fechaVenc = vigencia_fin;
    } else if (vigencia === 'esta_semana') {
      // Domingo de esta semana
      const d = new Date();
      d.setDate(d.getDate() + (7 - d.getDay()) % 7 || 7);
      fechaVenc = d.toISOString().slice(0, 10);
    } else {
      // Default: 15 días
      const d = new Date();
      d.setDate(d.getDate() + 15);
      fechaVenc = d.toISOString().slice(0, 10);
    }

    // Mapear vigencia a valores permitidos por el CHECK constraint
    const vigenciaDb = vigencia === 'rango' || vigencia === 'esta_semana' ? vigencia
      : '15_dias';

    const result = await pool.query(
      `INSERT INTO senales_compra
         (bodega_id, usuario_id, tipo_maiz, variedad_code, volumen_ton, precio_ofrecido,
          radio_km, vigencia, vigencia_inicio, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [bodega_id, userId, tipo_maiz, variedad_code || null, volumen_ton || null,
       precio_ofrecido, radio_km || 50, vigenciaDb,
       vigencia_inicio || null, fechaVenc]
    );

    const senal = result.rows[0];

    // C-14: Notificar productores con info completa de bodega (best-effort)
    try {
      const bodegaR = await pool.query(
        `SELECT b.nombre, b.municipio, b.estado, b.localidad,
                ic.telefono, ic.correo, ic.nombre AS contacto_nombre
         FROM bodegas b
         LEFT JOIN infraestructura_contactos ic ON ic.bodega_id = b.id AND ic.es_principal = TRUE
         WHERE b.id = $1 LIMIT 1`,
        [bodega_id]
      );
      const b = bodegaR.rows[0];
      if (b) {
        const tipoLabel: Record<string, string> = { blanco: 'Maíz Blanco', amarillo: 'Maíz Amarillo', criollo: 'Criollo / Local' };
        const vigLabel = vigencia_fin
          ? `del ${(vigencia_inicio || '').slice(0,10)} al ${vigencia_fin.slice(0,10)}`
          : '15 días';
        const msg = `🔔 Requerimiento de maíz en ${b.nombre} (${b.municipio}, ${b.estado}): ${volumen_ton || '?'} ton de ${tipoLabel[tipo_maiz] || tipo_maiz} a $${Number(precio_ofrecido).toLocaleString()}/ton. Vigencia: ${vigLabel}.${b.telefono ? ` Contacto: ${b.contacto_nombre || b.nombre} — ${b.telefono}` : ''}${b.correo ? ` / ${b.correo}` : ''}`;
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
           SELECT id, 'senal_compra', $1, $2, 'senales_compra'
           FROM usuarios WHERE rol IN ('productor','tecnico') AND activo = TRUE`,
          [msg, senal.id]
        );
      }
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
