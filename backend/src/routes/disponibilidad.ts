import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/disponibilidad — productor declara maíz disponible
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { up_id, tipo_maiz, variedad_code, volumen_estimado_ton, ventana_venta } = req.body;

  if (!up_id || !tipo_maiz || !ventana_venta) {
    res.status(400).json({ error: 'Campos requeridos: up_id, tipo_maiz, ventana_venta' });
    return;
  }

  try {
    // Obtener producer_id del usuario
    const prodR = await pool.query(
      'SELECT producer_id FROM producer WHERE usuario_id = $1 LIMIT 1',
      [userId]
    );
    if (prodR.rows.length === 0) {
      res.status(403).json({ error: 'No se encontró productor vinculado a tu cuenta' });
      return;
    }
    const producer_id = prodR.rows[0].producer_id;

    // Verificar que la UP pertenece al productor
    const upCheck = await pool.query(
      'SELECT up_id FROM up WHERE up_id = $1 AND producer_id = $2',
      [up_id, producer_id]
    );
    if (upCheck.rows.length === 0) {
      res.status(403).json({ error: 'La UP no pertenece al productor' });
      return;
    }

    // Calcular fecha_vencimiento según ventana_venta
    let fechaVenc: string;
    if (ventana_venta === 'esta_semana') {
      const d = new Date();
      d.setDate(d.getDate() + (7 - d.getDay()) % 7 || 7);
      fechaVenc = d.toISOString().slice(0, 10);
    } else if (ventana_venta === 'quincena') {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      fechaVenc = d.toISOString().slice(0, 10);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      fechaVenc = d.toISOString().slice(0, 10);
    }

    // Desactivar disponibilidades anteriores del mismo productor + UP
    await pool.query(
      `UPDATE disponibilidad_productor SET activa = FALSE, updated_at = NOW()
       WHERE producer_id = $1 AND up_id = $2 AND activa = TRUE`,
      [producer_id, up_id]
    );

    const result = await pool.query(
      `INSERT INTO disponibilidad_productor
         (producer_id, up_id, tipo_maiz, variedad_code, volumen_estimado_ton,
          ventana_venta, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [producer_id, up_id, tipo_maiz, variedad_code || null,
       volumen_estimado_ton || null, ventana_venta, fechaVenc]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/disponibilidad — lista disponibilidades activas del productor autenticado
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  try {
    const result = await pool.query(
      `SELECT dp.*, u.municipality_name AS municipio, u.state_name AS estado
       FROM disponibilidad_productor dp
       JOIN up u ON u.up_id = dp.up_id
       JOIN producer p ON p.producer_id = dp.producer_id
       WHERE p.usuario_id = $1 AND dp.activa = TRUE
       ORDER BY dp.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/disponibilidad/:id — desactivar (soft delete)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  try {
    const result = await pool.query(
      `UPDATE disponibilidad_productor dp
       SET activa = FALSE, updated_at = NOW()
       FROM producer p
       WHERE dp.id = $1 AND dp.producer_id = p.producer_id AND p.usuario_id = $2
       RETURNING dp.id`,
      [req.params.id, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No encontrada o sin permiso' });
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
