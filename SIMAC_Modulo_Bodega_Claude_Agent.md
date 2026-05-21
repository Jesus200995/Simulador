# SIMAC — Módulo Bodega

**Documento optimizado para Claude Agent / implementación técnica**  
**Origen:** `SIMAC_DocTecnico_Bodega_V1.docx`  
**Versión base:** 1.0 — Mayo 2026  
**Programa:** Plan Nacional Maíz 2026

---

## Instrucciones para Claude Agent

Lee este archivo completo antes de editar código. Tu trabajo NO es rediseñar el sistema desde cero: debes conservar el backend Node.js/TypeScript, conservar la base PostgreSQL existente y crear un nuevo frontend React para el módulo Bodega.

### Reglas obligatorias

1. **No borrar ni recrear tablas existentes.** Solo agregar columnas y tablas nuevas mediante migraciones SQL secuenciales.
2. **Crear primero `migrate_v8_bodeguero.sql`.** Ahí van los `ALTER TABLE`, tablas nuevas, constraints e inserts base.
3. **Renombrar el rol funcional de `bodeguero` a `bodega`.** En `usuarios.rol` los valores válidos para este módulo son: `bodega | industria | admin`.
4. **No exponer módulos de productor, supervisor ni seguimiento en el frontend Bodega.** Esas tablas permanecen en BD para fases posteriores.
5. **Crear frontend nuevo en React 18 + Vite 5 + Tailwind CSS.** No migrar componentes Vue.
6. **Mantener la estructura del backend.** Agregar rutas nuevas en routers separados; no romper endpoints existentes.
7. **Todos los selects deben consumir catálogos desde BD.** No hardcodear `tipo_maiz`, ciclos, variedades, estados o municipios.
8. **Los datos de oferta de productores en B-11/B-12 son agregados por municipio.** Nunca mostrar datos individuales ahí.
9. **Usar color primario institucional:** `#1A5C38`.
10. **Mantener `VITE_API_URL=http://localhost:3000/api` en `.env.local`.**

### Orden recomendado de ejecución

1. Base de datos: migración `migrate_v8_bodeguero.sql`.
2. Backend: rutas de asociación de bodegas, mis bodegas y semáforo.
3. Frontend: proyecto React + auth + pantallas B-01 a B-05.
4. Inventario y precios: B-06, B-07, B-09.
5. Señales de compra y oferta agregada: B-10, B-11, B-12.
6. Transacciones, tarifario y mercado: B-13, B-14, B-15, B-16, B-22.
7. Ventanillas y apoyos: B-17 a B-21.
8. Jobs diarios, notificaciones y PWA.

### Archivos que debes crear o modificar

> Ajusta las rutas exactas al repositorio real, pero conserva esta separación por capa.

```txt
backend/
  migrations/migrate_v8_bodeguero.sql
  src/routes/bodeguero.routes.ts
  src/routes/senalesCompra.routes.ts
  src/routes/transacciones.routes.ts
  src/routes/tarifario.routes.ts
  src/routes/ventanillas.routes.ts
  src/routes/oferta.routes.ts
  src/jobs/bodegaDailyJobs.ts

frontend-react/
  .env.local
  src/services/api.ts
  src/router/index.tsx
  src/store/auth.ts
  src/layouts/BodegaLayout.tsx
  src/pages/auth/LoginPage.tsx
  src/pages/auth/RegisterPage.tsx
  src/pages/bodega/*.tsx
  src/components/*.tsx
```

---

# 1. Contexto y decisiones técnicas

## 1.1 Regla general para el desarrollador

> 🚨 CRÍTICO
> No borrar tablas existentes. Agregar columnas y tablas nuevas únicamente mediante archivos de migración nombrados secuencialmente: migrate_v8_bodeguero.sql, migrate_v9_senales.sql, etc. El módulo productor técnico, seguimiento y supervisor permanecen en la BD sin cambios, no se exponen en el frontend de este módulo.

## 1.2 Decisiones por capa

| **Capa**                   | **Decisión**            | **Justificación**                                                                                                             |
|----------------------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Backend Node.js/TypeScript | ✅ CONSERVAR y extender | Auth JWT funcional, roles.ts correcto, rutas limpias, pool PostgreSQL probado. Evita 3-4 semanas de reescritura.              |
| Base de datos PostgreSQL   | ✅ CONSERVAR y migrar   | Tablas core con datos reales cargados. Solo se agregan columnas y tablas vía migraciones SQL nombradas.                       |
| Frontend Vue 3             | 🔄 REHACER en React     | Stack definido: React + Vite + Tailwind CSS + Leaflet. Vue a React es reescritura. El 73% de pantallas (16 de 22) son nuevas. |
| Módulos no-bodeguero       | ⏸ NO TOCAR en MVP       | Seguimiento, supervisor, productor-técnico permanecen en BD para fases posteriores. No exponer en frontend.                   |

## 1.3 Stack técnico definitivo

| **Capa**       | **Tecnología**                             | **Notas para el desarrollador**                                     |
|----------------|--------------------------------------------|---------------------------------------------------------------------|
| Frontend       | React 18 + Vite 5                          | Nuevo repositorio. NO migrar componentes Vue.                       |
| Estilos        | Tailwind CSS                               | No CSS modules ni styled-components.                                |
| Routing        | React Router v6                            | createBrowserRouter.                                                |
| Estado global  | Zustand o Context API                      | Solo para auth token y usuario autenticado. No Redux.               |
| Mapas          | Leaflet + react-leaflet                    | Sin API key de pago. Tiles: OpenStreetMap.                          |
| Gráficas       | Recharts o Chart.js                        | Para tendencia de precios y ocupación de stock.                     |
| HTTP client    | fetch nativo (función request() de api.ts) | Copiar la función request() del proyecto actual. Mismos endpoints.  |
| Backend        | Node.js 20 + Express + TypeScript          | Conservar íntegro. Solo agregar nuevas rutas en archivos separados. |
| Base de datos  | PostgreSQL 15 + PostGIS                    | Conservar íntegro. Agregar solo vía migraciones.                    |
| Color primario | #1A5C38                                   | Verde institucional Plan Nacional Maíz.                             |
| PWA            | vite-plugin-pwa                            | manifest.json + service worker básico para soporte offline.         |

## 1.4 Roles del sistema — Ajuste importante

> ⚠ IMPORTANTE
> El rol se renombra de 'bodeguero' a 'bodega' en el campo usuarios.rol. El frontend solo muestra dos opciones en la pantalla B-01: 'Soy bodega' e 'Industria'. Los roles 'productor' y 'supervisor' NO aparecen en la PWA de este módulo. La tabla usuarios.rol acepta: bodega | industria | admin.

# 2. Base de datos

## 2.1 Tablas a conservar SIN cambios

El desarrollador NO debe alterar estas tablas. Solo se consumen con SELECT / INSERT en los endpoints ya existentes.

| **Tabla**                                                 | **Qué contiene y por qué se conserva**                                                                                                          |
|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| usuarios                                                  | id, email, curp, nombre_completo, password_hash, telefono, rol (bodega\|industria\|admin), activo. Base del sistema JWT.                        |
| sesiones                                                  | token_hash, ip_address, user_agent, expires_at. Invalidación de tokens.                                                                         |
| regiones                                                  | 5 regiones: Noroeste, Noreste, Occidente, Centro, Sur-Sureste.                                                                                  |
| geo_state                                                 | 32 estados mexicanos (state_id VARCHAR(2) INEGI, name). Select de Estado en formularios.                                                        |
| geo_municipality                                          | Municipios ligados a geo_state. Endpoint: GET /api/auth/municipalities?state_id=XX ya existe.                                                   |
| bodegas                                                   | Tabla principal del módulo. 24 bodegas cargadas + estructura completa. Solo agregar 3 columnas de semáforo (ver §2.2).                          |
| inventarios                                               | bodega_id, usuario_id, ciclo, tipo_maiz, origen, volumen_almacenamiento, volumen_problema, fecha, observaciones. Agregar 3 columnas (ver §2.2). |
| precios                                                   | tipo_precio, fuente, precio, tipo_maiz, fecha, bodega_id, usuario_captura. Agregar 3 columnas (ver §2.2).                                       |
| infraestructura_contactos                                 | bodega_id, nombre, cargo, telefono, correo, es_principal. Endpoints POST/DELETE ya existen.                                                     |
| notificaciones                                            | alerta_id, usuario_id, leida, fecha_leida. GET/PATCH ya existen.                                                                                |
| cat_catalog                                               | Catálogo genérico: tipo_maiz, cycle_type, crop, destination, production_system.                                                                 |
| cat_crop_variety                                          | 14 variedades de maíz + Criollo/Local + Otra. Para selects de variedad.                                                                         |
| precios_maiz                                              | Tabla informativa de precios de referencia. Solo lectura en frontend.                                                                           |
| producer, up, cycle, cycle_crop, seguimiento_\*, alertas | Módulo productor-técnico y seguimiento. NO TOCAR. Permanece en BD para fases posteriores.                                                       |

## 2.2 Tablas a extender — Solo ALTER TABLE

> 🚨 CRÍTICO
> Crear archivo migrate_v8_bodeguero.sql. NUNCA recrear tablas existentes.

### bodegas — 3 columnas nuevas

| **Columna nueva**   | **Tipo / Default**              | **Descripción**                                                               |
|---------------------|---------------------------------|-------------------------------------------------------------------------------|
| semaforo_compra     | VARCHAR(10) DEFAULT 'verde'     | Estado de compra. Valores: verde \| amarillo \| rojo. Visible para productor. |
| semaforo_updated_at | TIMESTAMP                       | Fecha de última actualización del semáforo.                                   |
| semaforo_usuario_id | INTEGER REFERENCES usuarios(id) | Quién actualizó (auditoría).                                                  |

> ✅ CONSERVAR
> Columnas que YA EXISTEN y deben usarse: es_ventanilla (BOOLEAN), realiza_acopio, opera_incentivos, opera_coberturas, registra_inventario, estatus_operativo, capacidad_ton, localidad, estatus (aprobada/pendiente/rechazada), creado_por, aprobado_por, fecha_aprobacion. No recrear ninguna.

### inventarios — 3 columnas nuevas

| **Columna nueva** | **Tipo / Constraint**                      | **Descripción**                                                      |
|-------------------|--------------------------------------------|----------------------------------------------------------------------|
| variedad_code     | VARCHAR(40)                                | FK lógica a cat_crop_variety.code WHERE crop='maiz'. Campo opcional. |
| humedad_pct       | NUMERIC(5,2)                               | Porcentaje de humedad del maíz almacenado. Ej: 14.5                  |
| calidad           | VARCHAR(10) CHECK IN ('primera','segunda') | Calidad del maíz. Selector de 2 opciones en B-07.                    |

### precios — 3 columnas nuevas

| **Columna nueva** | **Tipo / Constraint**                      | **Descripción**                                     |
|-------------------|--------------------------------------------|-----------------------------------------------------|
| variedad_code     | VARCHAR(40)                                | Variedad del maíz para el que se publica el precio. |
| humedad_pct       | NUMERIC(5,2)                               | Humedad base del precio publicado (ej: 14%).        |
| calidad           | VARCHAR(10) CHECK IN ('primera','segunda') | Calidad del maíz al que aplica el precio.           |

## 2.3 Tablas nuevas a crear

> ⚠ IMPORTANTE
> Crear en orden respetando FK. Todas en la misma base de datos 'bodegas'.

### bodeguero_bodegas — Asociación usuario ↔ bodega

El usuario bodega ya NO crea bodegas. Solicita asociarse a bodegas del catálogo existente. La asociación queda válida desde el momento en que el bodeguero la selecciona (no requiere validación del admin salvo alta de bodega nueva).

| **Columna**                   | **Tipo / Constraint**                    | **Descripción**                                                               |
|-------------------------------|------------------------------------------|-------------------------------------------------------------------------------|
| id                            | SERIAL PRIMARY KEY                       |                                                                               |
| usuario_id                    | INTEGER REFERENCES usuarios(id)          | El usuario bodega que solicita la asociación.                                 |
| bodega_id                     | INTEGER REFERENCES bodegas(id)           | Bodega del catálogo que quiere operar.                                        |
| estatus                       | VARCHAR(20) DEFAULT 'aprobada'           | aprobada (default) \| pendiente (solo si es bodega nueva que requiere admin). |
| fecha_solicitud               | TIMESTAMP DEFAULT CURRENT_TIMESTAMP      | Cuándo solicitó la asociación.                                                |
| aprobado_por                  | INTEGER REFERENCES usuarios(id) NULLABLE | Admin que aprobó (para altas nuevas).                                         |
| fecha_aprobacion              | TIMESTAMP NULLABLE                       |                                                                               |
| UNIQUE(usuario_id, bodega_id) | Constraint                               | Un usuario no puede solicitar la misma bodega dos veces.                      |

### senales_compra — Señal de compra activa (B-10)

El usuario bodega publica que busca maíz. El sistema notifica a productores dentro del radio.

| **Columna**       | **Tipo / Constraint**               | **Descripción**                                                                               |
|-------------------|-------------------------------------|-----------------------------------------------------------------------------------------------|
| id                | SERIAL PRIMARY KEY                  |                                                                                               |
| bodega_id         | INTEGER REFERENCES bodegas(id)      | Bodega que publica la señal.                                                                  |
| usuario_id        | INTEGER REFERENCES usuarios(id)     | Usuario bodega que la publica.                                                                |
| tipo_maiz         | VARCHAR(20) NOT NULL                | FK lógica a cat_catalog WHERE catalog='tipo_maiz'.                                            |
| variedad_code     | VARCHAR(40) NULLABLE                | FK lógica a cat_crop_variety WHERE crop='maiz'. Opcional.                                     |
| volumen_ton       | NUMERIC(10,2)                       | Toneladas aproximadas que busca.                                                              |
| precio_ofrecido   | NUMERIC(10,2) NOT NULL              | MXN/ton que ofrece pagar.                                                                     |
| radio_km          | INTEGER DEFAULT 50                  | Radio de búsqueda desde la bodega. Slider en el formulario (rangos por región).               |
| vigencia          | VARCHAR(20) NOT NULL                | esta_semana \| 15_dias. Select en el formulario.                                              |
| fecha_vencimiento | DATE NOT NULL                       | Calculada en backend. esta_semana = domingo de la semana actual. 15_dias = CURRENT_DATE + 15. |
| activa            | BOOLEAN DEFAULT TRUE                | FALSE cuando se cancela o vence. Máximo 5 señales activas por bodega.                         |
| interesados_count | INTEGER DEFAULT 0                   | Número de productores que respondieron 'Me interesa'. Incrementar con UPDATE.                 |
| created_at        | TIMESTAMP DEFAULT CURRENT_TIMESTAMP |                                                                                               |

> ⚠ IMPORTANTE
> REGLA: Máximo 5 señales activas por bodega simultáneamente. El backend valida COUNT(id) WHERE bodega_id = X AND activa = TRUE antes de insertar. Si ya hay 5, devuelve error 400 con mensaje: 'Ya tienes 5 señales activas. Cancela una antes de publicar una nueva.'

### transacciones — Compras registradas (B-13, B-14)

| **Columna**            | **Tipo / Constraint**                            | **Descripción**                                                               |
|------------------------|--------------------------------------------------|-------------------------------------------------------------------------------|
| id                     | SERIAL PRIMARY KEY                               |                                                                               |
| bodega_id              | INTEGER REFERENCES bodegas(id)                   | Bodega donde ocurrió la compra. SELECT desplegable de mis bodegas.            |
| usuario_bodeguero      | INTEGER REFERENCES usuarios(id)                  | Quién registra la transacción.                                                |
| producer_id            | BIGINT REFERENCES producer(producer_id) NULLABLE | Productor del padrón. NULL si no está registrado.                             |
| nombre_productor_libre | VARCHAR(200) NULLABLE                            | Nombre libre cuando producer_id es NULL.                                      |
| tipo_maiz              | VARCHAR(20) NOT NULL                             | FK lógica a cat_catalog WHERE catalog='tipo_maiz'. SELECT desplegable.        |
| variedad_code          | VARCHAR(40) NULLABLE                             | FK lógica a cat_crop_variety WHERE crop='maiz'. SELECT desplegable.           |
| volumen_ton            | NUMERIC(10,2) NOT NULL                           | Toneladas compradas.                                                          |
| precio_ton             | NUMERIC(10,2) NOT NULL                           | Precio pagado en MXN/ton.                                                     |
| fecha                  | DATE NOT NULL — CHECK fecha \<= CURRENT_DATE     | Fecha de la compra. No puede ser futura.                                      |
| confirmacion_productor | VARCHAR(20) DEFAULT 'pendiente'                  | pendiente \| confirmada \| discrepancia \| expirada.                          |
| peso_precio_sistema    | NUMERIC(3,2) DEFAULT 0.5                         | Factor de confianza. confirmada=0.75, expirada/pendiente=0.5, discrepancia=0. |
| notas                  | TEXT NULLABLE                                    |                                                                               |
| created_at, updated_at | TIMESTAMP                                        |                                                                               |

### cat_conceptos_servicio — Catálogo de servicios de bodega

| **Columna**    | **Tipo**                                 | **Descripción**                                                                         |
|----------------|------------------------------------------|-----------------------------------------------------------------------------------------|
| id             | SERIAL PRIMARY KEY                       |                                                                                         |
| nombre         | VARCHAR(100) NOT NULL                    | Ej: Recepción y descarga, Secado, Almacenamiento.                                       |
| icono          | VARCHAR(50)                              | Nombre del ícono para el frontend. Ej: 'truck', 'droplet', 'box'.                       |
| unidad_default | VARCHAR(20) DEFAULT 'MXN/ton'            | MXN/ton \| MXN/ton/mes \| MXN/viaje                                                     |
| estatus        | VARCHAR(20) DEFAULT 'aprobado'           | aprobado \| pendiente. El bodeguero propone nuevos (pendiente hasta que admin apruebe). |
| propuesto_por  | INTEGER REFERENCES usuarios(id) NULLABLE | NULL para los 7 conceptos base.                                                         |

Insertar en migrate_v8 — 7 conceptos base (estatus='aprobado', propuesto_por=NULL):

- Recepción y descarga · icono: truck · MXN/ton

- Pesaje · icono: scale · MXN/ton

- Limpieza · icono: wind · MXN/ton

- Secado · icono: sun · MXN/ton

- Almacenamiento · icono: box · MXN/ton/mes

- Fumigación · icono: shield · MXN/ton

- Maniobras de carga · icono: package · MXN/ton

### tarifario_servicios — Precios publicados por el usuario (B-15)

| **Columna**     | **Tipo**                                      | **Descripción**                                            |
|-----------------|-----------------------------------------------|------------------------------------------------------------|
| id              | SERIAL PRIMARY KEY                            |                                                            |
| bodega_id       | INTEGER REFERENCES bodegas(id)                | Bodega que publica la tarifa.                              |
| concepto_id     | INTEGER REFERENCES cat_conceptos_servicio(id) | Concepto del catálogo WHERE estatus='aprobado'.            |
| precio          | NUMERIC(10,2) NOT NULL                        | Precio del servicio en la unidad correspondiente.          |
| vigencia_inicio | DATE DEFAULT CURRENT_DATE                     | Cuándo aplica el precio.                                   |
| vigencia_fin    | DATE NULLABLE                                 | Cuándo vence.                                              |
| activo          | BOOLEAN DEFAULT TRUE                          |                                                            |
| updated_at      | TIMESTAMP DEFAULT CURRENT_TIMESTAMP           | Disparar alerta al bodeguero si \> 30 días sin actualizar. |

> ⚠ IMPORTANTE
> ALERTA DE TARIFARIO: Si CURRENT_DATE - updated_at > 30 días, el sistema notifica al bodeguero y marca el tarifario como 'desactualizado'. Agregar job en backend que corre diariamente y consulta: SELECT bodega_id, usuario_id FROM tarifario_servicios WHERE activo=TRUE AND CURRENT_DATE - updated_at > 30 GROUP BY bodega_id, usuario_id.

### ventanillas — Bodegas con función de ventanilla (B-17, B-18)

El usuario bodega define si su bodega es ventanilla desde la configuración de 'Mis Bodegas'. El admin NO lo define. Puede haber múltiples ventanillas por bodega, cada una con diferente enlace de Agricultura.

| **Columna**               | **Tipo**                            | **Descripción**                                                                      |
|---------------------------|-------------------------------------|--------------------------------------------------------------------------------------|
| id                        | SERIAL PRIMARY KEY                  |                                                                                      |
| bodega_id                 | INTEGER REFERENCES bodegas(id)      | Bodega asociada. La bodega actualiza es_ventanilla=TRUE al crear el primer registro. |
| usuario_id                | INTEGER REFERENCES usuarios(id)     | Usuario bodega responsable.                                                          |
| nombre_enlace_agricultura | VARCHAR(200) NOT NULL               | Nombre del enlace con Agricultura. Campo obligatorio.                                |
| nombre_ventanilla         | VARCHAR(200) NULLABLE               | Nombre de la ventanilla. Campo opcional.                                             |
| telefono_responsable      | VARCHAR(20) NOT NULL                | Teléfono del responsable.                                                            |
| correo_responsable        | VARCHAR(200) NOT NULL               | Correo del responsable.                                                              |
| tipo                      | VARCHAR(20)                         | coberturas \| incentivos \| ambos. Selector visual en B-18.                          |
| estatus                   | VARCHAR(20) DEFAULT 'activa'        | activa \| inactiva.                                                                  |
| created_at                | TIMESTAMP DEFAULT CURRENT_TIMESTAMP |                                                                                      |

### apoyos_ventanilla + solicitudes_apoyo (B-19, B-20, B-21)

> 📋 NOTA
> CATÁLOGO INICIAL: Por ahora solo dos conceptos de apoyo: 'Coberturas' e 'Incentivos'. Estos se mostrarán como opciones en B-19. La definición detallada de los apoyos se completará en fases posteriores.

| **Tabla**         | **Columnas clave**                                                                                                                                    | **Descripción**                                                                                |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| apoyos_ventanilla | ventanilla_id FK, nombre_apoyo (coberturas\|incentivos), descripcion, requisitos, disponible BOOLEAN, cupo_disponible INT NULLABLE, vigencia_fin DATE | Apoyos disponibles en la ventanilla. El bodeguero publica y activa/desactiva.                  |
| solicitudes_apoyo | ventanilla_id FK, apoyo_id FK, producer_id FK, estado VARCHAR(20) DEFAULT 'recibida', notas TEXT, created_at, updated_at                              | Manifestaciones de interés. Workflow: recibida → contactado → agendada → canalizada → cerrada. |

# 3. Catálogos existentes — Desplegables listos para usar

> 🚨 CRÍTICO
> No hardcodear valores en el frontend. Todos los selects consumen las tablas existentes.

## 3.1 cat_catalog

Query: SELECT code, label FROM cat_catalog WHERE catalog = '...' ORDER BY sort_order

| **catalog (valor del WHERE)** | **Valores en BD (code → label)**                                                                                                       | **Dónde se usa**                                                            |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| tipo_maiz                     | blanco→Maíz Blanco, amarillo→Maíz Amarillo, forrajero→Maíz Forrajero, palomero→Maíz Palomero, morado→Maíz Morado, criollo→Maíz Criollo | B-07 Inventario, B-09 Precio diario, B-10 Señal de compra, B-13 Transacción |
| cycle_type                    | PV→Primavera-Verano, OI→Otoño-Invierno, ANUAL→Anual                                                                                    | B-07 Inventario (campo ciclo)                                               |
| destination                   | autoconsumo, venta_local, venta_nacional, exportacion, mixto                                                                           | B-13 Transacción (destino del maíz, campo opcional)                         |

## 3.2 cat_crop_variety

Query: SELECT code, label FROM cat_crop_variety WHERE crop = 'maiz' ORDER BY sort_order

Regla de filtrado: Si tipo_maiz = nativo/criollo → mostrar solo CRIOLLO_LOCAL y OTRA. Si tipo = blanco o amarillo → mostrar lista completa.

| **code**               | **label**                                                    |
|------------------------|--------------------------------------------------------------|
| NO_SABE                | No sabe — disponible como opción en B-09 y B-10              |
| CRIOLLO_LOCAL          | Criollo / local (con campo de texto libre opcional)          |
| H-40, H-48, H-50, H-52 | Híbridos CIMMYT — frecuentes en Sinaloa, Jalisco, Guanajuato |
| H-66, H-70, H-161      | Híbridos CIMMYT — frecuentes en Nayarit y Occidente          |
| VS-22, VS-23           | Variedades de polinización libre                             |
| H-520, H-564C          | Híbridos tropicales — frecuentes en Sur-Sureste              |
| V-236P                 | V-236P (Pepitilla)                                           |
| OTRA                   | Otra (campo texto libre obligatorio)                         |

## 3.3 Regiones — Rangos de radio para señal de compra (B-10)

El slider de radio de búsqueda en B-10 varía por región. El backend determina la región de la bodega por su geo_state y aplica los límites correspondientes:

| **Región**        | **Estados que cubre**                                        | **Radio mínimo** | **Radio default** | **Radio máximo** |
|-------------------|--------------------------------------------------------------|------------------|-------------------|------------------|
| Noroeste          | Sinaloa, Sonora, Baja California, Nayarit                    | 30 km            | 80 km             | 200 km           |
| Noreste           | Nuevo León, Tamaulipas, Coahuila, Chihuahua                  | 20 km            | 60 km             | 150 km           |
| Occidente (Bajío) | Jalisco, Guanajuato, Michoacán, Colima, Zacatecas            | 20 km            | 60 km             | 150 km           |
| Centro            | CDMX, Edomex, Puebla, Querétaro, Tlaxcala, Hidalgo           | 15 km            | 40 km             | 100 km           |
| Sur-Sureste       | Veracruz, Oaxaca, Chiapas, Tabasco, Yucatán, Campeche, Q.Roo | 20 km            | 50 km             | 120 km           |

# 4. Rutas Backend

## 4.1 Rutas a conservar SIN cambios

| **Endpoint**                                   | **Uso en módulo bodega**                                                   |
|------------------------------------------------|----------------------------------------------------------------------------|
| POST /api/auth/login                           | Inicio de sesión. JWT. Sin cambios.                                        |
| POST /api/auth/registro                        | Crear cuenta. Payload ya tiene campo rol. Usar 'bodega' como valor.        |
| GET /api/auth/perfil                           | Obtener usuario autenticado.                                               |
| GET /api/auth/states                           | Select de Estado en onboarding (B-02).                                     |
| GET /api/auth/municipalities?state_id=XX       | Select de Municipio filtrado (B-02 y formulario bodega).                   |
| GET /api/bodegas                               | Buscar bodegas del catálogo nacional (B-03). Params: q, estado, municipio. |
| GET /api/bodegas/:id                           | Detalle de bodega del catálogo.                                            |
| GET /api/bodegas/catalogos                     | Regiones, estados, municipios, tipos_maiz.                                 |
| GET /api/infraestructura                       | Lista de bodegas aprobadas para mapa y exploración.                        |
| GET /api/infraestructura/:id                   | Detalle completo: bodega + contactos + inventarios + último precio (B-06). |
| GET /api/infraestructura/catalogos             | Catálogos incluyendo tipo_maiz. Reusar en B-07 y B-09.                     |
| POST /api/infraestructura/:id/contactos        | Agregar contacto a bodega (B-06).                                          |
| DELETE /api/infraestructura/:id/contactos/:cid | Eliminar contacto.                                                         |
| GET /api/infraestructura/:id/precios           | Historial de precios de una bodega (B-06 detalle).                         |
| GET /api/mis-inventarios                       | Inventarios registrados por el usuario autenticado.                        |
| GET /api/precios                               | Lista de precios con filtros.                                              |
| GET /api/precios/dashboard                     | KPIs de precios.                                                           |
| GET /api/home/stats                            | KPIs del dashboard. Ya tiene rama role === bodega (ampliar en §4.2).       |
| GET /api/alertas/notificaciones/mis            | Notificaciones del usuario autenticado.                                    |
| PATCH /api/alertas/notificaciones/leer-todas   | Marcar todas como leídas.                                                  |

## 4.2 Rutas a modificar

| **Endpoint**                             | **Qué cambiar exactamente**                                                                                                                                                                                                                                                                   |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| POST /api/infraestructura/:id/inventario | Agregar al body y persistir: variedad_code (VARCHAR, opcional), humedad_pct (NUMERIC), calidad ('primera'\|'segunda').                                                                                                                                                                        |
| POST /api/infraestructura/:id/precios    | Agregar al body y persistir: variedad_code, humedad_pct, calidad.                                                                                                                                                                                                                             |
| GET /api/home/stats — rama bodega        | KPI 1: comparar mi último precio vs Precio del Maíz regional. KPI 2: COUNT solicitudes_apoyo WHERE estado='recibida'. KPI 3: productores con disponibilidad en radio de mis bodegas (tabla disponibilidad_productor). KPI 4: SUM(volumen_almacenamiento) / SUM(capacidad_ton) de mis bodegas. |
| POST /api/infraestructura (crear bodega) | Esta ruta queda SOLO para admin/responsable. El usuario bodega usa POST /api/bodeguero/bodegas/solicitar para asociarse.                                                                                                                                                                      |

## 4.3 Rutas nuevas a crear

| **Endpoint nuevo**                          | **Descripción**                                                                                                                                                              |
|---------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| POST /api/bodeguero/bodegas/solicitar       | Crea registro en bodeguero_bodegas con estatus=aprobada (del catálogo) o pendiente (alta nueva). Body: { bodega_id }.                                                        |
| GET /api/bodeguero/mis-bodegas              | Bodegas asociadas al usuario autenticado WHERE estatus=aprobada. Incluir semaforo_compra, capacidad_ton, último inventario.                                                  |
| PATCH /api/bodegas/:id/semaforo             | Actualizar semaforo_compra. Body: { semaforo: 'verde'\|'amarillo'\|'rojo' }. Actualiza semaforo_updated_at y semaforo_usuario_id.                                            |
| GET /api/senales-compra                     | Lista señales activas. Params: bodega_id, tipo_maiz. Incluye interesados_count.                                                                                              |
| POST /api/senales-compra                    | Crea señal. Validar: max 5 activas por bodega. Calcular fecha_vencimiento en backend.                                                                                        |
| DELETE /api/senales-compra/:id              | Desactivar señal: SET activa=FALSE. Solo el usuario que la publicó.                                                                                                          |
| POST /api/senales-compra/:id/interes        | Productor responde 'Me interesa'. Incrementa interesados_count. Crea notificación para el bodeguero.                                                                         |
| GET /api/transacciones                      | Historial de transacciones. Params: bodega_id, fecha_inicio, fecha_fin, tipo_maiz.                                                                                           |
| POST /api/transacciones                     | Registrar transacción. Si producer_id tiene usuario_id → crear notificación de confirmación para el productor.                                                               |
| PATCH /api/transacciones/:id/confirmar      | El productor confirma (confirmada) o reporta error (discrepancia). Actualiza peso_precio_sistema automáticamente.                                                            |
| GET /api/tarifario/:bodegaId                | Tarifario activo de la bodega con JOIN a cat_conceptos_servicio.                                                                                                             |
| POST /api/tarifario/:bodegaId               | Publicar precio para un concepto. Body: { concepto_id, precio, vigencia_inicio, vigencia_fin }.                                                                              |
| PUT /api/tarifario/:bodegaId/:tarifaId      | Actualizar precio existente. Actualizar updated_at.                                                                                                                          |
| GET /api/cat-conceptos-servicio             | Catálogo WHERE estatus='aprobado'. Para el SELECT del formulario de tarifario.                                                                                               |
| POST /api/cat-conceptos-servicio/proponer   | Bodeguero propone concepto nuevo. Queda estatus='pendiente'. Admin aprueba desde su panel.                                                                                   |
| GET /api/ventanillas                        | Ventanillas del usuario bodega autenticado.                                                                                                                                  |
| POST /api/ventanillas                       | Alta de ventanilla. Actualiza bodegas.es_ventanilla=TRUE. Body: { bodega_id, nombre_enlace_agricultura, nombre_ventanilla, telefono_responsable, correo_responsable, tipo }. |
| GET /api/ventanillas/:id/apoyos             | Apoyos publicados en la ventanilla.                                                                                                                                          |
| POST /api/ventanillas/:id/apoyos            | Publicar apoyo. Body: { nombre_apoyo, descripcion, requisitos, cupo_disponible, vigencia_fin }.                                                                              |
| PATCH /api/ventanillas/:id/apoyos/:aid      | Activar/desactivar apoyo o actualizar cupo.                                                                                                                                  |
| GET /api/ventanillas/:id/solicitudes        | Lista de manifestaciones de interés recibidas. Param: estado (filtro). Incluir datos completos del productor interesado.                                                     |
| PATCH /api/ventanillas/:id/solicitudes/:sid | Cambiar estado del workflow. Body: { estado: 'contactado'\|'agendada'\|'canalizada'\|'cerrada', notas }.                                                                     |
| GET /api/oferta/municipios                  | Vista AGREGADA de disponibilidad de productores por municipio. Params: radio_km, bodega_id, tipo_maiz. NUNCA devolver datos individuales.                                    |

# 5. Pantallas — Especificación completa

## 5.0 Resumen de estado de todas las pantallas

| **ID** | **Pantalla**                             | **Estado**                 | **Prioridad** |
|--------|------------------------------------------|----------------------------|---------------|
| B-01   | Acceso y selección de rol                | 🔄 Adaptar en React        | CRÍTICA       |
| B-02   | Registro del usuario bodega              | 🔄 Adaptar en React        | CRÍTICA       |
| B-03   | Selección de bodegas que opera           | 🆕 Nueva                   | CRÍTICA       |
| B-04   | Tablero del Bodeguero — KPIs del día     | 🔄 Adaptar en React        | CRÍTICA       |
| B-05   | Mis bodegas — lista                      | 🔄 Adaptar en React        | CRÍTICA       |
| B-06   | Detalle de bodega                        | 🔄 Adaptar en React        | CRÍTICA       |
| B-07   | Stock e inventario — actualizar          | 🔄 Adaptar + nuevos campos | CRÍTICA       |
| B-08   | Estado de compra — semáforo              | 🆕 Nueva                   | CRÍTICA       |
| B-09   | Publicar precio de compra diario         | 🔄 Adaptar + nuevos campos | CRÍTICA       |
| B-10   | Publicar señal de compra activa          | 🆕 Nueva                   | CRÍTICA       |
| B-11   | Vista oferta productores — tabla         | 🆕 Nueva                   | ALTA          |
| B-12   | Mapa oferta productores                  | 🆕 Nueva                   | ALTA          |
| B-13   | Registro de transacción nueva            | 🆕 Nueva                   | ALTA          |
| B-14   | Historial de transacciones               | 🆕 Nueva                   | ALTA          |
| B-15   | Tarifario de servicios — publicar/editar | 🆕 Nueva                   | ALTA          |
| B-16   | Proponer nuevo concepto de servicio      | 🆕 Nueva                   | ALTA          |
| B-17   | Mis ventanillas — lista                  | 🆕 Nueva                   | ALTA          |
| B-18   | Alta y edición de ventanilla             | 🆕 Nueva                   | ALTA          |
| B-19   | Apoyos disponibles en mi ventanilla      | 🆕 Nueva                   | ALTA          |
| B-20   | Solicitudes recibidas — lista            | 🆕 Nueva                   | ALTA          |
| B-21   | Detalle solicitud — cambiar estado       | 🆕 Nueva                   | ALTA          |
| B-22   | Vista de mercado y precios               | 🔄 Adaptar en React        | ALTA          |

## B-01 — Acceso y selección de rol

> 📋 NOTA
> Base existente: LoginView.vue. Rehacer completamente en React.

Descripción: Pantalla de entrada a la PWA. El usuario elige su rol antes de hacer login.

### Elementos de la pantalla (de arriba hacia abajo):

- Logo SIMAC + texto 'Plan Nacional Maíz 2026' centrado en la parte superior

- **Selector de rol:** Selector de rol — 2 tarjetas grandes con ícono:

  - '🏪 Soy Bodega' — rol: bodega

  - '🏭 Soy Industria' — rol: industria (tortillerías, nixtamaleras, etc.)

- Al seleccionar un rol la tarjeta se resalta con borde verde #1A5C38

- Campos de login: correo electrónico + contraseña

- Botón primario: 'Entrar' (verde #1A5C38, ancho completo)

- Link secundario: '¿Aún no tienes cuenta? Regístrate'

### Comportamiento esperado:

- Si el usuario no selecciona rol y toca 'Entrar': mostrar error inline 'Selecciona tu tipo de cuenta para continuar'

- POST /api/auth/login con { email, password, rol }

- Si login exitoso: redirigir a B-04 (Tablero del Bodeguero)

- Token JWT almacenado en localStorage con clave 'simac_token'

## B-02 — Registro del usuario bodega

> 📋 NOTA
> Base existente: RegisterView.vue. Adaptar en React. Agregar selects Estado/Municipio.

### Formulario de registro — Campos:

| **Campo**            | **Tipo**                   | **Validación**                | **Endpoint/Fuente**                      |
|----------------------|----------------------------|-------------------------------|------------------------------------------|
| Nombre completo      | Text input                 | Obligatorio, mín 3 caracteres |                                          |
| Correo electrónico   | Email input                | Obligatorio, formato válido   |                                          |
| Teléfono celular     | Tel input                  | Obligatorio, 10 dígitos       |                                          |
| Estado donde opera   | SELECT                     | Obligatorio                   | GET /api/auth/states                     |
| Municipio            | SELECT filtrado por estado | Obligatorio                   | GET /api/auth/municipalities?state_id=XX |
| Contraseña           | Password input             | Obligatorio, mín 8 caracteres |                                          |
| Confirmar contraseña | Password input             | Debe coincidir                |                                          |

### Comportamiento esperado:

- POST /api/auth/registro con { nombre_completo, email, telefono, estado_id, municipio_id, password, rol: 'bodega' }

- Al completar registro: ir directamente a B-03 (selección de bodegas)

- No requiere verificación por SMS en esta fase

## B-03 — Selección de bodegas que opera

> 📋 NOTA
> Pantalla nueva. No existe en el desarrollo anterior.

El usuario bodega selecciona las bodegas del catálogo nacional que opera. La selección queda aprobada automáticamente (no requiere validación del admin). Solo si la bodega NO existe en el catálogo, el alta pasa por validación del admin.

### Elementos de la pantalla:

- Título: 'Selecciona las bodegas que operas'

- Filtros en la parte superior: selector de Estado + selector de Municipio (cascada)

- Campo de búsqueda por nombre de bodega

- Lista de resultados: nombre de bodega, municipio, estado, capacidad en toneladas

- Cada resultado tiene botón '+ Agregar'. Al agregar: la bodega pasa a la lista 'Mis bodegas seleccionadas' en la parte inferior

- Lista 'Mis bodegas seleccionadas': muestra las bodegas ya agregadas con botón para quitar cada una

- Botón secundario: '+ Mi bodega no está en la lista' → abre formulario de alta nueva bodega (ver abajo)

- Botón principal: 'Continuar' (verde) — habilitado solo si hay al menos 1 bodega seleccionada

### Formulario de alta de bodega nueva (modal o pantalla aparte):

> ⚠ IMPORTANTE
> Esta es la ÚNICA acción que requiere validación del admin. La bodega queda en estatus 'pendiente' hasta que el admin la apruebe.

- Nombre de la bodega — texto obligatorio

- Estado — SELECT (GET /api/auth/states)

- Municipio — SELECT filtrado

- Localidad — texto libre opcional

- Capacidad en toneladas — número

- Coordenadas (lat/lon) — campo de mapa Leaflet: el usuario toca el mapa para marcar la ubicación

- Al enviar: POST /api/infraestructura con estatus='pendiente'. Mostrar mensaje: 'Tu solicitud de alta fue enviada. Te notificaremos cuando sea aprobada.'

### Endpoints utilizados:

- GET /api/bodegas?estado=XX&municipio=YY&q=nombre — buscar en catálogo

- POST /api/bodeguero/bodegas/solicitar — asociar bodega existente

- POST /api/infraestructura — alta de bodega nueva (solo para admin en adelante)

## B-04 — Tablero del Bodeguero (Dashboard principal)

> 📋 NOTA
> Base existente: InicioView.vue. Rehacer completamente en React con los 4 KPIs definidos. Ver mockup visual en la Sección 7 de este documento.

### Estructura de la pantalla (de arriba hacia abajo):

- Header fijo: logo SIMAC + nombre del usuario + campana de notificaciones con badge contador

- Saludo: 'Buenos días, \[nombre\]' + fecha del día

- Sección KPIs: 4 tarjetas en grid 2x2 (móvil: stack vertical)

### KPI 1 — Precio del Maíz

- Título: 'Precio del Maíz hoy'

- Subtítulo: '\[Estado o Municipio de sus bodegas\]'

- Valor principal: precio en MXN/ton en número grande

- Flecha y color: ↑ verde si subió vs ayer, ↓ rojo si bajó. Texto: '+\$X vs ayer'

- Línea inferior: 'Tu precio publicado: \$X/ton — \[↑ por encima / ↓ por debajo\] del promedio'

> ⚠ IMPORTANTE
> IMPORTANTE: Este precio contempla SOLO lo que se le paga al productor (componente PO). No es el Precio Sistema completo. La definición exacta de los 3 tipos de precio se documentará en la siguiente versión.

### KPI 2 — Solicitudes de ventanilla

- Solo visible si el usuario tiene al menos una ventanilla configurada

- Título: 'Solicitudes pendientes'

- Valor: número de solicitudes con estado='recibida'

- Al tocar: navega a B-20 (lista de solicitudes)

- Si no tiene ventanillas: este KPI no se muestra (el grid se ajusta a 3 tarjetas o la tarjeta muestra 'Configura una ventanilla')

### KPI 3 — Productores con disponibilidad

- Título: 'Productores con maíz disponible cerca'

- Valor: número de productores con disponibilidad declarada dentro del radio de sus bodegas

- Lógica: radio calculado desde el centroide de cada bodega del usuario. Si hay menos de 5 productores en radio, ampliar automáticamente al estado de la bodega

- Subtexto: 'En un radio de X km de tus bodegas · Y toneladas aproximadas'

- Al tocar: navega a B-11 (tabla de oferta)

### KPI 4 — Ocupación de almacén

- Título: 'Ocupación de almacén'

- Valor: porcentaje de ocupación total de todas sus bodegas

- Barra de progreso visual con color: verde \< 70%, amarillo 70-90%, rojo \> 90%

- Subtexto: 'X ton almacenadas de Y ton de capacidad total'

- Al tocar: navega a B-07 (inventario)

### Acceso rápido — 3 botones de acción

- '📋 Publicar precio del día' → B-09

- '👁 Ver oferta de productores' → B-11

- '✍ Registrar transacción' → B-13

### Endpoint:

- GET /api/home/stats (rama bodega) — devuelve los 4 KPIs en una sola llamada

## B-05 — Mis Bodegas (lista)

> 📋 NOTA
> Base existente: MisBodegasView.vue. Rehacer en React con GET /api/bodeguero/mis-bodegas.

### Elementos de la pantalla:

- Lista de bodegas asociadas y aprobadas

- Por cada bodega en la lista:

  - Nombre de la bodega

  - Municipio, Estado

  - Semáforo de compra: 🟢 Comprando / 🟡 Capacidad limitada / 🔴 No compra esta semana

  - Porcentaje de ocupación actual (barra de progreso pequeña)

  - Botón 'Ver detalle' → B-06

  - Botón 'Actualizar semáforo' → B-08

- Botón flotante '+' en la esquina inferior derecha → abre flujo de agregar bodega (B-03)

## B-06 — Detalle de Bodega

> 📋 NOTA
> Base existente: BodegaDetalleView.vue. Adaptar en React con pestañas.

### Pestañas de la pantalla:

- Pestaña 'General': nombre, municipio, estado, capacidad, localidad, coordenadas, contactos (POST/DELETE /api/infraestructura/:id/contactos)

- Pestaña 'Inventario': último registro de inventario + botón 'Actualizar inventario' → B-07

- Pestaña 'Precios': historial de los últimos 30 días. GET /api/infraestructura/:id/precios. Gráfica de tendencia simple (Recharts)

- Pestaña 'Señales activas': señales de compra activas de esta bodega. Botón 'Nueva señal' → B-10

## B-07 — Stock e Inventario

> 📋 NOTA
> Formulario existente. Agregar 3 campos nuevos: variedad_code, humedad_pct, calidad.

### Formulario completo — Campos:

| **Campo**                    | **Tipo**                      | **Fuente/Validación**                  | **¿Es nuevo?** |
|------------------------------|-------------------------------|----------------------------------------|----------------|
| Bodega                       | SELECT de mis bodegas         | GET /api/bodeguero/mis-bodegas         | No             |
| Ciclo                        | SELECT                        | cat_catalog WHERE catalog='cycle_type' | No             |
| Tipo de maíz                 | SELECT                        | cat_catalog WHERE catalog='tipo_maiz'  | No             |
| Origen                       | SELECT                        | Local \| Importado                     | No             |
| Volumen almacenamiento (ton) | Número                        | Obligatorio                            | No             |
| Volumen con problema (ton)   | Número                        | Opcional                               | No             |
| Variedad                     | SELECT filtrado por tipo_maiz | cat_crop_variety WHERE crop='maiz'     | ✅ NUEVO       |
| Humedad (%)                  | Número decimal                | Ej: 14.5                               | ✅ NUEVO       |
| Calidad                      | SELECT                        | Primera \| Segunda                     | ✅ NUEVO       |
| Fecha                        | Date picker                   | No puede ser futura                    | No             |
| Observaciones                | Textarea                      | Opcional                               | No             |

### Comportamiento esperado:

- POST /api/infraestructura/:id/inventario con todos los campos

- Al guardar: actualizar KPI 4 del dashboard

- Mostrar historial de los últimos 5 registros de esta bodega en la parte inferior de la pantalla

## B-08 — Estado de Compra (Semáforo)

> 📋 NOTA
> Pantalla nueva. No existe. PATCH /api/bodegas/:id/semaforo.

### Diseño de la pantalla:

- Si el usuario tiene múltiples bodegas: selector de bodega en la parte superior

- 3 botones grandes ocupando toda la pantalla, uno debajo del otro:

  - 🟢 'Estoy comprando maíz esta semana' — fondo verde claro al seleccionar

  - 🟡 'Comprando con capacidad limitada' — fondo amarillo claro al seleccionar

  - 🔴 'No estoy comprando esta semana' — fondo rojo claro al seleccionar

- El botón activo actual aparece marcado/resaltado al cargar la pantalla

- Texto informativo: 'Este estado es visible para los productores que buscan dónde vender su maíz'

- Botón 'Guardar' que hace PATCH /api/bodegas/:id/semaforo

- Al guardar: mostrar confirmación y regresar a B-05

## B-09 — Publicar Precio de Compra Diario

> 📋 NOTA
> Formulario existente. Agregar variedad_code, humedad_pct y calidad. Respetar catálogo de variedades existente.

### Formulario completo — Campos:

| **Campo**        | **Tipo**                 | **Fuente/Validación**                                | **¿Es nuevo?** |
|------------------|--------------------------|------------------------------------------------------|----------------|
| Bodega           | SELECT de mis bodegas    | GET /api/bodeguero/mis-bodegas                       | No             |
| Tipo de maíz     | SELECT                   | cat_catalog WHERE catalog='tipo_maiz'                | No             |
| Variedad         | SELECT filtrado por tipo | cat_crop_variety WHERE crop='maiz'                   | ✅ NUEVO       |
| Humedad base (%) | Número decimal           | Ej: 14.0                                             | ✅ NUEVO       |
| Calidad          | SELECT                   | Primera \| Segunda                                   | ✅ NUEVO       |
| Precio (MXN/ton) | Número                   | Obligatorio. Se precarga el precio del día anterior. | No             |
| Observaciones    | Textarea                 | Opcional                                             | No             |

### Comportamiento esperado:

- Al abrir la pantalla: precargar el precio del día anterior para que el bodeguero solo confirme o modifique

- Si ya publicó precio hoy: mostrar el precio actual con botón 'Modificar'

- POST /api/infraestructura/:id/precios

- Alerta automática: si la bodega lleva más de 24 horas sin publicar precio → notificación push al bodeguero + badge 'precio desactualizado' visible para el productor

## B-10 — Publicar Señal de Compra Activa

> 📋 NOTA
> Pantalla nueva. Mecanismo de conexión bodega → productor.

### Formulario — Campos:

| **Campo**                 | **Tipo**                 | **Fuente/Validación**                 |
|---------------------------|--------------------------|---------------------------------------|
| Bodega                    | SELECT de mis bodegas    | GET /api/bodeguero/mis-bodegas        |
| Tipo de maíz que busca    | SELECT                   | cat_catalog WHERE catalog='tipo_maiz' |
| Variedad (opcional)       | SELECT filtrado por tipo | cat_crop_variety WHERE crop='maiz'    |
| Volumen que busca (ton)   | Número                   | Obligatorio                           |
| Precio ofrecido (MXN/ton) | Número                   | Obligatorio                           |
| Vigencia                  | SELECT de 2 opciones     | Esta semana \| Próximos 15 días       |
| Radio de búsqueda         | Slider (km)              | Rangos por región — ver §3.3          |

### Comportamiento esperado:

- Validar antes de publicar: si ya hay 5 señales activas para esta bodega → error: 'Ya tienes 5 señales activas. Cancela una antes de publicar una nueva.'

- Al publicar: el sistema notifica a TODOS los productores en el radio, aunque no hayan declarado disponibilidad y aunque no tengan la misma variedad. El objetivo es que vean que el sistema funciona.

- Texto de la notificación al productor: '🔔 Bodega \[nombre\] busca \[X\] ton de \[tipo_maiz\] a \$\[precio\]/ton. Está a \[Y\] km de tu parcela.'

- Si en el radio hay menos de 5 productores: ampliar automáticamente al estado de la bodega para garantizar que la notificación llegue a alguien

- El bodeguero ve en tiempo real cuántos productores respondieron con 'Me interesa' (campo interesados_count)

- Mostrar lista de señales activas de esta bodega en la parte inferior con botón 'Cancelar' para cada una

## B-11 — Vista de Oferta de Productores (Tabla)

> 🚨 CRÍTICO
> Pantalla nueva. GET /api/oferta/municipios — datos AGREGADOS. NUNCA mostrar nombres ni datos individuales de productores.

### Tabla de oferta — Columnas:

| **Columna**             | **Descripción**                                                                        |
|-------------------------|----------------------------------------------------------------------------------------|
| Municipio               | Nombre del municipio                                                                   |
| Productores disponibles | Número de productores con disponibilidad declarada en ese municipio                    |
| Toneladas aproximadas   | Suma del volumen declarado en ese municipio                                            |
| Ventana de tiempo       | Predominante: Esta semana / 15 días / 1 mes                                            |
| Acción                  | Botón 'Publicar señal de compra para este municipio' → precarga B-10 con ese municipio |

### Filtros disponibles:

- Por tipo de maíz

- Por variedad

- Por ventana de tiempo (esta semana / 15 días / 1 mes)

## B-12 — Mapa de Oferta de Productores

Misma información que B-11 pero en mapa Leaflet. Puntos de calor (heatmap) por municipio mostrando concentración de oferta. Al tocar un municipio: mostrar popup con los datos agregados de la tabla B-11.

## B-13 — Registro de Transacción Nueva

> 📋 NOTA
> Pantalla nueva. Usar listas desplegables para agilizar el registro.

### Formulario — Campos con listas desplegables:

| **Campo**                      | **Tipo**                   | **Fuente/Validación**                                                                     |
|--------------------------------|----------------------------|-------------------------------------------------------------------------------------------|
| Bodega donde ocurrió la compra | SELECT                     | GET /api/bodeguero/mis-bodegas — desplegable de mis bodegas                               |
| Productor                      | Búsqueda por CURP o nombre | Buscar en productores de la zona. Si no está: campo de texto libre 'Nombre del productor' |
| Tipo de maíz                   | SELECT                     | cat_catalog WHERE catalog='tipo_maiz' — desplegable                                       |
| Variedad                       | SELECT filtrado            | cat_crop_variety WHERE crop='maiz' — desplegable                                          |
| Volumen (ton)                  | Número                     | Obligatorio                                                                               |
| Precio pagado (MXN/ton)        | Número                     | Obligatorio                                                                               |
| Fecha de compra                | Date picker                | No puede ser futura                                                                       |
| Notas                          | Textarea                   | Opcional                                                                                  |

### Comportamiento esperado:

- POST /api/transacciones

- Si el productor tiene usuario en el sistema → enviar notificación push para confirmación

- El productor tiene 48 horas para confirmar. Si no responde: transacción entra con peso_precio_sistema=0.5

- Si el productor confirma: peso=0.75. Si reporta discrepancia: peso=0 y se marca para revisión del admin

## B-14 — Historial de Transacciones

Tabla con el historial de todas las transacciones registradas por el bodeguero. Filtros: fecha, bodega, tipo de maíz, estado de confirmación. GET /api/transacciones.

## B-15 — Tarifario de Servicios

> 📋 NOTA
> Pantalla nueva. Lista visual con íconos de los servicios que ofrece la bodega.

### Diseño de la pantalla:

- Lista de tarjetas, una por cada concepto de servicio del catálogo (GET /api/cat-conceptos-servicio WHERE estatus='aprobado')

- Cada tarjeta muestra: ícono del concepto + nombre del concepto + precio actual publicado (o 'Sin precio') + unidad (MXN/ton, MXN/ton/mes, etc.)

- Al tocar una tarjeta: campo editable de precio + selector de vigencia (inicio y fin)

- Botón 'Guardar tarifa' por cada concepto: POST o PUT /api/tarifario/:bodegaId

- Badge de alerta si el tarifario lleva más de 30 días sin actualizar: '⚠ Actualiza tu tarifario para seguir apareciendo en el Precio del Maíz'

- Botón al final: '+ Proponer nuevo servicio' → B-16

## B-16 — Proponer Nuevo Concepto de Servicio

Formulario simple: nombre del concepto + unidad (MXN/ton \| MXN/ton/mes \| MXN/viaje). POST /api/cat-conceptos-servicio/proponer. El concepto queda en estado 'pendiente' hasta que el admin lo apruebe. Mostrar mensaje: 'Tu propuesta fue enviada. Te notificaremos cuando el admin la apruebe.'

## B-17 a B-21 — Módulo de Ventanillas

> 📋 NOTA
> Este módulo completo vive dentro de la sección 'Mis Ventanillas' en la navegación principal. Solo aparece si el usuario tiene al menos una bodega configurada como ventanilla.

## B-17 — Mis Ventanillas (Lista)

### Elementos de la pantalla:

- Lista de ventanillas del usuario. GET /api/ventanillas

- Por cada ventanilla: nombre de la bodega, nombre de la ventanilla (si existe), tipo (Coberturas/Incentivos/Ambos), nombre del enlace con Agricultura, número de solicitudes pendientes

- Al tocar una ventanilla: ir a detalle que incluye B-19, B-20, B-21 en pestañas

- Botón '+' para agregar ventanilla → B-18

## B-18 — Alta y Edición de Ventanilla

### Formulario — Campos:

| **Campo**                         | **Tipo**              | **Validación**                                                 |
|-----------------------------------|-----------------------|----------------------------------------------------------------|
| Bodega asociada                   | SELECT de mis bodegas | Obligatorio. Esta bodega tendrá es_ventanilla=TRUE al guardar. |
| Tipo de ventanilla                | SELECT                | Coberturas \| Incentivos \| Ambos — obligatorio                |
| Nombre del enlace con Agricultura | Text input            | Obligatorio — nombre de la persona responsable                 |
| Nombre de la ventanilla           | Text input            | Opcional                                                       |
| Teléfono del responsable          | Tel input             | Obligatorio, 10 dígitos                                        |
| Correo del responsable            | Email input           | Obligatorio, formato válido                                    |

### Comportamiento esperado:

- POST /api/ventanillas

- Al guardar: actualizar bodegas.es_ventanilla=TRUE para la bodega seleccionada

- Regresar a B-17 y mostrar la nueva ventanilla en la lista

## B-19 — Apoyos Disponibles en la Ventanilla

### Diseño de la pantalla:

- Lista de apoyos publicados en la ventanilla. GET /api/ventanillas/:id/apoyos

- Catálogo inicial: 2 conceptos disponibles para publicar: 'Coberturas' e 'Incentivos'

- Por cada apoyo: nombre, descripción, cupo disponible (si aplica), vigencia, toggle activo/inactivo

- Botón '+ Publicar nuevo apoyo': abre formulario con campos: nombre_apoyo (selector de Coberturas/Incentivos), descripción, requisitos, cupo_disponible, vigencia_fin

- POST /api/ventanillas/:id/apoyos

## B-20 — Solicitudes Recibidas (Lista)

> ⚠ IMPORTANTE
> Las solicitudes de productores interesados en apoyos se gestionan aquí. La información del productor interesado SÍ es visible en este módulo (a diferencia de la oferta agregada de B-11).

### Elementos de la pantalla:

- Lista de manifestaciones de interés recibidas. GET /api/ventanillas/:id/solicitudes

- Por cada solicitud: nombre del productor, municipio, apoyo de interés, fecha de envío, estado actual con badge de color

- Filtro por estado: Todas / Recibidas / En contacto / Agendadas / Canalizadas / Cerradas

- Al tocar una solicitud → B-21

## B-21 — Detalle de Solicitud

### Elementos de la pantalla:

- Datos del productor: nombre, municipio, apoyo solicitado

- Historial de estados con fechas y notas anteriores

- Selector de nuevo estado: botones de cambio de estado según workflow

  - Recibida → Contactado → Agendada → Canalizada a oficina → Cerrada

- Campo de notas para dejar registro de la gestión en cada etapa

- Botón 'Guardar cambio de estado': PATCH /api/ventanillas/:id/solicitudes/:sid

- Al guardar: el productor recibe notificación del nuevo estado de su solicitud

## B-22 — Vista de Mercado y Precios

> 📋 NOTA
> Base existente: PreciosDashboardView.vue. Adaptar en React con los 3 tipos de precio.

### Elementos de la pantalla:

- Sección 'Tipos de precio del maíz' — 3 tarjetas (definición exacta se completa en siguiente versión del documento):

  - Precio del Maíz (lo que se paga al productor)

  - Precio de Compra (precio del productor + margen del bodeguero)

  - Precio de Venta (precio total de la cadena)

- Referencia externa: Precio Chicago en USD/bushel y MXN/ton. Actualización automática.

- Comparativo con otras bodegas del mismo municipio: '↑ Tu precio está \$X por encima del promedio' — SOLO precios, sin nombres de otras bodegas

- Gráfica de tendencia de los últimos 30 días (Recharts). Una sola línea: precio publicado por el bodeguero.

> ⚠ IMPORTANTE
> PENDIENTE: La definición exacta de los 3 tipos de precio (Precio del Maíz, Precio de Compra, Precio de Venta y el margen de intermediación) se documentará en la siguiente versión del documento técnico. El desarrollador puede dejar placeholders en la UI con los nombres correctos.

# 6. Sistema de Notificaciones

Las notificaciones reutilizan la tabla 'notificaciones' existente. Cada notificación lleva directamente a la pantalla relevante al ser tocada.

| **Evento que dispara la notificación**                | **Quién recibe**                                                             | **Mensaje**                                                                                                  | **Pantalla que abre**                              |
|-------------------------------------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| Bodeguero publica señal de compra activa              | Todos los productores en el radio (aunque no hayan declarado disponibilidad) | '🔔 Bodega \[nombre\] busca \[X\] ton de \[tipo\] a \$\[precio\]/ton. Está a \[Y\] km de tu parcela.'        | Mapa centrado en la bodega con botón 'Me interesa' |
| Productor toca 'Me interesa' en señal de compra       | El bodeguero que publicó la señal                                            | 'Un productor de \[municipio\] respondió a tu señal. Ya tienes \[X\] productores interesados.'               | B-10 con el contador actualizado                   |
| Bodeguero registra una transacción                    | El productor involucrado                                                     | 'La Bodega \[nombre\] registró una compra tuya: \[X\] ton a \$\[precio\]/ton. ¿Es correcto?'                 | Pantalla de confirmación del productor             |
| Bodeguero publica oferta de productores por municipio | Productores involucrados en ese municipio                                    | 'La Bodega \[nombre\] está interesada en el maíz disponible en \[municipio\]. Acércate a la bodega.'         | Detalle de la bodega en el mapa del productor      |
| Tarifario sin actualizar 30+ días                     | El bodeguero responsable                                                     | '⚠ Tu tarifario no se ha actualizado en 30 días. Actualízalo para seguir apareciendo en el Precio del Maíz.' | B-15 Tarifario                                     |
| Bodega sin publicar precio 24+ horas                  | El bodeguero responsable                                                     | '⚠ No has publicado el precio de compra de hoy. Los productores no pueden ver tu precio actual.'             | B-09 Publicar precio                               |
| Productor envía solicitud de apoyo a ventanilla       | El bodeguero de esa ventanilla                                               | 'Nuevo productor de \[municipio\] solicita información sobre \[nombre del apoyo\].'                          | B-20 Solicitudes                                   |
| Bodeguero cambia estado de solicitud de apoyo         | El productor que solicitó                                                    | 'Tu solicitud de \[apoyo\] en Bodega \[nombre\] cambió a: \[nuevo estado\].'                                 | Estado de su solicitud en la app del productor     |

# 7. Orden de Construcción Recomendado

| **Semana** | **Qué construir**                                                                                                                                                                | **Entregable esperado**                                                            |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| 1          | migrate_v8_bodeguero.sql (tablas nuevas + columnas ALTER TABLE). Nuevo repo React + Vite + Tailwind. Copiar función request() de api.ts. Configurar .env.local con VITE_API_URL. | BD lista. Proyecto frontend arrancado con auth funcional (B-01, B-02).             |
| 2          | B-03 (selección de bodegas). B-04 (tablero). B-05 (mis bodegas con semáforo). B-08 (semáforo). Rutas backend: solicitar-asociación, mis-bodegas, semáforo.                       | Bodeguero puede activar cuenta, asociarse a bodegas y actualizar semáforo.         |
| 3          | B-06 (detalle bodega). B-07 (inventario con nuevos campos). B-09 (precio diario con nuevos campos). Modificar endpoints infraestructura/inventario y /precios.                   | Precio del bodeguero capturado correctamente y visible en el sistema.              |
| 4          | B-10 (señal de compra). Notificaciones conectadas (senales_compra → notificaciones). B-11/B-12 (oferta de productores agregada por municipio).                                   | Conexión bodega → productor funciona de extremo a extremo.                         |
| 5          | B-13/B-14 (transacciones). B-15/B-16 (tarifario y propuesta de conceptos). B-22 (mercado y precios).                                                                             | Componente S del Precio del Maíz con datos reales. Historial de compras operativo. |
| 6+         | B-17 a B-21 (ventanillas, apoyos, solicitudes). Configurar vite-plugin-pwa (manifest.json + service worker).                                                                     | Sistema completo listo para piloto con bodegas y productores.                      |

> 📋 NOTA
> Variable de entorno clave: VITE_API_URL=http://localhost:3000/api en el archivo .env.local del nuevo repo React. La función request() del archivo src/services/api.ts actual ya lee import.meta.env.VITE_API_URL. Copiar esa función sin cambios. No cambiar el puerto ni la estructura de rutas del backend (src/index.ts). Solo agregar nuevos routers.

# 8. Flujo Completo — Bodega conecta con Productor

Esta sección describe el flujo de extremo a extremo que conecta al usuario bodega con los productores a través de señales de compra, notificaciones y transacciones. Todas las piezas ya están documentadas en las secciones anteriores — esta sección las une en un solo flujo para que el desarrollador entienda cómo deben interactuar.

> 🚨 CRÍTICO
> Este es el flujo más importante del sistema. Sin él, la bodega es solo un registro de datos. Con él, SIMAC se convierte en un mercado activo que conecta oferta y demanda de maíz en tiempo real.

## 8.1 Flujo A — Bodega busca maíz (B-10 → Productor → B-13)

| **Paso** | **Quién actúa**   | **Qué hace**                                                | **Pantalla / Endpoint**                                                                      | **Resultado visible**                                                                                                             |
|----------|-------------------|-------------------------------------------------------------|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| 1        | Bodeguero         | Consulta la oferta disponible en su área                    | B-11 o B-12 — GET /api/oferta/municipios                                                     | Ve tabla o mapa con municipios, toneladas aproximadas y ventana de tiempo. Datos agregados, sin nombres de productores.           |
| 2        | Bodeguero         | Decide publicar una señal de compra                         | B-10 — POST /api/senales-compra                                                              | Completa formulario: tipo de maíz, volumen, precio ofrecido, vigencia, radio de búsqueda (slider por región).                     |
| 3        | Sistema (backend) | Valida que la bodega no tenga ya 5 señales activas          | Validación en POST /api/senales-compra                                                       | Si hay 5 activas: error 400 'Cancela una señal antes de publicar nueva'. Si hay menos de 5: crea el registro y continúa.          |
| 4        | Sistema (backend) | Busca productores en el radio definido                      | Consulta tabla disponibilidad_productor con PostGIS — distancia desde centroide de la bodega | Si hay menos de 5 productores en el radio: ampliar automáticamente al estado de la bodega.                                        |
| 5        | Sistema (backend) | Envía notificación push a TODOS los productores encontrados | INSERT en tabla notificaciones por cada productor                                            | Mensaje: '🔔 Bodega \[nombre\] busca \[X\] ton de \[tipo\] a \$\[precio\]/ton. Está a \[Y\] km de tu parcela.'                    |
| 6        | Productor         | Recibe la notificación y toca 'Me interesa'                 | POST /api/senales-compra/:id/interes desde la app del productor                              | interesados_count se incrementa en 1 en la tabla senales_compra.                                                                  |
| 7        | Sistema (backend) | Notifica al bodeguero que hay productores interesados       | INSERT en tabla notificaciones para el bodeguero                                             | Mensaje: 'Un productor de \[municipio\] respondió a tu señal. Ya tienes \[X\] productores interesados.'                           |
| 8        | Bodeguero         | Ve en tiempo real cuántos productores respondieron          | B-10 — GET /api/senales-compra — campo interesados_count                                     | Contador actualizado en la pantalla de señales activas.                                                                           |
| 9        | Productor         | Se acerca físicamente a la bodega a vender su maíz          | (Acción fuera del sistema)                                                                   | La transacción ocurre en la báscula de la bodega.                                                                                 |
| 10       | Bodeguero         | Registra la transacción en el sistema                       | B-13 — POST /api/transacciones                                                               | Busca al productor por CURP o nombre. Registra: bodega, tipo de maíz, variedad, volumen, precio pagado, fecha.                    |
| 11       | Sistema (backend) | Notifica al productor para confirmar la transacción         | INSERT en tabla notificaciones para el productor                                             | Mensaje: 'La Bodega \[nombre\] registró una compra tuya: \[X\] ton a \$\[precio\]/ton. ¿Es correcto?'                             |
| 12       | Productor         | Confirma o reporta discrepancia                             | PATCH /api/transacciones/:id/confirmar desde app del productor                               | Si confirma: peso_precio_sistema=0.75. Si discrepancia: peso=0, marcado para revisión del admin. Si no responde en 48h: peso=0.5. |

## 8.2 Flujo B — Bodega publica oferta por municipio (B-11 → Productores)

Este es el flujo inverso: el bodeguero ve qué municipios tienen maíz disponible y decide contactar a los productores de un municipio específico.

| **Paso** | **Quién actúa**   | **Qué hace**                                                                            | **Pantalla / Endpoint**                             | **Resultado visible**                                                                                                                                            |
|----------|-------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1        | Bodeguero         | Navega a la vista de oferta                                                             | B-11 tabla o B-12 mapa — GET /api/oferta/municipios | Ve municipios con disponibilidad declarada: productores, toneladas aproximadas, ventana de tiempo. Puede filtrar por tipo de maíz, variedad y ventana de tiempo. |
| 2        | Bodeguero         | Detecta un municipio con oferta interesante y toca 'Publicar señal para este municipio' | B-11 — botón en cada fila de la tabla               | Abre B-10 con el municipio preseleccionado como destino de la señal.                                                                                             |
| 3        | Bodeguero         | Completa y publica la señal de compra                                                   | B-10 — POST /api/senales-compra                     | El sistema notifica a los productores con disponibilidad declarada en ese municipio.                                                                             |
| 4        | Sistema (backend) | Notifica a productores del municipio seleccionado                                       | INSERT en notificaciones                            | Mensaje: '🔔 Bodega \[nombre\] está interesada en el maíz disponible en \[municipio\]. Acércate a la bodega.'                                                    |
| 5        | Resto del flujo   | Igual que pasos 6-12 del Flujo A                                                        | Ver sección 8.1                                     | El productor responde, se acerca, el bodeguero registra la transacción.                                                                                          |

## 8.3 Estados de una señal de compra — Ciclo de vida

| **Estado**           | **Cuándo ocurre**                                                                                    | **Visible para el bodeguero**                                                              | **Acción disponible**                 |
|----------------------|------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|---------------------------------------|
| ACTIVA               | Justo después de publicarla. activa=TRUE.                                                            | Aparece en la lista de señales activas con contador de interesados en tiempo real.         | Cancelar señal (SET activa=FALSE).    |
| VENCIDA (automático) | Cuando fecha_vencimiento \< CURRENT_DATE. El backend corre un job diario que actualiza activa=FALSE. | Desaparece de la lista de señales activas. Queda en historial.                             | No hay acción disponible.             |
| CANCELADA (manual)   | Cuando el bodeguero la cancela desde B-10.                                                           | Desaparece de la lista. Queda en historial.                                                | No hay acción disponible.             |
| LÍMITE ALCANZADO     | Cuando intenta publicar señal 6 con 5 ya activas.                                                    | Error en pantalla: 'Ya tienes 5 señales activas. Cancela una antes de publicar una nueva.' | Cancelar una señal existente primero. |

## 8.4 Estados de una transacción — Ciclo de vida

| **Estado (confirmacion_productor)** | **Cuándo ocurre**                                                                 | **peso_precio_sistema** | **Impacto en el sistema**                                                                                    |
|-------------------------------------|-----------------------------------------------------------------------------------|-------------------------|--------------------------------------------------------------------------------------------------------------|
| pendiente (default)                 | Recién registrada por el bodeguero. El productor aún no responde.                 | 0.5                     | La transacción entra al Precio del Maíz con peso reducido.                                                   |
| confirmada                          | El productor toca 'Sí, es correcto' antes de 48 horas.                            | 0.75                    | La transacción alimenta el Precio del Maíz con alta confianza.                                               |
| discrepancia                        | El productor toca 'Hay un error' y describe qué fue diferente.                    | 0                       | La transacción se marca para revisión del admin. No alimenta el Precio del Maíz hasta que el admin resuelva. |
| expirada                            | El productor no responde en 48 horas. Job diario del backend actualiza el estado. | 0.5                     | Igual que pendiente — entra con peso reducido pero no bloquea el flujo.                                      |

> 🚨 CRÍTICO
> REGLA CRÍTICA DE BACKEND: El job diario debe correr dos operaciones: (1) SET activa=FALSE en senales_compra WHERE fecha_vencimiento < CURRENT_DATE AND activa=TRUE. (2) SET confirmacion_productor='expirada' en transacciones WHERE confirmacion_productor='pendiente' AND created_at < NOW() - INTERVAL '48 hours'. Ambas operaciones deben correr cada día a las 00:01 hora del servidor.

## 8.5 Resumen visual del flujo — referencia rápida para el desarrollador

| **Módulo origen**    | **Acción**                                 | **Módulo destino**                                              | **Canal**                              |
|----------------------|--------------------------------------------|-----------------------------------------------------------------|----------------------------------------|
| B-10 Señal de compra | Bodeguero publica señal                    | Notificación push → app del Productor                           | tabla notificaciones                   |
| App Productor        | Productor toca 'Me interesa'               | B-10 interesados_count se actualiza + notificación al bodeguero | POST /api/senales-compra/:id/interes   |
| B-11/B-12 Oferta     | Bodeguero toca 'Señal para este municipio' | B-10 con municipio preseleccionado                              | navegación interna React Router        |
| B-13 Transacción     | Bodeguero registra compra                  | Notificación push → app del Productor para confirmar            | POST /api/transacciones                |
| App Productor        | Productor confirma o reporta discrepancia  | peso_precio_sistema se actualiza en transacciones               | PATCH /api/transacciones/:id/confirmar |
| Job diario backend   | Vence señales y transacciones pendientes   | activa=FALSE en senales_compra / expirada en transacciones      | Cron job 00:01 diario                  |

# 9. Mockup Visual — B-04 Tablero del Bodeguero

La siguiente sección muestra el diseño visual de referencia para el Tablero del Bodeguero. El desarrollador debe usar estos colores, proporciones y estructura como guía para todas las pantallas del módulo.

> 📋 NOTA
> Color primario: #1A5C38 (verde institucional). Tipografía: sistema sans-serif. Botones primarios: fondo #1A5C38, texto blanco. KPIs: tarjetas con sombra suave, borde redondeado 12px. Iconografía: Lucide React o similar.

Ver pantalla de mockup interactivo adjunta. La pantalla B-04 debe incluir:

- Header: logo + nombre del usuario + campana de notificaciones

- Saludo personalizado con fecha

- Grid 2x2 de KPIs con estados visuales de color

- Sección de acceso rápido con 3 botones de acción prominentes

- Navegación inferior fija con 5 íconos: Tablero / Bodegas / Oferta / <img src="/mnt/data/simac_md/media/media/image1.png" style="width:5.20347in;height:9in" />Transacciones / Más
