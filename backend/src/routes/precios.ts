import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// GET /api/precios — Listar con filtros
// =============================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tipo_precio, fuente, tipo_maiz, estado, municipio, fecha_inicio, fecha_fin } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (tipo_precio) {
      conditions.push(`p.tipo_precio = $${idx++}`);
      params.push(tipo_precio);
    }
    if (fuente) {
      conditions.push(`p.fuente = $${idx++}`);
      params.push(fuente);
    }
    if (tipo_maiz) {
      conditions.push(`p.tipo_maiz = $${idx++}`);
      params.push(tipo_maiz);
    }
    if (estado) {
      conditions.push(`p.estado = $${idx++}`);
      params.push(estado);
    }
    if (municipio) {
      conditions.push(`p.municipio = $${idx++}`);
      params.push(municipio);
    }
    if (fecha_inicio) {
      conditions.push(`p.fecha >= $${idx++}`);
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      conditions.push(`p.fecha <= $${idx++}`);
      params.push(fecha_fin);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        p.*,
        i.nombre AS infraestructura_nombre
      FROM precios p
      LEFT JOIN infraestructura i ON p.bodega_id = i.id
      ${where}
      ORDER BY p.fecha DESC, p.created_at DESC
      LIMIT 500
    `, params);

    res.json({ precios: result.rows });
  } catch (error) {
    console.error('Error al obtener precios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/precios — Registrar precio
// =============================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      tipo_precio,
      fuente,
      tipo_maiz,
      fecha,
      precio,
      estado,
      municipio,
      observaciones,
      // internacional
      valor_origen,
      unidad_origen,
      tipo_cambio,
      // gobierno
      programa,
      // referencias opcionales
      bodega_id,
    } = req.body;

    if (!tipo_precio || !tipo_maiz || !fecha || precio === undefined) {
      res.status(400).json({ error: 'Faltan campos requeridos: tipo_precio, tipo_maiz, fecha, precio' });
      return;
    }

    // Ensure columns exist before inserting
    const result = await pool.query(`
      INSERT INTO precios (
        tipo_precio, fuente, tipo_maiz, fecha, precio,
        estado, municipio, observaciones,
        valor_origen, unidad_origen, tipo_cambio,
        programa, bodega_id, usuario_captura, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, NOW()
      )
      RETURNING *
    `, [
      tipo_precio,
      fuente || null,
      tipo_maiz,
      fecha,
      precio,
      estado || null,
      municipio || null,
      observaciones || null,
      valor_origen || null,
      unidad_origen || null,
      tipo_cambio || null,
      programa || null,
      bodega_id || null,
      userId,
    ]);

    res.status(201).json({ mensaje: 'Precio registrado correctamente', precio: result.rows[0] });
  } catch (error) {
    console.error('Error al registrar precio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/precios/dashboard — KPIs y resumen
// =============================================
router.get('/dashboard', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [kpi, porTipo, ultimoInt, ultimoGob] = await Promise.all([
      pool.query(`
        SELECT
          ROUND(AVG(precio)::numeric, 2)  AS promedio,
          MAX(precio)                      AS maximo,
          MIN(precio)                      AS minimo,
          COUNT(*)::int                    AS total_registros
        FROM precios
        WHERE fecha >= NOW() - INTERVAL '90 days'
      `),
      pool.query(`
        SELECT
          tipo_maiz,
          ROUND(AVG(precio)::numeric, 2) AS promedio,
          MAX(precio)                    AS maximo,
          MIN(precio)                    AS minimo,
          COUNT(*)::int                  AS registros
        FROM precios
        WHERE fecha >= NOW() - INTERVAL '90 days'
        GROUP BY tipo_maiz
        ORDER BY tipo_maiz
      `),
      pool.query(`
        SELECT precio, tipo_maiz, fecha, valor_origen, unidad_origen, tipo_cambio
        FROM precios
        WHERE tipo_precio = 'mercado_internacional'
        ORDER BY fecha DESC
        LIMIT 1
      `),
      pool.query(`
        SELECT precio, tipo_maiz, fecha, programa
        FROM precios
        WHERE tipo_precio = 'gobierno'
        ORDER BY fecha DESC
        LIMIT 1
      `),
    ]);

    res.json({
      kpi: kpi.rows[0],
      por_tipo_maiz: porTipo.rows,
      ultimo_internacional: ultimoInt.rows[0] || null,
      ultimo_gobierno: ultimoGob.rows[0] || null,
    });
  } catch (error) {
    console.error('Error al obtener dashboard de precios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
