import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Helper: obtener coordenadas de la primera bodega del usuario ───
async function getBodegaRef(userId: number): Promise<{ id: number; longitud: number; latitud: number; estado: string } | null> {
  const r = await pool.query(
    `SELECT b.id, b.latitud, b.longitud, b.estado
     FROM bodegas b
     JOIN bodeguero_bodegas bb ON bb.bodega_id = b.id
     WHERE bb.usuario_id = $1 AND bb.estatus = 'aprobada'
       AND b.latitud IS NOT NULL AND b.longitud IS NOT NULL
     LIMIT 1`,
    [userId]
  );
  return r.rows[0] || null;
}

// ─── Helper: check if PostGIS is available ───
let _hasPostGIS: boolean | null = null;
async function hasPostGIS(): Promise<boolean> {
  if (_hasPostGIS !== null) return _hasPostGIS;
  try {
    await pool.query("SELECT PostGIS_Version()");
    _hasPostGIS = true;
  } catch { _hasPostGIS = false; }
  return _hasPostGIS;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/oferta/municipios — B-03: datos AGREGADOS por municipio
// Intenta usar disponibilidad_productor + PostGIS; fallback a cycle_crop
// ═══════════════════════════════════════════════════════════════
router.get('/municipios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { tipo_maiz, radio_km } = req.query;
  const userId = req.user!.userId;

  try {
    const bodegaRef = await getBodegaRef(userId);
    const postgis = await hasPostGIS();
    const radio = Number(radio_km) || 60;

    // ── Strategy A: disponibilidad_productor table + PostGIS ──
    const hasDispTable = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disponibilidad_productor') AS e"
    );
    if (hasDispTable.rows[0].e && bodegaRef && postgis) {
      try {
        const radioMetros = radio * 1000;
        let tipoFilter = '';
        const params: any[] = [bodegaRef.longitud, bodegaRef.latitud, radioMetros];
        if (tipo_maiz && tipo_maiz !== 'all') {
          params.push(tipo_maiz);
          tipoFilter = `AND dp.tipo_maiz = $${params.length}`;
        }

        let result = await pool.query(
          `SELECT
             COALESCE(u.municipality_name, 'Sin municipio') AS municipio,
             COALESCE(u.state_name, 'Sin estado') AS estado,
             COUNT(DISTINCT dp.producer_id) AS productores_disponibles,
             COALESCE(SUM(dp.volumen_estimado_ton), 0)::numeric(12,2) AS toneladas_estimadas,
             MODE() WITHIN GROUP (ORDER BY dp.ventana_venta) AS ventana_predominante,
             ROUND((MIN(ST_Distance(
               ST_SetSRID(ST_Point(COALESCE(u.longitud,0), COALESCE(u.latitud,0)), 4326)::geography,
               ST_SetSRID(ST_Point($1, $2), 4326)::geography
             )) / 1000)::numeric, 1) AS distancia_km
           FROM disponibilidad_productor dp
           JOIN up u ON u.up_id = dp.up_id
           WHERE dp.activa = TRUE
             AND dp.fecha_vencimiento >= CURRENT_DATE
             AND ST_DWithin(
               ST_SetSRID(ST_Point(COALESCE(u.longitud,0), COALESCE(u.latitud,0)), 4326)::geography,
               ST_SetSRID(ST_Point($1, $2), 4326)::geography,
               $3
             )
             ${tipoFilter}
           GROUP BY u.municipality_name, u.state_name
           HAVING COUNT(DISTINCT dp.producer_id) > 0
           ORDER BY distancia_km ASC
           LIMIT 50`,
          params
        );

        // Fallback: si hay menos de 3 resultados, ampliar al estado
        if (result.rows.length < 3) {
          const params2: any[] = [bodegaRef.estado];
          let tipoFilter2 = '';
          if (tipo_maiz && tipo_maiz !== 'all') {
            params2.push(tipo_maiz);
            tipoFilter2 = `AND dp.tipo_maiz = $${params2.length}`;
          }
          result = await pool.query(
            `SELECT
               COALESCE(u.municipality_name, 'Sin municipio') AS municipio,
               COALESCE(u.state_name, 'Sin estado') AS estado,
               COUNT(DISTINCT dp.producer_id) AS productores_disponibles,
               COALESCE(SUM(dp.volumen_estimado_ton), 0)::numeric(12,2) AS toneladas_estimadas,
               MODE() WITHIN GROUP (ORDER BY dp.ventana_venta) AS ventana_predominante,
               0 AS distancia_km
             FROM disponibilidad_productor dp
             JOIN up u ON u.up_id = dp.up_id
             WHERE dp.activa = TRUE
               AND dp.fecha_vencimiento >= CURRENT_DATE
               AND u.state_name ILIKE $1
               ${tipoFilter2}
             GROUP BY u.municipality_name, u.state_name
             HAVING COUNT(DISTINCT dp.producer_id) > 0
             ORDER BY productores_disponibles DESC
             LIMIT 50`,
            params2
          );
          res.json({ data: result.rows, fallback: true,
            mensaje: `Mostrando productores en todo el estado (${bodegaRef.estado}) porque no se encontraron suficientes en ${radio} km` });
          return;
        }

        res.json({ data: result.rows, fallback: false });
        return;
      } catch (_) {
        // PostGIS query failed — fall through to Strategy B
      }
    }

    // ── Strategy B: cycle_crop fallback (original approach) ──
    let where = `WHERE cy.cycle_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 1`;
    const params: any[] = [];

    if (tipo_maiz && tipo_maiz !== 'all') {
      params.push(tipo_maiz);
      where += ` AND (cc.variety_id = $${params.length} OR $${params.length}::text = 'all')`;
    }

    // If we have bodega coords, filter by state at minimum
    if (bodegaRef) {
      params.push(bodegaRef.estado);
      where += ` AND u.state_name ILIKE $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         COALESCE(u.municipality_name, u.municipality_id, 'Sin municipio') AS municipio,
         COALESCE(u.state_name, u.state_id, 'Sin estado') AS estado,
         COUNT(DISTINCT p.producer_id) AS productores_disponibles,
         COALESCE(SUM(cc.yield_expected), 0)::numeric(12,2) AS toneladas_estimadas,
         'esta_semana' AS ventana_predominante,
         0 AS distancia_km
       FROM up u
       JOIN producer p ON p.producer_id = u.producer_id
       JOIN cycle cy ON cy.up_id = u.up_id
       LEFT JOIN cycle_crop cc ON cc.cycle_id = cy.cycle_id AND cc.crop = 'maiz'
       ${where}
       GROUP BY u.municipality_name, u.municipality_id, u.state_name, u.state_id
       HAVING COUNT(DISTINCT p.producer_id) > 0
       ORDER BY productores_disponibles DESC
       LIMIT 50`,
      params
    );

    res.json({ data: result.rows, fallback: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/oferta/municipios/:municipio/interes — B-04
// Bodega marca interés en oferta de un municipio → notifica productores
// ═══════════════════════════════════════════════════════════════
router.post('/municipios/:municipio/interes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { municipio } = req.params;
  const { bodega_id, tipo_maiz, precio_ofrecido } = req.body;
  const userId = req.user!.userId;

  if (!bodega_id) {
    res.status(400).json({ error: 'bodega_id requerido' });
    return;
  }

  try {
    // 1. Verificar que la bodega pertenece al usuario
    const bodegaCheck = await pool.query(
      `SELECT b.id, b.nombre, b.municipio, b.estado, b.latitud, b.longitud,
              ic.telefono, ic.nombre AS contacto_nombre
       FROM bodegas b
       JOIN bodeguero_bodegas bb ON bb.bodega_id = b.id
       LEFT JOIN infraestructura_contactos ic ON ic.bodega_id = b.id AND ic.es_principal = TRUE
       WHERE b.id = $1 AND bb.usuario_id = $2 AND bb.estatus = 'aprobada'`,
      [bodega_id, userId]
    );
    if (bodegaCheck.rows.length === 0) {
      res.status(403).json({ error: 'Bodega no encontrada o no autorizada' });
      return;
    }
    const bodega = bodegaCheck.rows[0];

    // 2. Buscar productores con UP en ese municipio que tengan usuario en sistema
    const productores = await pool.query(
      `SELECT DISTINCT u2.id AS usuario_id
       FROM up u
       JOIN producer p ON p.producer_id = u.producer_id
       JOIN usuarios u2 ON (u2.curp = p.curp OR u2.email = p.email)
       WHERE u.municipality_name ILIKE $1
         AND u2.activo = TRUE AND u2.rol = 'productor'`,
      [municipio]
    );

    // 3. Crear notificación con info completa de la bodega
    const precioTxt = precio_ofrecido ? `$${Number(precio_ofrecido).toLocaleString()}/ton` : 'precio a convenir';
    const tipoTxt = tipo_maiz || 'maíz';
    const contactoTxt = bodega.contacto_nombre && bodega.telefono
      ? `\n📞 Contacto: ${bodega.contacto_nombre} — ${bodega.telefono}`
      : '';
    const msg =
      `🏪 La bodega "${bodega.nombre}" está interesada en comprar ${tipoTxt} en ${municipio}.\n\n` +
      `📍 Ubicación: ${bodega.municipio}, ${bodega.estado}\n` +
      `💰 Precio ofrecido: ${precioTxt}` +
      contactoTxt +
      `\n\nAcércate a la bodega si quieres vender tu maíz.`;

    let notificados = 0;
    for (const prod of productores.rows) {
      try {
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
           VALUES ($1, 'interes_bodega_oferta', $2, $3, 'bodegas')`,
          [prod.usuario_id, msg, bodega_id]
        );
        notificados++;
      } catch (_) { /* best-effort */ }
    }

    res.json({ ok: true, productores_notificados: notificados });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
