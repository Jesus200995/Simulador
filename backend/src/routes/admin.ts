import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
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
      SELECT id, nombre_completo, email, curp, rol, activo, created_at as fecha_registro
      FROM usuarios
      ORDER BY created_at DESC
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

    const rolesValidos = ['productor', 'supervisor', 'bodeguero', 'responsable', 'admin'];
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

// =============================================
// POST /api/admin/crear-usuario
// =============================================
router.post('/crear-usuario', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, curp, nombre_completo, password, telefono, rol } = req.body;

    if (!email || !curp || !nombre_completo || !password || !telefono || !rol) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    const rolesValidos = ['productor', 'supervisor', 'bodeguero', 'responsable', 'admin'];
    if (!rolesValidos.includes(rol)) {
      res.status(400).json({ error: 'Rol no válido' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const curpUpper = curp.toUpperCase().trim();
    const emailLower = email.toLowerCase().trim();

    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR curp = $2',
      [emailLower, curpUpper]
    );
    if (existente.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o CURP' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nombreNorm = nombre_completo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

    const result = await pool.query(
      `INSERT INTO usuarios (email, curp, nombre_completo, password_hash, telefono, rol, activo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, curp, nombre_completo, telefono, rol, activo, created_at as fecha_registro`,
      [emailLower, curpUpper, nombreNorm, passwordHash, telefono.replace(/[\s\-\(\)]/g, ''), rol]
    );

    res.status(201).json({ message: 'Usuario creado exitosamente', usuario: result.rows[0] });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o CURP' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PUT /api/admin/usuarios/:id - Edit user
// =============================================
router.put('/usuarios/:id', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, curp, telefono } = req.body;

    if (!nombre_completo && !email && !curp && !telefono) {
      res.status(400).json({ error: 'Debe enviar al menos un campo para actualizar' });
      return;
    }

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (nombre_completo) { sets.push(`nombre_completo = $${idx++}`); params.push(nombre_completo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()); }
    if (email) { sets.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()); }
    if (curp) { sets.push(`curp = $${idx++}`); params.push(curp.toUpperCase().trim()); }
    if (telefono) { sets.push(`telefono = $${idx++}`); params.push(telefono.replace(/\D/g, '')); }

    params.push(id);
    const result = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, nombre_completo, email, curp, telefono, rol, activo, created_at as fecha_registro`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: 'Usuario actualizado correctamente', usuario: result.rows[0] });
  } catch (error: any) {
    console.error('Error al editar usuario:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o CURP' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// DELETE /api/admin/usuarios/:id
// =============================================
router.delete('/usuarios/:id', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (Number(id) === req.user!.userId) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre_completo',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: `Usuario "${result.rows[0].nombre_completo}" eliminado correctamente` });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    if (error.code === '23503') {
      res.status(409).json({ error: 'No se puede eliminar: el usuario tiene registros asociados. Desactívalo en su lugar.' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
