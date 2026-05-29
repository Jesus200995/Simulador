# SIMAC — Plan Nacional Maíz 2026

## Módulo de Precios — Especificación Técnica Completa

Aplica a: Bodeguero (B22) · Productor (P-11) · Admin (A4)

v1.0 · Mayo 2026 · Para el desarrollador

Repo: github.com/Jesus200995/Simulador

Verde primario: #1A5C38 · Stack: React + Vite + Tailwind + Chart.js

## Índice

1. Resumen del módulo y qué cambia vs. la versión anterior

2. Los 3 precios — definición, fórmulas y fuentes de datos

3. Fuentes externas — Yahoo Finance (Chicago) y Banxico API (TC)

4. Pantalla B22 — Bodeguero

5. Pantalla P-11 — Productor

6. Pantalla A4 — Admin (referencia al documento de Admin)

7. Componente PO — cómo se calcula con datos reales

8. Componente S — tarifario de servicios

9. Datos FIRA — carga y uso

10. Endpoints de API — existentes y nuevos

11. Estados de UI

12. Checklist de entrega

## 1. RESUMEN Y QUÉ CAMBIA

### 1.1 Qué reemplaza este documento

Este documento reemplaza la lógica de precios anterior en B22PreciosMercado.tsx y PreciosProductorPage.tsx. Los archivos existen pero usan una estructura de datos diferente que NO coincide con la nueva especificación.

| **Elemento anterior**          | **Estado**                       | **Qué hacer**                                    |
|--------------------------------|----------------------------------|--------------------------------------------------|
| Fórmula PS = PO + S + M + F    | ❌ ELIMINADA                     | No usar. Reemplazar por los 3 precios nuevos.    |
| Componente M (margen 10%)      | ❌ ELIMINADO de precios visibles | No mostrar como componente del precio.           |
| Componente F (flete)           | ❌ ELIMINADO del piloto          | No mostrar. Badge 'Próximamente' si hay espacio. |
| Barra verde PS = PO+S+M+F      | ❌ ELIMINAR de B22               | Reemplazar por la nueva estructura de 3 precios. |
| chicago hardcodeado en backend | 🔴 FIX URGENTE                   | Conectar a Yahoo Finance. Ver sección 3.         |
| tc_banxico hardcodeado         | 🔴 FIX URGENTE                   | Conectar a Banxico API. Ver sección 3.           |
| B22PreciosMercado.tsx          | 🔄 REESCRIBIR                    | Reemplazar con nueva estructura. Ver sección 4.  |
| PreciosProductorPage.tsx       | 🔄 REESCRIBIR                    | Adaptar nombres de campo. Ver sección 5.         |
| Precio CEDIS                   | ⏸ EN DESARROLLO                  | Mantener badge 'En desarrollo'. No calcular.     |

### 1.2 Los 3 precios — resumen rápido

| **#** | **Nombre**            | **Fórmula simplificada**                  | **Calculado en**                   |
|--------|-----------------------|-------------------------------------------|------------------------------------|
| 1      | Margen de Negociación | (Chicago × 39.368 × TC) + (50 USD × TC)   | Frontend con datos del backend     |
| 2      | Precio de Compra      | PO (precio bodega) + S (servicios bodega) | Backend — frontend solo muestra    |
| 3      | Precio de Venta       | Precio de Compra − Margen de Negociación  | Frontend puro — sin endpoint extra |

## 2. LOS 3 PRECIOS — DEFINICIÓN COMPLETA

### 2.1 Precio 1 — Margen de Negociación

#### Descripción

Precio de referencia internacional. Representa el valor mínimo de negociación del maíz blanco en el mercado mexicano, calculado a partir de la Bolsa de Chicago convertido a MXN/ton, más un bono fijo por ser maíz blanco.

#### Fórmula exacta

> **Margen de Negociación (MXN/ton):** ( Chicago (USD/bushel) × 39.368 ) × TC (MXN/USD) + ( 50 × TC )

#### Los 4 componentes que se muestran visualmente

| **Componente**         | **Valor ejemplo**    | **Fuente**                                        | **Configurable**                 |
|------------------------|----------------------|---------------------------------------------------|----------------------------------|
| Precio Chicago         | \$4.85 USD/bushel    | Yahoo Finance — símbolo ZC=F                      | No — fuente externa automática   |
| Factor de conversión   | × 39.368 bushels/ton | Constante fija (1 ton métrica = 39.368 bushels)   | No — hardcodeado como constante  |
| Tipo de cambio USD/MXN | \$17.82 MXN/USD      | Banxico API — serie SF43718                       | No — fuente externa automática   |
| Bono Maíz Blanco       | +\$50 USD/ton fijo   | Constante del programa — const BONO_MAIZ_USD = 50 | No — hardcodeado, no viene de BD |

#### Cálculo paso a paso (frontend)

> const FACTOR_CONVERSION = 39.368; // bushels por tonelada métrica — constante fija
>
> const BONO_MAIZ_USD = 50; // constante del programa — NO viene de BD
>
> // Datos del endpoint GET /api/precios/referencias/externas
>
> const { chicago_usd_bushel, tc_banxico } = referenciaExterna;
>
> const chicago_usd_ton = chicago_usd_bushel * FACTOR_CONVERSION;
>
> const chicago_mxn = chicago_usd_ton * tc_banxico;
>
> const bono_mxn = BONO_MAIZ_USD * tc_banxico;
>
> const margen_negociacion = chicago_mxn + bono_mxn;

#### Visualización — 4 tarjetas pequeñas + total

Las 4 tarjetas se muestran en grid 2×2 arriba del total. El total va en una tarjeta grande debajo:

- Tarjeta 1: 'Precio Chicago' — \$X.XX USD/bushel — 'CME Group · Hoy'

- Tarjeta 2: 'Conversión' — '× 39.368' — '= \$XXX.XX USD/ton'

- Tarjeta 3: 'Tipo de cambio' — '\$XX.XX MXN/USD' — 'Banxico · Hoy'

- Tarjeta 4: 'Bono Maíz' — '+\$50 USD/ton' — '= \$XXX MXN/ton'

- Tarjeta total (ancho completo): 'MARGEN DE NEGOCIACIÓN' — \$X,XXX MXN/ton — número grande

> *⚠️ Timestamp obligatorio debajo del total: 'Actualizado hoy a las 7:00am' o badge amarillo 'Datos de ayer — Chicago y TC del día anterior' si el cron no corrió.*

### 2.2 Precio 2 — Precio de Compra

#### Descripción

Precio que refleja el costo real del maíz en la cadena de bodega. Se compone de lo que recibe el productor (PO) y lo que cobra la bodega por sus servicios (S).

> **Precio de Compra (MXN/ton):** PO (Precio Origen) + S (Servicios de Bodega)

#### Componente PO — Precio Origen

- Definición: promedio de los precios de compra publicados por las bodegas en los últimos 7 días

- Fuente de datos: tabla precios, campo tipo_precio = 'bodega'

- Query: promedio de precios.precio WHERE tipo_precio='bodega' AND fecha \>= NOW()-7 días

- Endpoint que lo devuelve: GET /api/precios/dashboard → campo kpi.promedio

- Si no hay precios publicados en los últimos 7 días: mostrar N/A con badge 'Sin datos suficientes'

#### Componente S — Servicios de Bodega

- Definición: promedio de tarifarios activos de bodegas con tarifario actualizado en los últimos 60 días

- Fuente de datos: tabla tarifario_servicios

- La suma de todos los conceptos del tarifario de una bodega = S de esa bodega

- S regional = promedio de los S de todas las bodegas activas en la región

- Si no hay tarifarios: NO mostrar \$0 — mostrar bloque con texto 'Las bodegas no han publicado tarifario de servicios'

- Endpoint: GET /api/precios/componentes/detalle → componente con label 'S'

#### Visualización — dos bloques de color diferente

- Bloque verde #1A5C38: '🌽 LO QUE GANA EL PRODUCTOR' → \$X,XXX MXN/ton → 'Precio promedio pagado · últimos 7 días' → 'X bodegas incluidas'

- Signo + entre los dos bloques

- Bloque azul #1B4F8A: '🏪 SERVICIOS DE LA BODEGA' → \$X,XXX MXN/ton → 'Secado, limpieza, almacenamiento...' → 'X bodegas con tarifario activo'

- Signo = debajo

- Tarjeta total: 'PRECIO DE COMPRA TOTAL' → \$X,XXX MXN/ton → número grande

- Porcentajes: PO = XX.X% del precio de compra / S = XX.X% del precio de compra

### 2.3 Precio 3 — Precio de Venta

#### Descripción

El resultado final: lo que queda después de restar el Margen de Negociación al Precio de Compra. Indica la posición del precio de la bodega vs. la referencia internacional.

> **Precio de Venta (MXN/ton):** Precio de Compra − Margen de Negociación

#### Cálculo — 100% frontend

> // Con los valores ya obtenidos de precios 1 y 2:
>
> const precio_venta = precio_compra - margen_negociacion;
>
> // Si precio_venta \> 0 → mostrar en verde
>
> // Si precio_venta \< 0 → mostrar en rojo con ícono ⚠️
>
> // Si precio_venta = 0 → mostrar en gris

#### Visualización — formato resta visible

- Línea 1: 'Precio de Compra \$X,XXX MXN/ton'

- Línea 2: '− Margen Negociación \$X,XXX MXN/ton'

- Línea divisoria

- Resultado grande: 'PRECIO DE VENTA \$X,XXX MXN/ton' — verde si positivo, rojo si negativo

- NUNCA ocultar ni ajustar un resultado negativo — mostrarlo tal cual con aviso

### 2.4 Precio CEDIS — en desarrollo

No calcular. Mostrar el siguiente bloque en la pantalla:

> \<div className='border-2 border-dashed border-gray-200 rounded-xl p-4 mt-4'\>
>
> \<span className='bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full'\>
>
> EN DESARROLLO
>
> \</span\>
>
> \<h3\>Precio CEDIS\</h3\>
>
> \<p\>Precio de compra en Centrales de Abasto menos el Margen de Negociación.
>
> Próximamente disponible.\</p\>
>
> \</div\>

## 3. FUENTES EXTERNAS — YAHOO FINANCE Y BANXICO API

> *🔴 Esta sección es el cambio más importante de todo el módulo. Chicago y TC están hardcodeados en el backend actual. Hay que conectarlos a fuentes reales. Sin este fix, los precios del sistema son ficticios.*

### 3.1 Chicago CME — Yahoo Finance

#### Símbolo a consultar

- Símbolo: ZC=F — Corn Futures (CBOT, en USD/bushel)

- Este es el precio del maíz amarillo en Chicago — se usa como referencia internacional para el maíz blanco mexicano

- La diferencia entre maíz amarillo y blanco se absorbe en el Bono Maíz de \$50 USD/ton

#### Implementación en backend — Node.js

> // Instalar: npm install yahoo-finance2
>
> import yahooFinance from 'yahoo-finance2';
>
> async function obtenerChicagoCME(): Promise\<number\> {
>
> try {
>
> const quote = await yahooFinance.quote('ZC=F');
>
> // regularMarketPrice es el precio actual en USD/bushel
>
> return quote.regularMarketPrice;
>
> } catch (error) {
>
> console.error('Error Yahoo Finance:', error);
>
> // Si falla: retornar el último valor guardado en BD
>
> return await obtenerUltimoChicagoDeDB();
>
> }
>
> }
>
> *ℹ️ Yahoo Finance no cobra ni requiere API key para consultas básicas de precios de futuros. La librería yahoo-finance2 es la más mantenida para Node.js. Como fallback siempre usar el último valor guardado en BD.*

#### Horario de operación del mercado

- El mercado de futuros de maíz CBOT opera: Lun-Vie 8:30am-1:20pm hora Chicago (CT)

- Fuera de horario: Yahoo Finance devuelve el último precio de cierre — es válido usarlo

- Fines de semana: usar el precio del viernes. Badge 'Precio de cierre del viernes' en la UI

- El cron corre a las 7:00am hora México — el mercado abre a las 8:30am CT (9:30am hora México)

- Por tanto el cron captura el precio de cierre del día anterior — es correcto para el propósito

### 3.2 Tipo de cambio USD/MXN — Banxico API

#### Endpoint oficial

- URL: https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno

- Serie SF43718: tipo de cambio para solventar obligaciones en moneda extranjera — el más usado en México

- Requiere token gratuito: obtenerlo en https://www.banxico.org.mx/SieAPIRest/service/v1/token

- El token es una cadena de 64 caracteres — guardar en variable de entorno: BANXICO_TOKEN

#### Implementación en backend — Node.js

> async function obtenerTipoCambioBanxico(): Promise\<number\> {
>
> try {
>
> const response = await axios.get(
>
> 'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno',
>
> { headers: { 'Bmx-Token': process.env.BANXICO_TOKEN } }
>
> );
>
> const datos = response.data.bmx.series\[0\].datos;
>
> const ultimo = datos\[datos.length - 1\];
>
> return parseFloat(ultimo.dato); // 'dato' es el TC como string
>
> } catch (error) {
>
> console.error('Error Banxico API:', error);
>
> return await obtenerUltimoTCDeDB();
>
> }
>
> }
>
> *ℹ️ El token de Banxico es gratuito pero tiene límite de 5,000 llamadas por día. Con el cron de 1 vez al día más el botón manual del admin, estamos muy por debajo del límite. Guardar el token en .env como BANXICO_TOKEN='...'*

### 3.3 Cron job y flujo de actualización

#### Cron job automático (7:00am hora México)

> import cron from 'node-cron';
>
> // Corre a las 7:00am hora México todos los días
>
> cron.schedule('0 7 * * *', async () =\> {
>
> await actualizarReferenciasExternas('cron');
>
> }, { timezone: 'America/Mexico_City' });
>
> async function actualizarReferenciasExternas(fuente: string) {
>
> const chicago = await obtenerChicagoCME();
>
> const tc = await obtenerTipoCambioBanxico();
>
> const chicago_usd_ton = chicago * 39.368;
>
> const chicago_mxn = chicago_usd_ton * tc;
>
> // Guardar en tabla precio_referencias_externas
>
> await db.query(\`
>
> INSERT INTO precio_referencias_externas
>
> (chicago_usd_bushel, chicago_usd_ton, chicago_mxn, tc_banxico, fuente, error)
>
> VALUES (\$1, \$2, \$3, \$4, \$5, false)
>
> \`, \[chicago, chicago_usd_ton, chicago_mxn, tc, fuente\]);
>
> }

#### Endpoint que el frontend consume

GET /api/precios/referencias/externas — MODIFICAR para que lea de la tabla en lugar de valores hardcodeados:

> // ANTES (hardcodeado — ELIMINAR):
>
> return { chicago_usd_bushel: 6.28, tc_banxico: 17.42, ... }
>
> // DESPUÉS (desde BD):
>
> const ultimo = await db.query(\`
>
> SELECT * FROM precio_referencias_externas
>
> ORDER BY created_at DESC LIMIT 1
>
> \`);
>
> return {
>
> chicago_usd_bushel: ultimo.chicago_usd_bushel,
>
> chicago_usd_ton: ultimo.chicago_usd_ton,
>
> chicago_mxn: ultimo.chicago_mxn,
>
> tc_banxico: ultimo.tc_banxico,
>
> updated_at: ultimo.created_at,
>
> fuente: ultimo.fuente,
>
> error: ultimo.error
>
> }

#### Tabla nueva requerida en BD

Si no existe, crear con migración v14:

> CREATE TABLE IF NOT EXISTS precio_referencias_externas (
>
> id SERIAL PRIMARY KEY,
>
> chicago_usd_bushel NUMERIC(10,4),
>
> chicago_usd_ton NUMERIC(10,2),
>
> chicago_mxn NUMERIC(10,2),
>
> tc_banxico NUMERIC(10,4),
>
> garantia_sader NUMERIC(10,2),
>
> fuente VARCHAR(30) DEFAULT 'cron',
>
> error BOOLEAN DEFAULT false,
>
> created_at TIMESTAMPTZ DEFAULT NOW()
>
> );

#### Endpoint manual para el Admin

POST /api/precios/actualizar-externas — solo accesible con rol admin:

> router.post('/actualizar-externas', soloAdmin, async (req, res) =\> {
>
> await actualizarReferenciasExternas('admin_manual');
>
> const nuevo = await obtenerUltimasReferencias();
>
> res.json({ success: true, datos: nuevo });
>
> });

## 4. PANTALLA B22 — BODEGUERO

### 4.1 Archivo y ruta

- Archivo: app-bodega/src/pages/B22PreciosMercado.tsx

- Ruta: /bodeguero/precios (o la ruta actual — verificar en router.tsx)

- Acceso: RequireBodeguero guard

### 4.2 Estructura completa de la pantalla (de arriba hacia abajo)

| **#** | **Bloque**                       | **Descripción**                                                      |
|--------|----------------------------------|----------------------------------------------------------------------|
| 1      | Header                           | 'Módulo de Precios · Maíz blanco · Hoy' + timestamp de actualización |
| 2      | Precio 1 — Margen de Negociación | 4 tarjetas componentes + tarjeta total                               |
| 3      | Precio 2 — Precio de Compra      | Bloque verde (PO) + bloque azul (S) + total                          |
| 4      | Precio 3 — Precio de Venta       | Visualización de resta + resultado grande                            |
| 5      | Precio 4 — CEDIS                 | Badge 'En desarrollo' — sin datos                                    |
| 6      | Gráfica tendencia 30 días        | 3 líneas: Margen, Compra, Venta — Chart.js                           |

### 4.3 Llamadas al backend

| **Dato**           | **Endpoint**                           | **Campo a usar**                                   |
|--------------------|----------------------------------------|----------------------------------------------------|
| Chicago y TC       | GET /api/precios/referencias/externas  | chicago_usd_bushel, tc_banxico, updated_at         |
| PO (precio origen) | GET /api/precios/dashboard             | kpi.promedio                                       |
| S (servicios)      | GET /api/precios/componentes/detalle   | componentes\[\] donde componente='S'               |
| Gráfica 30 días    | GET /api/precios/tendencia?dias=30     | tendencia\[\].fecha + calcular margen/compra/venta |
| Precio de Venta    | No hay endpoint — calcular en frontend | precio_compra - margen_negociacion                 |

### 4.4 Comportamiento de la gráfica

- Los datos de tendencia vienen del endpoint: GET /api/precios/tendencia — devuelve tendencia\[\].fecha y tendencia\[\].ps (precio sistema)

- El Margen de Negociación histórico NO está en el endpoint — el frontend debe recalcularlo por fecha usando chicago y garantia de cada punto

- Si el endpoint no devuelve chicago y garantia por fecha: usar el valor actual para todas las fechas (aproximación válida para el piloto)

- Precio de Venta en la gráfica = PS del endpoint (el campo ps ya es el precio sistema calculado)

- Altura de la gráfica: 180px. Responsive.

### 4.5 Tokens de diseño del módulo

| **Elemento**             | **Color / Valor**                                                     |
|--------------------------|-----------------------------------------------------------------------|
| Fondo de página          | #F3F4F6 gris claro                                                   |
| Tarjetas de componentes  | Blanco, border 1px #E5E7EB, border-radius 12px, sombra suave         |
| Bloque PO (productor)    | #1A5C38 fondo con texto blanco — o fondo #E8F5EE con texto #1A5C38 |
| Bloque S (servicios)     | #1B4F8A fondo con texto blanco — o fondo #EFF6FF con texto #2563EB |
| Tarjeta total Margen     | Fondo blanco, número en negro grande, label en gris                   |
| Precio de Venta positivo | Número en verde #1A5C38                                              |
| Precio de Venta negativo | Número en rojo #DC2626 + ícono ⚠️                                    |
| Línea Margen en gráfica  | #1A5C38 sólida 2px + relleno opacidad 0.08                           |
| Línea Precio de Compra   | #2563EB sólida 2px sin relleno                                       |
| Línea Precio de Venta    | #D97706 punteada 1.5px sin relleno                                   |

## 5. PANTALLA P-11 — PRODUCTOR

### 5.1 Archivo y ruta

- Archivo: app-bodega/src/pages/productor/PreciosProductorPage.tsx

- Ruta: /productor/precios

- Acceso: RequireProductor guard

### 5.2 Diferencias vs. la pantalla del Bodeguero

| **Elemento**      | **Bodeguero (B22)**                   | **Productor (P-11)**                                    |
|-------------------|---------------------------------------|---------------------------------------------------------|
| Precio 1 — Margen | Muestra las 4 tarjetas componentes    | Muestra solo el total — sin desglose de componentes     |
| Precio 2 — Compra | Muestra N bodegas incluidas en PO y S | Muestra solo: 'Precio que te pagan las bodegas' + total |
| Precio 3 — Venta  | Igual que bodeguero                   | Igual que bodeguero                                     |
| Utilidad FIRA     | No visible                            | No visible (solo Admin)                                 |
| Gráfica 30 días   | 3 líneas completas                    | 3 líneas completas — misma gráfica                      |
| Detalle de S      | Muestra desglose de servicios         | No muestra desglose — solo el valor total               |

### 5.3 KPI en el dashboard del productor

El dashboard del productor (DashboardProductorPage.tsx) muestra un KPI de precio del día. Este KPI debe mostrar el PO — no el Precio de Compra ni el Precio de Venta:

> // KPI del dashboard del productor
>
> // Mostrar: PO = precio promedio que pagan las bodegas
>
> // Fuente: GET /api/precios/dashboard → kpi.promedio
>
> // Label: 'Precio del día' o 'Lo que pagan las bodegas hoy'

### 5.4 Comportamiento especial para productores Tipo B

- El productor Tipo B (pendiente de validación) puede ver la pantalla de precios completa

- No hay restricción de contenido en precios para Tipo B

- La única restricción de Tipo B es el botón 'Tengo maíz disponible' en el dashboard — ese botón aparece bloqueado

### 5.5 Llamadas al backend — Productor

| **Dato**           | **Endpoint**                          | **Campo**                                  |
|--------------------|---------------------------------------|--------------------------------------------|
| Chicago y TC       | GET /api/productor/precios            | Verificar que devuelve la nueva estructura |
| PO                 | GET /api/productor/precios            | precio_compra (renombrar o mapear a PO)    |
| Margen Negociación | Calcular en frontend con chicago y TC | —                                          |
| Precio de Venta    | Calcular en frontend                  | —                                          |
| Gráfica            | GET /api/precios/tendencia?dias=30    | Mismo endpoint que bodeguero               |

> *⚠️ El endpoint GET /api/productor/precios existe pero devuelve campos con nombres del sistema anterior (precio_compra, precio_bodega, precio_mercado). Actualizar el endpoint para que devuelva la nueva estructura o mapear los campos en el frontend.*

## 6. PANTALLA A4 — ADMIN

La especificación completa del módulo Admin se encuentra en el documento separado:

> **SIMAC_Admin_Spec_V1.docx — Sección 8: Pantalla A4 — Módulo de Precios**

En resumen, el Admin ve los mismos 3 precios que bodeguero y productor, más:

- Gráfica de tendencia 30 días

- Tabla de bodegas que publicaron precio hoy

- Panel de referencias con historial de actualizaciones

- Utilidad Estimada FIRA por estado/municipio (exclusivo Admin)

- Panel de discrepancias

- Tabla de brechas por estado

- Exportar CSV

- Botón 'Actualizar ahora' para forzar refresh de Chicago y TC

## 7. COMPONENTE PO — CÓMO SE CALCULA

### 7.1 Definición

PO (Precio Origen) = promedio de los precios de compra publicados por bodegas en los últimos 7 días.

### 7.2 Tabla de origen

- Tabla: precios

- Filtro: tipo_precio = 'bodega'

- Filtro: fecha \>= NOW() - INTERVAL '7 days'

- Agregación: AVG(precio) ponderado — si hay suficiente volumen de transacciones confirmadas, ponderar por volumen; si no, usar promedio simple

### 7.3 Endpoint existente

GET /api/precios/dashboard devuelve kpi.promedio — verificar que este campo es el promedio de tipo_precio='bodega' de los últimos 7 días. Si no lo es, ajustar la query del endpoint.

### 7.4 Regla cuando no hay datos

- Si hay 0 precios tipo 'bodega' en los últimos 7 días: PO = null

- En la UI: mostrar bloque verde con texto 'Sin precio publicado — ninguna bodega ha reportado precio esta semana'

- El Precio de Compra y el Precio de Venta también muestran N/A cuando PO = null

- NO inventar ni usar un valor de fallback — la transparencia es prioritaria

## 8. COMPONENTE S — SERVICIOS DE BODEGA

### 8.1 Definición

S (Servicios) = suma de los conceptos del tarifario de una bodega = lo que cobra la bodega por recibir, limpiar, secar y almacenar el maíz del productor.

### 8.2 Cálculo

- S por bodega = SUM de tarifario_servicios.precio_ton de todos los conceptos activos de esa bodega

- S regional = AVG de S de todas las bodegas con tarifario actualizado en los últimos 60 días

- Si una bodega no actualizó su tarifario en \> 60 días: excluir de S regional (bodega inactiva en tarifario)

### 8.3 Estado actual

> *⚠️ El tarifario está vacío en la BD del piloto — ninguna bodega ha publicado tarifario todavía. S = 0 hasta que las bodegas carguen su tarifario.*

Mientras S = 0, el sistema muestra:

- Bloque azul con borde punteado: 'Las bodegas aún no han publicado su tarifario de servicios'

- Precio de Compra = PO + 0 = PO (solo el valor del productor)

- NO mostrar \$0 en el bloque de S — mostrar el mensaje explicativo

### 8.4 Alerta automática para bodegueros

El sistema ya tiene lógica para alertar si una bodega lleva \> 60 días sin actualizar tarifario. Verificar que el endpoint de notificaciones genera esta alerta.

## 9. DATOS FIRA — CARGA Y USO

### 9.1 Qué son los datos FIRA

FIRA (Fideicomisos Instituidos en Relación con la Agricultura) publica costos de producción por estado y modalidad (riego / temporal). Estos datos permiten al Admin calcular la Utilidad Estimada del Productor: cuánto le queda al productor después de cubrir sus costos de producción.

### 9.2 Tabla en BD

- Tabla: costos_fira (ya existe — migración v13)

- Campos confirmados por el inventario del repo

- Estados con dato actualmente: Jalisco, Sinaloa, Guanajuato

### 9.3 Campos esperados del CSV de actualización

| **Campo CSV** | **Tipo** | **Obligatorio** | **Descripción**                                                             |
|---------------|----------|-----------------|-----------------------------------------------------------------------------|
| estado        | Texto    | Sí              | Nombre del estado — debe coincidir con catálogo del sistema                 |
| municipio     | Texto    | No              | Si existe, se guarda a nivel municipio. Si vacío, se guarda a nivel estado. |
| ciclo         | Texto    | Sí              | PV (primavera-verano) u OI (otoño-invierno)                                 |
| modalidad     | Texto    | Sí              | riego o temporal                                                            |
| costo_por_ton | Número   | Sí              | Costo de producción en MXN/ton                                              |

### 9.4 Flujo de carga de CSV

1.  Admin va a /admin/precios → sección FIRA → botón 'Actualizar datos FIRA'

2.  Modal: input de tipo file (accept='.csv')

3.  Validación en frontend antes de subir: verificar que el CSV tiene las columnas requeridas

4.  POST /api/precios/fira/upload-csv con el archivo

5.  Backend: validar columnas, hacer UPSERT en costos_fira (actualizar si existe, insertar si no)

6.  Respuesta: { insertados: N, actualizados: N, errores: \[\] }

7.  Toast con el resultado: 'Datos FIRA actualizados: X nuevos, Y actualizados'

### 9.5 Cómo se usa en la pantalla

- Solo visible en /admin/precios — NO en B22 ni P-11

- Fórmula: Utilidad Estimada = PO regional del estado − Costo FIRA (mismo estado y ciclo)

- Si hay dato por municipio: usar el del municipio. Si no: usar el del estado.

- Mostrar riego y temporal por separado en la tabla

- Si PO \> Costo FIRA: celda verde — el productor tiene utilidad positiva

- Si PO \< Costo FIRA: celda roja — el productor pierde dinero

## 10. ENDPOINTS DE API

### 10.1 Endpoints existentes — verificar y ajustar

| **Endpoint**                                | **Ajuste requerido**                                                                          |
|---------------------------------------------|-----------------------------------------------------------------------------------------------|
| GET /api/precios/referencias/externas       | 🔴 CRÍTICO: Reemplazar valores hardcodeados por consulta a tabla precio_referencias_externas  |
| GET /api/precios/tendencia                  | 🔴 Verificar que chicago no está hardcodeado en la query. Si lo está, reemplazar.             |
| GET /api/precios/dashboard                  | 🟡 Verificar que kpi.promedio es el AVG de tipo_precio='bodega' últimos 7 días                |
| GET /api/precios/componentes/detalle        | 🟡 Verificar que el componente S viene de tarifario_servicios y no está hardcodeado           |
| GET /api/productor/precios                  | 🟡 Mapear campos al nuevo naming: precio_compra→PO, agregar margen_negociacion y precio_venta |
| GET /api/precios/brechas/estados            | 🟢 Ya existe — consumir directamente                                                          |
| GET /api/precios/discrepancias              | 🟢 Ya existe — consumir directamente                                                          |
| PUT /api/precios/discrepancias/:id/resolver | 🟢 Ya existe — consumir directamente                                                          |
| GET /api/precios/parametros                 | 🟢 Ya existe — usar para obtener garantia_sader                                               |

### 10.2 Endpoints nuevos a crear

| **Endpoint**                          | **Método** | **Descripción**                                                                         |
|---------------------------------------|------------|-----------------------------------------------------------------------------------------|
| POST /api/precios/actualizar-externas | POST       | Llama a Yahoo Finance y Banxico, guarda en precio_referencias_externas. Solo admin.     |
| GET /api/precios/actualizaciones-log  | GET        | Devuelve últimas 20 filas de precio_referencias_externas ordenadas por created_at DESC. |
| POST /api/precios/fira/upload-csv     | POST       | Recibe CSV, valida columnas, hace upsert en costos_fira. Solo admin.                    |

## 11. ESTADOS DE UI

| **Estado**                         | **Cuándo**                           | **Qué mostrar**                                                             |
|------------------------------------|--------------------------------------|-----------------------------------------------------------------------------|
| Cargando                           | Al montar o refrescar                | Skeleton loaders en cada bloque — no spinner global                         |
| Chicago/TC desactualizado          | Datos \> 24h o error de fuente       | Badge amarillo 'Datos de ayer' sobre las tarjetas de Margen                 |
| Error de fuente externa            | Yahoo Finance o Banxico no responden | Badge rojo 'Error de actualización' + botón 'Actualizar ahora' (solo admin) |
| PO = null (sin precios de bodegas) | 0 precios tipo bodega en 7 días      | Bloque verde con borde punteado: 'Sin precio publicado esta semana'         |
| S = 0 (sin tarifarios)             | Tabla tarifario_servicios vacía      | Bloque azul con borde punteado: 'Bodegas no han publicado tarifario'        |
| Precio de Venta negativo           | PO+S \< Margen Negociación           | Número en rojo + ícono ⚠️ — NO ocultar                                      |
| Gráfica sin datos                  | Menos de 3 puntos en 30 días         | Mensaje: 'Datos insuficientes para mostrar tendencia'                       |
| FIRA sin dato para el estado       | Estado sin registro en costos_fira   | Celda con '—' en gris — no mostrar \$0                                      |
| Error de API genérico              | Error 500 o red caída                | Tarjeta de error con botón 'Reintentar'. No dejar pantalla en blanco.       |

## 12. CHECKLIST DE ENTREGA

#### Fix crítico de backend (bloquea todo lo demás)

- Instalar yahoo-finance2: npm install yahoo-finance2

- Obtener token Banxico gratuito y guardarlo en .env como BANXICO_TOKEN

- Crear tabla precio_referencias_externas (migración v14 si no existe)

- Implementar cron job a las 7:00am hora México

- GET /api/precios/referencias/externas lee de la tabla — NO hardcodeado

- POST /api/precios/actualizar-externas funcional

#### Pantalla B22 — Bodeguero

- Los 3 precios muestran datos reales del backend

- Fórmula PS = PO+S+M+F ELIMINADA — no aparece en la pantalla

- Las 4 tarjetas de Margen de Negociación muestran los componentes correctos

- Bloque PO verde y bloque S azul visualmente distinguibles

- Precio de Venta negativo → rojo + ⚠️

- CEDIS → badge 'En desarrollo'

- Gráfica 30 días con 3 líneas y tooltip funcional

- Timestamp de actualización visible

- Badge 'Datos de ayer' cuando Chicago/TC no son del día

#### Pantalla P-11 — Productor

- Misma lógica que B22 pero sin desglose de componentes

- KPI del dashboard muestra PO (no Precio de Compra total)

- Tipo B puede ver la pantalla sin restricciones

- GET /api/productor/precios devuelve la nueva estructura de campos

#### Datos FIRA

- Tabla costos_fira tiene datos de Jalisco, Sinaloa y Guanajuato

- Subir CSV desde /admin/precios funcional con validación

- Utilidad Estimada visible solo en Admin

- Celdas verdes/rojas según PO \> o \< Costo FIRA

*Plan Nacional Maíz 2026 · SIMAC — Módulo de Precios · v1.0 · Mayo 2026*

*Confidencial — Uso interno del equipo de desarrollo*
