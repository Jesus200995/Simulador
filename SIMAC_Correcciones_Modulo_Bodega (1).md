# SIMAC — Documento de Correcciones: Módulo Bodega
**Versión:** 1.0 · **Fecha:** Mayo 2026  
**Para:** Equipo de desarrollo frontend/backend  
**Repo:** github.com/Jesus200995/Simulador  

> ⚠️ Este documento lista correcciones al desarrollo ya entregado del módulo Bodega. Cada corrección indica exactamente **qué cambiar**, **dónde** y **cómo debe quedar**.

---

## ÍNDICE DE CORRECCIONES

| # | Corrección | Pantalla/Módulo | Tipo |
|---|---|---|---|
| C-01 | Cambio de término "bodeguero" → "bodega" | Global | Texto |
| C-02 | Datos de bodega no se muestran correctamente | B-06 General | Bug |
| C-03 | Inventario sobrescribe registros anteriores | B-07 Inventario | Bug crítico |
| C-04 | Desplegable tipo de maíz incorrecto en inventario | B-07 Inventario | Dato |
| C-05 | Quitar campos "Vol. con problema" y "Humedad" de inventario | B-07 Inventario | UI |
| C-06 | Desplegable tipo de maíz incorrecto en precio de compra | B-09 Precios | Dato |
| C-07 | Quitar campo "Humedad" de precio de compra | B-09 Precios | UI |
| C-08 | Historial de precios debe guardarse y mostrarse en gráfica | B-09 Precios | Funcional |
| C-09 | Renombrar "señal de compra" → "requerimiento de maíz" | B-10 Señales | Texto |
| C-10 | Leyenda incorrecta en tab Señales | B-10 Señales | Texto |
| C-11 | Vigencia: cambiar desplegable por selector de calendario | B-10 Señales | UI |
| C-12 | Corrección de variedades de maíz en todos los desplegables | Global | Dato crítico |
| C-13 | Módulo Oferta: lógica de productores cercanos por centroide | B-11/B-12 Oferta | Funcional |
| C-14 | Notificación al productor desde Oferta debe incluir info de bodega | B-11/B-12 Oferta | Funcional |
| C-15 | Tab "Historial" → renombrar a "Transacciones" | Navegación | Texto |
| C-16 | Transacciones no se están guardando correctamente | B-13/B-14 | Bug crítico |
| C-17 | Búsqueda de productor con autocompletado | B-13 Transacción | Funcional |
| C-18 | "Tipo de ventanilla" → "Tipos de apoyos en esta ventanilla" | B-18 Ventanilla | Texto |
| C-19 | Ventanilla debe permitir registrar varias por bodega | B-18 Ventanilla | Funcional |
| C-20 | Notificar al productor ventanillas cercanas | Sistema | Funcional |
| C-21 | Correcciones al Tablero: títulos de KPIs y lógica de ocupación | B-04 Tablero | UI + Funcional |
| C-22 | Nuevo módulo: Precios (3 tipos de precio + construcción visual) | B-22 Precios | Nuevo |

---

## CORRECCIONES DETALLADAS

---

### C-01 — Cambio de término "bodeguero" por "bodega"
**Tipo:** Texto global  
**Prioridad:** Alta

**Problema:**  
En múltiples pantallas aparece el término "bodeguero" (visible en el Tablero: "BODEGUERO PRUEBA"). El término correcto definido en el sistema es **"bodega"**.

**Dónde corregir:**
- Tablero (B-04): saludo "¡Buenas tardes! BODEGUERO PRUEBA" → cambiar a **"¡Buenas tardes! [NOMBRE DEL USUARIO]"** y quitar el badge que dice "BODEGUERO PRUEBA"
- Badge debajo del saludo: dice "Bodega 🏪" — este sí está correcto, conservar
- Cualquier otro lugar en el código donde aparezca el string `"bodeguero"` en textos visibles al usuario — hacer búsqueda global en el repo y reemplazar por `"bodega"`
- En base de datos: el campo `usuarios.rol` debe contener el valor `'bodega'` (no `'bodeguero'`). Verificar que el seed y el registro de prueba estén con el valor correcto.

---

### C-02 — Datos de bodega no se muestran en la pantalla General
**Tipo:** Bug  
**Prioridad:** Alta  
**Pantalla:** B-06 — Tab "General" del detalle de bodega

**Problema visible en Imagen 1:**  
La bodega "DIEGOS" ADAN ORTIS MACIAS muestra `Capacidad: 0 ton`. Los datos de la bodega existen en la base de datos pero no se están mostrando correctamente.

**Qué revisar:**
1. El endpoint `GET /api/infraestructura/:id` — verificar que devuelve `capacidad_ton` con el valor real (no null ni 0)
2. En el frontend, verificar que el componente mapea correctamente el campo `capacidad_ton` de la respuesta al texto "Capacidad"
3. Si `capacidad_ton` llega como `null` desde la API, mostrar `"Sin datos"` en lugar de `"0 ton"`
4. Verificar que los datos de las 24 bodegas cargadas en producción tengan `capacidad_ton` con valor real en la tabla `bodegas`

**Cómo debe quedar:**
```
Capacidad       500 ton        ← valor real de la BD
Localidad       VILLAMAR
Estatus op.     activa
Coordenadas     19.9467, -102.5528
```

---

### C-03 — Inventario sobrescribe el registro anterior en lugar de acumular
**Tipo:** Bug crítico  
**Prioridad:** Crítica  
**Pantalla:** B-07 — Tab "Inventario"

**Problema visible en Imagen 2:**  
El botón "Actualizar inventario" reemplaza el último registro. El sistema debe **acumular registros** — cada vez que se guarda un inventario, se crea un nuevo registro en la tabla `inventarios`, nunca se sobreescribe el anterior.

**Corrección en backend:**  
```sql
-- INCORRECTO (lo que hace actualmente):
UPDATE inventarios SET volumen_almacenamiento = X WHERE bodega_id = Y

-- CORRECTO:
INSERT INTO inventarios (bodega_id, usuario_id, tipo_maiz, variedad_code, 
  volumen_almacenamiento, calidad, ciclo, fecha, observaciones)
VALUES (...)
```

**Corrección en frontend:**  
- La pantalla muestra "ÚLTIMO REGISTRO" con la fecha — esto es correcto visualmente
- Agregar debajo del último registro un botón o link: **"Ver historial de inventarios"** que abra una lista con todos los registros anteriores ordenados por fecha descendente
- El historial debe mostrar: fecha, tipo de maíz, variedad, volumen, calidad

---

### C-04 — Desplegable "Tipo de maíz" incorrecto en formulario de inventario
**Tipo:** Dato  
**Prioridad:** Alta  
**Pantalla:** B-07 — Formulario de actualizar inventario

**Problema:**  
El desplegable de tipo de maíz en inventario tiene opciones incorrectas o incompletas.

**Cómo debe quedar el desplegable:**
```
Tipo de maíz
├── Maíz Blanco
├── Maíz Amarillo
└── Criollo / Local
```

> ⚠️ Solo estas 3 opciones. Eliminar cualquier otra opción que exista actualmente.

**En base de datos** — verificar que la tabla `cat_catalog` WHERE `catalog = 'tipo_maiz'` tenga exactamente:
```sql
('blanco',   'Maíz Blanco',    1),
('amarillo', 'Maíz Amarillo',  2),
('criollo',  'Criollo / Local', 3)
```

---

### C-05 — Quitar campos "Vol. con problema" y "Humedad (%)" del formulario de inventario
**Tipo:** UI  
**Prioridad:** Alta  
**Pantalla:** B-07 — Formulario de actualizar inventario

**Problema visible en Imagen 2:**  
El formulario muestra "Vol. con problema" y "Humedad" — estos campos quedan eliminados del formulario visible.

**Qué quitar:**
- Campo `volumen_problema` — eliminar del formulario de captura. **No eliminar la columna de la BD**, solo ocultarlo en el frontend por si se necesita en el futuro.
- Campo `humedad_pct` — eliminar del formulario de captura y del resumen de "Último registro". **No eliminar la columna de la BD.**

**Formulario resultante — campos que deben quedar:**
```
Bodega            [SELECT — mis bodegas]
Ciclo             [SELECT — PV / OI / Anual]
Tipo de maíz      [SELECT — Maíz Blanco / Maíz Amarillo / Criollo]
Variedad          [SELECT — filtrado según tipo, ver C-12]
Origen            [SELECT — Local / Importado]
Vol. almacenado   [número en toneladas]
Calidad           [SELECT — Primera / Segunda]
Fecha             [date picker — no puede ser futura]
Observaciones     [textarea — opcional]
```

---

### C-06 — Desplegable "Tipo de maíz" incorrecto en publicar precio de compra
**Tipo:** Dato  
**Prioridad:** Alta  
**Pantalla:** B-09 — Publicar precio de compra diario

**Corrección idéntica a C-04.** El desplegable debe tener solo:
```
Maíz Blanco / Maíz Amarillo / Criollo / Local
```

---

### C-07 — Quitar campo "Humedad" del formulario de precio de compra
**Tipo:** UI  
**Prioridad:** Alta  
**Pantalla:** B-09 — Publicar precio de compra diario

**Qué quitar:** El campo de humedad `humedad_pct` se elimina del formulario visible de precio de compra. No eliminar la columna de la BD.

**Formulario resultante — campos que deben quedar:**
```
Bodega            [SELECT — mis bodegas]
Tipo de maíz      [SELECT — Maíz Blanco / Maíz Amarillo / Criollo]
Variedad          [SELECT — filtrado según tipo, ver C-12]
Calidad           [SELECT — Primera / Segunda]
Precio (MXN/ton)  [número — se precarga el precio del día anterior]
Observaciones     [textarea — opcional]
```

---

### C-08 — Historial de precios: cada precio capturado debe guardarse y verse en gráfica
**Tipo:** Funcional  
**Prioridad:** Alta  
**Pantalla:** B-09 — Publicar precio de compra diario

**Comportamiento esperado:**
1. Cada vez que el usuario captura un precio, se crea un nuevo registro en la tabla `precios` — **nunca sobreescribir el registro anterior**
2. Al abrir la pantalla de publicar precio, **precargar automáticamente** el precio del día anterior para que el usuario solo lo confirme o modifique
3. Debajo del formulario de captura, mostrar una **gráfica de línea** (Recharts) con el historial de precios capturados por esa bodega en los últimos 30 días
4. El eje X de la gráfica es la fecha, el eje Y es el precio en MXN/ton
5. Si el usuario tiene más de una bodega, la gráfica muestra una línea por bodega con colores diferentes y leyenda

**Endpoint:**  
- `GET /api/infraestructura/:id/precios` — ya existe, verificar que devuelva todos los registros históricos, no solo el último

---

### C-09 — Renombrar "señal de compra" por "Requerimiento de maíz"
**Tipo:** Texto  
**Prioridad:** Alta  
**Pantalla:** B-10 — Tab "Señales", formulario de nueva señal

**Problema visible en Imagen 3:**  
El botón dice "Nueva señal de compra" y el tab dice "Señales". Esto se confunde con el módulo de Oferta de productores.

**Cambios de texto:**

| Texto actual | Texto correcto |
|---|---|
| "Nueva señal de compra" (botón) | **"+ Nuevo requerimiento de maíz"** |
| Tab "Señales" | **"Requerimientos"** |
| "Las señales activas se ven en la sección Oferta" (leyenda) | **Eliminar esta leyenda completamente** (ver C-10) |
| "señal de compra" en cualquier otro lugar del módulo | **"requerimiento de maíz"** |
| Título del formulario | **"Publicar requerimiento de maíz"** |

**En base de datos:** el nombre de la tabla `senales_compra` puede mantenerse igual (cambio solo en frontend). Si hay strings en el backend que se exponen al usuario, actualizar también.

---

### C-10 — Eliminar leyenda incorrecta en tab Señales/Requerimientos
**Tipo:** Texto  
**Prioridad:** Alta  
**Pantalla:** B-10 — Tab "Señales" (ahora "Requerimientos")

**Problema visible en Imagen 3:**  
Aparece el texto: *"Las señales activas se ven en la sección Oferta"*  
Esto es incorrecto y genera confusión porque la sección Oferta muestra la disponibilidad de **productores**, no los requerimientos de la bodega.

**Corrección:**  
- Eliminar completamente esa leyenda
- Si no hay requerimientos activos, mostrar: **"No tienes requerimientos de maíz activos. Publica uno para que los productores cercanos lo vean."**
- Los requerimientos activos **sí deben listarse en esta misma pantalla** — cada uno con: tipo de maíz, variedad, volumen buscado, precio ofrecido, vigencia, número de productores interesados y botón "Cancelar"

---

### C-11 — Vigencia: cambiar desplegable por selector de calendario (rango de fechas)
**Tipo:** UI  
**Prioridad:** Media  
**Pantalla:** B-10 — Formulario de requerimiento de maíz

**Problema visible en Imagen 4:**  
El campo "Vigencia" es un desplegable con opción "Esta semana". Debe cambiarse por un **selector de rango de fechas** (date range picker).

**Cómo debe funcionar:**
- El usuario selecciona una **fecha de inicio** y una **fecha de fin** del requerimiento
- La fecha de inicio no puede ser anterior a hoy
- La etiqueta del campo debe decir: **"¿Para cuándo necesitas el maíz?"**
- Debajo del selector, mostrar texto informativo en gris: *"Indica el período en que necesitas recibir el maíz en tu bodega"*
- En la BD: guardar `vigencia_inicio (DATE)` y `vigencia_fin (DATE)` en lugar del campo `vigencia VARCHAR`

**Migración requerida en BD:**
```sql
-- En tabla senales_compra:
ALTER TABLE senales_compra ADD COLUMN vigencia_inicio DATE;
ALTER TABLE senales_compra ADD COLUMN vigencia_fin DATE;
-- El campo vigencia VARCHAR puede mantenerse o eliminarse según criterio del dev
```

---

### C-12 — Corrección de variedades de maíz en todos los desplegables
**Tipo:** Dato crítico  
**Prioridad:** Alta  
**Afecta:** B-07 Inventario, B-09 Precios, B-10 Requerimiento, B-13 Transacción

**Problema:**  
Las variedades en el desplegable son incorrectas o incompletas. A continuación la lista validada con fuentes INIFAP/CIMMYT para las regiones del Plan Nacional Maíz 2026 (Bajío, Occidente, Sinaloa, Centro, Sur-Sureste).

**Cómo debe funcionar el desplegable:**  
El SELECT de variedad se filtra dinámicamente según el tipo de maíz seleccionado. Son dos campos en cascada.

---

#### Variedades de MAÍZ BLANCO
*(Híbridos INIFAP y CIMMYT más usados en las regiones del programa)*

```
Maíz Blanco
├── H-40       — Bajío y Occidente (Jalisco, Guanajuato, Michoacán)
├── H-48       — Valles Altos (Edomex, Puebla, Tlaxcala, Hidalgo)
├── H-50       — Valles Altos y Occidente
├── H-52       — Valles Altos (Centro)
├── H-59       — Sinaloa y Noroeste (riego)
├── H-66       — Occidente y Nayarit
├── H-70       — Occidente y Nayarit
├── H-77       — Valles Altos (riego, Querétaro, Guanajuato)
├── H-383      — Bajío y Norte-Centro
├── VS-22      — Variedad polinización libre, temporal
├── VS-23      — Variedad polinización libre, temporal
├── H-520      — Trópico húmedo (Veracruz, Tabasco, Oaxaca)
├── H-564C     — Trópico húmedo Sur-Sureste
└── Otra       — [campo de texto libre obligatorio al seleccionar]
```

---

#### Variedades de MAÍZ AMARILLO
*(Híbridos INIFAP más usados para uso pecuario e industrial)*

```
Maíz Amarillo
├── H-384A     — Centro y Norte-Centro (800–1,900 msnm, riego)
├── H-385      — Centro y Bajío
├── V-53A      — Variedad polinización libre, Valles Altos
├── V-55A      — Variedad polinización libre, Valles Altos
├── Búho       — Doble propósito grano/forraje, Valles Altos
├── Criollo Amarillo — Temporal, uso local
└── Otra       — [campo de texto libre obligatorio al seleccionar]
```

---

#### Variedades de CRIOLLO / LOCAL

```
Criollo / Local
├── Criollo Local  — [campo de texto libre para que el usuario especifique 
│                     el nombre que le da en su región]
└── No sabe        — opción disponible en requerimiento y transacción
```

> 💡 **Regla de filtrado:** Cuando el usuario selecciona "Criollo / Local", el campo de variedad debe mostrar solo "Criollo Local" con texto libre y "No sabe". No mostrar las listas de híbridos H-.

**Actualización en BD:**  
Limpiar la tabla `cat_crop_variety` y cargar exactamente las variedades listadas arriba, agrupadas por `tipo_maiz`. Cada registro: `code, label, tipo_maiz, sort_order`.

```sql
-- Ejemplo de seed correcto:
INSERT INTO cat_crop_variety (code, label, tipo_maiz, sort_order) VALUES
  ('H-40',    'H-40',    'blanco',   1),
  ('H-48',    'H-48',    'blanco',   2),
  ('H-50',    'H-50',    'blanco',   3),
  ('H-52',    'H-52',    'blanco',   4),
  ('H-59',    'H-59',    'blanco',   5),
  ('H-66',    'H-66',    'blanco',   6),
  ('H-70',    'H-70',    'blanco',   7),
  ('H-77',    'H-77',    'blanco',   8),
  ('H-383',   'H-383',   'blanco',   9),
  ('VS-22',   'VS-22',   'blanco',   10),
  ('VS-23',   'VS-23',   'blanco',   11),
  ('H-520',   'H-520',   'blanco',   12),
  ('H-564C',  'H-564C',  'blanco',   13),
  ('OTRA_B',  'Otra',    'blanco',   14),
  ('H-384A',  'H-384A',  'amarillo', 1),
  ('H-385',   'H-385',   'amarillo', 2),
  ('V-53A',   'V-53A',   'amarillo', 3),
  ('V-55A',   'V-55A',   'amarillo', 4),
  ('BUHO',    'Búho',    'amarillo', 5),
  ('CRIOLLO_AMARILLO', 'Criollo Amarillo', 'amarillo', 6),
  ('OTRA_A',  'Otra',    'amarillo', 7),
  ('CRIOLLO_LOCAL', 'Criollo Local (especificar)', 'criollo', 1),
  ('NO_SABE', 'No sabe', 'criollo',  2);
```

---

### C-13 — Módulo Oferta: lógica correcta de productores cercanos
**Tipo:** Funcional  
**Prioridad:** Crítica  
**Pantalla:** B-11 Tabla de oferta / B-12 Mapa de oferta

**Cómo debe funcionar:**

1. El sistema toma el **centroide de la Unidad de Producción (UP)** de cada productor registrado (coordenadas que ya están cargadas en la tabla `up` o equivalente)
2. Calcula la distancia desde ese centroide a cada bodega que opera el usuario
3. Asigna al productor la **bodega más cercana** de las que opera el usuario
4. La pantalla Oferta muestra una **tabla agregada por municipio** — NUNCA datos individuales de productores:

```
Municipio       | Productores | Toneladas aprox. | Ventana de tiempo | Acción
----------------|-------------|------------------|-------------------|--------
Pénjamo, Gto    |     12      |    ~340 ton      | Esta semana       | [Ver en mapa]
La Piedad, Mich |      8      |    ~210 ton      | 15 días           | [Ver en mapa]
```

5. Filtros disponibles en la parte superior: tipo de maíz, variedad, ventana de tiempo
6. Botón por fila: **"Publicar requerimiento para este municipio"** → abre B-10 con el municipio preseleccionado
7. Si no hay productores en el radio de ninguna bodega: ampliar automáticamente al estado de la bodega y mostrar aviso: *"Mostrando productores en todo el estado de [Estado] porque no se encontraron en el radio habitual"*

**Endpoint requerido:**
```
GET /api/oferta/municipios?bodega_id=X&tipo_maiz=blanco&radio_km=60
```
Respuesta: array de objetos `{ municipio, estado, productores_count, toneladas_aprox, ventana_predominante }`

---

### C-14 — Notificación al productor desde Oferta debe incluir información completa de la bodega
**Tipo:** Funcional  
**Prioridad:** Alta  
**Afecta:** Sistema de notificaciones

**Problema:**  
Cuando el usuario bodega publica un requerimiento o señala interés en un municipio, la notificación que llega al productor debe incluir **información completa de la bodega**, no solo el nombre.

**Formato correcto de la notificación al productor:**
```
🔔 La bodega [NOMBRE DE LA BODEGA] está interesada en 
comprar maíz en [MUNICIPIO].

📍 Ubicación: [MUNICIPIO], [ESTADO]
📞 Contacto: [TELÉFONO DEL RESPONSABLE de la bodega]
💰 Precio ofrecido: $[PRECIO]/ton
🌽 Tipo: [TIPO DE MAÍZ] — [VARIEDAD si aplica]
📦 Busca: [VOLUMEN] toneladas
📅 Para: [FECHA INICIO] al [FECHA FIN]

Acércate a la bodega si quieres vender.
```

**En backend:** al crear el registro de notificación, hacer JOIN con la tabla `bodegas` e `infraestructura_contactos` para incluir nombre, municipio, estado y teléfono del contacto principal de la bodega.

---

### C-15 — Renombrar tab "Historial" por "Transacciones" en la navegación
**Tipo:** Texto  
**Prioridad:** Media  
**Afecta:** Navegación inferior (bottom nav)

**Problema visible en Imagen 5:**  
El tab de la navegación inferior dice **"Historial"** con ícono de factura. Debe decir **"Transacciones"**.

**Cambios:**
- Label del tab: `"Historial"` → `"Transacciones"`
- Título del módulo en la pantalla: `"MÓDULO / Transacciones"` — este ya está correcto (Imagen 5)
- Ícono: puede mantenerse el mismo o usar uno de transferencia/intercambio

---

### C-16 — Bug crítico: las transacciones no se están guardando correctamente
**Tipo:** Bug crítico  
**Prioridad:** Crítica  
**Pantalla:** B-13/B-14 — Registro y listado de transacciones

**Problema:**  
El módulo muestra "0 transacciones registradas" y "Sin transacciones registradas" (Imagen 5) incluso cuando se han registrado compras. Las transacciones no persisten correctamente.

**Qué revisar en orden:**

1. **Endpoint POST /api/transacciones** — verificar que devuelve status 201 y el registro insertado. Revisar logs del servidor al momento del POST.
2. **Tabla `transacciones`** — verificar que el INSERT llega a la BD:
   ```sql
   SELECT * FROM transacciones ORDER BY created_at DESC LIMIT 10;
   ```
3. **Endpoint GET /api/transacciones** — verificar que el filtro por `usuario_id` o `bodega_id` no está excluyendo los registros recién creados
4. **Frontend** — verificar que después del POST exitoso se hace un re-fetch de la lista (`GET /api/transacciones`) para refrescar la pantalla
5. **Foreign keys** — verificar que `bodega_id` y `usuario_id` en la transacción corresponden a registros existentes y que no hay violación de FK que cause rollback silencioso

---

### C-17 — Búsqueda de productor con autocompletado por CURP o nombre
**Tipo:** Funcional  
**Prioridad:** Alta  
**Pantalla:** B-13 — Formulario de registro de transacción

**Comportamiento esperado:**
1. El campo "Productor" es un campo de búsqueda con autocompletado (typeahead)
2. El usuario escribe mínimo 3 caracteres (CURP o nombre)
3. El sistema consulta la base de productores registrados y muestra sugerencias en un dropdown
4. Cada sugerencia muestra: nombre completo + municipio + CURP (últimos 4 dígitos)
5. Si el productor no aparece: mostrar opción **"+ Registrar nombre manualmente"** que convierte el campo en texto libre

**Endpoint requerido:**
```
GET /api/productores/buscar?q=TEXTO&bodega_id=X
```
- Buscar en campos: `nombre_completo`, `curp`
- Priorizar productores del municipio de la bodega seleccionada
- Devolver máximo 10 resultados
- Respuesta: `[{ producer_id, nombre_completo, municipio, curp_parcial }]`

---

### C-18 — Cambiar etiqueta "Tipo de ventanilla" por "Tipos de apoyos en esta ventanilla"
**Tipo:** Texto  
**Prioridad:** Media  
**Pantalla:** B-18 — Formulario de nueva ventanilla

**Problema visible en Imagen 6:**  
El campo dice **"Tipo de ventanilla"** con opciones Coberturas / Incentivos / Ambos.

**Corrección:**
- Etiqueta: `"Tipo de ventanilla"` → **`"Tipos de apoyos que hay en esta ventanilla"`**
- Las opciones (Coberturas / Incentivos / Ambos) se mantienen igual
- Agregar texto de ayuda debajo del selector en gris: *"Selecciona qué apoyos del gobierno se gestionan en esta ventanilla"*

---

### C-19 — Ventanilla debe permitir registrar varias por bodega
**Tipo:** Funcional  
**Prioridad:** Alta  
**Pantalla:** B-17/B-18 — Mis ventanillas

**Problema:**  
Una bodega puede tener más de una ventanilla (por ejemplo, una para Coberturas y otra para Incentivos, cada una con diferente enlace de Agricultura). El sistema debe permitir esto.

**Reglas:**
- Una bodega puede tener **N ventanillas** — sin límite
- Cada ventanilla tiene su propio responsable (nombre del enlace con Agricultura, teléfono, correo)
- En la lista B-17, mostrar todas las ventanillas agrupadas por bodega
- El formulario B-18 al guardar **no debe reemplazar** la ventanilla existente — debe crear un nuevo registro en la tabla `ventanillas`
- La tabla `ventanillas` ya tiene la estructura correcta (bodega_id FK, un registro por ventanilla) — verificar que el INSERT no hace UPDATE

---

### C-20 — Notificar al productor las ventanillas cercanas (igual que bodegas)
**Tipo:** Funcional  
**Prioridad:** Media  
**Afecta:** Sistema de notificaciones al productor

**Comportamiento esperado:**  
Cuando se crea o actualiza una ventanilla, y hay productores en el radio de la bodega asociada, enviar notificación push al productor:

```
🏛️ Hay una ventanilla de apoyo cerca de ti.

📍 [NOMBRE DE LA VENTANILLA o NOMBRE DE LA BODEGA]
   [MUNICIPIO], [ESTADO]
🎯 Apoyos disponibles: [Coberturas / Incentivos / Ambos]
📞 Responsable: [NOMBRE DEL ENLACE] — [TELÉFONO]

Toca aquí para solicitar información.
```

**Lógica de radio:** misma que para señales de compra — radio de la bodega según región, ampliar al estado si hay menos de 5 productores en el radio.

---

### C-21 — Correcciones al Tablero: títulos de KPIs y lógica de ocupación
**Tipo:** UI + Funcional  
**Prioridad:** Alta  
**Pantalla:** B-04 — Tablero del Bodeguero

**Problema visible en Imagen 7:**  
Los títulos de los KPIs son genéricos y la lógica de ocupación no es clara.

**Correcciones por KPI:**

#### KPI 1 — Precio
- Título actual: `"PRECIO BODEGA"` → cambiar a: **`"Precio promedio de maíz al productor hoy"`**
- Subtítulo actual: `"MXN/ton · último registrado"` → cambiar a: **`"Promedio de tu región · [NOMBRE DEL ESTADO]"`**
- Agregar indicador comparativo debajo del precio:
  - Si el precio publicado está **por encima** del promedio regional: mostrar **`↑ $X por encima del promedio regional`** en verde
  - Si está **por debajo**: mostrar **`↓ $X por debajo del promedio regional`** en rojo
  - Si no hay suficientes datos para comparar: mostrar `"Sin datos comparativos hoy"`

#### KPI 2 — Solicitudes
- Título actual: `"SOLICITUDES"` → cambiar a: **`"Solicitudes a ventanillas pendientes de atención"`**
- Subtítulo: `"pendientes en ventanilla"` → mantener igual

#### KPI 3 — Stock
- Título actual: `"STOCK TOTAL"` → cambiar a: **`"Productores de maíz cercanos a tus bodegas"`**
- Valor: actualmente muestra las toneladas en stock — este KPI debe mostrar el **número de productores** con disponibilidad declarada en el radio de las bodegas del usuario
- Subtítulo: mostrar las toneladas aproximadas disponibles: `"~X ton disponibles en el área"`

#### KPI 4 — Ocupación
- Título actual: `"OCUPACIÓN"` → cambiar a: **`"Ocupación del almacén"`**
- La fórmula y el valor deben mostrar los **tres datos juntos**:

```
Ocupación del almacén

        72%
████████████░░░░  

3,600 ton almacenadas
de 5,000 ton de capacidad total
476 ton de espacio disponible
```

- Fórmula backend:
  ```
  % ocupación = (SUM(volumen_almacenamiento) / SUM(capacidad_ton)) × 100
  ```
  Suma de todas las bodegas del usuario (JOIN bodeguero_bodegas → bodegas → último inventario por bodega)
- Color de la barra de progreso:
  - Verde: < 70%
  - Amarillo/naranja: 70% – 90%
  - Rojo: > 90%

---

### C-22 — Nuevo módulo: Precios (3 tipos de precio + construcción visual)
**Tipo:** Nuevo módulo  
**Prioridad:** Alta  
**Pantalla:** B-22 — Vista de Mercado y Precios (ampliar/reemplazar lo existente)

**Descripción:**  
Este módulo muestra al usuario bodega los 3 tipos de precio del maíz de forma visual, amigable y explicativa. Los datos vienen del perfil de administrador — el usuario bodega solo los consulta, no los edita.

---

#### Estructura de la pantalla (de arriba hacia abajo):

**Bloque 1 — Los 3 tipos de precio (tarjetas visuales)**

Tres tarjetas con colores distintos, íconos grandes y texto explicativo:

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  🌍 Precio Inter-   │  │  🏪 Precio de       │  │  💰 Precio de       │
│  nacional / Margen  │  │  Compra             │  │  Venta              │
│  de negociación     │  │                     │  │                     │
│                     │  │                     │  │                     │
│   $X,XXX/ton        │  │   $X,XXX/ton        │  │   $X,XXX/ton        │
│                     │  │                     │  │                     │
│  Referencia del     │  │  Lo que la bodega   │  │  Precio total de    │
│  mercado global     │  │  paga al productor  │  │  la cadena hasta    │
│  (Chicago CME)      │  │  más sus servicios  │  │  la harinera        │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

- Tarjeta 1 (azul): Precio Internacional / Margen de negociación
- Tarjeta 2 (verde): Precio de Compra = lo que paga al productor + servicios de bodega
- Tarjeta 3 (naranja): Precio de Venta = precio total de la cadena

**Bloque 2 — Cómo se construye este precio (diagrama visual)**

Sección explicativa con cajitas y flechas que muestre:

```
  [Dato del productor]     [Tarifario de la bodega]    [Parámetros del admin]
   Precio que pagas   +    Secado + limpieza      +    Margen + Flete GIS
         PO                       S                         M + F
         │                        │                           │
         └────────────────────────┴───────────────────────────┘
                                  │
                          PRECIO DE VENTA
                    (lo que paga la harinera)
```

Texto debajo: *"Los precios que tú capturas diariamente contribuyen a construir estos valores para toda la región"*

**Bloque 3 — Tu posición en el mercado**

Comparativo del precio que publica la bodega vs otras bodegas del mismo municipio:

```
Tu precio hoy:           $4,500/ton
Promedio del municipio:  $4,380/ton
                         ↑ Estás $120 por encima del promedio
```

- Solo mostrar el precio comparativo — **nunca el nombre de otras bodegas**
- Si hay menos de 3 bodegas en el municipio con precio publicado: no mostrar este bloque (insuficiente para comparar de forma anónima)

**Bloque 4 — Gráfica de tendencia**

Gráfica de línea (Recharts) con los últimos 30 días:
- Línea verde: precio que publica esta bodega
- Línea gris punteada: promedio del municipio
- Eje X: fechas, Eje Y: MXN/ton
- Tooltip al hover con los dos valores del día

**Endpoint requerido:**
```
GET /api/precios/mercado?bodega_id=X&periodo=30d
Respuesta: {
  precio_internacional: number,
  precio_compra: number,
  precio_venta: number,
  mi_precio_hoy: number,
  promedio_municipio: number,
  diferencia: number,
  tendencia: [{ fecha, mi_precio, promedio_municipio }]
}
```

---

## RESUMEN DE BUGS CRÍTICOS (resolver primero)

| # | Bug | Impacto |
|---|---|---|
| C-03 | Inventario sobrescribe registro anterior | Pérdida de datos históricos |
| C-16 | Transacciones no se guardan | Módulo completamente no funcional |
| C-02 | Datos de bodega en 0 | Información incorrecta para el usuario |

---

## RESUMEN DE CAMBIOS EN BASE DE DATOS

| Tabla | Tipo de cambio | Descripción |
|---|---|---|
| `usuarios` | Verificar | Campo `rol` debe tener valor `'bodega'` no `'bodeguero'` |
| `cat_catalog` | UPDATE/SEED | Solo 3 valores en `tipo_maiz`: blanco, amarillo, criollo |
| `cat_crop_variety` | SEED completo | Reemplazar con las variedades validadas de C-12 |
| `inventarios` | Verificar lógica | INSERT siempre, nunca UPDATE al capturar inventario |
| `precios` | Verificar lógica | INSERT siempre, nunca UPDATE al capturar precio |
| `senales_compra` | ALTER TABLE | Agregar `vigencia_inicio DATE` y `vigencia_fin DATE` |
| `transacciones` | Debug | Investigar por qué los registros no persisten (C-16) |
| `ventanillas` | Verificar lógica | Permite múltiples registros por bodega_id |

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Próxima revisión: tras entrega de correcciones por el equipo de desarrollo*
