import pool from '../config/database';

/**
 * Bodega Daily Jobs — runs at 00:01 server time.
 * 1. Expire active purchase signals past their fecha_vencimiento.
 * 2. Mark pending transactions as 'expirada' after 48 h without producer response.
 * Per spec §8.3 and §8.4 of SIMAC_Modulo_Bodega_Claude_Agent.md.
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
      console.log(`[DailyJob] Señales vencidas: ${senalesRes.rowCount}`);
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
      console.log(`[DailyJob] Transacciones expiradas: ${txRes.rowCount}`);
    }
  } catch (err) {
    console.error('[DailyJob] Error en jobs diarios de bodega:', err);
  }
}

/**
 * Schedule the job to run daily at 00:01.
 * Call this once from src/index.ts at startup.
 */
export function scheduleBodegaDailyJobs(): void {
  function msUntilNextRun(): number {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 1, 0, 0);
    return next.getTime() - now.getTime();
  }

  function scheduleNext(): void {
    const delay = msUntilNextRun();
    console.log(`[DailyJob] Próxima ejecución en ${Math.round(delay / 60000)} min`);
    setTimeout(async () => {
      await runBodegaDailyJobs();
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}
