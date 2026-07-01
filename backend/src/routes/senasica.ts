import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { enviarPushNativa } from '../utils/webpush';

const router = Router();

const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/var/www/Simulador/uploads/senasica'
  : path.join(__dirname, '../../../uploads/senasica');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `senasica_${Date.now()}_${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.csv$/i)) return cb(new Error('Solo se permiten archivos CSV'));
    cb(null, true);
  },
  limits: { fileSize: Infinity }
});

// ─────────────────────────────────────────────
// POST /api/senasica/cargar-csv
// ─────────────────────────────────────────────
router.post('/cargar-csv', authMiddleware, upload.single('archivo'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No se recibió ningún archivo' }); return; }

  const usuarioId = req.user?.userId;
  const filePath  = req.file.path;
  let cargaId: number | null = null;

  try {
    // 1. Registrar inicio
    const cargaRes = await pool.query(
      `INSERT INTO senasica_cargas (nombre_archivo, usuario_id, estado) VALUES ($1, $2, 'procesando') RETURNING id`,
      [req.file.originalname, usuarioId]
    );
    cargaId = cargaRes.rows[0].id;

    // 2. Desactivar alertas anteriores de SENASICA
    await pool.query(`UPDATE alertas_externas SET activa = FALSE WHERE fuente = 'SENASICA'`);

    // 3. Parsear CSV
    const puntos: {
      cve_geo: string; cve_ent: string; cve_mun: string; cultivo: string;
      lng: number; lat: number; hectareas: number; riesgo: string;
    }[] = [];

    await new Promise<void>((resolve, reject) => {
      const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
      let isHeader = true;
      rl.on('line', (line) => {
        if (isHeader) { isHeader = false; return; }
        const cols = line.split(',');
        if (cols.length < 8) return;
        const lng = parseFloat(cols[4]);
        const lat = parseFloat(cols[5]);
        if (isNaN(lng) || isNaN(lat)) return;
        if (!cols[3]?.toLowerCase().includes('ma')) return;
        puntos.push({
          cve_geo:   cols[0]?.trim() ?? '',
          cve_ent:   cols[1]?.trim() ?? '',
          cve_mun:   cols[2]?.trim() ?? '',
          cultivo:   cols[3]?.trim() ?? '',
          lng, lat,
          hectareas: parseFloat(cols[6]) || 0,
          riesgo:    cols[7]?.trim().toLowerCase() ?? 'medio'
        });
      });
      rl.on('close', resolve);
      rl.on('error', reject);
    });

    // 4. Parámetros de radio
    const radiosRes = await pool.query(`SELECT nivel_riesgo, radio_km FROM senasica_parametros WHERE activo = TRUE`);
    const radios: Record<string, number> = { alto: 50, medio: 25, bajo: 10 };
    for (const r of radiosRes.rows) radios[r.nivel_riesgo] = r.radio_km;

    // 5. Nombre de plaga desde el nombre del archivo
    const nombrePlaga = req.file!.originalname
      .replace(/-(Riego|Temporal|Mixto)/i, '')
      .replace(/\.csv$/i, '')
      .trim() || 'Plaga detectada';

    let totalUpsAfectadas = 0;
    let totalNotificaciones = 0;

    for (const punto of puntos) {
      const nivelNorm = punto.riesgo
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u');
      const nivel = nivelNorm.includes('alto') ? 'alto' : nivelNorm.includes('medio') ? 'medio' : 'bajo';
      const radioKm = radios[nivel] ?? 25;

      // Insertar alerta externa
      const alertaRes = await pool.query(
        `INSERT INTO alertas_externas
           (tipo_alerta, subtipo, nivel_riesgo, descripcion, recomendacion,
            cultivo_afectado, coordenada, radio_km, estado, municipio,
            fecha_deteccion, fuente, id_alerta_origen, activa)
         VALUES
           ('fitosanitaria', $1, $2, $3, $4, 'maiz',
            ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
            $7, $8, $9, NOW()::date, 'SENASICA', $10, TRUE)
         ON CONFLICT (id_alerta_origen) DO UPDATE
           SET activa = TRUE, nivel_riesgo = EXCLUDED.nivel_riesgo
         RETURNING id`,
        [
          nombrePlaga,
          nivel,
          `Detección de ${nombrePlaga} en cultivo de maíz. Superficie: ${punto.hectareas} ha.`,
          nivel === 'alto'  ? 'Inspecciona tu cultivo de inmediato y contacta a tu técnico de campo.' :
          nivel === 'medio' ? 'Revisa tu cultivo en los próximos días y mantente alerta.' :
                              'Mantente informado. El riesgo es bajo en este momento.',
          punto.lng, punto.lat, radioKm,
          punto.cve_ent, punto.cve_mun,
          `SENASICA-${punto.cve_geo}-${punto.riesgo}-${Date.now()}-${Math.random()}`
        ]
      );

      const alertaId = alertaRes.rows[0]?.id;
      if (!alertaId) continue;

      // 6. Buscar UPs dentro del radio usando PostGIS
      const upsRes = await pool.query(
        `SELECT
           u.up_id, p.producer_id, p.nombres,
           us.id AS usuario_id,
           us.push_endpoint, us.push_p256dh, us.push_auth, us.push_activo,
           ROUND(
             (ST_Distance(
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
               u.geom::geography
             ) / 1000.0)::numeric
           , 1) AS distancia_km
         FROM up u
         JOIN producer p ON p.producer_id = u.producer_id
         JOIN usuarios us ON us.id = p.usuario_id
         WHERE
           ST_DWithin(
             ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
             u.geom::geography,
             $3 * 1000
           )
           AND us.activo = TRUE
           AND u.geom IS NOT NULL`,
        [punto.lng, punto.lat, radioKm]
      );

      for (const up of upsRes.rows) {
        totalUpsAfectadas++;
        await pool.query(
          `INSERT INTO alertas_up (alerta_id, up_id, distancia_km, notificado)
           VALUES ($1, $2, $3, FALSE) ON CONFLICT (alerta_id, up_id) DO NOTHING`,
          [alertaId, up.up_id, up.distancia_km]
        );

        const emoji   = nivel === 'alto' ? '🔴' : nivel === 'medio' ? '🟡' : '🟢';
        const titulo  = `${emoji} Alerta fitosanitaria — ${nombrePlaga}`;
        const mensaje = nivel === 'alto'
          ? `Se detectó ${nombrePlaga} con riesgo ALTO a ${up.distancia_km} km de tu parcela. Inspecciona tu cultivo de inmediato.`
          : nivel === 'medio'
          ? `Se detectó ${nombrePlaga} con riesgo MEDIO a ${up.distancia_km} km de tu parcela. Revisa tu cultivo pronto.`
          : `Se detectó ${nombrePlaga} cerca de tu zona (${up.distancia_km} km). Riesgo BAJO. Mantente informado.`;

        // Notificación in-app
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, alerta_externa_id, titulo, mensaje, tipo, leida)
           VALUES ($1, $2, $3, $4, 'alerta_sanitaria', FALSE)`,
          [up.usuario_id, alertaId, titulo, mensaje]
        );

        await pool.query(
          `UPDATE alertas_up SET notificado = TRUE WHERE alerta_id = $1 AND up_id = $2`,
          [alertaId, up.up_id]
        );

        // Push nativa
        if (up.push_activo && up.push_endpoint) {
          await enviarPushNativa(
            { endpoint: up.push_endpoint, p256dh: up.push_p256dh, auth: up.push_auth },
            { titulo, mensaje, tipo: 'alerta_sanitaria', nivel }
          ).catch(err => console.error(`Push fallida usuario ${up.usuario_id}:`, err));
        }

        totalNotificaciones++;
      }
    }

    // 7. Marcar carga completada
    await pool.query(
      `UPDATE senasica_cargas SET
         estado = 'completado', total_puntos = $1,
         total_ups_afectadas = $2, total_notificaciones = $3, completado_en = NOW()
       WHERE id = $4`,
      [puntos.length, totalUpsAfectadas, totalNotificaciones, cargaId]
    );

    fs.unlinkSync(filePath);
    res.json({
      ok: true,
      resumen: {
        archivo: req.file!.originalname,
        puntos_procesados: puntos.length,
        ups_afectadas: totalUpsAfectadas,
        notificaciones: totalNotificaciones
      }
    });

  } catch (error) {
    console.error('Error procesando CSV SENASICA:', error);
    if (cargaId) {
      await pool.query(
        `UPDATE senasica_cargas SET estado = 'error', error_detalle = $1 WHERE id = $2`,
        [String(error), cargaId]
      ).catch(() => {});
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// ─────────────────────────────────────────────
// GET /api/senasica/historial
// ─────────────────────────────────────────────
router.get('/historial', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT sc.*, u.nombre_completo AS subido_por
       FROM senasica_cargas sc
       LEFT JOIN usuarios u ON u.id = sc.usuario_id
       ORDER BY sc.created_at DESC LIMIT 20`
    );
    res.json({ cargas: result.rows });
  } catch {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ─────────────────────────────────────────────
// GET /api/senasica/parametros
// ─────────────────────────────────────────────
router.get('/parametros', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT * FROM senasica_parametros ORDER BY radio_km DESC`);
    res.json({ parametros: result.rows });
  } catch {
    res.status(500).json({ error: 'Error al obtener parámetros' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/senasica/parametros/:nivel
// ─────────────────────────────────────────────
router.patch('/parametros/:nivel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nivel } = req.params;
    const { radio_km } = req.body;
    if (!['alto', 'medio', 'bajo'].includes(nivel)) { res.status(400).json({ error: 'Nivel inválido' }); return; }
    if (!radio_km || radio_km < 1 || radio_km > 500) { res.status(400).json({ error: 'Radio debe ser entre 1 y 500 km' }); return; }
    await pool.query(
      `UPDATE senasica_parametros SET radio_km = $1, updated_at = NOW() WHERE nivel_riesgo = $2`,
      [radio_km, nivel]
    );
    res.json({ ok: true, nivel, radio_km });
  } catch {
    res.status(500).json({ error: 'Error al actualizar parámetro' });
  }
});

export default router;
