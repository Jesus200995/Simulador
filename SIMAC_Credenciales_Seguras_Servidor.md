# SIMAC — Credenciales Seguras en el Servidor
## Cómo desplegar desde Git sin exponer contraseñas
**Plan Nacional Maíz 2026 · Mayo 2026**
**Para:** Desarrollador — ejecutar una sola vez en el servidor de producción

> Este documento resuelve el problema de las credenciales reales que estaban
> en `.env.example`. El objetivo es que el servidor funcione con credenciales
> seguras sin que nunca aparezcan en el repositorio de Git.

---

## El problema actual

El flujo de deploy actual es:
```
git push → servidor hace git pull → app corre
```

Las credenciales estaban en `.env.example` dentro del repo porque el servidor
las necesita para arrancar. Eso es incorrecto — cualquier persona con acceso
al repo puede ver la IP, usuario y contraseña de la base de datos.

---

## La solución — `.env` real en el servidor, nunca en Git

El servidor tiene su propio archivo `.env` con las credenciales reales.
Git nunca lo sube ni lo sobreescribe porque está en `.gitignore`.
El deploy sigue siendo `git pull` — nada cambia en el flujo.

---

## Paso 1 — Cambiar la contraseña de la base de datos

> ⚠️ Hacer esto PRIMERO antes que cualquier otra cosa.
> La contraseña `2025` ya está expuesta en el historial de Git.

Conectarse al servidor y ejecutar en PostgreSQL:

```bash
# Conectarse al servidor
ssh usuario@31.97.8.51

# Entrar a PostgreSQL
psql -U postgres

# Cambiar la contraseña del usuario 'jesus'
ALTER USER jesus WITH PASSWORD 'nueva_password_muy_segura_aqui';

# Salir
\q
```

**Cómo generar una contraseña segura:**
```bash
# En cualquier terminal — genera una contraseña aleatoria de 32 caracteres
openssl rand -base64 32
# Ejemplo de resultado: K8mX2pL9nQ3vR7wJ4tY6uI1oP5sA0dF8
# Copiar ese resultado y usarlo como contraseña
```

> Guardar la nueva contraseña en un lugar seguro (gestor de contraseñas).
> NO guardarla en ningún archivo del repo.

---

## Paso 2 — Verificar que `.env` está en `.gitignore`

En el servidor, dentro de la carpeta del proyecto:

```bash
cd /ruta/al/proyecto

# Verificar que .env está ignorado
cat .gitignore | grep ".env"
# Resultado esperado: .env
# Si no aparece, agregar:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Paso 3 — Crear el `.env` real en el servidor

Este archivo se crea UNA SOLA VEZ directamente en el servidor.
**Nunca se hace `git add` ni `git commit` de este archivo.**

```bash
# Crear el archivo en el backend
nano /ruta/al/proyecto/backend/.env
```

Contenido completo del archivo — reemplazar cada valor con los reales:

```env
# ─── BASE DE DATOS ───────────────────────────────────────────────
DATABASE_URL=postgresql://jesus:NUEVA_PASSWORD_AQUI@31.97.8.51:5432/bodegas

# ─── AUTENTICACIÓN ───────────────────────────────────────────────
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=pegar_aqui_cadena_aleatoria_minimo_64_caracteres

# ─── BANXICO API (tipo de cambio oficial USD/MXN) ────────────────
# Obtener gratis en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
BANXICO_TOKEN=pegar_aqui_token_de_64_caracteres_sin_espacios

# ─── CÓDIGO DE REGISTRO ADMIN ────────────────────────────────────
# Cambiar 'SIMAC2026' por un código secreto del equipo
ADMIN_REGISTRO_CODIGO=codigo_secreto_del_equipo

# ─── SERVIDOR ────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production

# ─── CORS ────────────────────────────────────────────────────────
FRONTEND_URL=https://bodega.geodatos.com.mx
```

Guardar el archivo: `Ctrl+O` → Enter → `Ctrl+X`

---

## Paso 4 — Generar un JWT_SECRET seguro

```bash
# En el servidor, generar una cadena aleatoria segura:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Resultado ejemplo:
# a3f8c2d1e9b4f7a0c5d2e8b1f6a3c9d4e7b2f5a8c1d6e3b0f9a4c7d2e5b8f1a6c3d0

# Copiar ese valor completo y pegarlo como JWT_SECRET en el .env
```

---

## Paso 5 — Crear el `.env` del frontend

```bash
# Crear el archivo en app-bodega
nano /ruta/al/proyecto/app-bodega/.env
```

Contenido:

```env
VITE_API_URL=https://bodega.geodatos.com.mx/api
```

Guardar: `Ctrl+O` → Enter → `Ctrl+X`

---

## Paso 6 — Limpiar `.env.example` en el repo

En tu máquina local (no en el servidor), limpiar el archivo:

**`backend/.env.example`** — reemplazar con placeholders:

```env
# ─── BASE DE DATOS ───────────────────────────────────────────────
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db

# ─── AUTENTICACIÓN ───────────────────────────────────────────────
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=cadena_aleatoria_minimo_64_caracteres

# ─── BANXICO API ─────────────────────────────────────────────────
# Obtener gratis en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
# Sin este token el TC usa Yahoo Finance como fallback
BANXICO_TOKEN=tu_token_de_64_caracteres_sin_espacios

# ─── CÓDIGO DE REGISTRO ADMIN ────────────────────────────────────
# Cambiar por un código secreto real — NO usar el default
ADMIN_REGISTRO_CODIGO=codigo_secreto_del_equipo

# ─── SERVIDOR ────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── CORS ────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
```

Hacer commit y push:

```bash
git add backend/.env.example
git commit -m "fix: limpiar credenciales reales de .env.example"
git push
```

---

## Paso 7 — Verificar que el servidor arranca con el nuevo `.env`

```bash
# En el servidor
cd /ruta/al/proyecto/backend

# Hacer pull para traer los cambios del .env.example limpio
git pull

# Verificar que el .env real NO fue sobreescrito por git pull
cat .env | grep DB_PASSWORD
# Resultado esperado: tu contraseña real — NO 'tu_password_seguro'

# Reiniciar el servidor
pm2 restart simac-backend
# o si usa otro gestor:
npm run start

# Verificar que arranca correctamente
pm2 logs simac-backend
# Buscar en los logs:
# ✅ "Servidor corriendo en puerto 3000"
# ✅ "Conectado a PostgreSQL"
# ✅ "Cron job de precios registrado"
```

---

## Paso 8 — Verificar que todo funciona

```bash
# Salud del servidor
curl http://localhost:3000/api/health
# Resultado esperado: { "status": "ok", "db": "connected" }

# Verificar que JWT_SECRET no tiene fallback
# Temporalmente comentar JWT_SECRET en .env:
# JWT_SECRET=...  →  # JWT_SECRET=...
# Reiniciar servidor → debe lanzar error fatal y NO arrancar
# Restaurar JWT_SECRET y reiniciar

# Verificar precio externo
curl http://localhost:3000/api/precios/referencias/externas
# Resultado esperado: datos reales de Chicago y TC — no hardcodeados
```

---

## Cómo funciona el deploy a partir de ahora

El flujo no cambia. La diferencia es que el `.env` real vive solo en el servidor:

```
Tu máquina:
  git commit + git push → sube código limpio sin credenciales

Servidor:
  git pull → trae el código nuevo
  .env real → sigue intacto, git nunca lo toca
  pm2 restart → reinicia con las credenciales reales del .env local
```

**El `.env` del servidor nunca se sube a Git.**
**Si el servidor muere**, recrear el `.env` con los valores guardados
en el gestor de contraseñas del equipo.

---

## Checklist final

```
□ Contraseña de BD cambiada en el servidor PostgreSQL
□ .env real creado en backend/ del servidor con todos los valores
□ .env real creado en app-bodega/ del servidor
□ JWT_SECRET generada con crypto.randomBytes(64) — mínimo 64 chars
□ BANXICO_TOKEN configurado sin espacios
□ ADMIN_REGISTRO_CODIGO cambiado del default 'SIMAC2026'
□ .env.example limpiado con placeholders — commit + push
□ git pull en servidor confirma que .env no fue sobreescrito
□ Servidor arranca sin errores
□ GET /api/health responde { status: "ok", db: "connected" }
□ Sin JWT_SECRET en .env → servidor lanza error fatal (no arranca)
```

---

*SIMAC Plan Nacional Maíz 2026 · Credenciales Seguras en Servidor*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
