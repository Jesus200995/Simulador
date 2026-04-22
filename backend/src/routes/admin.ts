import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: solo admin
function soloAdmin(req: AuthRequest, res: Response, next: Function): void {
  if (req.user?.rol !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    return;
  }
  next();
}

// =============================================
// GET /api/admin/usuarios
// =============================================
router.get('/usuarios', authMiddleware, soloAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT id, nombre_completo, email, curp, rol, activo, fecha_registro
      FROM usuarios
      ORDER BY fecha_registro DESC
    `);
    res.json({ usuarios: result.rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/admin/usuarios/:id/rol
// =============================================
router.patch('/usuarios/:id/rol', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const rolesValidos = ['tecnico', 'supervisor', 'responsable', 'admin'];
    if (!rolesValidos.includes(rol)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    const result = await pool.query(
      'UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre_completo, email, rol, activo',
      [rol, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: 'Rol actualizado correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/admin/usuarios/:id/estatus
// =============================================
router.patch('/usuarios/:id/estatus', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      res.status(400).json({ error: 'El campo activo debe ser true o false' });
      return;
    }

    const result = await pool.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, nombre_completo, email, rol, activo',
      [activo, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`, usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al cambiar estatus:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/admin/bodegas-pendientes
// =============================================
router.get('/bodegas-pendientes', authMiddleware, soloAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT b.*, r.nombre as region_nombre,
             u.nombre_completo as creado_por_nombre
      FROM bodegas b
      LEFT JOIN regiones r ON b.region_id = r.id
      LEFT JOIN usuarios u ON b.creado_por = u.id
      WHERE b.estatus = 'pendiente'
      ORDER BY b.fecha_creacion DESC
    `);
    res.json({ bodegas: result.rows });
  } catch (error) {
    console.error('Error al obtener bodegas pendientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
