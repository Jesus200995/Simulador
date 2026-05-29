import axios from 'axios';
// @ts-ignore
import yahooFinance from 'yahoo-finance2';
import pool from '../config/database';

const FACTOR_BUSHEL_TON = 39.368;
const BONO_MAIZ_USD = 50;

// Turn off yahooFinance warnings to clean up logs if necessary
yahooFinance.setGlobalConfig({
  queue: {
    concurrency: 1
  }
});

/**
 * Obtiene el precio actual de futuros de maíz en Chicago (símbolo: ZC=F) en USD/bushel
 */
export async function obtenerChicagoCME(): Promise<number> {
  try {
    console.log('Consultando futuros de maíz en Chicago (ZC=F) en Yahoo Finance...');
    const quote = await yahooFinance.quote('ZC=F');
    const price = quote.regularMarketPrice;
    if (price && typeof price === 'number') {
      console.log(`Precio Chicago obtenido: ${price} USD/bushel`);
      return price;
    }
    throw new Error('No se recibió un precio válido de Yahoo Finance');
  } catch (error) {
    console.error('Error al obtener precio de Chicago de Yahoo Finance:', error);
    // Intentar obtener el último de la BD
    const lastDb = await obtenerUltimoDeDB();
    if (lastDb && lastDb.chicago_usd_bushel) {
      console.log(`Usando fallback de Chicago de BD: ${lastDb.chicago_usd_bushel} USD/bushel`);
      return parseFloat(lastDb.chicago_usd_bushel);
    }
    // Si no hay nada en BD, devolver valor por defecto
    console.log('Sin fallback en BD para Chicago. Usando por defecto 6.28');
    return 6.28;
  }
}

/**
 * Obtiene el Tipo de Cambio USD/MXN de Banxico o de Yahoo Finance como fallback robusto
 */
export async function obtenerTCBanxico(): Promise<number> {
  // 1. Intentar con API de Banxico si hay token configurado
  if (process.env.BANXICO_TOKEN) {
    try {
      console.log('Consultando TC Banxico (SF43718)...');
      const response = await axios.get(
        'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno',
        {
          headers: { 'Bmx-Token': process.env.BANXICO_TOKEN },
          timeout: 10000
        }
      );
      const datos = response.data?.bmx?.series?.[0]?.datos;
      if (datos && datos.length > 0) {
        const ultimo = datos[datos.length - 1];
        const tcVal = parseFloat(ultimo.dato);
        if (!isNaN(tcVal)) {
          console.log(`TC Banxico obtenido con éxito: ${tcVal} MXN/USD`);
          return tcVal;
        }
      }
      throw new Error('Formato de respuesta de Banxico no esperado');
    } catch (error: any) {
      console.error('Error al consultar Banxico API:', error.message || error);
    }
  } else {
    console.log('BANXICO_TOKEN no configurado en variables de entorno. Usando fallback de Yahoo Finance...');
  }

  // 2. Fallback a Yahoo Finance (USDMXN=X)
  try {
    console.log('Consultando TC USD/MXN (USDMXN=X) en Yahoo Finance como fallback...');
    const quote = await yahooFinance.quote('USDMXN=X');
    const price = quote.regularMarketPrice;
    if (price && typeof price === 'number') {
      console.log(`TC Yahoo Finance obtenido con éxito: ${price} MXN/USD`);
      return price;
    }
    throw new Error('No se recibió un tipo de cambio válido de Yahoo Finance');
  } catch (error) {
    console.error('Error al obtener TC de Yahoo Finance:', error);
  }

  // 3. Fallback a base de datos
  const lastDb = await obtenerUltimoDeDB();
  if (lastDb && lastDb.tc_banxico) {
    console.log(`Usando fallback de TC de BD: ${lastDb.tc_banxico} MXN/USD`);
    return parseFloat(lastDb.tc_banxico);
  }

  // 4. Último recurso: hardcoded
  console.log('Sin fallback en BD para TC. Usando por defecto 17.42');
  return 17.42;
}

/**
 * Obtiene el último registro guardado en la tabla de referencias externas
 */
async function obtenerUltimoDeDB() {
  try {
    const res = await pool.query(`
      SELECT chicago_usd_bushel, tc_banxico, garantia_sader
      FROM precio_referencias_externas
      ORDER BY created_at DESC LIMIT 1
    `);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Error al obtener último registro de referencias de BD:', error);
    return null;
  }
}

/**
 * Actualiza las referencias externas en la BD (Chicago y TC)
 */
export async function actualizarReferenciasExternas(fuente: string): Promise<any> {
  console.log(`Iniciando actualización de referencias externas. Fuente: ${fuente}`);
  let chicagoUsdBushel = 6.28;
  let tc = 17.42;
  let isError = false;
  let errorMsg = '';

  try {
    chicagoUsdBushel = await obtenerChicagoCME();
    tc = await obtenerTCBanxico();
  } catch (e: any) {
    isError = true;
    errorMsg = e.message || String(e);
    console.error('Error crítico durante la actualización de referencias:', e);
  }

  // Obtener la garantía SADER de la tabla de parámetros
  let garantiaSader = 6915.00;
  try {
    const paramsRes = await pool.query('SELECT precio_garantia_sader FROM precio_parametros ORDER BY id DESC LIMIT 1');
    if (paramsRes.rows.length > 0) {
      garantiaSader = parseFloat(paramsRes.rows[0].precio_garantia_sader);
    }
  } catch (e) {
    console.error('Error al obtener precio de garantía SADER de parámetros, usando 6915:', e);
  }

  const chicagoUsdTon = Math.round((chicagoUsdBushel * FACTOR_BUSHEL_TON) * 100) / 100;
  const chicagoMxn = Math.round((chicagoUsdTon * tc) * 100) / 100;

  try {
    const insertRes = await pool.query(`
      INSERT INTO precio_referencias_externas
      (chicago_usd_bushel, chicago_usd_ton, chicago_mxn, tc_banxico, garantia_sader, fuente, error)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [chicagoUsdBushel, chicagoUsdTon, chicagoMxn, tc, garantiaSader, fuente, isError]);

    console.log('Referencias externas actualizadas con éxito en BD.');
    return insertRes.rows[0];
  } catch (dbError) {
    console.error('Error al insertar referencias externas en base de datos:', dbError);
    // Retornamos un objeto manual en caso de fallo catastrófico de BD
    return {
      chicago_usd_bushel: chicagoUsdBushel,
      chicago_usd_ton: chicagoUsdTon,
      chicago_mxn: chicagoMxn,
      tc_banxico: tc,
      garantia_sader: garantiaSader,
      fuente,
      error: true,
      created_at: new Date()
    };
  }
}
