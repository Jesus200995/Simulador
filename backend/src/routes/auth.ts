import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RegistroPayload, LoginPayload } from '../types';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validar CURP mexicano
function validarCURP(curp: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  return curpRegex.test(curp);
}

// Validar email
function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar teléfono (10 dígitos México)
function validarTelefono(telefono: string): boolean {
  const telRegex = /^\d{10}$/;
  return telRegex.test(telefono.replace(/[\s\-\(\)]/g, ''));
}

// Normalizar nombre: mayúsculas sin tildes
function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// =============================================
// POST /api/auth/registro
// =============================================
router.post('/registro', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, curp, nombre_completo, password, telefono, rol, state_id, municipality_id }: RegistroPayload = req.body;

    // Validaciones
    if (!email || !curp || !nombre_completo || !password || !telefono || !rol) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    if (!validarEmail(email)) {
      res.status(400).json({ error: 'Formato de email inválido' });
      return;
    }

    const curpUpper = curp.toUpperCase();
    if (!validarCURP(curpUpper)) {
      res.status(400).json({ error: 'Formato de CURP inválido. Debe ser 18 caracteres alfanuméricos' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
    if (!validarTelefono(telefonoLimpio)) {
      res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' });
      return;
    }

    const rolesValidos = ['tecnico', 'supervisor', 'responsable', 'admin'];
    if (!rolesValidos.includes(rol)) {
      res.status(400).json({ error: 'Rol no válido' });
      return;
    }

    // Verificar si ya existe
    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR curp = $2',
      [email.toLowerCase().trim(), curpUpper]
    );

    if (existente.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o CURP' });
      return;
    }

    // Hash de contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Normalizar nombre
    const nombreNormalizado = normalizarNombre(nombre_completo);

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO usuarios (email, curp, nombre_completo, password_hash, telefono, rol, state_id, municipality_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, curp, nombre_completo, telefono, rol, state_id, municipality_id, created_at`,
      [email.toLowerCase().trim(), curpUpper, nombreNormalizado, passwordHash, telefonoLimpio, rol, state_id || null, municipality_id || null]
    );

    const usuario = result.rows[0];

    // Generar JWT
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, rol: usuario.rol },
      secret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        curp: usuario.curp,
        nombre_completo: usuario.nombre_completo,
        telefono: usuario.telefono,
        rol: usuario.rol,
        state_id: usuario.state_id,
        municipality_id: usuario.municipality_id,
      },
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o CURP' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/login
// =============================================
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginPayload = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      return;
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const usuario = result.rows[0];

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    // Generar JWT
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, rol: usuario.rol },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        curp: usuario.curp,
        nombre_completo: usuario.nombre_completo,
        telefono: usuario.telefono,
        rol: usuario.rol,
        state_id: usuario.state_id,
        municipality_id: usuario.municipality_id,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/auth/perfil
// =============================================
router.get('/perfil', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, curp, nombre_completo, telefono, rol, state_id, municipality_id, created_at FROM usuarios WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/auth/states
// =============================================
router.get('/states', async (req: Request, res: Response): Promise<void> => {
  try {
    const states = await pool.query('SELECT state_id, name FROM geo_state ORDER BY name');
    res.json({ states: states.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estados' });
  }
});

// =============================================
// GET /api/auth/municipalities
// =============================================
router.get('/municipalities', async (req: Request, res: Response): Promise<void> => {
  try {
    const { state_id } = req.query;
    if (!state_id) {
      res.status(400).json({ error: 'Se requiere state_id' });
      return;
    }
    const result = await pool.query(
      'SELECT municipality_id, name FROM geo_municipality WHERE state_id = $1 ORDER BY name',
      [state_id]
    );
    res.json({ municipalities: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener municipios' });
  }
});

export default router;
