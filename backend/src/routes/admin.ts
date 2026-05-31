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
// POST /api/admin/registro-admin
// Registro de nuevo admin con código de acceso corporativo
// =============================================
router.post('/registro-admin', async (req: any, res: Response): Promise<void> => {
  try {
    const { nombre_completo, email, password, codigo_acceso } = req.body;

    if (!nombre_completo || !email || !password || !codigo_acceso) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    // Verificar código de acceso corporativo (almacenado en env o en tabla configuracion)
    const CODIGO_ADMIN = process.env.ADMIN_REGISTRO_CODIGO;
    if (!CODIGO_ADMIN) {
      throw new Error('FATAL: ADMIN_REGISTRO_CODIGO no definida en variables de entorno.');
    }
    if (codigo_acceso.trim().toUpperCase() !== CODIGO_ADMIN.toUpperCase()) {
      res.status(403).json({ error: 'Código de acceso corporativo incorrecto' });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const nombreNorm = nombre_completo.trim();

    // Verificar si ya existe
    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailLower]);
    if (existente.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO usuarios (email, nombre_completo, password_hash, rol, activo)
       VALUES ($1, $2, $3, 'admin', true)
       RETURNING id, email, nombre_completo, rol`,
      [emailLower, nombreNorm, passwordHash]
    );

    res.status(201).json({
      message: 'Cuenta administrativa creada exitosamente',
      usuario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al registrar admin:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// =============================================
// GET /api/admin/usuarios
// Devuelve todos los productores con su estado_validacion, UP y datos del productor
// =============================================
router.get('/usuarios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  try {
    const { estado_validacion, estado, q, tipo_registro, rol } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (estado_validacion) { conditions.push(`p.estado_validacion = $${idx++}`); params.push(estado_validacion); }
    if (tipo_registro) { conditions.push(`p.tipo_registro = $${idx++}`); params.push(tipo_registro); }
    if (estado) { conditions.push(`up.state_name = $${idx++}`); params.push(estado); }
    // Filtro por rol — busca en tabla usuarios vinculada por curp
    if (rol) { conditions.push(`u.rol = $${idx++}`); params.push(rol); }
    if (q) {
      conditions.push(`(p.nombres ILIKE $${idx} OR p.apellido_paterno ILIKE $${idx} OR p.curp ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        p.producer_id AS id,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        p.curp,
        p.phone AS telefono,
        p.correo,
        p.estado_validacion,
        p.tipo_registro,
        p.created_at AS fecha_registro,
        p.programas_beneficiario,
        p.nota_admin,
        up.state_name AS estado_up,
        up.municipality_name AS municipio_up,
        up.up_name AS nombre_up,
        up.area_ha_calc AS superficie_ha,
        u.rol AS rol_sistema
      FROM producer p
      LEFT JOIN up ON up.producer_id = p.producer_id
      LEFT JOIN usuarios u ON u.curp = p.curp
      ${where}
      ORDER BY p.created_at DESC
      LIMIT 500
    `, params);
    res.json({ usuarios: result.rows, productores: result.rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/admin/usuarios/estados-disponibles
// =============================================
router.get('/usuarios/estados-disponibles', authMiddleware, soloAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT up.state_name AS estado
      FROM producer p
      JOIN up ON up.producer_id = p.producer_id
      WHERE up.state_name IS NOT NULL
        AND up.state_name != ''
      ORDER BY estado ASC
    `);
    res.json({ 
      estados: result.rows.map(r => r.estado) 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estados' });
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
// Maneja tanto activo (usuarios) como estado_validacion (productores)
// =============================================
router.patch('/usuarios/:id/estatus', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.rol !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    return;
  }
  try {
    const { id } = req.params;
    const { activo, estado_validacion, nota } = req.body;

    // Si viene estado_validacion, actualizar en tabla producer (aprobar/rechazar productor)
    if (estado_validacion !== undefined) {
      // Persistir nota_admin si viene en el body
      const result = await pool.query(
        `UPDATE producer
         SET estado_validacion = $1,
             nota_admin = CASE WHEN $3::text IS NOT NULL AND $3 != '' THEN $3::text ELSE nota_admin END
         WHERE producer_id = $2
         RETURNING producer_id AS id, nombres, apellido_paterno, estado_validacion, nota_admin`,
        [estado_validacion, id, nota || null]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Productor no encontrado' });
        return;
      }
      res.json({ message: `Productor ${estado_validacion}`, productor: result.rows[0] });
      return;
    }

    // Si viene activo, actualizar en tabla usuarios
    if (typeof activo !== 'boolean') {
      res.status(400).json({ error: 'Debe enviar activo (boolean) o estado_validacion (string)' });
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


// =============================================
// GET /api/admin/usuarios/:id — Detalle de un productor
// =============================================
router.get('/usuarios/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        p.producer_id AS id,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        p.curp,
        p.phone AS telefono,
        p.correo,
        p.estado_validacion,
        p.tipo_registro,
        p.created_at AS fecha_registro,
        p.programas_beneficiario,
        up.state_name AS estado_up,
        up.municipality_name AS municipio_up,
        up.up_name AS nombre_up,
        up.area_ha_calc AS superficie_ha,
        up.lat,
        up.lng
      FROM producer p
      LEFT JOIN up ON up.producer_id = p.producer_id
      WHERE p.producer_id = $1
    `, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }
    res.json({ productor: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/admin/actividad-reciente
// =============================================
router.get('/actividad-reciente', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  try {
    // Combinamos eventos de diferentes tablas
    const productoresR = pool.query(`
      SELECT
        'validacion' AS tipo,
        CONCAT(p.nombres, ' ', p.apellido_paterno, ' (Tipo ', COALESCE(p.tipo_registro, 'B'), ') registrado') AS descripcion,
        'Sistema' AS actor,
        p.created_at AS fecha,
        CONCAT('/admin/productores/', p.producer_id) AS link
      FROM producer p
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const alertasR = pool.query(`
      SELECT
        'alerta' AS tipo,
        COALESCE(a.descripcion, a.tipo_alerta) AS descripcion,
        'Sistema' AS actor,
        a.fecha_alerta AS fecha,
        '/admin/alertas' AS link
      FROM alertas a
      ORDER BY a.fecha_alerta DESC
      LIMIT 10
    `).catch(() => ({ rows: [] as any[] }));

    const [prod, alert] = await Promise.all([productoresR, alertasR]);
    const eventos = [...prod.rows, ...(alert as any).rows]
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 20);

    res.json({ eventos });
  } catch (error) {
    console.error('Error actividad-reciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/admin/ventanillas/resumen
// Tabla resumen de ventanillas con apoyos solicitados y atendidos
// =============================================
router.get('/ventanillas/resumen', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  try {
    const result = await pool.query(`
      SELECT
        v.id AS ventanilla_id,
        b.nombre AS bodega_nombre,
        b.estado AS bodega_estado,
        v.tipo,
        v.nombre_enlace_agricultura,
        v.telefono_enlace,
        v.correo_enlace,
        COUNT(sa.id) AS apoyos_solicitados,
        COUNT(sa.id) FILTER (WHERE sa.estado IN ('canalizada', 'cerrada')) AS apoyos_atendidos
      FROM ventanillas v
      JOIN bodegas b ON v.bodega_id = b.id
      LEFT JOIN solicitudes_apoyo sa ON sa.ventanilla_id = v.id
      GROUP BY v.id, b.nombre, b.estado, v.tipo, v.nombre_enlace_agricultura, v.telefono_enlace, v.correo_enlace
      ORDER BY b.estado, b.nombre
    `);
    res.json({ ventanillas: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error GET /admin/ventanillas/resumen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
