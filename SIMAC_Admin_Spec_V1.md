# SIMAC — Plan Nacional Maíz 2026

## Módulo Admin — Especificación Técnica

v1.0 · Mayo 2026 · Para el desarrollador

Repo: github.com/Jesus200995/Simulador

App: app-bodega/ (React + Vite + Tailwind CSS)

**Verde primario: #1A5C38**

## Índice del documento

1. Contexto y decisiones de arquitectura

2. Acceso — login y guard RequireAdmin

3. Estructura de navegación del módulo Admin

4. Pantalla A0 — Dashboard / Resumen General

5. Pantalla A1 — Gestión de Productores

6. Pantalla A2 — Infraestructura / Bodegas

7. Pantalla A3 — Alertas

8. Pantalla A4 — Módulo de Precios (resumen en dashboard)

9. Endpoints de API requeridos

10. Estados de UI y manejo de errores

11. Checklist de entrega

## 1. CONTEXTO Y DECISIONES DE ARQUITECTURA

### 1.1 Qué existe y qué se construye

El backend está prácticamente completo. Todos los endpoints Admin ya existen en el repo. Lo que se construye en esta especificación es el frontend React en app-bodega/ — no existe ninguna pantalla Admin en esa carpeta actualmente.

> *⚠️ appbodegas/ (Vue) tiene AdminView.vue y DashboardAdminView.vue pero está CONGELADO — no extender, no migrar, solo usar como referencia visual de qué datos se mostraban.*

| **Elemento**                      | **Estado**                  | **Acción requerida**            |
|-----------------------------------|-----------------------------|---------------------------------|
| Endpoints /api/admin/*           | ✅ Existen en backend       | Solo consumir desde el frontend |
| Endpoints /api/dashboard/admin/* | ✅ Existen en backend       | Solo consumir desde el frontend |
| Guard RequireAdmin                | ❌ No existe en app-bodega/ | Crear en router.tsx             |
| Carpeta /admin en app-bodega/src/ | ❌ No existe                | Crear estructura completa       |
| Login /admin/login                | ❌ No existe                | Crear LoginAdminPage.tsx        |
| appbodegas/ AdminView.vue         | ⏸ Congelado                 | Solo referencia — no tocar      |

### 1.2 Roles del sistema

El JWT ya define 5 roles. Para el módulo Admin:

| **Rol**                            | **Acceso al módulo Admin**                                                               | **Restricciones**     |
|------------------------------------|------------------------------------------------------------------------------------------|-----------------------|
| admin                              | Acceso completo — todas las pantallas y acciones                                         | Ninguna               |
| responsable                        | Acceso de solo lectura — puede ver todo pero no modificar parámetros ni aprobar/rechazar | Sin botones de acción |
| bodeguero / productor / supervisor | Sin acceso — redirige a su dashboard                                                     | Guard bloquea la ruta |

### 1.3 Estructura de archivos a crear

Crear la siguiente estructura dentro de app-bodega/src/:

> app-bodega/src/
>
> ├── pages/
>
> │ └── admin/
>
> │ ├── LoginAdminPage.tsx
>
> │ ├── DashboardAdminPage.tsx
>
> │ ├── ProductoresAdminPage.tsx
>
> │ ├── ProductorDetalleAdminPage.tsx
>
> │ ├── BodegasAdminPage.tsx
>
> │ ├── BodegaDetalleAdminPage.tsx
>
> │ ├── AlertasAdminPage.tsx
>
> │ └── PreciosAdminPage.tsx
>
> ├── components/
>
> │ └── admin/
>
> │ ├── AdminShell.tsx ← layout con sidebar
>
> │ ├── KpiCard.tsx
>
> │ ├── ActividadReciente.tsx
>
> │ └── DiscrepanciasPanel.tsx
>
> └── router.tsx ← agregar rutas /admin/* con RequireAdmin

## 2. ACCESO — LOGIN Y GUARD REQUIREADMIN

### 2.1 Ruta y comportamiento del login Admin

URL: /admin/login

Componente: LoginAdminPage.tsx

#### Formulario

- Campo: Correo electrónico (type=email, requerido)

- Campo: Contraseña (type=password, requerido)

- Botón: 'Ingresar al panel' — color verde #1A5C38, ancho completo

- Link: 'Volver al inicio' — lleva a /login (login general del sistema)

#### Comportamiento

1.  POST /api/auth/login con { email, password }

2.  Si JWT devuelve rol !== 'admin' && rol !== 'responsable' → mostrar error: 'No tienes permisos para acceder al panel administrativo'

3.  Si JWT devuelve rol === 'admin' o 'responsable' → guardar token en Zustand store + localStorage → redirigir a /admin

4.  Si credenciales incorrectas → mensaje de error bajo el formulario, no limpiar el email

> *ℹ️ El endpoint de login es el mismo que usa el bodeguero: POST /api/auth/login. La diferencia es que el guard verifica el rol en el JWT antes de permitir acceso a /admin/*.*

### 2.2 Guard RequireAdmin

Crear en app-bodega/src/router.tsx junto a los guards existentes (RequireProductor, RequireBodeguero):

> // RequireAdmin — agregar en router.tsx
>
> function RequireAdmin({ children }: { children: ReactNode }) {
>
> const { user } = useAuthStore();
>
> if (!user) return \<Navigate to='/admin/login' replace /\>;
>
> if (user.rol !== 'admin' && user.rol !== 'responsable')
>
> return \<Navigate to='/login' replace /\>;
>
> return \<\>{children}\</\>;
>
> }

#### Rutas a proteger con RequireAdmin

- /admin → DashboardAdminPage

- /admin/productores → ProductoresAdminPage

- /admin/productores/:id → ProductorDetalleAdminPage

- /admin/bodegas → BodegasAdminPage

- /admin/bodegas/:id → BodegaDetalleAdminPage

- /admin/alertas → AlertasAdminPage

- /admin/precios → PreciosAdminPage

### 2.3 AdminShell — layout con sidebar

Todas las pantallas /admin/* usan AdminShell.tsx como wrapper. Contiene:

#### Sidebar izquierdo (fijo, 240px)

- Logo SIMAC + texto 'Panel Administrativo'

- Nombre del admin logueado + badge de rol

- Ítems de navegación (íconos + texto):

  - 🏠 Resumen General → /admin

  - 👥 Productores → /admin/productores

  - 🏭 Bodegas → /admin/bodegas

  - 🚨 Alertas → /admin/alertas

  - 💰 Precios → /admin/precios

- Ítem activo: fondo verde #1A5C38, texto blanco

- Ítem inactivo: texto gris, hover fondo verde claro

- Botón 'Cerrar sesión' al fondo del sidebar

#### Área de contenido (flex-1, overflow-y-auto)

- Header: título de la pantalla actual + breadcrumb

- Contenido de la pantalla específica

## 3. ESTRUCTURA DE NAVEGACIÓN

| **Ruta**               | **Componente**            | **Título en sidebar** | **Endpoint principal**                                           |
|------------------------|---------------------------|-----------------------|------------------------------------------------------------------|
| /admin                 | DashboardAdminPage        | Resumen General       | GET /api/dashboard/admin/resumen                                 |
| /admin/productores     | ProductoresAdminPage      | Productores           | GET /api/admin/usuarios + GET /api/dashboard/admin/operacion     |
| /admin/productores/:id | ProductorDetalleAdminPage | — (sub-página)        | GET /api/admin/usuarios/:id                                      |
| /admin/bodegas         | BodegasAdminPage          | Bodegas               | GET /api/admin/bodegas-pendientes + GET /api/bodegas             |
| /admin/bodegas/:id     | BodegaDetalleAdminPage    | — (sub-página)        | GET /api/bodegas/:id                                             |
| /admin/alertas         | AlertasAdminPage          | Alertas               | GET /api/dashboard/admin/alertas                                 |
| /admin/precios         | PreciosAdminPage          | Precios               | GET /api/precios/referencias/externas + /api/precios/sistema/hoy |

## 4. PANTALLA A0 — DASHBOARD / RESUMEN GENERAL

### 4.1 Layout de la pantalla

URL: /admin

La pantalla tiene 4 secciones en orden vertical:

5.  Header con fecha del día y badge EN VIVO

6.  6 KPI Cards en grid de 3 columnas

7.  Tarjeta resumen de Precios del día + botón Ver detalle

8.  Tabla de actividad reciente

### 4.2 Las 6 KPI Cards

Grid de 3 columnas (responsive: 2 en tablet, 1 en móvil). Cada card: borde izquierdo de 4px de color, sombra suave, border-radius 12px.

| **#** | **KPI**                     | **Color borde**      | **Dato principal**                           | **Badge secundario**            | **Endpoint**                       |
|--------|-----------------------------|----------------------|----------------------------------------------|---------------------------------|------------------------------------|
| 1      | Productores Activos         | #1A5C38 verde       | COUNT(productor, estado_validacion='activo') | ⚠ X pendientes de validación    | /api/dashboard/admin/operacion     |
| 2      | Bodegas Activas             | #2563EB azul        | COUNT(bodegas, estatus='aprobada')           | ⚠ X pendientes de aprobación    | /api/admin/bodegas-pendientes      |
| 3      | Transacciones (7d)          | #4A9B6A verde claro | COUNT(transacciones, últimos 7 días)         | Delta vs semana anterior ↑↓     | /api/precios/transacciones/resumen |
| 4      | Alertas Activas             | #DC2626 rojo        | COUNT(alertas activas, nivel≥media)          | X críticas / X medias / X bajas | /api/dashboard/admin/alertas       |
| 5      | Requerimientos de Compra    | #D97706 naranja     | COUNT(senales_compra activas)                | Total toneladas buscadas        | GET /api/bodegas (filtrar activas) |
| 6      | Disponibilidades Declaradas | #1A5C38 verde       | COUNT(disponibilidad_productor activas)      | Total toneladas disponibles     | /api/dashboard/admin/resumen       |

> *ℹ️ Si el valor de pendientes en las cards 1 o 2 es \> 0, el badge debe ser amarillo/naranja con ícono de advertencia. Si es 0, no mostrar badge.*

### 4.3 Tarjeta resumen de Precios

Debajo de los KPIs, una tarjeta ancha (ancho completo) con fondo verde oscuro #1A5C38:

- Título: 'Precios del Maíz Blanco · Hoy' — texto blanco

- 3 valores en flex-row, separados por divisores verticales:

  - Margen de Negociación: \$X,XXX MXN/ton — con label y fuente (Chicago + Banxico)

  - Precio de Compra: \$X,XXX MXN/ton — con label 'PO + S'

  - Precio de Venta: \$X,XXX MXN/ton — en verde claro si positivo, rojo si negativo

- Timestamp: 'Actualizado hoy a las 7:00am' o badge 'Datos de ayer' si no hay datos del día

- Botón 'Ver detalle completo →' alineado a la derecha — navega a /admin/precios

> *⚠️ Si Chicago o TC están desactualizados, mostrar badge rojo 'Error de actualización' y botón 'Actualizar ahora' dentro de esta tarjeta.*

### 4.4 Tabla de Actividad Reciente

Tabla con los últimos 20 eventos del sistema, ordenados por fecha descendente. Paginación: 20 por página.

| **Columna** | **Contenido**              | **Ejemplo**                                            |
|-------------|----------------------------|--------------------------------------------------------|
| Tipo        | Ícono + label de categoría | ✅ Validación / 🏭 Bodega / 💰 Transacción / 🚨 Alerta |
| Descripción | Texto del evento           | 'Productor Juan Pérez (Tipo B) aprobado'               |
| Actor       | Quién generó el evento     | Admin / Sistema / Bodeguero nombre                     |
| Fecha/Hora  | Timestamp relativo         | 'Hace 5 min' / 'Hoy 09:32' / 'Ayer 14:15'              |
| Acción      | Link si aplica             | 'Ver detalle' → navega a la entidad relevante          |

Fuente del dato: GET /api/dashboard/admin/operacion — agregar campo 'eventos_recientes' al response si no existe, o crear GET /api/admin/actividad-reciente con los últimos 50 eventos de las tablas: producer (inserts/updates), bodegas (estatus changes), transacciones (inserts), alertas_externas (inserts).

## 5. PANTALLA A1 — GESTIÓN DE PRODUCTORES

### 5.1 Layout general

URL: /admin/productores

Una sola pantalla con 3 tabs en la parte superior. El tab activo se recuerda con estado local (useState).

| **Tab**     | **Contenido**                                                 | **Badge en el tab**                   |
|-------------|---------------------------------------------------------------|---------------------------------------|
| Pendientes  | Productores Tipo B con estado_validacion = 'pendiente'        | Contador en rojo — desaparece si es 0 |
| Todos       | Padrón completo con filtros                                   | Total de productores registrados      |
| Suspendidos | Productores con estado_validacion = 'inactivo' o 'suspendido' | Contador en gris                      |

### 5.2 Tab Pendientes

#### Filtros

- Búsqueda por texto (nombre o CURP)

- Filtro por estado (select desplegable)

- Filtro por municipio (carga según estado seleccionado)

- Ordenar por: Fecha de registro (más reciente primero — default), Nombre A-Z

#### Tabla de pendientes

| **Columna**           | **Dato**                                    | **Ancho aprox.** |
|-----------------------|---------------------------------------------|------------------|
| Nombre completo       | producer.nombre + apellidos                 | 20%              |
| CURP                  | producer.curp                               | 15%              |
| Estado / Municipio UP | up.estado + up.municipio                    | 20%              |
| Cultivo               | up.cultivo_principal + variedad             | 15%              |
| Registrado            | producer.created_at — formato 'DD MMM YYYY' | 12%              |
| Acciones              | Botones Aprobar / Rechazar + Ver detalle    | 18%              |

#### Acción Aprobar

9.  Admin hace clic en 'Aprobar'

10. Modal de confirmación: '¿Confirmas la aprobación de \[Nombre\]?' + campo opcional 'Nota interna'

11. Clic en 'Confirmar' → PATCH /api/admin/usuarios/:id/estatus con { estado_validacion: 'activo', nota: '...' }

12. El productor recibe notificación automática (sistema de notificaciones ya existente)

13. La fila desaparece del tab Pendientes y aparece en tab Todos

14. Toast de éxito: '✅ Productor aprobado correctamente'

#### Acción Rechazar

15. Admin hace clic en 'Rechazar'

16. Modal: campo OBLIGATORIO 'Motivo del rechazo' (textarea, mínimo 20 caracteres)

17. PATCH /api/admin/usuarios/:id/estatus con { estado_validacion: 'rechazado', nota: motivo }

18. Toast de éxito: 'Productor rechazado. Se le notificará el motivo.'

> *ℹ️ El campo nota/motivo se guarda en BD para auditoría. El productor lo puede ver en su pantalla de perfil.*

### 5.3 Tab Todos

#### Filtros

- Búsqueda por texto (nombre, CURP, teléfono)

- Estado (select) → municipio (select dinámico)

- Tipo: Todos / Tipo A / Tipo B

- Estatus: Todos / Activo / Pendiente / Rechazado / Suspendido

- Botón 'Limpiar filtros'

#### Tabla del padrón

Mismas columnas que el tab Pendientes + columna 'Tipo' (A/B) + columna 'Estatus' con badge de color.

Paginación: 25 registros por página. Contador total: 'Mostrando X-Y de Z productores'.

#### Colores de badge de estatus

- activo → verde #E8F5EE / texto #1A5C38

- pendiente → amarillo #FFFBEB / texto #D97706

- rechazado → rojo #FEF2F2 / texto #DC2626

- suspendido → gris #F3F4F6 / texto #6B7280

### 5.4 Tab Suspendidos

Misma tabla que 'Todos' pero filtrado a estatus suspendido/inactivo. Acción disponible: 'Reactivar' → PATCH /api/admin/usuarios/:id/estatus con { estado_validacion: 'activo' }.

### 5.5 Pantalla de Detalle del Productor

URL: /admin/productores/:id — navegar al hacer clic en cualquier fila de las tablas anteriores.

#### Secciones de la pantalla

- Header: nombre completo, CURP, tipo A/B, badge de estatus, fecha de registro

- Datos de la UP: estado, municipio, cultivo, variedad, superficie, coordenadas en mini-mapa Leaflet

- Ciclo productivo activo (si existe): ciclo PV/OI, año, rendimiento esperado, fechas

- Disponibilidades declaradas: tabla con fecha, tipo maíz, variedad, volumen, estatus

- Acciones disponibles (solo rol admin):

  - Aprobar / Rechazar (si está pendiente)

  - Suspender / Reactivar (si está activo/suspendido)

- Botón 'Volver a la lista' — regresa a /admin/productores manteniendo el tab y filtros activos

> *ℹ️ El mini-mapa muestra el centroide de la UP. Si no tiene coordenadas exactas, muestra el centroide del municipio con badge 'Ubicación aproximada'.*

## 6. PANTALLA A2 — INFRAESTRUCTURA / BODEGAS

### 6.1 Layout general

URL: /admin/bodegas

Pantalla dividida en dos columnas sincronizadas:

- Columna izquierda (40%): filtros + lista de bodegas scrolleable

- Columna derecha (60%): mapa Leaflet con marcadores

- Los filtros afectan tanto la lista como los marcadores del mapa simultáneamente

- Al filtrar por estado: el mapa hace fitBounds() a las bodegas del estado seleccionado

- Clic en una fila de la lista → el mapa vuela (flyTo) al marcador de esa bodega y abre su popup

- Clic en un marcador del mapa → la fila correspondiente se resalta en la lista

### 6.2 Filtros

- Búsqueda por texto (nombre de bodega)

- Estado (select) → municipio (select dinámico)

- Estatus: Todos / Aprobadas / Pendientes / Rechazadas

- Semáforo: Todos / 🟢 Comprando / 🟡 Cap. limitada / 🔴 No compra

- Badge contador: 'X pendientes de aprobación' — en naranja si \> 0

### 6.3 Lista de bodegas

Cada ítem de la lista muestra:

- Nombre de la bodega + municipio, estado

- Badge de estatus (aprobada/pendiente/rechazada) con color

- Badge semáforo de compra (🟢/🟡/🔴)

- Capacidad: X,XXX ton

- Al hacer clic: navega a /admin/bodegas/:id

Paginación: 20 por página. Paginación visible en la lista (no en el mapa).

### 6.4 Mapa Leaflet

- Centrado en México al cargar: lat 23.6345, lon -102.5528, zoom 5

- Tiles: ESRI World Imagery (gratuito, sin API key)

- URL tiles: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}

- Capa de nombres: World_Boundaries_and_Places encima

- Marcadores por estatus:

  - Aprobada: marcador verde #1A5C38

  - Pendiente: marcador naranja #D97706

  - Rechazada: marcador gris #9CA3AF

- Popup al tocar marcador: nombre, municipio, estatus, semáforo, capacidad, botón 'Ver detalle'

### 6.5 Pantalla de Detalle de Bodega

URL: /admin/bodegas/:id

#### Secciones

- Header: nombre bodega, estatus badge, semáforo badge, botones de acción (Aprobar/Rechazar si pendiente)

- Datos generales: dirección, municipio, estado, capacidad total, coordenadas

- Inventario actual: tabla con tipo maíz, variedad, stock en toneladas, fecha último registro

- Tarifario de servicios: tabla con concepto, precio por tonelada, fecha de actualización — badge rojo si \> 60 días sin actualizar

- Requerimientos de compra activos: tabla con tipo maíz, variedad, volumen buscado, precio ofrecido, radio km, vigencia

- Transacciones recientes (últimos 30 días): tabla con fecha, productor, tipo maíz, volumen, precio, estatus confirmación

#### Acción Aprobar bodega

19. Solo visible si estatus = 'pendiente'

20. Modal: '¿Aprobar la bodega \[nombre\]?' + nota opcional

21. PATCH /api/bodegas/:id/aprobar

22. Toast éxito + badge de estatus cambia a 'aprobada'

#### Acción Rechazar bodega

23. Modal: motivo OBLIGATORIO (textarea)

24. PATCH /api/bodegas/:id/rechazar

25. Toast: 'Bodega rechazada.'

## 7. PANTALLA A3 — ALERTAS

### 7.1 Layout

URL: /admin/alertas

Pantalla dividida en dos columnas:

- Columna izquierda (35%): filtros + lista de alertas scrolleable

- Columna derecha (65%): mapa Leaflet con zonas de alerta superpuestas

### 7.2 Tipos de alerta y fuentes

| **Tipo**               | **Ícono** | **Fuente**                                             | **Editable por Admin**          |
|------------------------|-----------|--------------------------------------------------------|---------------------------------|
| Fitosanitaria SENASICA | 🌿        | Externa — CSV SENASICA cargado por migración           | No — solo lectura               |
| Climática              | 🌦️        | Externa — fuente meteorológica / cargada por migración | No — solo lectura               |
| Operativa del sistema  | ⚙️        | Interna — generada por el sistema automáticamente      | Sí — puede marcar como atendida |
| Mercado                | 📈        | Interna — calculada cuando brecha de precio \> umbral  | Sí — puede marcar como atendida |

### 7.3 Filtros de la lista

- Tipo: Todas / Fitosanitaria / Climática / Operativa / Mercado

- Nivel: Todos / 🔴 Alta / 🟡 Media / 🟢 Baja

- Estado: Activas / Atendidas / Todas

- Estado (geografía): select de estado mexicano

### 7.4 Lista de alertas

Cada ítem muestra:

- Ícono de tipo + badge de nivel con color (rojo/naranja/verde)

- Título de la alerta

- Alcance geográfico: estado(s) afectado(s)

- Fecha de inicio y vigencia

- Para alertas operativas/mercado: botón 'Marcar como atendida'

#### Acción Marcar como atendida

26. Disponible solo para alertas de tipo Operativa y Mercado

27. Clic en botón → modal de confirmación con campo 'Notas de resolución' (opcional)

28. PATCH /api/dashboard/admin/alertas/:id con { estado: 'atendida', notas: '...' }

29. La alerta pasa al grupo 'Atendidas' — no se elimina, se archiva

### 7.5 Mapa de alertas

- Mismo stack Leaflet + ESRI World Imagery

- Zonas de alerta como polígonos semitransparentes encima del mapa

- Color del polígono según nivel: rojo 30% opacidad (alta), naranja (media), verde (baja)

- Al tocar un polígono: popup con título, tipo, nivel, alcance y fecha

- Al seleccionar una alerta de la lista: el mapa hace flyTo al área afectada

- Toggle en el mapa para mostrar/ocultar por tipo de alerta

> *⚠️ Si las alertas no tienen geometría de polígono (solo tienen estado como texto), mostrar marcadores puntales en el centroide del estado afectado en lugar de polígonos.*

## 8. PANTALLA A4 — MÓDULO DE PRECIOS

### 8.1 Dos niveles de visualización

El módulo de precios existe en dos lugares:

- Tarjeta resumen en el Dashboard (/admin) — ya especificada en sección 4.3

- Pantalla completa /admin/precios — especificada en esta sección

> *ℹ️ La lógica completa de los 3 precios y las fuentes de datos (Yahoo Finance + Banxico API) se especifica en el documento separado: SIMAC_Spec_Precios_Admin_V1.md — este documento cubre la integración de esa lógica dentro del módulo Admin.*

### 8.2 Layout de la pantalla /admin/precios

Pantalla de dos columnas con los siguientes bloques en orden:

| **#** | **Bloque**                                                                | **Columna**            | **Prioridad** |
|--------|---------------------------------------------------------------------------|------------------------|---------------|
| 1      | Barra de estado: Chicago, TC Banxico, timestamp, botón 'Actualizar ahora' | Ancho completo         | OBLIGATORIO   |
| 2      | Los 3 precios: Margen Negociación, Precio Compra, Precio Venta            | Izquierda (60%)        | OBLIGATORIO   |
| 3      | Gráfica tendencia 30 días (3 líneas)                                      | Izquierda (60%)        | OBLIGATORIO   |
| 4      | Tabla de bodegas que publicaron precio hoy                                | Izquierda (60%)        | OBLIGATORIO   |
| 5      | Panel referencias (Chicago, TC, Bono Maíz)                                | Derecha (40%)          | OBLIGATORIO   |
| 6      | Utilidad Estimada FIRA por estado/municipio                               | Derecha (40%)          | OBLIGATORIO   |
| 7      | Historial actualizaciones Chicago/TC                                      | Derecha (40%)          | OBLIGATORIO   |
| 8      | Panel de discrepancias pendientes                                         | Derecha (40%)          | OBLIGATORIO   |
| 9      | Tabla de brechas por estado                                               | Ancho completo (abajo) | OBLIGATORIO   |

### 8.3 Barra de estado de fuentes externas

Barra horizontal en la parte superior de la pantalla. Fondo gris claro. Muestra:

- Chicago (CME): \$X.XX USD/bushel — fuente: Yahoo Finance — 'Actualizado: HH:MM'

- Tipo de cambio: \$XX.XX MXN/USD — fuente: Banxico API — 'Actualizado: HH:MM'

- Estado: badge verde 'Al día' o badge rojo 'Error — datos de ayer'

- Botón 'Actualizar ahora' (solo rol admin) — dispara POST /api/precios/actualizar-externas

> *⚠️ Si la actualización automática del cron job falló, la barra muestra el badge rojo con la fecha/hora del último dato exitoso. El botón manual está siempre visible para el admin.*

### 8.4 Los 3 precios en pantalla Admin

Misma estructura visual que en B22 y PreciosProductorPage, pero con información adicional del sistema:

#### Precio 1 — Margen de Negociación

- Mismas 4 tarjetas: Chicago, conversión ×39.368, TC Banxico, Bono Maíz \$50 USD

- Total: Margen de Negociación = \$X,XXX MXN/ton

- Fuentes citadas explícitamente: 'Yahoo Finance · cron 7:00am' y 'Banxico API · cron 7:00am'

#### Precio 2 — Precio de Compra (PO + S)

- PO = promedio de precios publicados por bodegas hoy (tipo_precio='bodega', tabla precios)

- S = promedio de tarifario_servicios de bodegas activas con tarifario actualizado ≤60 días

- Si S = 0 (sin tarifarios): mostrar bloque azul con texto 'Sin datos de tarifario — las bodegas no han publicado servicios'

- Mostrar: N bodegas incluidas en el promedio de PO, N bodegas incluidas en S

#### Precio 3 — Precio de Venta

- Precio de Compra − Margen de Negociación

- Calculado en frontend con los valores ya obtenidos

- Verde si positivo, rojo si negativo

### 8.5 Tabla de bodegas que publicaron precio hoy

Tabla debajo de los 3 precios. Muestra qué bodegas reportaron precio de compra hoy:

| **Columna**      | **Dato**                                       |
|------------------|------------------------------------------------|
| Bodega           | nombre + municipio, estado                     |
| Precio publicado | precios.precio en MXN/ton                      |
| Tipo maíz        | precios.tipo_maiz                              |
| Hora             | precios.created_at — formato HH:MM             |
| Vs. promedio     | diferencia en \$ y % vs el PO promedio del día |

Fuente: GET /api/precios con filtro fecha=hoy y tipo_precio='bodega'

Si ninguna bodega publicó precio hoy: mostrar mensaje 'Ninguna bodega ha publicado precio hoy. El PO usa el promedio de los últimos 7 días.'

### 8.6 Gráfica de tendencia 30 días

- Librería: Chart.js v4 (ya instalado en el proyecto)

- Tipo: LineChart, altura 200px

- 3 series:

  - Margen de Negociación: línea sólida 2px, color #1A5C38, área rellena opacidad 0.08

  - Precio de Compra: línea sólida 2px, color #2563EB, sin relleno

  - Precio de Venta: línea punteada 1.5px, color #D97706, sin relleno

- Tooltip al hover: los 3 valores del día en tooltip oscuro

- Eje X: fechas, máximo 8 ticks, formato 'DD MMM'

- Eje Y: valores en pesos con '\$' y separador de miles

- Chips de leyenda custom arriba del gráfico (no usar leyenda nativa de Chart.js)

- Fuente: GET /api/precios/tendencia con parámetro dias=30

### 8.7 Panel de referencias externas (columna derecha)

- Chicago USD/bushel: valor + fecha de actualización

- Chicago MXN/ton: valor calculado (chicago × 39.368 × TC)

- Tipo de cambio Banxico: valor + fecha

- Bono Maíz: \$50 USD/ton (constante — hardcodeado, no viene de BD)

- Precio de Garantía SADER: valor de GET /api/precios/parametros

### 8.8 Utilidad Estimada FIRA (columna derecha, solo Admin)

Tabla con costo FIRA por estado/municipio vs PO regional:

| **Columna**        | **Dato**                                                         |
|--------------------|------------------------------------------------------------------|
| Estado / Municipio | Nombre geográfico                                                |
| Costo FIRA         | MXN/ton — de tabla costos_fira (riego y temporal por separado)   |
| PO Regional        | Promedio PO de bodegas en esa zona                               |
| Utilidad Est.      | PO − Costo FIRA en MXN/ton — verde si positivo, rojo si negativo |

- Solo muestra estados con dato en costos_fira: Jalisco, Sinaloa, Guanajuato (migración v13)

- Si el dato es por municipio: mostrar municipio; si solo hay dato estatal: mostrar estado

- Fuente: GET /api/precios/referencias/externas (ya incluye costo_fira según el response existente)

- Botón 'Actualizar datos FIRA' → modal para subir CSV. El CSV debe tener columnas: estado, municipio (opcional), ciclo, modalidad, costo_por_ton

### 8.9 Historial de actualizaciones (columna derecha)

Tabla compacta de las últimas 10 actualizaciones de Chicago y TC:

| **Columna**              | **Dato**                               |
|--------------------------|----------------------------------------|
| Fecha/Hora               | Timestamp de la actualización          |
| Fuente                   | Yahoo Finance / Banxico / Manual Admin |
| Chicago anterior → nuevo | X.XX → X.XX USD/bushel                 |
| TC anterior → nuevo      | XX.XX → XX.XX MXN/USD                  |

Fuente: crear tabla precio_actualizaciones_log en BD o agregar endpoint GET /api/precios/actualizaciones-log que devuelva los últimos 20 registros de cuando se actualizaron chicago y TC.

### 8.10 Panel de discrepancias (columna derecha)

Lista scrolleable de transacciones con discrepancias pendientes de resolver:

- Cada ítem: nombre productor, bodega, fecha, volumen, precio bodega vs precio productor

- Badge de prioridad: ALTA (rojo) / MEDIA (naranja) / BAJA (gris)

- Botón 'Resolver' → modal con campo de notas + botón confirmar

- PUT /api/precios/discrepancias/:id/resolver con { resolucion: 'descripción', notas: '...' }

- Si no hay discrepancias: '✅ Sin discrepancias pendientes'

- Fuente: GET /api/precios/discrepancias

### 8.11 Tabla de brechas por estado (ancho completo, abajo)

Tabla ordenada por brecha mayor a menor. Solo estados con ≥ 5 transacciones en los últimos 7 días:

| **Columna**   | **Dato**                                                        |
|---------------|-----------------------------------------------------------------|
| Estado        | Nombre del estado                                               |
| PO Promedio   | Precio promedio que pagan las bodegas                           |
| Margen Neg.   | Margen de Negociación calculado para ese estado                 |
| Brecha        | PO Promedio − Margen Negociación en \$ y %                      |
| Nivel         | Badge: 🔴 Crítica (\>20%) / 🟡 Media (10-20%) / 🟢 Baja (\<10%) |
| Transacciones | Cantidad usada para el promedio                                 |

Fuente: GET /api/precios/brechas/estados

### 8.12 Exportar CSV

- Botón 'Descargar CSV' en la esquina superior derecha de la pantalla /admin/precios

- El CSV incluye 2 hojas (o 2 archivos): precios_hoy.csv y tendencia_30dias.csv

- precios_hoy.csv: fecha, margen_negociacion, precio_compra (PO, S, total), precio_venta, chicago_usd_bushel, tc_banxico

- tendencia_30dias.csv: fecha, margen, precio_compra, precio_venta

- La descarga es del lado del cliente — construir el CSV con los datos ya cargados en memoria, sin llamada extra al backend

## 9. ENDPOINTS DE API — RESUMEN DE LO QUE SE USA Y LO QUE FALTA

### 9.1 Endpoints que YA EXISTEN — solo consumir

| **Endpoint**                                | **Método** | **Usado en**               | **Nota**                                                        |
|---------------------------------------------|------------|----------------------------|-----------------------------------------------------------------|
| GET /api/dashboard/admin/resumen            | GET        | Dashboard KPIs             | Verificar que incluye disponibilidades y requerimientos activos |
| GET /api/dashboard/admin/operacion          | GET        | Dashboard + Productores    | Verificar que devuelve conteo por estado_validacion             |
| GET /api/dashboard/admin/infraestructura    | GET        | Dashboard + Bodegas        | Verificar campos capacidad, stock, ocupacion                    |
| GET /api/dashboard/admin/alertas            | GET        | Dashboard + Alertas        | Verificar por_nivel, por_estado, por_tipo                       |
| GET /api/dashboard/admin/precios            | GET        | Dashboard precios          | Verificar que devuelve los 3 precios nuevos                     |
| GET /api/admin/usuarios                     | GET        | Gestión productores        | Agregar filtro por rol=productor + estado_validacion            |
| GET /api/admin/bodegas-pendientes           | GET        | Bodegas tab Pendientes     | Ya existe                                                       |
| PATCH /api/admin/usuarios/:id/estatus       | PATCH      | Aprobar/rechazar productor | Agregar campo nota al body                                      |
| PATCH /api/bodegas/:id/aprobar              | PATCH      | Aprobar bodega             | Ya existe                                                       |
| PATCH /api/bodegas/:id/rechazar             | PATCH      | Rechazar bodega            | Ya existe                                                       |
| GET /api/bodegas                            | GET        | Mapa y lista bodegas       | Verificar que devuelve latitud/longitud                         |
| GET /api/precios/referencias/externas       | GET        | Panel referencias          | MOVER de hardcodeado a Yahoo Finance + Banxico                  |
| GET /api/precios/tendencia                  | GET        | Gráfica 30 días            | chicago hardcodeado — requiere fix                              |
| GET /api/precios/brechas/estados            | GET        | Tabla brechas              | Ya existe                                                       |
| GET /api/precios/discrepancias              | GET        | Panel discrepancias        | Ya existe                                                       |
| PUT /api/precios/discrepancias/:id/resolver | PUT        | Resolver discrepancias     | Ya existe                                                       |
| GET /api/precios/parametros                 | GET        | Panel referencias SADER    | Ya existe                                                       |

### 9.2 Endpoints que FALTAN — crear en backend

| **Endpoint**                          | **Método** | **Para qué**             | **Descripción**                                                                                                         |
|---------------------------------------|------------|--------------------------|-------------------------------------------------------------------------------------------------------------------------|
| POST /api/precios/actualizar-externas | POST       | Botón 'Actualizar ahora' | Dispara llamada a Yahoo Finance y Banxico API, guarda resultado, retorna nuevos valores                                 |
| GET /api/admin/actividad-reciente     | GET        | Tabla actividad reciente | Devuelve últimos 50 eventos de tablas producer, bodegas, transacciones, alertas con tipo, descripción, actor, timestamp |
| GET /api/precios/actualizaciones-log  | GET        | Historial Chicago/TC     | Devuelve últimas 20 actualizaciones de referencias externas con valor anterior/nuevo                                    |
| POST /api/precios/fira/upload-csv     | POST       | Subir CSV FIRA           | Recibe CSV, valida columnas, hace upsert en tabla costos_fira                                                           |

### 9.3 Fix crítico requerido en backend — Chicago y TC

> *🔴 CRÍTICO: El endpoint GET /api/precios/referencias/externas tiene chicago_usd_bushel, tc_banxico y chicago_mxn hardcodeados con valores fijos. Esto es el cambio más importante antes de usar el módulo de precios en producción.*

#### Instrucciones para el desarrollador backend

30. Instalar librería: npm install yahoo-finance2 (o axios para llamada directa a Yahoo Finance)

31. Símbolo de maíz en Yahoo Finance: ZC=F (Corn Futures — CBOT, en USD/bushel)

32. Símbolo tipo de cambio en Yahoo Finance: MXN=X (USD/MXN spot)

33. Alternativa Banxico API oficial para TC: https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno — requiere token Banxico gratuito

34. Crear cron job con node-cron que corre a las 7:00am hora México (America/Mexico_City):

> cron.schedule('0 7 * * *', () =\> actualizarReferenciasExternas(), { timezone: 'America/Mexico_City' });

35. La función actualizarReferenciasExternas() debe:

    - Llamar a Yahoo Finance para obtener ZC=F (Chicago) y MXN=X (TC)

    - Guardar en tabla precio_referencias_externas: chicago_usd_bushel, chicago_usd_ton, chicago_mxn, tc_banxico, fecha, fuente, creado_por='cron'

    - Si la llamada falla: mantener el último valor exitoso y marcar campo error=true

36. El endpoint GET /api/precios/referencias/externas debe consultar esta tabla en lugar de devolver valores hardcodeados

37. El endpoint POST /api/precios/actualizar-externas hace lo mismo pero con creado_por='admin_manual'

> *ℹ️ Si no existe la tabla precio_referencias_externas en BD, crearla con migración v14: id, chicago_usd_bushel, chicago_usd_ton, chicago_mxn, tc_banxico, garantia_sader, costo_fira, fecha, fuente, error, created_at.*

## 10. ESTADOS DE UI Y MANEJO DE ERRORES

| **Estado**                      | **Cuándo ocurre**                                           | **Qué mostrar**                                                              |
|---------------------------------|-------------------------------------------------------------|------------------------------------------------------------------------------|
| Cargando                        | Al montar el componente o aplicar filtros                   | Skeleton loaders en cada card y tabla — NO spinner global                    |
| Sin datos                       | Tabla vacía (sin productores pendientes, sin bodegas, etc.) | Mensaje descriptivo con ícono: 'No hay productores pendientes de validación' |
| Error de API                    | Falla de red o error 500                                    | Card de error con botón 'Reintentar'. No dejar pantalla en blanco.           |
| Chicago/TC desactualizado       | El cron job falló o datos \> 24h                            | Badge rojo 'Datos desactualizados' + botón 'Actualizar ahora'                |
| S sin datos (tarifarios vacíos) | Sin tarifarios en BD                                        | Bloque azul 'Sin datos de servicios — bodegas no han publicado tarifario'    |
| Sin discrepancias               | Panel 7C vacío                                              | '✅ Sin discrepancias pendientes. Todos los datos están validados.'          |
| Sin permisos (responsable)      | Rol responsable intenta editar                              | Ocultar botones de acción. Solo lectura visible.                             |
| Precio de Venta negativo        | PO + S \< Margen de Negociación                             | Mostrar el valor en rojo con ícono ⚠️ — no ocultar ni ajustar                |

## 11. CHECKLIST DE ENTREGA

#### Acceso y autenticación

- Login /admin/login funciona — POST /api/auth/login con validación de rol

- Usuarios con rol != admin o responsable no pueden acceder a /admin/*

- RequireAdmin guard creado y aplicado a todas las rutas /admin/*

- AdminShell con sidebar navegable y estado activo correcto

- Cerrar sesión limpia el store de Zustand y redirige a /admin/login

#### Dashboard

- 6 KPI cards con datos reales del backend

- Badges de pendientes en cards 1 y 2 (naranja si \> 0, oculto si = 0)

- Tarjeta resumen de precios con los 3 valores y botón 'Ver detalle'

- Tabla de actividad reciente con paginación

#### Productores

- 3 tabs: Pendientes / Todos / Suspendidos

- Badge rojo en tab Pendientes con contador (desaparece si = 0)

- Filtros funcionando en los 3 tabs

- Aprobar con modal de confirmación + nota opcional

- Rechazar con motivo OBLIGATORIO (validación de mínimo 20 caracteres)

- Pantalla de detalle con mini-mapa Leaflet

- Botón 'Volver' mantiene tab y filtros activos

#### Bodegas

- Lista + mapa sincronizados — filtros afectan ambos

- Zoom automático al filtrar por estado

- Clic en lista → flyTo en mapa

- Clic en marcador → resalta en lista

- Detalle de bodega con tarifario, inventario, requerimientos y transacciones

- Aprobar/rechazar desde el detalle

#### Alertas

- Lista + mapa sincronizados

- 4 tipos de alerta con filtros

- Marcar como atendida solo para operativas y mercado

- Polígonos o marcadores en mapa según tipo

#### Precios

- Barra de estado con Chicago y TC — badge verde 'Al día' o rojo 'Error'

- Botón 'Actualizar ahora' funcional (POST /api/precios/actualizar-externas)

- Chicago y TC vienen de Yahoo Finance + Banxico API — NO hardcodeados

- Los 3 precios muestran datos reales

- Precio de Venta negativo muestra en rojo

- S = 0 muestra bloque de aviso — no \$0

- Gráfica 30 días con 3 líneas y tooltip

- Tabla de bodegas que publicaron precio hoy

- Utilidad FIRA por estado/municipio solo visible para admin

- Subir CSV FIRA funcional con validación de columnas

- Historial de actualizaciones Chicago/TC

- Panel de discrepancias con acción Resolver

- Tabla de brechas por estado

- Descarga CSV funcional (cliente, sin llamada extra al backend)

*Plan Nacional Maíz 2026 · SIMAC — Módulo Admin · v1.0 · Mayo 2026*

*Confidencial — Uso interno del equipo de desarrollo*
