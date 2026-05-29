import cron from 'node-cron';
import { actualizarReferenciasExternas } from '../services/preciosExternos';

/**
 * Job de Precios Externos - se ejecuta diariamente a las 07:00 AM hora de la Ciudad de México.
 * Consulta Yahoo Finance (Chicago ZC=F) y Banxico API/Yahoo Finance (TC USD/MXN).
 */
export async function runPreciosCron(): Promise<void> {
  try {
    console.log('[CRON] Iniciando actualización diaria de precios a las 07:00 AM...');
    const result = await actualizarReferenciasExternas('cron');
    console.log('[CRON] Actualización de precios finalizada con éxito. ID insertado:', result?.id);
  } catch (err) {
    console.error('[CRON] Error al actualizar precios en cron diario:', err);
  }
}

/**
 * Agenda el job para ejecutarse todos los días a las 07:00 AM (America/Mexico_City).
 */
export function schedulePreciosCron(): void {
  cron.schedule('0 7 * * *', async () => {
    await runPreciosCron();
  }, { timezone: 'America/Mexico_City' });

  console.log('[CRON] Job de actualización de precios programado para las 07:00 AM (America/Mexico_City)');
}
