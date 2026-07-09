/**
 * Script de carga masiva: usuarios OREF (rol 'user', panel administrativo).
 * Cada uno ve solo su estado asignado y tiene acceso a:
 *   - productores: ver
 *   - bodegas: ver + exportar
 * Contraseñas fijas (no se regeneran) — vienen del insumo de RH/representación.
 *
 * Uso: cd backend && node scripts/crear_usuarios_oref.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const USUARIOS = [
  { estado: 'AGUASCALIENTES',              nombre: 'Kristian Andrés Vera Guerrero',        email: 'representacioon.ags@agricultura.gob.mx',   pass: 'y7chjtDA' },
  { estado: 'BAJA CALIFORNIA',             nombre: 'José Antonio Ramírez Gómez',           email: 'representacion.bc@agricultura.gob.mx',     pass: 'fH9uMrCr' },
  { estado: 'BAJA CALIFORNIA SUR',         nombre: 'Armando Ramírez Gálvez',               email: 'representacion.bcs@agricultura.gob.mx',    pass: 'TmXwtBzw' },
  { estado: 'CAMPECHE',                    nombre: 'Carlos Emilio Baquiro Caceres',        email: 'representacion.camp@agricultura.gob.mx',   pass: 'BpdxaKPV' },
  { estado: 'COAHUILA',                    nombre: 'Alfredo Padilla Esparza',              email: 'representacion.coah@agricultura.gob.mx',   pass: 'NqtJKSBE' },
  { estado: 'COLIMA',                      nombre: 'Ernesto German Virgen Verduzco',       email: 'representacion.col@agricultura.gob.mx',    pass: 'rqB4Krd7' },
  { estado: 'CHIAPAS',                     nombre: 'Maria De Los Angeles Cruz Hernandez',  email: 'representacion.chis@agricultura.gob.mx',   pass: 'zqcsMYm6' },
  { estado: 'CHIHUAHUA',                   nombre: 'Benjamin Carrera Chavez',              email: 'representacion.chih@agricultura.gob.mx',   pass: 'sQMk5gm4' },
  { estado: 'CIUDAD DE MEXICO',            nombre: 'Maria Del Refugio Medina Juárez',      email: 'representacion.cdmx@agricultura.gob.mx',   pass: 'udd5G7UP' },
  { estado: 'DURANGO',                     nombre: 'Ismael Ayala Salazar',                 email: 'representacion.dgo@agricultura.gob.mx',    pass: 'n7b4XXB6' },
  { estado: 'GUANAJUATO',                  nombre: 'Justino Eugenio Arriaga Rojas',        email: 'representacion.gto@agricultura.gob.mx',    pass: 'GpG8sKYv' },
  { estado: 'GUERRERO',                    nombre: 'Wilfrido Najera Lomeli',               email: 'representacion.gro@agricultura.gob.mx',    pass: '7zNHDyzz' },
  { estado: 'HIDALGO',                     nombre: 'José Arnulfo Flores Valdez',           email: 'representacion.hgo@agricultura.gob.mx',    pass: 'pgAvePsF' },
  { estado: 'JALISCO',                     nombre: 'Alfredo Porras Dominguez',             email: 'representacion.jal@agricultura.gob.mx',    pass: 'CDHDUExC' },
  { estado: 'ESTADO DE MEXICO',            nombre: 'Gisela Osornio Silva',                 email: 'representacion.mex@agricultura.gob.mx',    pass: 'CMvwJpVr' },
  { estado: 'MICHOACAN',                   nombre: 'Vicente Lara Garcia',                  email: 'representacion.mich@agricultura.gob.mx',   pass: 'dwSaRjU5' },
  { estado: 'MORELOS',                     nombre: 'Jose Luis Arizmendi Baena',            email: 'representacion.mor@agricultura.gob.mx',    pass: 'DWhKajDx' },
  { estado: 'NAYARIT',                     nombre: 'Diana Maria Valdez Sojo',              email: 'representacion.nay@agricultura.gob.mx',    pass: '9zFkMwNx' },
  { estado: 'NUEVO LEON',                  nombre: 'Erick Oziel Rodriguez Leal',           email: 'anarely.avila@nvl.agricultura.gob.mx',     pass: 'kFCSAUY5' },
  { estado: 'OAXACA',                      nombre: 'Carolina Ojeda Martínez',              email: 'representacion.oax@agricultura.gob.mx',    pass: '7HSYePQQ' },
  { estado: 'PUEBLA',                      nombre: 'Morayma Rubi Joven',                   email: 'representación.pue@agricultura.gob.mx',    pass: '4ufE6mPH' },
  { estado: 'QUERETARO',                   nombre: 'Benito De Jesús Olvera Muñoz',         email: 'representacion.qro@agricultura.gob.mx',    pass: 'PWfg6tZ5' },
  { estado: 'QUINTANA ROO',                nombre: 'Enrique Morales Pardo',                email: 'representacion.qroo@agricultura.gob.mx',   pass: 'fkHbJK43' },
  { estado: 'SAN LUIS POTOSI',             nombre: 'Sergio Martinez Y Martinez',           email: 'representacion.slp@agricultura.gob.mx',    pass: 'APJs3vFJ' },
  { estado: 'SINALOA',                     nombre: 'Jesus Vega Acuña',                     email: 'representacion.sin@agricultura.gob.mx',    pass: 'Jx9m4qW8' },
  { estado: 'SONORA',                      nombre: 'Juan Manuel Gonzalez Alvarado',        email: 'representacion.son@agricultura.gob.mx',    pass: 'QdTuyE2Z' },
  { estado: 'TABASCO',                     nombre: 'Carlos Francisco Lastra Gonzalez',     email: 'representacion.tab@agricultura.gob.mx',    pass: 'PUfddQZH' },
  { estado: 'TAMAULIPAS',                  nombre: 'Roman Rigoberto Garza Infante',        email: 'representacion.tamps@agricultura.gob.mx',  pass: 'tRstHyW6' },
  { estado: 'TLAXCALA',                    nombre: 'Jorge Caballero Roman',                email: 'representacion.tlax@agricultura.gob.mx',   pass: 'TBetpWQk' },
  { estado: 'VERACRUZ',                    nombre: 'Evaristo Ovando Ramirez',              email: 'representacion.ver@agricultura.gob.mx',    pass: '5XZGmRyc' },
  { estado: 'YUCATAN',                     nombre: 'Jorge Carlos Berlin Montero',          email: 'representacion.yuc@agricultura.gob.mx',    pass: 'HmYqTaAm' },
  { estado: 'ZACATECAS',                   nombre: 'Juan Antonio Rangel Trujillo',         email: 'representacion.zac@agricultura.gob.mx',    pass: 'aRFV4PHX' },
];

// Permisos fijos para todos: productores/ver, bodegas/ver, bodegas/exportar
const PERMISOS_OREF = [
  { vista: 'productores', sub_accion: 'ver',      habilitado: true },
  { vista: 'bodegas',     sub_accion: 'ver',      habilitado: true },
  { vista: 'bodegas',     sub_accion: 'exportar', habilitado: true },
];

async function main() {
  let creados = 0, omitidos = 0;

  for (const u of USUARIOS) {
    const emailLower = u.email.toLowerCase().trim();

    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailLower]);
    if (existente.rows.length > 0) {
      console.log(`⏭  Omitido (ya existe): ${emailLower}`);
      omitidos++;
      continue;
    }

    const hash = await bcrypt.hash(u.pass, 12);

    const result = await pool.query(
      `INSERT INTO usuarios
         (email, nombre_completo, password_hash, rol, activo,
          es_panel_usuario, estado_asignado, debe_cambiar_pass)
       VALUES ($1, $2, $3, 'user', true, true, $4, true)
       RETURNING id, email, nombre_completo, estado_asignado`,
      [emailLower, u.nombre.trim(), hash, u.estado]
    );

    const usuarioId = result.rows[0].id;

    for (const p of PERMISOS_OREF) {
      await pool.query(
        `INSERT INTO admin_permisos (usuario_id, vista, sub_accion, habilitado)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (usuario_id, vista, sub_accion) DO UPDATE SET habilitado = $4, actualizado_en = NOW()`,
        [usuarioId, p.vista, p.sub_accion, p.habilitado]
      );
    }

    console.log(`✓ Creado: ${result.rows[0].nombre_completo} (${result.rows[0].estado_asignado}) — ${emailLower}`);
    creados++;
  }

  console.log(`\nResumen: ${creados} creados, ${omitidos} omitidos (ya existían) de ${USUARIOS.length} totales.`);
  await pool.end();
}

main().catch(err => {
  console.error('Error en carga de usuarios OREF:', err);
  process.exit(1);
});
