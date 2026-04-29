import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/bodegas/catalogos - Regiones, Estados, Municipios
// =============================================
router.get('/catalogos', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [regiones, estados, municipios, ddrs] = await Promise.all([
      pool.query('SELECT id, nombre FROM regiones ORDER BY nombre'),
      pool.query('SELECT DISTINCT estado, region_id FROM bodegas WHERE estado IS NOT NULL ORDER BY estado'),
      pool.query('SELECT DISTINCT municipio, estado FROM bodegas WHERE municipio IS NOT NULL ORDER BY municipio'),
      pool.query('SELECT DISTINCT ddr, estado FROM bodegas WHERE ddr IS NOT NULL AND ddr != \'\' ORDER BY ddr'),
    ]);
    res.json({
      regiones: regiones.rows,
      estados: estados.rows,
      municipios: municipios.rows,
      ddrs: ddrs.rows,
    });
  } catch (error) {
    console.error('Error al obtener catalogos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/bodegas - Filtrar bodegas + KPI agregado
// =============================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { region_id, estado, municipio, q } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (region_id) {
      conditions.push(`b.region_id = $${idx++}`);
      params.push(Number(region_id));
    }
    if (estado) {
      conditions.push(`b.estado = $${idx++}`);
      params.push(estado);
    }
    if (municipio) {
      conditions.push(`b.municipio = $${idx++}`);
      params.push(municipio);
    }
    if (q) {
      conditions.push(`(b.nombre ILIKE $${idx} OR b.clave ILIKE $${idx} OR b.estado ILIKE $${idx} OR b.municipio ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const bodegasQuery = `
      SELECT b.*, r.nombre as region_nombre
      FROM bodegas b
      LEFT JOIN regiones r ON b.region_id = r.id
      ${where}
      ORDER BY b.nombre ASC
    `;

    const kpiQuery = `
      SELECT
        COUNT(*)::int                                     AS total_bodegas,
        COALESCE(SUM(b.capacidad_toneladas), 0)::float   AS total_capacidad,
        COUNT(DISTINCT b.estado)::int                    AS total_estados,
        COUNT(DISTINCT b.municipio)::int                 AS total_municipios,
        COUNT(*) FILTER (WHERE b.activo = true)::int     AS total_inventarios
      FROM bodegas b
      ${where}
    `;

    const [bodegasResult, kpiResult] = await Promise.all([
      pool.query(bodegasQuery, params),
      pool.query(kpiQuery, params),
    ]);

    res.json({
      bodegas: bodegasResult.rows,
      kpi: kpiResult.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener bodegas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/bodegas - Crear nueva bodega
// =============================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      clave, nombre, estado, municipio, localidad, direccion,
      latitud, longitud, capacidad_ton,
    } = req.body;

    if (!nombre || !estado || !municipio || latitud == null || longitud == null) {
      res.status(400).json({ error: 'Campos obligatorios: nombre, estado, municipio, latitud, longitud' });
      return;
    }

    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      res.status(400).json({ error: 'Coordenadas inválidas' });
      return;
    }

    // Determinar estatus según rol
    const userResult = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.user?.userId]);
    const rol = userResult.rows[0]?.rol || 'bodeguero';
    const estatus = ['admin', 'responsable'].includes(rol) ? 'aprobada' : 'pendiente';

    const result = await pool.query(`
      INSERT INTO bodegas (
        clave, nombre, estado, municipio, localidad, direccion,
        latitud, longitud, capacidad_ton,
        estatus, creado_por, fecha_creacion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      clave || null, nombre, estado, municipio, localidad || null, direccion || null,
      latitud, longitud, capacidad_ton || 0,
      estatus, req.user?.userId,
    ]);

    res.status(201).json({ message: 'Bodega registrada exitosamente', bodega: result.rows[0] });
  } catch (error: any) {
    console.error('Error al crear bodega:', error);
    res.status(500).json({ error: 'Error al crear bodega: ' + (error.message || '') });
  }
});

// =============================================
// GET /api/bodegas/:id - Detalle de bodega
// =============================================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, r.nombre as region_nombre
       FROM bodegas b
       LEFT JOIN regiones r ON b.region_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bodega no encontrada' });
      return;
    }

    res.json({ bodega: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener bodega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/bodegas/:id/aprobar
// =============================================
router.patch('/:id/aprobar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Solo el admin puede aprobar bodegas' });
      return;
    }
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bodegas SET estatus = 'aprobada' WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bodega no encontrada' });
      return;
    }
    res.json({ message: 'Bodega aprobada', bodega: result.rows[0] });
  } catch (error) {
    console.error('Error al aprobar bodega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/bodegas/:id/rechazar
// =============================================
router.patch('/:id/rechazar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Solo el admin puede rechazar bodegas' });
      return;
    }
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bodegas SET estatus = 'rechazada' WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bodega no encontrada' });
      return;
    }
    res.json({ message: 'Bodega rechazada', bodega: result.rows[0] });
  } catch (error) {
    console.error('Error al rechazar bodega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
