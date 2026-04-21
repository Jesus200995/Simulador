import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/alertas - Lista de alertas
// =============================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { up_id, ciclo_id, estado_alerta, nivel_alerta } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (up_id) { conditions.push(`a.up_id = $${idx++}`); params.push(Number(up_id)); }
    if (ciclo_id) { conditions.push(`a.ciclo_id = $${idx++}`); params.push(Number(ciclo_id)); }
    if (estado_alerta) { conditions.push(`a.estado_alerta = $${idx++}`); params.push(estado_alerta); }
    if (nivel_alerta) { conditions.push(`a.nivel_alerta = $${idx++}`); params.push(nivel_alerta); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        a.*,
        p.nombres, p.apellido_paterno, p.apellido_materno,
        u.up_name,
        c.cycle_year, c.cycle_type,
        usr.nombre_completo as usuario_nombre
      FROM alertas a
      LEFT JOIN producer p ON a.producer_id = p.producer_id
      LEFT JOIN up u ON a.up_id = u.up_id
      LEFT JOIN cycle c ON a.ciclo_id = c.cycle_id
      LEFT JOIN usuarios usr ON a.usuario_registro = usr.id
      ${where}
      ORDER BY a.fecha_alerta DESC, a.created_at DESC
    `, params);

    res.json({ alertas: result.rows });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/alertas/:id - Detalle de alerta
// =============================================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        a.*,
        p.nombres, p.apellido_paterno, p.apellido_materno, p.curp,
        u.up_name, u.area_ha_calc,
        c.cycle_year, c.cycle_type,
        usr.nombre_completo as usuario_nombre
      FROM alertas a
      LEFT JOIN producer p ON a.producer_id = p.producer_id
      LEFT JOIN up u ON a.up_id = u.up_id
      LEFT JOIN cycle c ON a.ciclo_id = c.cycle_id
      LEFT JOIN usuarios usr ON a.usuario_registro = usr.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alerta no encontrada' });
      return;
    }

    res.json({ alerta: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/alertas - Crear alerta manual
// =============================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      producer_id, up_id, ciclo_id,
      tipo_alerta, fecha_alerta, nivel_alerta, observaciones,
    } = req.body;

    if (!up_id || !ciclo_id || !tipo_alerta || !fecha_alerta || !nivel_alerta) {
      res.status(400).json({ error: 'Campos obligatorios faltantes' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO alertas
        (producer_id, up_id, ciclo_id, tipo_alerta, origen_alerta, fecha_alerta,
         nivel_alerta, estado_alerta, observaciones, usuario_registro)
      VALUES ($1,$2,$3,$4,'manual',$5,$6,'pendiente',$7,$8)
      RETURNING *
    `, [producer_id || null, up_id, ciclo_id, tipo_alerta, fecha_alerta, nivel_alerta, observaciones || null, req.userId]);

    const alerta = result.rows[0];

    // Crear notificación interna para el técnico que registró
    await pool.query(`
      INSERT INTO notificaciones (alerta_id, usuario_id) VALUES ($1, $2)
    `, [alerta.id, req.userId]);

    res.status(201).json({ alerta });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/alertas/automatica - Crear alerta automática (sin duplicados)
// =============================================
router.post('/automatica', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      producer_id, up_id, ciclo_id,
      tipo_alerta, fecha_alerta, nivel_alerta, observaciones,
    } = req.body;

    if (!up_id || !ciclo_id || !tipo_alerta || !fecha_alerta || !nivel_alerta) {
      res.status(400).json({ error: 'Campos obligatorios faltantes' });
      return;
    }

    // Verificar duplicado (up + tipo + fecha para automáticas)
    const dup = await pool.query(`
      SELECT id FROM alertas
      WHERE up_id=$1 AND tipo_alerta=$2 AND fecha_alerta=$3 AND origen_alerta='automatica'
    `, [up_id, tipo_alerta, fecha_alerta]);

    if (dup.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe una alerta automática para esta UP, tipo y fecha', alerta_id: dup.rows[0].id });
      return;
    }

    const result = await pool.query(`
      INSERT INTO alertas
        (producer_id, up_id, ciclo_id, tipo_alerta, origen_alerta, fecha_alerta,
         nivel_alerta, estado_alerta, observaciones, usuario_registro)
      VALUES ($1,$2,$3,$4,'automatica',$5,$6,'pendiente',$7,$8)
      RETURNING *
    `, [producer_id || null, up_id, ciclo_id, tipo_alerta, fecha_alerta, nivel_alerta, observaciones || null, req.userId]);

    const alerta = result.rows[0];

    // Notificar a todos los técnicos asignados a ese producer
    const tecnicos = await pool.query(`
      SELECT tecnico_asignado_id as usuario_id FROM producer
      WHERE producer_id = $1 AND tecnico_asignado_id IS NOT NULL
    `, [producer_id || null]);

    for (const t of tecnicos.rows) {
      await pool.query(`
        INSERT INTO notificaciones (alerta_id, usuario_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [alerta.id, t.usuario_id]);
    }

    res.status(201).json({ alerta });
  } catch (error) {
    console.error('Error al crear alerta automática:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/alertas/:id/estado - Cambiar estado de alerta
// =============================================
router.patch('/:id/estado', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado_alerta, observaciones } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'descartada', 'atendida'];
    if (!estado_alerta || !estadosValidos.includes(estado_alerta)) {
      res.status(400).json({ error: 'Estado inválido. Valores permitidos: ' + estadosValidos.join(', ') });
      return;
    }

    // Las alertas automáticas solo cambian de estado, no de contenido
    const result = await pool.query(`
      UPDATE alertas
      SET estado_alerta = $1,
          observaciones = COALESCE($2, observaciones),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [estado_alerta, observaciones || null, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alerta no encontrada' });
      return;
    }

    res.json({ alerta: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar estado de alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PUT /api/alertas/:id - Editar alerta manual
// =============================================
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tipo_alerta, fecha_alerta, nivel_alerta, observaciones } = req.body;

    // Solo se pueden editar alertas manuales
    const check = await pool.query('SELECT origen_alerta FROM alertas WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ error: 'Alerta no encontrada' });
      return;
    }
    if (check.rows[0].origen_alerta === 'automatica') {
      res.status(403).json({ error: 'Las alertas automáticas no se pueden editar, solo cambiar de estado' });
      return;
    }

    const result = await pool.query(`
      UPDATE alertas
      SET tipo_alerta = COALESCE($1, tipo_alerta),
          fecha_alerta = COALESCE($2, fecha_alerta),
          nivel_alerta = COALESCE($3, nivel_alerta),
          observaciones = COALESCE($4, observaciones),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [tipo_alerta, fecha_alerta, nivel_alerta, observaciones, id]);

    res.json({ alerta: result.rows[0] });
  } catch (error) {
    console.error('Error al editar alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/alertas/notificaciones/mis
// Notificaciones del usuario autenticado
// =============================================
router.get('/notificaciones/mis', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        n.id, n.leida, n.created_at,
        a.id as alerta_id, a.tipo_alerta, a.nivel_alerta, a.estado_alerta, a.fecha_alerta,
        p.nombres, p.apellido_paterno,
        u.up_name
      FROM notificaciones n
      JOIN alertas a ON n.alerta_id = a.id
      LEFT JOIN producer p ON a.producer_id = p.producer_id
      LEFT JOIN up u ON a.up_id = u.up_id
      WHERE n.usuario_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.userId]);

    const total_no_leidas = result.rows.filter(r => !r.leida).length;

    res.json({ notificaciones: result.rows, total_no_leidas });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/alertas/notificaciones/:id/leer
// Marcar notificación como leída
// =============================================
router.patch('/notificaciones/:id/leer', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE notificaciones
      SET leida = TRUE, fecha_leida = CURRENT_TIMESTAMP
      WHERE id = $1 AND usuario_id = $2
    `, [id, req.userId]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/alertas/notificaciones/leer-todas
// Marcar todas las notificaciones como leídas
// =============================================
router.patch('/notificaciones/leer-todas', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(`
      UPDATE notificaciones
      SET leida = TRUE, fecha_leida = CURRENT_TIMESTAMP
      WHERE usuario_id = $1 AND leida = FALSE
    `, [req.userId]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
