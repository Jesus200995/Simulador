import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Solo admins y responsables pueden exportar
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  if (user?.rol !== 'admin' && user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIMAC';
    wb.created = new Date();

    // ── Helpers ──────────────────────────────────────────────────────────
    function addSheet(name: string, rows: any[], cols: { key: string; header: string; width?: number }[]) {
      const ws = wb.addWorksheet(name);
      ws.columns = cols.map(c => ({ key: c.key, header: c.header, width: c.width ?? 20 }));

      // Header estilo
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C38' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 18;

      rows.forEach((row, i) => {
        const r = ws.addRow(cols.map(c => row[c.key] ?? ''));
        r.font = { size: 9 };
        if (i % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5FAF7' } };
      });

      ws.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + cols.length)}1` };
    }

    // ── 1. Productores ───────────────────────────────────────────────────
    const { rows: productores } = await pool.query(`
      SELECT
        p.producer_id, p.curp, p.nombres, p.apellido_paterno, p.apellido_materno,
        p.fecha_nacimiento, p.genero, p.telefono, p.correo,
        s.nombre AS estado, m.nombre AS municipio,
        p.activo_renapo, p.activo_padron, p.created_at
      FROM producer p
      LEFT JOIN geo_state s ON s.id = p.state_id
      LEFT JOIN geo_municipality m ON m.id = p.municipality_id
      ORDER BY p.apellido_paterno, p.nombres
    `);
    addSheet('Productores', productores, [
      { key: 'producer_id', header: 'ID', width: 10 },
      { key: 'curp',              header: 'CURP',              width: 20 },
      { key: 'nombres',           header: 'Nombres',           width: 22 },
      { key: 'apellido_paterno',  header: 'Ap. Paterno',       width: 18 },
      { key: 'apellido_materno',  header: 'Ap. Materno',       width: 18 },
      { key: 'fecha_nacimiento',  header: 'Fecha Nac.',        width: 14 },
      { key: 'genero',            header: 'Género',            width: 10 },
      { key: 'telefono',          header: 'Teléfono',          width: 14 },
      { key: 'correo',            header: 'Correo',            width: 28 },
      { key: 'estado',            header: 'Estado',            width: 18 },
      { key: 'municipio',         header: 'Municipio',         width: 20 },
      { key: 'activo_renapo',     header: 'Activo RENAPO',     width: 14 },
      { key: 'activo_padron',     header: 'Activo Padrón',     width: 14 },
      { key: 'created_at',        header: 'Registro',          width: 18 },
    ]);

    // ── 2. Bodegas ───────────────────────────────────────────────────────
    const { rows: bodegas } = await pool.query(`
      SELECT
        b.id, b.nombre, b.clave_bodega, b.capacidad_toneladas,
        b.precio_compra, b.precio_servicio,
        s.nombre AS estado, m.nombre AS municipio,
        b.direccion, b.latitud, b.longitud,
        b.activo, b.created_at
      FROM bodegas b
      LEFT JOIN geo_state s ON s.id = b.state_id
      LEFT JOIN geo_municipality m ON m.id = b.municipality_id
      ORDER BY s.nombre, b.nombre
    `);
    addSheet('Bodegas', bodegas, [
      { key: 'id',                   header: 'ID',              width: 8  },
      { key: 'nombre',               header: 'Nombre',          width: 30 },
      { key: 'clave_bodega',         header: 'Clave',           width: 14 },
      { key: 'capacidad_toneladas',  header: 'Cap. (ton)',       width: 12 },
      { key: 'precio_compra',        header: 'Precio Compra',   width: 14 },
      { key: 'precio_servicio',      header: 'Precio Servicio', width: 15 },
      { key: 'estado',               header: 'Estado',          width: 18 },
      { key: 'municipio',            header: 'Municipio',       width: 20 },
      { key: 'direccion',            header: 'Dirección',       width: 35 },
      { key: 'latitud',              header: 'Latitud',         width: 12 },
      { key: 'longitud',             header: 'Longitud',        width: 12 },
      { key: 'activo',               header: 'Activo',          width: 10 },
      { key: 'created_at',           header: 'Registro',        width: 18 },
    ]);

    // ── 3. Transacciones ─────────────────────────────────────────────────
    const { rows: transacciones } = await pool.query(`
      SELECT
        t.id, t.folio,
        p.nombres || ' ' || p.apellido_paterno AS productor,
        b.nombre AS bodega,
        t.volumen_toneladas, t.precio_ton, t.total,
        t.estatus, t.fecha_transaccion, t.created_at
      FROM transacciones t
      LEFT JOIN producer p ON p.producer_id = t.producer_id
      LEFT JOIN bodegas b ON b.id = t.bodega_id
      ORDER BY t.fecha_transaccion DESC
    `);
    addSheet('Transacciones', transacciones, [
      { key: 'id',                 header: 'ID',         width: 8  },
      { key: 'folio',              header: 'Folio',      width: 16 },
      { key: 'productor',          header: 'Productor',  width: 30 },
      { key: 'bodega',             header: 'Bodega',     width: 25 },
      { key: 'volumen_toneladas',  header: 'Vol. (ton)', width: 12 },
      { key: 'precio_ton',         header: 'Precio/ton', width: 12 },
      { key: 'total',              header: 'Total MXN',  width: 14 },
      { key: 'estatus',            header: 'Estatus',    width: 14 },
      { key: 'fecha_transaccion',  header: 'Fecha',      width: 16 },
      { key: 'created_at',         header: 'Registro',   width: 18 },
    ]);

    // ── 4. Inventarios ───────────────────────────────────────────────────
    const { rows: inventarios } = await pool.query(`
      SELECT
        i.id, b.nombre AS bodega,
        i.variedad, i.volumen_actual_ton, i.volumen_maximo_ton,
        i.precio_referencia, i.fecha_actualizacion
      FROM inventarios i
      LEFT JOIN bodegas b ON b.id = i.bodega_id
      ORDER BY b.nombre, i.variedad
    `);
    addSheet('Inventarios', inventarios, [
      { key: 'id',                  header: 'ID',           width: 8  },
      { key: 'bodega',              header: 'Bodega',       width: 28 },
      { key: 'variedad',            header: 'Variedad',     width: 20 },
      { key: 'volumen_actual_ton',  header: 'Vol. Actual',  width: 14 },
      { key: 'volumen_maximo_ton',  header: 'Vol. Máximo',  width: 14 },
      { key: 'precio_referencia',   header: 'Precio Ref.',  width: 14 },
      { key: 'fecha_actualizacion', header: 'Actualizado',  width: 18 },
    ]);

    // ── 5. Precios Maíz ──────────────────────────────────────────────────
    const { rows: precios } = await pool.query(`
      SELECT fecha, region, precio_promedio, precio_minimo, precio_maximo,
             volumen_operado, fuente, created_at
      FROM precios_maiz
      ORDER BY fecha DESC
      LIMIT 5000
    `);
    addSheet('Precios Maíz', precios, [
      { key: 'fecha',            header: 'Fecha',       width: 14 },
      { key: 'region',           header: 'Región',      width: 20 },
      { key: 'precio_promedio',  header: 'Prom. MXN',   width: 12 },
      { key: 'precio_minimo',    header: 'Mín. MXN',    width: 12 },
      { key: 'precio_maximo',    header: 'Máx. MXN',    width: 12 },
      { key: 'volumen_operado',  header: 'Vol. (ton)',   width: 12 },
      { key: 'fuente',           header: 'Fuente',       width: 16 },
      { key: 'created_at',       header: 'Registro',     width: 18 },
    ]);

    // ── 6. Alertas ───────────────────────────────────────────────────────
    const { rows: alertas } = await pool.query(`
      SELECT
        a.id, a.tipo, a.descripcion, a.severidad,
        b.nombre AS bodega, a.resuelta, a.created_at
      FROM alertas a
      LEFT JOIN bodegas b ON b.id = a.bodega_id
      ORDER BY a.created_at DESC
    `);
    addSheet('Alertas', alertas, [
      { key: 'id',          header: 'ID',          width: 8  },
      { key: 'tipo',        header: 'Tipo',        width: 18 },
      { key: 'descripcion', header: 'Descripción', width: 40 },
      { key: 'severidad',   header: 'Severidad',   width: 12 },
      { key: 'bodega',      header: 'Bodega',      width: 25 },
      { key: 'resuelta',    header: 'Resuelta',    width: 10 },
      { key: 'created_at',  header: 'Fecha',       width: 18 },
    ]);

    // ── 7. Disponibilidad ────────────────────────────────────────────────
    const { rows: disponibilidad } = await pool.query(`
      SELECT
        d.id,
        p.nombres || ' ' || p.apellido_paterno AS productor,
        d.tipo_maiz, d.variedad, d.volumen_ton,
        s.nombre AS estado, m.nombre AS municipio,
        d.fecha_disponible, d.estatus, d.created_at
      FROM disponibilidad_productor d
      LEFT JOIN producer p ON p.producer_id = d.producer_id
      LEFT JOIN geo_state s ON s.id = d.state_id
      LEFT JOIN geo_municipality m ON m.id = d.municipality_id
      ORDER BY d.created_at DESC
    `);
    addSheet('Disponibilidad', disponibilidad, [
      { key: 'id',               header: 'ID',          width: 8  },
      { key: 'productor',        header: 'Productor',   width: 30 },
      { key: 'tipo_maiz',        header: 'Tipo Maíz',   width: 16 },
      { key: 'variedad',         header: 'Variedad',    width: 18 },
      { key: 'volumen_ton',      header: 'Vol. (ton)',  width: 12 },
      { key: 'estado',           header: 'Estado',      width: 18 },
      { key: 'municipio',        header: 'Municipio',   width: 20 },
      { key: 'fecha_disponible', header: 'Disponible',  width: 14 },
      { key: 'estatus',          header: 'Estatus',     width: 12 },
      { key: 'created_at',       header: 'Registro',    width: 18 },
    ]);

    // ── 8. Señales de Compra ─────────────────────────────────────────────
    const { rows: senales } = await pool.query(`
      SELECT
        sc.id, b.nombre AS bodega,
        sc.tipo_maiz, sc.variedad, sc.volumen_requerido_ton,
        sc.precio_oferta, sc.radio_km, sc.estatus,
        sc.fecha_inicio, sc.fecha_fin, sc.created_at
      FROM senales_compra sc
      LEFT JOIN bodegas b ON b.id = sc.bodega_id
      ORDER BY sc.created_at DESC
    `);
    addSheet('Señales Compra', senales, [
      { key: 'id',                   header: 'ID',          width: 8  },
      { key: 'bodega',               header: 'Bodega',      width: 25 },
      { key: 'tipo_maiz',            header: 'Tipo Maíz',   width: 16 },
      { key: 'variedad',             header: 'Variedad',    width: 18 },
      { key: 'volumen_requerido_ton',header: 'Vol. (ton)',  width: 12 },
      { key: 'precio_oferta',        header: 'Precio MXN',  width: 13 },
      { key: 'radio_km',             header: 'Radio (km)',  width: 12 },
      { key: 'estatus',              header: 'Estatus',     width: 12 },
      { key: 'fecha_inicio',         header: 'Inicio',      width: 14 },
      { key: 'fecha_fin',            header: 'Fin',         width: 14 },
      { key: 'created_at',           header: 'Registro',    width: 18 },
    ]);

    // ── 9. Usuarios Productores (sin admins/panel) ────────────────────────
    const { rows: usuarios } = await pool.query(`
      SELECT
        u.id, u.curp, u.nombre_completo, u.email, u.telefono,
        s.nombre AS estado, m.nombre AS municipio,
        u.activo, u.ultimo_login, u.created_at
      FROM usuarios u
      LEFT JOIN geo_state s ON s.id = u.state_id
      LEFT JOIN geo_municipality m ON m.id = u.municipality_id
      WHERE u.rol = 'productor'
      ORDER BY u.nombre_completo
    `);
    addSheet('Usuarios Productores', usuarios, [
      { key: 'id',              header: 'ID',           width: 8  },
      { key: 'curp',            header: 'CURP',         width: 20 },
      { key: 'nombre_completo', header: 'Nombre',       width: 30 },
      { key: 'email',           header: 'Email',        width: 28 },
      { key: 'telefono',        header: 'Teléfono',     width: 14 },
      { key: 'estado',          header: 'Estado',       width: 18 },
      { key: 'municipio',       header: 'Municipio',    width: 20 },
      { key: 'activo',          header: 'Activo',       width: 10 },
      { key: 'ultimo_login',    header: 'Último acceso',width: 18 },
      { key: 'created_at',      header: 'Registro',     width: 18 },
    ]);

    // ── 10. Seguimiento ──────────────────────────────────────────────────
    const { rows: seguimiento } = await pool.query(`
      SELECT
        sv.id, sv.tipo_visita,
        p.nombres || ' ' || p.apellido_paterno AS productor,
        sv.observaciones, sv.fecha_visita, sv.created_at
      FROM seguimiento_visitas sv
      LEFT JOIN producer p ON p.producer_id = sv.producer_id
      ORDER BY sv.fecha_visita DESC
    `);
    addSheet('Seguimiento', seguimiento, [
      { key: 'id',            header: 'ID',           width: 8  },
      { key: 'tipo_visita',   header: 'Tipo',         width: 16 },
      { key: 'productor',     header: 'Productor',    width: 30 },
      { key: 'observaciones', header: 'Observaciones',width: 40 },
      { key: 'fecha_visita',  header: 'Fecha',        width: 14 },
      { key: 'created_at',    header: 'Registro',     width: 18 },
    ]);

    // ── Stream response ──────────────────────────────────────────────────
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SIMAC_BD_${fecha}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();

  } catch (err: any) {
    console.error('[exportar-bd]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el archivo.' });
  }
});

export default router;
