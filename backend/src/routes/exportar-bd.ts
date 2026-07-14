import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  if (user?.rol !== 'admin' && user?.rol !== 'responsable') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIMAC';
    wb.created = new Date();

    function addSheet(name: string, rows: any[], cols: { key: string; header: string; width?: number }[]) {
      const ws = wb.addWorksheet(name);
      ws.columns = cols.map(c => ({ key: c.key, header: c.header, width: c.width ?? 20 }));
      const hr = ws.getRow(1);
      hr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C38' } };
      hr.alignment = { vertical: 'middle', horizontal: 'center' };
      hr.height = 18;
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
        p.producer_id, p.curp,
        p.nombres, p.apellido_paterno, p.apellido_materno,
        p.sexo, p.phone AS telefono, p.correo_electronico AS correo,
        s.name AS estado, m.name AS municipio,
        p.localidad, p.estatus_registro, p.tipo_registro,
        p.created_at
      FROM producer p
      LEFT JOIN geo_state s ON s.state_id = p.state_id
      LEFT JOIN geo_municipality m ON m.municipality_id = p.municipality_id
      ORDER BY p.apellido_paterno, p.nombres
    `);
    addSheet('Productores', productores, [
      { key: 'producer_id',      header: 'ID',             width: 10 },
      { key: 'curp',             header: 'CURP',           width: 20 },
      { key: 'nombres',          header: 'Nombres',        width: 22 },
      { key: 'apellido_paterno', header: 'Ap. Paterno',    width: 18 },
      { key: 'apellido_materno', header: 'Ap. Materno',    width: 18 },
      { key: 'sexo',             header: 'Sexo',           width: 8  },
      { key: 'telefono',         header: 'Teléfono',       width: 14 },
      { key: 'correo',           header: 'Correo',         width: 30 },
      { key: 'estado',           header: 'Estado',         width: 18 },
      { key: 'municipio',        header: 'Municipio',      width: 22 },
      { key: 'localidad',        header: 'Localidad',      width: 20 },
      { key: 'estatus_registro', header: 'Estatus',        width: 14 },
      { key: 'tipo_registro',    header: 'Tipo',           width: 8  },
      { key: 'created_at',       header: 'Registro',       width: 20 },
    ]);

    // ── 2. Bodegas ───────────────────────────────────────────────────────
    const { rows: bodegas } = await pool.query(`
      SELECT
        id, nombre, clave, estado, municipio, localidad,
        region_id, ddr, cader, ejido,
        capacidad_toneladas, latitud, longitud,
        direccion, codigo_postal, created_at
      FROM bodegas
      ORDER BY estado, nombre
    `);
    addSheet('Bodegas', bodegas, [
      { key: 'id',                   header: 'ID',           width: 8  },
      { key: 'nombre',               header: 'Nombre',       width: 35 },
      { key: 'clave',                header: 'Clave',        width: 14 },
      { key: 'estado',               header: 'Estado',       width: 18 },
      { key: 'municipio',            header: 'Municipio',    width: 20 },
      { key: 'localidad',            header: 'Localidad',    width: 20 },
      { key: 'ddr',                  header: 'DDR',          width: 14 },
      { key: 'cader',                header: 'CADER',        width: 14 },
      { key: 'ejido',                header: 'Ejido',        width: 20 },
      { key: 'capacidad_toneladas',  header: 'Cap. (ton)',   width: 12 },
      { key: 'latitud',              header: 'Latitud',      width: 12 },
      { key: 'longitud',             header: 'Longitud',     width: 12 },
      { key: 'direccion',            header: 'Dirección',    width: 35 },
      { key: 'created_at',           header: 'Registro',     width: 20 },
    ]);

    // ── 3. Transacciones ─────────────────────────────────────────────────
    const { rows: transacciones } = await pool.query(`
      SELECT
        t.id,
        COALESCE(p.nombres || ' ' || p.apellido_paterno, t.nombre_productor_libre) AS productor,
        b.nombre AS bodega,
        t.tipo_maiz, t.variedad_code,
        t.volumen_ton, t.precio_ton,
        ROUND((t.volumen_ton * t.precio_ton)::numeric, 2) AS total,
        t.confirmacion_productor AS estatus,
        t.fecha, t.created_at
      FROM transacciones t
      LEFT JOIN producer p ON p.producer_id = t.producer_id
      LEFT JOIN bodegas b ON b.id = t.bodega_id
      ORDER BY t.fecha DESC
    `);
    addSheet('Transacciones', transacciones, [
      { key: 'id',          header: 'ID',          width: 8  },
      { key: 'productor',   header: 'Productor',   width: 32 },
      { key: 'bodega',      header: 'Bodega',      width: 28 },
      { key: 'tipo_maiz',   header: 'Tipo Maíz',   width: 14 },
      { key: 'variedad_code', header: 'Variedad',  width: 16 },
      { key: 'volumen_ton', header: 'Vol. (ton)',  width: 12 },
      { key: 'precio_ton',  header: 'Precio/ton',  width: 12 },
      { key: 'total',       header: 'Total MXN',   width: 14 },
      { key: 'estatus',     header: 'Estatus',     width: 14 },
      { key: 'fecha',       header: 'Fecha',       width: 14 },
      { key: 'created_at',  header: 'Registro',    width: 20 },
    ]);

    // ── 4. Inventarios ───────────────────────────────────────────────────
    const { rows: inventarios } = await pool.query(`
      SELECT
        i.id, b.nombre AS bodega,
        i.tipo_maiz, i.ciclo, i.origen,
        i.volumen_almacenamiento, i.volumen_problemas,
        i.fecha, i.fecha_registro
      FROM inventarios i
      LEFT JOIN bodegas b ON b.id = i.bodega_id
      ORDER BY b.nombre, i.fecha DESC
    `);
    addSheet('Inventarios', inventarios, [
      { key: 'id',                    header: 'ID',             width: 8  },
      { key: 'bodega',                header: 'Bodega',         width: 30 },
      { key: 'tipo_maiz',             header: 'Tipo Maíz',      width: 16 },
      { key: 'ciclo',                 header: 'Ciclo',          width: 16 },
      { key: 'origen',                header: 'Origen',         width: 12 },
      { key: 'volumen_almacenamiento',header: 'Vol. (ton)',      width: 14 },
      { key: 'volumen_problemas',     header: 'Vol. Problemas', width: 15 },
      { key: 'fecha',                 header: 'Fecha',          width: 14 },
      { key: 'fecha_registro',        header: 'Registro',       width: 20 },
    ]);

    // ── 5. Precios Maíz ──────────────────────────────────────────────────
    const { rows: precios } = await pool.query(`
      SELECT id, tipo, precio, unidad, tendencia, fecha_actualizacion
      FROM precios_maiz
      ORDER BY fecha_actualizacion DESC
      LIMIT 5000
    `);
    addSheet('Precios Maíz', precios, [
      { key: 'id',                 header: 'ID',           width: 8  },
      { key: 'tipo',               header: 'Tipo',         width: 20 },
      { key: 'precio',             header: 'Precio MXN',   width: 14 },
      { key: 'unidad',             header: 'Unidad',       width: 12 },
      { key: 'tendencia',          header: 'Tendencia',    width: 14 },
      { key: 'fecha_actualizacion',header: 'Fecha',        width: 14 },
    ]);

    // ── 6. Alertas ───────────────────────────────────────────────────────
    const { rows: alertas } = await pool.query(`
      SELECT
        a.id, a.tipo_alerta, a.origen_alerta, a.nivel_alerta,
        a.estado_alerta, a.observaciones, a.fecha_alerta, a.created_at
      FROM alertas a
      ORDER BY a.fecha_alerta DESC
    `);
    addSheet('Alertas', alertas, [
      { key: 'id',            header: 'ID',           width: 8  },
      { key: 'tipo_alerta',   header: 'Tipo',         width: 20 },
      { key: 'origen_alerta', header: 'Origen',       width: 16 },
      { key: 'nivel_alerta',  header: 'Nivel',        width: 12 },
      { key: 'estado_alerta', header: 'Estado',       width: 14 },
      { key: 'observaciones', header: 'Observaciones',width: 40 },
      { key: 'fecha_alerta',  header: 'Fecha',        width: 14 },
      { key: 'created_at',    header: 'Registro',     width: 20 },
    ]);

    // ── 7. Disponibilidad ────────────────────────────────────────────────
    const { rows: disponibilidad } = await pool.query(`
      SELECT
        d.id,
        p.nombres || ' ' || p.apellido_paterno AS productor,
        d.tipo_maiz, d.variedad_code, d.variedad_libre,
        d.volumen_estimado_ton, d.precio_minimo_ton,
        d.ventana_venta, d.fecha_disponible, d.fecha_vencimiento,
        d.activa, d.created_at
      FROM disponibilidad_productor d
      LEFT JOIN producer p ON p.producer_id = d.producer_id
      ORDER BY d.created_at DESC
    `);
    addSheet('Disponibilidad', disponibilidad, [
      { key: 'id',                  header: 'ID',            width: 8  },
      { key: 'productor',           header: 'Productor',     width: 32 },
      { key: 'tipo_maiz',           header: 'Tipo Maíz',     width: 14 },
      { key: 'variedad_code',       header: 'Variedad',      width: 16 },
      { key: 'variedad_libre',      header: 'Var. Libre',    width: 16 },
      { key: 'volumen_estimado_ton',header: 'Vol. (ton)',     width: 12 },
      { key: 'precio_minimo_ton',   header: 'Precio Mín.',   width: 12 },
      { key: 'ventana_venta',       header: 'Ventana',       width: 14 },
      { key: 'fecha_disponible',    header: 'Disponible',    width: 14 },
      { key: 'fecha_vencimiento',   header: 'Vencimiento',   width: 14 },
      { key: 'activa',              header: 'Activa',        width: 10 },
      { key: 'created_at',          header: 'Registro',      width: 20 },
    ]);

    // ── 8. Señales de Compra ─────────────────────────────────────────────
    const { rows: senales } = await pool.query(`
      SELECT
        sc.id, b.nombre AS bodega,
        sc.tipo_maiz, sc.variedad_code, sc.volumen_ton,
        sc.precio_ofrecido, sc.radio_km, sc.vigencia,
        sc.interesados_count, sc.activa,
        sc.fecha_vencimiento, sc.created_at
      FROM senales_compra sc
      LEFT JOIN bodegas b ON b.id = sc.bodega_id
      ORDER BY sc.created_at DESC
    `);
    addSheet('Señales Compra', senales, [
      { key: 'id',               header: 'ID',             width: 8  },
      { key: 'bodega',           header: 'Bodega',         width: 28 },
      { key: 'tipo_maiz',        header: 'Tipo Maíz',      width: 14 },
      { key: 'variedad_code',    header: 'Variedad',       width: 16 },
      { key: 'volumen_ton',      header: 'Vol. (ton)',      width: 12 },
      { key: 'precio_ofrecido',  header: 'Precio MXN',     width: 13 },
      { key: 'radio_km',         header: 'Radio (km)',      width: 12 },
      { key: 'vigencia',         header: 'Vigencia',        width: 14 },
      { key: 'interesados_count',header: 'Interesados',    width: 13 },
      { key: 'activa',           header: 'Activa',          width: 10 },
      { key: 'fecha_vencimiento',header: 'Vencimiento',    width: 14 },
      { key: 'created_at',       header: 'Registro',       width: 20 },
    ]);

    // ── 9. Usuarios Productores ───────────────────────────────────────────
    const { rows: usuarios } = await pool.query(`
      SELECT
        u.id, u.curp, u.nombre_completo, u.email, u.telefono,
        s.name AS estado, m.name AS municipio,
        u.activo, u.created_at
      FROM usuarios u
      LEFT JOIN geo_state s ON s.state_id = u.state_id
      LEFT JOIN geo_municipality m ON m.municipality_id = u.municipality_id
      WHERE u.rol = 'productor'
      ORDER BY u.nombre_completo
    `);
    addSheet('Usuarios Productores', usuarios, [
      { key: 'id',              header: 'ID',           width: 8  },
      { key: 'curp',            header: 'CURP',         width: 20 },
      { key: 'nombre_completo', header: 'Nombre',       width: 30 },
      { key: 'email',           header: 'Email',        width: 30 },
      { key: 'telefono',        header: 'Teléfono',     width: 14 },
      { key: 'estado',          header: 'Estado',       width: 18 },
      { key: 'municipio',       header: 'Municipio',    width: 22 },
      { key: 'activo',          header: 'Activo',       width: 10 },
      { key: 'created_at',      header: 'Registro',     width: 20 },
    ]);

    // ── 10. Seguimiento ──────────────────────────────────────────────────
    const { rows: seguimiento } = await pool.query(`
      SELECT
        sv.id,
        p.nombres || ' ' || p.apellido_paterno AS productor,
        sv.etapa_cultivo, sv.estado_cultivo,
        sv.tipo_maiz, sv.precio_observado,
        sv.observaciones, sv.fecha_visita, sv.created_at
      FROM seguimiento_visitas sv
      LEFT JOIN producer p ON p.producer_id = sv.producer_id
      ORDER BY sv.fecha_visita DESC
    `);
    addSheet('Seguimiento', seguimiento, [
      { key: 'id',               header: 'ID',              width: 8  },
      { key: 'productor',        header: 'Productor',       width: 32 },
      { key: 'etapa_cultivo',    header: 'Etapa',           width: 16 },
      { key: 'estado_cultivo',   header: 'Estado Cultivo',  width: 16 },
      { key: 'tipo_maiz',        header: 'Tipo Maíz',       width: 14 },
      { key: 'precio_observado', header: 'Precio Obs.',     width: 14 },
      { key: 'observaciones',    header: 'Observaciones',   width: 40 },
      { key: 'fecha_visita',     header: 'Fecha',           width: 14 },
      { key: 'created_at',       header: 'Registro',        width: 20 },
    ]);

    // ── Stream ───────────────────────────────────────────────────────────
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SIMAC_BD_${fecha}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();

  } catch (err: any) {
    console.error('[exportar-bd]', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el archivo.' });
  }
});

export default router;
