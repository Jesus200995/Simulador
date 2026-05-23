import cron from 'node-cron';
import pool from '../config/database';

/**
 * Bodega Daily Jobs — runs at 00:01 server time via node-cron.
 * 1. Expire active purchase signals past their fecha_vencimiento.
 * 2. Mark pending transactions as 'expirada' after 48 h without producer response.
 * 3. Expire disponibilidad_productor past their fecha_vencimiento.
 */

export async function runBodegaDailyJobs(): Promise<void> {
  try {
    // 1. Vencer señales de compra cuya fecha ya pasó
    const senalesRes = await pool.query(
      `UPDATE senales_compra
         SET activa = FALSE
       WHERE activa = TRUE AND fecha_vencimiento < CURRENT_DATE
       RETURNING id`
    );
    if (senalesRes.rowCount && senalesRes.rowCount > 0) {
      console.log(`[CRON] Señales vencidas: ${senalesRes.rowCount}`);
    }

    // 2. Expirar transacciones pendientes sin respuesta después de 48 horas
    const txRes = await pool.query(
      `UPDATE transacciones
         SET confirmacion_productor = 'expirada',
             peso_precio_sistema    = 0.5,
             updated_at             = NOW()
       WHERE confirmacion_productor = 'pendiente'
         AND created_at < NOW() - INTERVAL '48 hours'
       RETURNING id`
    );
    if (txRes.rowCount && txRes.rowCount > 0) {
      console.log(`[CRON] Transacciones expiradas: ${txRes.rowCount}`);
    }

    // 3. Vencer disponibilidades de productores
    try {
      await pool.query(
        `UPDATE disponibilidad_productor
           SET activa = FALSE
         WHERE activa = TRUE AND fecha_vencimiento < CURRENT_DATE`
      );
    } catch (_) { /* table may not exist yet */ }

    console.log(`[CRON] Jobs diarios ejecutados: ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[CRON] Error en jobs diarios de bodega:', err);
  }
}

/**
 * Schedule the job to run daily at 00:01 using node-cron.
 * Call this once from src/index.ts at startup.
 */
export function scheduleBodegaDailyJobs(): void {
  // Run daily at 00:01
  cron.schedule('1 0 * * *', async () => {
    await runBodegaDailyJobs();
  }, { timezone: 'America/Mexico_City' });

  console.log('[CRON] Job diario programado para 00:01 (America/Mexico_City)');
}
