import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function adminOnly(req: AuthRequest, res: Response): boolean {
  if (req.user!.rol !== 'admin' && req.user!.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso restringido a administradores' });
    return false;
  }
  return true;
}

// GET /api/dashboard/admin/resumen — KPIs principales
router.get('/resumen', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [productores, ups, superficie, produccion, bodegas, alertas, ciclosActivos, supervisores] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM producer`),
      pool.query(`SELECT COUNT(*)::int AS total FROM up`),
      pool.query(`
        SELECT COALESCE(SUM(cc.area_sown_ha), 0)::numeric(12,2) AS total_ha
        FROM cycle_crop cc
        JOIN cycle c ON c.cycle_id = cc.cycle_id
        WHERE c.cycle_year = EXTRACT(YEAR FROM NOW())::int
      `),
      pool.query(`
        SELECT COALESCE(SUM(ec.produccion_estimada_ton), 0)::numeric(12,2) AS total_ton
        FROM estimacion_cosecha ec
        JOIN cycle c ON c.cycle_id = ec.ciclo_id
        WHERE c.cycle_year = EXTRACT(YEAR FROM NOW())::int
      `),
      pool.query(`SELECT COUNT(*)::int AS total FROM bodegas WHERE estatus = 'aprobada' AND activo = true`),
      pool.query(`SELECT COUNT(*)::int AS total FROM alertas WHERE estado_alerta = 'pendiente'`),
      pool.query(`
        SELECT COUNT(DISTINCT c.cycle_id)::int AS total
        FROM cycle c
        WHERE c.cycle_year = EXTRACT(YEAR FROM NOW())::int
      `),
      pool.query(`SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'supervisor' AND activo = true`),
    ]);

    res.json({
      productores: productores.rows[0].total,
      ups: ups.rows[0].total,
      superficie_ha: parseFloat(superficie.rows[0].total_ha),
      produccion_estimada_ton: parseFloat(produccion.rows[0].total_ton),
      bodegas_activas: bodegas.rows[0].total,
      alertas_pendientes: alertas.rows[0].total,
      ciclos_activos: ciclosActivos.rows[0].total,
      supervisores_activos: supervisores.rows[0].total,
    });
  } catch (error) {
    console.error('Error dashboard resumen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/produccion — Producción por estado, ciclo, cultivo
router.get('/produccion', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [porEstado, porCiclo, porAnio, sinCiclo] = await Promise.all([
      pool.query(`
        SELECT
          u.state_name AS estado,
          COUNT(DISTINCT u.up_id)::int AS ups,
          COUNT(DISTINCT cc.cycle_crop_id)::int AS cultivos,
          COALESCE(SUM(cc.area_sown_ha), 0)::numeric(10,2) AS area_ha,
          COALESCE(SUM(ec.produccion_estimada_ton), 0)::numeric(10,2) AS produccion_ton
        FROM up u
        LEFT JOIN cycle c ON c.up_id = u.up_id
        LEFT JOIN cycle_crop cc ON cc.cycle_id = c.cycle_id
        LEFT JOIN estimacion_cosecha ec ON ec.up_id = u.up_id AND ec.ciclo_id = c.cycle_id
        WHERE u.state_name IS NOT NULL
        GROUP BY u.state_name
        ORDER BY area_ha DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT
          c.cycle_type,
          c.cycle_year,
          COUNT(DISTINCT c.cycle_id)::int AS ciclos,
          COUNT(DISTINCT cc.cycle_crop_id)::int AS cultivos,
          COALESCE(SUM(cc.area_sown_ha), 0)::numeric(10,2) AS area_ha
        FROM cycle c
        LEFT JOIN cycle_crop cc ON cc.cycle_id = c.cycle_id
        GROUP BY c.cycle_type, c.cycle_year
        ORDER BY c.cycle_year DESC, c.cycle_type
        LIMIT 20
      `),
      pool.query(`
        SELECT
          c.cycle_year,
          COUNT(DISTINCT c.cycle_id)::int AS ciclos,
          COUNT(DISTINCT u.up_id)::int AS ups,
          COALESCE(SUM(cc.area_sown_ha), 0)::numeric(10,2) AS area_ha
        FROM cycle c
        JOIN up u ON u.up_id = c.up_id
        LEFT JOIN cycle_crop cc ON cc.cycle_id = c.cycle_id
        GROUP BY c.cycle_year
        ORDER BY c.cycle_year DESC
        LIMIT 6
      `),
      pool.query(`
        SELECT COUNT(*)::int AS ups_sin_ciclo
        FROM up u
        WHERE NOT EXISTS (SELECT 1 FROM cycle c WHERE c.up_id = u.up_id)
      `),
    ]);

    res.json({
      por_estado: porEstado.rows,
      por_ciclo: porCiclo.rows,
      por_anio: porAnio.rows,
      ups_sin_ciclo: sinCiclo.rows[0].ups_sin_ciclo,
    });
  } catch (error) {
    console.error('Error dashboard producción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/infraestructura — Bodegas, capacidad, inventario
router.get('/infraestructura', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [porEstado, capacidadTotal, inventarioActual, topBodegas] = await Promise.all([
      pool.query(`
        SELECT
          estado,
          COUNT(*)::int AS total_bodegas,
          COALESCE(SUM(capacidad_toneladas), 0)::numeric(12,2) AS capacidad_ton
        FROM bodegas
        WHERE estatus = 'aprobada' AND activo = true
        GROUP BY estado
        ORDER BY capacidad_ton DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS bodegas_aprobadas,
          COALESCE(SUM(capacidad_toneladas), 0)::numeric(12,2) AS capacidad_total_ton
        FROM bodegas
        WHERE estatus = 'aprobada' AND activo = true
      `),
      pool.query(`
        SELECT COALESCE(SUM(i.volumen_almacenamiento), 0)::numeric(12,2) AS stock_actual_ton
        FROM inventarios i
        JOIN (
          SELECT bodega_id, MAX(fecha) AS max_fecha
          FROM inventarios
          GROUP BY bodega_id
        ) latest ON latest.bodega_id = i.bodega_id AND latest.max_fecha = i.fecha
        JOIN bodegas b ON b.id = i.bodega_id
        WHERE b.estatus = 'aprobada' AND b.activo = true
      `),
      pool.query(`
        SELECT
          b.nombre,
          b.estado,
          b.municipio,
          b.capacidad_toneladas,
          COALESCE(
            (SELECT i.volumen_almacenamiento FROM inventarios i
             WHERE i.bodega_id = b.id ORDER BY i.fecha DESC LIMIT 1), 0
          )::numeric(10,2) AS stock_actual
        FROM bodegas b
        WHERE b.estatus = 'aprobada' AND b.activo = true
        ORDER BY b.capacidad_toneladas DESC
        LIMIT 10
      `),
    ]);

    const cap = parseFloat(capacidadTotal.rows[0].capacidad_total_ton) || 0;
    const stock = parseFloat(inventarioActual.rows[0].stock_actual_ton) || 0;
    const ocupacion_pct = cap > 0 ? Math.round((stock / cap) * 100) : 0;

    res.json({
      por_estado: porEstado.rows,
      bodegas_aprobadas: capacidadTotal.rows[0].bodegas_aprobadas,
      capacidad_total_ton: cap,
      stock_actual_ton: stock,
      ocupacion_pct,
      top_bodegas: topBodegas.rows,
    });
  } catch (error) {
    console.error('Error dashboard infraestructura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/precios — Comparación de 3 tipos de precio
router.get('/precios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [promedios, recientes, tendencia] = await Promise.all([
      pool.query(`
        SELECT
          tipo_precio,
          tipo_maiz,
          AVG(precio)::numeric(10,2) AS promedio,
          MIN(precio)::numeric(10,2) AS minimo,
          MAX(precio)::numeric(10,2) AS maximo,
          COUNT(*)::int AS registros,
          MAX(fecha) AS ultima_fecha
        FROM precios
        WHERE fecha >= NOW() - INTERVAL '30 days'
          AND tipo_precio IN ('observado', 'bodega', 'mercado_internacional')
        GROUP BY tipo_precio, tipo_maiz
        ORDER BY tipo_precio, tipo_maiz
      `),
      pool.query(`
        SELECT DISTINCT ON (tipo_precio)
          tipo_precio,
          tipo_maiz,
          precio,
          fecha,
          estado,
          municipio
        FROM precios
        WHERE tipo_precio IN ('observado', 'bodega', 'mercado_internacional')
        ORDER BY tipo_precio, fecha DESC
      `),
      pool.query(`
        SELECT
          DATE_TRUNC('week', fecha)::date AS semana,
          tipo_precio,
          AVG(precio)::numeric(10,2) AS promedio
        FROM precios
        WHERE fecha >= NOW() - INTERVAL '90 days'
          AND tipo_precio IN ('observado', 'bodega', 'mercado_internacional')
        GROUP BY semana, tipo_precio
        ORDER BY semana, tipo_precio
      `),
    ]);

    res.json({
      promedios: promedios.rows,
      recientes: recientes.rows,
      tendencia: tendencia.rows,
    });
  } catch (error) {
    console.error('Error dashboard precios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/alertas — Alertas por severidad, estado, tipo
router.get('/alertas', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [porNivel, porEstado, porTipo, recientes, tendencia] = await Promise.all([
      pool.query(`
        SELECT nivel_alerta, COUNT(*)::int AS total
        FROM alertas
        GROUP BY nivel_alerta
        ORDER BY CASE nivel_alerta WHEN 'critico' THEN 1 WHEN 'alto' THEN 2 WHEN 'medio' THEN 3 WHEN 'bajo' THEN 4 ELSE 5 END
      `),
      pool.query(`
        SELECT estado_alerta, COUNT(*)::int AS total
        FROM alertas
        GROUP BY estado_alerta
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT tipo_alerta, COUNT(*)::int AS total, nivel_alerta
        FROM alertas
        WHERE estado_alerta = 'pendiente'
        GROUP BY tipo_alerta, nivel_alerta
        ORDER BY total DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT
          a.id, a.tipo_alerta, a.nivel_alerta, a.estado_alerta, a.fecha_alerta,
          p.nombres, p.apellido_paterno,
          u.up_name, u.state_name
        FROM alertas a
        LEFT JOIN producer p ON p.producer_id = a.producer_id
        LEFT JOIN up u ON u.up_id = a.up_id
        WHERE a.estado_alerta = 'pendiente'
        ORDER BY
          CASE a.nivel_alerta WHEN 'critico' THEN 1 WHEN 'alto' THEN 2 WHEN 'medio' THEN 3 ELSE 4 END,
          a.fecha_alerta DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT
          DATE_TRUNC('day', fecha_alerta)::date AS dia,
          COUNT(*)::int AS total,
          COUNT(CASE WHEN nivel_alerta IN ('alto','critico') THEN 1 END)::int AS criticas
        FROM alertas
        WHERE fecha_alerta >= NOW() - INTERVAL '30 days'
        GROUP BY dia
        ORDER BY dia
      `),
    ]);

    res.json({
      por_nivel: porNivel.rows,
      por_estado: porEstado.rows,
      por_tipo: porTipo.rows,
      recientes_pendientes: recientes.rows,
      tendencia_diaria: tendencia.rows,
    });
  } catch (error) {
    console.error('Error dashboard alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/operacion — Supervisores, calidad de datos, actividad
router.get('/operacion', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [supervisores, calidadDatos, visitasRecientes, productoresRol, registrosRecientes] = await Promise.all([
      pool.query(`
        SELECT
          u.id AS supervisor_id,
          u.nombre_completo,
          u.email,
          COUNT(DISTINCT sp.producer_id)::int AS productores_asignados,
          COUNT(DISTINCT sv.id)::int AS visitas_mes
        FROM usuarios u
        LEFT JOIN supervisor_productores sp ON sp.supervisor_id = u.id
        LEFT JOIN seguimiento_visitas sv ON sv.usuario_captura = u.id
          AND sv.fecha_visita >= NOW() - INTERVAL '30 days'
        WHERE u.rol = 'supervisor' AND u.activo = true
        GROUP BY u.id, u.nombre_completo, u.email
        ORDER BY productores_asignados DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_ups,
          COUNT(CASE WHEN u.up_name IS NOT NULL THEN 1 END)::int AS con_nombre,
          COUNT(CASE WHEN u.area_ha_calc > 0 THEN 1 END)::int AS con_area,
          COUNT(CASE WHEN EXISTS(SELECT 1 FROM cycle c WHERE c.up_id = u.up_id) THEN 1 END)::int AS con_ciclo,
          COUNT(CASE WHEN EXISTS(SELECT 1 FROM cycle_crop cc JOIN cycle c ON c.cycle_id = cc.cycle_id WHERE c.up_id = u.up_id) THEN 1 END)::int AS con_cultivo
        FROM up u
      `),
      pool.query(`
        SELECT
          sv.id, sv.fecha_visita, sv.etapa_cultivo AS tipo_visita,
          p.nombres, p.apellido_paterno,
          u.up_name,
          usu.nombre_completo AS tecnico
        FROM seguimiento_visitas sv
        JOIN up u ON u.up_id = sv.up_id
        JOIN producer p ON p.producer_id = sv.producer_id
        LEFT JOIN usuarios usu ON usu.id = sv.usuario_captura
        ORDER BY sv.fecha_visita DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT rol, COUNT(*)::int AS total
        FROM usuarios
        WHERE activo = true
        GROUP BY rol
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT
          DATE_TRUNC('day', created_at)::date AS dia,
          COUNT(*)::int AS nuevos_productores
        FROM producer
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY dia
        ORDER BY dia
      `),
    ]);

    const cd = calidadDatos.rows[0];
    const total = cd.total_ups || 1;
    const calidad = {
      total_ups: cd.total_ups,
      con_nombre_pct: Math.round((cd.con_nombre / total) * 100),
      con_area_pct: Math.round((cd.con_area / total) * 100),
      con_ciclo_pct: Math.round((cd.con_ciclo / total) * 100),
      con_cultivo_pct: Math.round((cd.con_cultivo / total) * 100),
    };

    res.json({
      supervisores: supervisores.rows,
      calidad_datos: calidad,
      visitas_recientes: visitasRecientes.rows,
      usuarios_por_rol: productoresRol.rows,
      registro_diario: registrosRecientes.rows,
    });
  } catch (error) {
    console.error('Error dashboard operación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/dashboard/admin/mapa — Datos geográficos para el mapa
router.get('/mapa', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!adminOnly(req, res)) return;
  try {
    const [upsGeo, bodegasGeo, porEstado] = await Promise.all([
      pool.query(`
        SELECT
          u.up_id, u.up_name, u.state_name, u.municipality_name,
          u.area_ha_calc,
          ST_X(u.centroid) AS lng, ST_Y(u.centroid) AS lat
        FROM up u
        WHERE u.centroid IS NOT NULL
        LIMIT 500
      `),
      pool.query(`
        SELECT
          b.id, b.nombre, b.estado, b.municipio,
          b.latitud AS lat, b.longitud AS lng,
          b.capacidad_toneladas
        FROM bodegas b
        WHERE b.estatus = 'aprobada' AND b.activo = true
          AND b.latitud IS NOT NULL AND b.longitud IS NOT NULL
        LIMIT 200
      `),
      pool.query(`
        SELECT
          u.state_name AS estado,
          COUNT(DISTINCT u.up_id)::int AS ups,
          COUNT(DISTINCT p.producer_id)::int AS productores,
          COALESCE(SUM(u.area_ha_calc), 0)::numeric(10,2) AS superficie_ha,
          COALESCE(SUM(ec.produccion_estimada_ton), 0)::numeric(10,2) AS produccion_ton
        FROM up u
        JOIN producer p ON p.producer_id = u.producer_id
        LEFT JOIN cycle c ON c.up_id = u.up_id
        LEFT JOIN estimacion_cosecha ec ON ec.up_id = u.up_id AND ec.ciclo_id = c.cycle_id
        WHERE u.state_name IS NOT NULL
        GROUP BY u.state_name
        ORDER BY produccion_ton DESC
      `),
    ]);

    res.json({
      ups: upsGeo.rows,
      bodegas: bodegasGeo.rows,
      por_estado: porEstado.rows,
    });
  } catch (error) {
    console.error('Error dashboard mapa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
