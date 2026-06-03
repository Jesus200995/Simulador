# SIMAC — Verificación de Distancias en Servidor
## Guía paso a paso — Para ejecutar tú misma
**Plan Nacional Maíz 2026 · Mayo 2026**

> Esta guía es para verificar que las distancias entre parcelas 
> y bodegas funcionan correctamente en el servidor de producción.
> No necesitas saber programar — solo seguir los pasos en orden.

---

## Antes de empezar — Lo que necesitas

- [ ] La IP del servidor (la que estaba en `.env.example` — `31.97.8.51`)
- [ ] El usuario SSH (pregúntale al programador si no lo tienes)
- [ ] La contraseña SSH del servidor
- [ ] Una terminal abierta en tu computadora

**¿Cómo abrir la terminal?**
- En Mac: busca "Terminal" en Spotlight (cmd + espacio)
- En Windows: busca "PowerShell" en el menú inicio

---

## PASO 1 — Conectarte al servidor

En tu terminal escribe exactamente esto y presiona Enter:

```bash
ssh jesus@31.97.8.51
```

Te va a pedir una contraseña. Escríbela y presiona Enter.
*(No verás los caracteres mientras escribes — es normal)*

**✅ Qué debes ver si funcionó:**
```
Welcome to Ubuntu 22.04...
jesus@servidor:~$
```
Aparece el símbolo `$` al final — significa que ya estás dentro del servidor.

**❌ Si ves esto:**
```
Connection refused
```
El servidor no está encendido o la IP cambió. Avísale al programador.

---

## PASO 2 — Ir a la carpeta del proyecto

Escribe esto y presiona Enter:

```bash
cd /ruta/al/proyecto/backend
```

> ⚠️ Si no sabes la ruta exacta, escribe esto primero:
> ```bash
> find / -name "index.ts" -path "*/backend/src/*" 2>/dev/null
> ```
> Te va a mostrar algo como `/home/jesus/Simulador/backend/src/index.ts`
> Tu ruta sería entonces `/home/jesus/Simulador/backend`

---

## PASO 3 — Verificar que POSTGIS_ENABLED está configurado

Escribe esto y presiona Enter:

```bash
grep POSTGIS_ENABLED .env
```

**✅ Resultado bueno — debes ver:**
```
POSTGIS_ENABLED=true
```
Continúa al Paso 4.

**❌ Resultado malo — no aparece nada o aparece:**
```
POSTGIS_ENABLED=false
```

Entonces escribe esto para arreglarlo:
```bash
echo "POSTGIS_ENABLED=true" >> .env
```

Verifica que quedó bien:
```bash
grep POSTGIS_ENABLED .env
```
Ahora sí debe aparecer `POSTGIS_ENABLED=true`

Reinicia el servidor:
```bash
pm2 restart simac-backend
```

**✅ Debes ver:**
```
[PM2] Restarting 'simac-backend'...
[PM2] Done.
```

---

## PASO 4 — Verificar que PostGIS está instalado

Escribe esto y presiona Enter:

```bash
psql -U jesus -d bodegas -c "SELECT PostGIS_version();"
```

Te puede pedir contraseña — es la contraseña de la base de datos.

**✅ Resultado bueno — debes ver algo como:**
```
postgis_version
------------------------------------------------
3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
(1 row)
```
Continúa al Paso 5.

**❌ Resultado malo — aparece:**
```
ERROR: function postgis_version() does not exist
```

Escribe esto para instalarlo:
```bash
psql -U jesus -d bodegas -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

**✅ Debes ver:**
```
CREATE EXTENSION
```
Continúa al Paso 5.

---

## PASO 5 — Registrar un productor de prueba

Ahora necesitas hacer esto desde la app — **no desde la terminal**.

1. Abre la app SIMAC en tu navegador o celular
2. Toca **"Soy Productor"**
3. Llena el formulario de registro con datos de prueba:
   - CURP: puedes usar una CURP de prueba
   - Nombre, apellidos: cualquier dato
4. Cuando llegues al **paso del mapa** — esto es lo más importante:
   - **Dibuja un polígono** aunque sea pequeño
   - Toca varios puntos en el mapa para formar un área
   - Confirma el polígono
5. Termina el registro completo

> Si no puedes registrar un productor nuevo porque ya existe,
> usa uno que ya esté registrado y que haya dibujado su parcela.

---

## PASO 6 — Verificar que la parcela se guardó en la base de datos

Vuelve a la terminal. Escribe esto y presiona Enter:

```bash
psql -U jesus -d bodegas -c "
SELECT 
  up_id,
  municipality_name AS municipio,
  state_name AS estado,
  ST_AsText(centroid) AS coordenadas_centro,
  CASE WHEN geom IS NULL THEN 'NO guardado' ELSE 'SI guardado' END AS poligono
FROM up
ORDER BY created_at DESC
LIMIT 3;
"
```

**✅ Resultado bueno — debes ver algo así:**
```
up_id | municipio  | estado  | coordenadas_centro        | poligono
------+------------+---------+---------------------------+----------
  42  | Culiacán   | Sinaloa | POINT(-107.394 24.796)    | SI guardado
  41  | Navolato   | Sinaloa | POINT(-107.712 24.760)    | SI guardado
```

Esto significa:
- `coordenadas_centro` tiene coordenadas reales — no NULL ✅
- `poligono` dice "SI guardado" ✅
- Las coordenadas corresponden al lugar donde dibujó ✅

**❌ Resultado malo — ves esto:**
```
up_id | municipio | estado  | coordenadas_centro | poligono
------+-----------+---------+--------------------+----------
  42  | Culiacán  | Sinaloa | NULL               | NO guardado
```

Esto significa que el polígono no se guardó. Regresa al Paso 3 y verifica que `POSTGIS_ENABLED=true` quedó correcto y reiniciaste el servidor.

---

## PASO 7 — Verificar las distancias en la app

Con el productor de prueba registrado y con coordenadas reales:

1. Abre la app con ese productor
2. Ve al **Dashboard del Productor**
3. Busca las bodegas cercanas

**✅ Resultado bueno:**
- Las bodegas muestran distancias en km con números reales
  Por ejemplo: `15 km`, `32 km`, `8 km`
- **NO aparece** el banner amarillo "Distancias aproximadas"

**❌ Resultado malo A — aparece banner amarillo:**
```
📍 Distancias aproximadas
Tu parcela no tiene ubicación exacta...
```
Significa que el centroide del productor sigue siendo NULL en BD.
Regresa al Paso 6 y verifica.

**❌ Resultado malo B — todas las bodegas dicen 0 km:**
Las coordenadas se guardaron pero el cálculo de distancia falla.
Avísale al programador con el resultado del Paso 6.

---

## PASO 8 — Verificar que bodegas existentes se actualizaron

Esta es la migración v19 que cambia el semáforo de todas las bodegas a "sin actividad". Si aún no se ejecutó, hazlo ahora:

```bash
psql -U jesus -d bodegas -f /ruta/al/proyecto/backend/migrations/migrate_v19_semaforo_default.sql
```

**✅ Debes ver:**
```
UPDATE 5
ALTER TABLE
```
*(el número es la cantidad de bodegas actualizadas)*

Verifica que quedó bien:
```bash
psql -U jesus -d bodegas -c "
SELECT semaforo_compra, COUNT(*) as total
FROM bodegas
GROUP BY semaforo_compra;
"
```

**✅ Resultado bueno:**
```
semaforo_compra | total
----------------+-------
sin_actividad   |   5
```
Todas las bodegas en `sin_actividad` ✅

**❌ Resultado malo:**
```
semaforo_compra | total
----------------+-------
comprando       |   3
sin_actividad   |   2
NULL            |   1
```
La migración no se aplicó completo. Vuelve a ejecutarla.

---

## PASO 9 — Salir del servidor

Cuando termines, escribe:
```bash
exit
```

Y presiona Enter. Ya estás fuera del servidor.

---

## Resumen de lo que verificaste

```
□ Paso 3 — POSTGIS_ENABLED=true en .env ✅
□ Paso 4 — PostGIS instalado en BD ✅
□ Paso 6 — Parcela de prueba guardada con coordenadas reales ✅
□ Paso 7 — Distancias reales en la app, sin banner amarillo ✅
□ Paso 8 — Bodegas en semáforo sin_actividad ✅
```

Si todos están ✅ — **las distancias funcionan correctamente.**

---

## Si algo falla — qué hacer

| Problema | Qué hacer |
|---|---|
| No puedo conectarme al servidor | Pídele la contraseña SSH al programador |
| POSTGIS no está instalado | Pídele al programador que lo instale |
| Las coordenadas siguen en NULL | Manda captura de pantalla del Paso 6 al programador |
| Las distancias siguen en 0 km | Manda captura del Paso 6 y Paso 7 al programador |
| No sé la ruta de la migración v19 | Pídele al programador la ruta exacta |

---

*SIMAC Plan Nacional Maíz 2026 · Verificación de Distancias*
*Mayo 2026 · Guía para verificación en servidor de producción*
