#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Especificaciones de diseño UI/UX — SIMAC app-bodegas
Módulo Productor y Módulo Bodega únicamente.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import Flowable

# ── Colores ───────────────────────────────────────────────────────────────────
VERDE          = colors.HexColor('#1A5C38')
VERDE_MED      = colors.HexColor('#1e6b42')
VERDE_LITE     = colors.HexColor('#22733f')
VERDE_DRAWER   = colors.HexColor('#2d7a52')
VERDE_BG       = colors.HexColor('#eef8f2')
VERDE_MENTA    = colors.HexColor('#f4fbf7')

GRIS_900       = colors.HexColor('#1C1C1E')
GRIS_700       = colors.HexColor('#374151')
GRIS_500       = colors.HexColor('#6b7280')
GRIS_400       = colors.HexColor('#9ca3af')
GRIS_300       = colors.HexColor('#d1d5db')
BLANCO         = colors.white


# ── Swatch de color ───────────────────────────────────────────────────────────
class ColorSwatch(Flowable):
    def __init__(self, color, w=48, h=28):
        Flowable.__init__(self)
        self.color = color
        self.width = w
        self.height = h

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        self.canv.setStrokeColor(colors.HexColor('#d1d5db'))
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=0, stroke=1)


class BarDivider(Flowable):
    def __init__(self):
        Flowable.__init__(self)
        self.width = 40
        self.height = 3

    def draw(self):
        self.canv.setFillColor(VERDE)
        self.canv.roundRect(0, 0, 40, 3, 1.5, fill=1, stroke=0)


def build_pdf(path):
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2*cm,
        title="Especificaciones Diseño — SIMAC app-bodegas",
    )
    W, _ = A4
    UW = W - 4*cm   # ancho útil ≈ 17 cm

    st = getSampleStyleSheet()

    # ── Estilos ───────────────────────────────────────────────────────────────
    def S(name, **kw):
        return ParagraphStyle(name, parent=st['Normal'], **kw)

    sec   = S('sec',  fontSize=13, leading=17, textColor=VERDE,
              fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=3)
    sub   = S('sub',  fontSize=10.5, leading=14, textColor=GRIS_900,
              fontName='Helvetica-Bold', spaceBefore=9, spaceAfter=3)
    body  = S('body', fontSize=9, leading=13, textColor=GRIS_700,
              fontName='Helvetica', spaceAfter=4)
    code  = S('code', fontSize=8, leading=12, textColor=VERDE,
              fontName='Courier', backColor=colors.HexColor('#f0fdf4'),
              leftIndent=6, spaceAfter=3, spaceBefore=3)
    foot  = S('foot', fontSize=7, textColor=GRIS_400,
              fontName='Helvetica', alignment=TA_CENTER)

    # ── Utilidades de tabla ───────────────────────────────────────────────────
    def tbl(data, cols, header=True):
        t = Table(data, colWidths=cols)
        style = [
            ('FONTSIZE',     (0,0), (-1,-1), 8),
            ('TOPPADDING',   (0,0), (-1,-1), 4),
            ('BOTTOMPADDING',(0,0), (-1,-1), 4),
            ('LEFTPADDING',  (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ('LINEBELOW',    (0,0), (-1,-1), 0.3, GRIS_300),
            ('BOX',          (0,0), (-1,-1), 0.5, GRIS_300),
            ('GRID',         (0,0), (-1,-1), 0.3, GRIS_300),
            ('VALIGN',       (0,0), (-1,-1), 'TOP'),
            ('ROWBACKGROUNDS', (0,1 if header else 0), (-1,-1), [BLANCO, VERDE_BG]),
            ('FONTNAME',     (0,1 if header else 0), (-1,-1), 'Helvetica'),
            ('TEXTCOLOR',    (0,1 if header else 0), (-1,-1), GRIS_700),
        ]
        if header:
            style += [
                ('BACKGROUND', (0,0), (-1,0), VERDE),
                ('TEXTCOLOR',  (0,0), (-1,0), BLANCO),
                ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ]
        t.setStyle(TableStyle(style))
        return t

    def prop_tbl(data):
        """Tabla de 2 cols: propiedad (verde bold) + valor."""
        rows = [['Propiedad', 'Valor']] + data
        t = Table(rows, colWidths=[4.5*cm, UW - 4.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), VERDE),
            ('TEXTCOLOR',     (0,0), (-1,0), BLANCO),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 8),
            ('FONTNAME',      (0,1), (0,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR',     (0,1), (0,-1), VERDE),
            ('FONTNAME',      (1,1), (1,-1), 'Helvetica'),
            ('TEXTCOLOR',     (1,1), (1,-1), GRIS_700),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING',   (0,0), (-1,-1), 7),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [BLANCO, VERDE_BG]),
            ('LINEBELOW',     (0,0), (-1,-1), 0.3, GRIS_300),
            ('BOX',           (0,0), (-1,-1), 0.5, GRIS_300),
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ]))
        return t

    story = []

    # ═══════════════════════════════════════════════════════════════════════════
    # PORTADA
    # ═══════════════════════════════════════════════════════════════════════════
    cover = Table(
        [[Paragraph('<b>SIMAC</b> — Especificaciones de Diseño UI/UX<br/>'
                    '<font size="11">Módulo Productor &amp; Módulo Bodega · app-bodegas · v1.0</font>',
                    S('ct', fontSize=21, leading=28, textColor=BLANCO,
                      fontName='Helvetica-Bold', alignment=TA_LEFT))]],
        colWidths=[UW],
    )
    cover.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), VERDE),
        ('TOPPADDING',    (0,0), (-1,-1), 28),
        ('BOTTOMPADDING', (0,0), (-1,-1), 28),
        ('LEFTPADDING',   (0,0), (-1,-1), 20),
        ('RIGHTPADDING',  (0,0), (-1,-1), 20),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
    ]))
    story.append(cover)
    story.append(Spacer(1, 5*mm))

    meta = tbl([
        ['Proyecto', 'SIMAC — Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México'],
        ['Módulos cubiertos', 'Módulo Productor  ·  Módulo Bodega (bodeguero)'],
        ['Tech', 'React 18 + TypeScript + TailwindCSS + Vite'],
        ['Fecha', '2026'],
    ], [3.5*cm, UW - 3.5*cm], header=False)
    story.append(meta)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 1. ROLES
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('1. Roles Cubiertos', sec))
    story.append(Paragraph(
        'Este documento cubre exclusivamente los dos roles de usuario final de la app-bodegas: '
        '<b>Productor</b> (agricultor que vende maíz) y <b>Bodega</b> (operador de bodega compradora). '
        'Cada rol tiene su propio layout, navegación y rutas independientes.',
        body
    ))

    roles = tbl([
        ['Rol', 'Descripción', 'Ruta base', 'Layout', 'Nav items'],
        ['productor',
         'Agricultor que declara disponibilidad y busca bodegas cercanas',
         '/productor',
         'LayoutProductor',
         'Inicio · Mapa · Precios · Apoyos · Perfil'],
        ['bodega',
         'Operador que gestiona bodegas, inventario, precios y oferta',
         '/dashboard',
         'Layout (bodeguero)',
         'Tablero · Bodegas · Oferta · Transacciones · Más'],
    ], [2.2*cm, 4.5*cm, 2.8*cm, 3*cm, UW - 12.5*cm])
    story.append(roles)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('Rutas principales por rol', sub))
    rutas = tbl([
        ['Módulo Bodega — rutas', 'Módulo Productor — rutas'],
        ['/dashboard  →  Tablero principal', '/productor  →  Dashboard / inicio'],
        ['/mis-bodegas  →  Lista de bodegas', '/productor/mapa  →  Mapa de bodegas'],
        ['/bodegas/:id  →  Detalle de bodega', '/productor/precios  →  Precios mercado'],
        ['/oferta  →  Oferta de productores', '/productor/incentivos  →  Apoyos/incentivos'],
        ['/transacciones  →  Historial', '/productor/perfil  →  Mi perfil'],
        ['/inventario  →  Stock actual', '/productor/ciclo  →  Ciclo productivo'],
        ['/precio-diario  →  Publicar precio', '/productor/ubicacion  →  Marcar parcela'],
        ['/ventanillas  →  Mis ventanillas', '/productor/propuesta-venta  →  Propuesta venta'],
    ], [UW/2, UW/2])
    story.append(rutas)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. COLORES — BARRAS VERDES
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('2. Colores — Barras Verdes y Elementos de Marca', sec))
    story.append(Paragraph(
        'Todos los banners, barras sticky, botones primarios y elementos de marca usan la '
        'misma paleta verde. Las barras de cabecera de ambos módulos comparten exactamente '
        'el mismo gradiente.',
        body
    ))

    # 2.1 Gradiente oficial
    story.append(Paragraph('2.1  Gradiente Oficial de Barras Sticky', sub))
    story.append(Paragraph(
        'Usado en el banner del Tablero de Bodega, el Dashboard de Productor, '
        'la pantalla de Mis Bodegas y todas las páginas con PageBanner:',
        body
    ))
    story.append(Paragraph(
        'bg-gradient-to-br  from-[#1A5C38]  via-[#1e6b42]  to-[#22733f]',
        code
    ))

    grad_vis = Table([[
        Table([[ColorSwatch(colors.HexColor('#1A5C38'), 66, 36),
                Paragraph('<b>#1A5C38</b><br/>Verde Principal<br/><i>from</i>',
                          S('gs', fontSize=8, fontName='Helvetica', textColor=GRIS_700, leading=11))]],
              colWidths=[72, 60], rowHeights=[44]),
        Table([[ColorSwatch(colors.HexColor('#1e6b42'), 66, 36),
                Paragraph('<b>#1e6b42</b><br/>Verde Medio<br/><i>via</i>',
                          S('gs2', fontSize=8, fontName='Helvetica', textColor=GRIS_700, leading=11))]],
              colWidths=[72, 60], rowHeights=[44]),
        Table([[ColorSwatch(colors.HexColor('#22733f'), 66, 36),
                Paragraph('<b>#22733f</b><br/>Verde Claro<br/><i>to</i>',
                          S('gs3', fontSize=8, fontName='Helvetica', textColor=GRIS_700, leading=11))]],
              colWidths=[72, 60], rowHeights=[44]),
    ]], colWidths=[UW/3, UW/3, UW/3])
    grad_vis.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEAFTER', (0,0), (1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(grad_vis)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Efecto adicional de profundidad: superposición <b>bg-gradient-to-l from-emerald-500/10 to-transparent</b> '
        'en esquina derecha (opacity 50%, sube a 100% en hover). '
        'Sombra: <b>shadow-[0_8px_30px_rgba(26,92,56,0.25)]</b>. '
        'Borde inferior redondeado: <b>rounded-b-3xl</b> (24 px) en Productor y '
        '<b>rounded-b-[2rem]</b> (32 px) en Bodega.',
        body
    ))

    # 2.2 Paleta verde completa
    story.append(Paragraph('2.2  Paleta Verde Completa', sub))
    greens = [
        ('#1A5C38', 'Verde Principal',  'Barras sticky · botones primarios · íconos activos · markers mapa · nav activo'),
        ('#1e6b42', 'Verde Medio',      'Punto intermedio (via) del gradiente de barras'),
        ('#22733f', 'Verde Claro',      'Extremo final (to) del gradiente de barras'),
        ('#2d7a52', 'Verde Drawer',     'Extremo inferior del gradiente del drawer de perfil'),
        ('#eef8f2', 'Verde BG',         'Fondo global de la app · cuerpo de páginas · contenedores'),
        ('#f4fbf7', 'Verde Menta',      'Hover de ítems de menú · fondo de chips sin actividad'),
        ('#30d158', 'Verde iOS (ok)',   'Botones de confirmar en toolbar del mapa'),
        ('#22c55e', 'Green-500',        'Punto de pulso del reloj MX · indicador vivo en chip clock'),
        ('#10b981', 'Emerald-500',      'Dot de semáforo "Comprando" · badge verde en bodegas'),
    ]
    for hex_v, nombre, desc in greens:
        r = Table([[
            Table([[ColorSwatch(colors.HexColor(hex_v), 44, 26)]],
                  colWidths=[52], rowHeights=[34]),
            Paragraph(f'<b>{nombre}</b>  <font color="#1A5C38" size="7.5"><i>{hex_v}</i></font>',
                      S('sl', fontSize=8.5, fontName='Helvetica-Bold', textColor=GRIS_900, leading=12)),
            Paragraph(desc, body),
        ]], colWidths=[56, 3.8*cm, UW - 56 - 3.8*cm])
        r.setStyle(TableStyle([
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LINEBELOW',     (0,0), (-1,-1), 0.3, GRIS_300),
        ]))
        story.append(r)

    story.append(Spacer(1, 5*mm))

    # 2.3 Semáforo
    story.append(Paragraph('2.3  Semáforo de Estado de Compra (Bodegas)', sub))
    story.append(Paragraph(
        'Cada bodega muestra su estado de compra con un punto de color (dot) '
        'y un badge con fondo, texto y borde específicos:',
        body
    ))
    sem = tbl([
        ['Estado', 'Dot color / hex', 'Badge — fondo', 'Badge — texto', 'Badge — borde'],
        ['verde  (Comprando)',     '#10b981  emerald-500', 'bg-emerald-50',   'text-emerald-700', 'border-emerald-200'],
        ['amarillo  (Cap. limitada)', '#f59e0b  amber-500',   'bg-amber-50',     'text-amber-700',   'border-amber-200'],
        ['rojo  (No compra)',      '#ef4444  red-500',     'bg-red-50',       'text-red-700',     'border-red-200'],
        ['sin_actividad',         '#9ca3af  gray-400',    'bg-[#f4fbf7]',    'text-gray-600',    'border-gray-200'],
    ], [2.8*cm, 2.8*cm, 2.5*cm, 2.5*cm, UW - 10.6*cm])
    story.append(sem)
    story.append(Spacer(1, 4*mm))

    # 2.4 Colores de alerta y estado
    story.append(Paragraph('2.4  Colores de Alerta y Estado', sub))
    alertas = tbl([
        ['Propósito', 'Color / Hex', 'Dónde aparece'],
        ['Advertencia / en revisión', 'amber-400  #f59e0b', 'Banners border-l-4 de alertas y cuenta en revisión'],
        ['Alerta climática activa',   'orange-500  #f97316', 'Banner superior naranja (productor y bodega)'],
        ['Alerta sanitaria activa',   'red-600  #dc2626',    'Banner superior rojo'],
        ['Error / sin compra',        'red-500  #ef4444',    'Semáforo rojo · barra ocupación >90%'],
        ['Badge notificaciones',      'rose-500  #f43f5e',   'Punto rojo en campana del header'],
        ['Logout / peligro',          'red-50 bg · red-600 texto', 'Botón cerrar sesión en drawer de perfil'],
        ['Barra ocupación media',     'amber-400  #f59e0b',  'Barra de ocupación entre 70% y 90%'],
        ['Info / ventanillas',        'blue-500  #3b82f6',   'KPI card de solicitudes a ventanillas (Bodega)'],
    ], [3.5*cm, 3.5*cm, UW - 7*cm])
    story.append(alertas)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. TIPOGRAFÍA
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('3. Tipografía', sec))

    story.append(Paragraph('3.1  Familia de Fuentes', sub))
    story.append(Paragraph(
        'La app usa el stack tipográfico nativo de Apple/iOS. No hay fuente web general '
        '(Outfit 900 solo se importa para el efecto shimmer del logotipo SIMAC, no para texto de interfaz).',
        body
    ))
    story.append(Paragraph(
        "font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
        code
    ))

    story.append(Paragraph('3.2  Escala Tipográfica — Módulo Bodega', sub))
    typo_bodega = tbl([
        ['Elemento', 'Tamaño', 'Peso', 'Color'],
        ['Label módulo (UPPERCASE, banner)', '10–11px', 'Bold 700', 'emerald-300/80  rgba(110,231,183,0.8)'],
        ['H1 banner (título página)', '20px sm:24px', 'Black 900', 'white'],
        ['Subtítulo banner', '13–14px', 'Medium 500', 'white/80'],
        ['Nombre usuario en banner', '13px', 'Medium 500', 'white/80'],
        ['Chip de rol (badge)', '11–12px', 'Bold 700', 'white'],
        ['Chip reloj MX', '11–12px', 'Bold 700', 'white  tracking-widest'],
        ['KPI título (uppercase)', '13px', 'Bold 700', 'gray-500  #6b7280'],
        ['KPI valor principal', '28–32px', 'Black 900', 'gray-900  #111827'],
        ['KPI subtítulo', '12px', 'Medium 500', 'gray-500'],
        ['Acción rápida — título', '14–15px', 'Bold 700', 'gray-900'],
        ['Acción rápida — descripción', '11–12px', 'Normal 400', 'gray-400/90'],
        ['Card bodega — nombre', '16px', 'Bold 700', 'gray-900'],
        ['Card bodega — municipio', '13px', 'Normal 400', 'gray-400'],
        ['Badge semáforo en card', '10px', 'Semibold 600', 'según semáforo'],
        ['Ocupación % texto', '11px', 'Medium 500', 'gray-400'],
        ['Botones de acción en card', '13px', 'Semibold 600', '#1A5C38 o gray-700'],
        ['Label secciones UPPERCASE', '11px', 'Bold 700', 'gray-400/90  tracking-widest'],
        ['Nav label activo', '10px', 'Semibold 600', '#1A5C38'],
        ['Nav label inactivo', '10px', 'Medium 500', 'gray-400'],
        ['PageHeader H1', '20px', 'Bold 700', 'gray-900'],
        ['PageHeader "Volver"', '14px', 'Medium 500', '#1A5C38'],
        ['Drawer — nombre usuario', '17px', 'Bold 700', 'white'],
        ['Drawer — email', '13px', 'Normal 400', 'green-200'],
        ['Drawer — ítems menú', '15px', 'Medium 500', 'gray-700'],
    ], [4.8*cm, 1.8*cm, 1.8*cm, UW - 8.4*cm])
    story.append(typo_bodega)

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('3.3  Escala Tipográfica — Módulo Productor', sub))
    typo_prod = tbl([
        ['Elemento', 'Tamaño', 'Peso', 'Color'],
        ['Label INICIO (UPPERCASE, banner)', '11px', 'Semibold 600', 'green-300/70  tracking-widest'],
        ['H1 saludo banner', '19–22px', 'Black 900', 'white  tracking-tight'],
        ['Nombre completo bajo saludo', '13px', 'Medium 500', 'white/40'],
        ['Chip "Productor" (badge)', '11px', 'Bold 700', 'white'],
        ['Fecha en banner', '11px', 'Normal 400', 'green-200/60  capitalize'],
        ['Chip reloj MX', '11px', 'Bold 700', 'white  tracking-wide'],
        ['Precio de compra (grande)', '40–48px', 'Black 900', 'gray-900  tracking-tight'],
        ['Unidad /ton', '16–18px', 'Bold 700', 'gray-400'],
        ['Delta precio (±$)', '14px', 'Bold 700', 'emerald-600 o red-500'],
        ['"PRECIO DE COMPRA HOY…"', '13px', 'Bold 700', 'gray-500  tracking-wide'],
        ['Card bodega cercana — nombre', '14px', 'Semibold 600', 'zinc-800'],
        ['Card bodega — municipio/km', '12px', 'Normal 400', 'zinc-500'],
        ['Card bodega — precio /ton', '14px', 'Bold 700', 'zinc-900'],
        ['Etiqueta "Ventanilla"', '12px', 'Medium 500', '#1A5C38  bg-emerald-50'],
        ['Botón "Propuesta de venta"', '18px  (lg)', 'Semibold 600', 'white'],
        ['Botón "Agregar parcela"', '14px', 'Medium 500', '#1A5C38'],
        ['Banner advertencia — título', '14px', 'Semibold 600', 'amber-800'],
        ['Banner advertencia — texto', '13px', 'Normal 400', 'amber-700'],
        ['Nav label activo', '10px', 'Bold 700', '#1A5C38'],
        ['Nav label inactivo', '10px', 'Medium 500', 'slate-400'],
        ['PageHeader "Volver"', '14px', 'Bold 700', '#1A5C38'],
        ['PageHeader H1', '20px', 'Bold 700', 'slate-900'],
        ['PageHeader subtítulo', '12px', 'Medium 500', 'slate-500'],
    ], [4.8*cm, 1.8*cm, 1.8*cm, UW - 8.4*cm])
    story.append(typo_prod)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. COMPONENTES
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('4. Componentes de Diseño', sec))

    # 4.1 AppHeader
    story.append(Paragraph('4.1  AppHeader — Barra Superior "Liquid Glass"  (compartida por ambos módulos)', sub))
    story.append(Paragraph(
        'La barra superior es idéntica en Productor y Bodega. '
        'Implementa el efecto "liquid glass" de Apple 2026.',
        body
    ))
    story.append(prop_tbl([
        ['Altura', 'h-16  (64px)'],
        ['Fondo vidrio', 'bg-white/60  +  backdrop-blur-2xl  +  backdrop-saturate-150'],
        ['Gradiente interior', 'bg-gradient-to-b from-white/40 to-transparent'],
        ['Línea superior (brillo)', '1px  bg-gradient-to-r from-transparent via-white/90 to-transparent'],
        ['Línea inferior (hairline)', '1px  bg-slate-900/[0.07]'],
        ['Brillo animado', 'simac-header-sheen — recorre el header cada 7s (loop infinito)'],
        ['Z-index', 'z-30'],
        ['Logo / ícono app', 'w-9 h-9 (36px) · rounded-[12px] · ring-1 ring-black/[0.06] · shadow verde'],
        ['Texto "SIMAC"', '15.5px · Bold · slate-900 · tracking-[-0.02em]'],
        ['Subtítulo bajo SIMAC', '10.5px · Medium · slate-400 · truncate · max-w 165–440px'],
        ['Avatar (iniciales)', 'w-9 h-9 · rounded-full · bg-gradient-to-br from-[#1f7a49] to-[#123f27]'],
        ['Texto iniciales en avatar', '12px · font-black · white · tracking-wide'],
        ['Campana notificaciones', 'w-9 h-9 · rounded-full · bg-white/55 · ring-1 ring-black/[0.05]'],
        ['Badge notificaciones', 'bg-rose-500 · min-w-[16px] h-[16px] · 9px font-black · ring-2 ring-white'],
    ]))
    story.append(Spacer(1, 4*mm))

    # 4.2 Banners sticky
    story.append(Paragraph('4.2  Banners Sticky de Módulo', sub))
    story.append(Paragraph(
        'Cada página principal tiene un banner verde sticky que muestra el contexto, '
        'el saludo, el rol y el reloj. Están pegados debajo del AppHeader con z-20.',
        body
    ))
    banner = tbl([
        ['Propiedad', 'Módulo Bodega', 'Módulo Productor'],
        ['Gradiente', 'from-[#1A5C38] via-[#1e6b42] to-[#22733f]  (bg-gradient-to-br)', 'Idéntico'],
        ['Borde inferior redondeado', 'rounded-b-[2rem]  (32px) en dashboard', 'rounded-b-3xl  (24px)'],
        ['Sombra', 'shadow-[0_8px_30px_rgba(26,92,56,0.25)]', 'shadow-[0_4px_20px_rgba(26,92,56,0.25)]'],
        ['Superposición decorativa', 'from-emerald-500/10 → opacity 50%→100% hover', 'Idéntico'],
        ['Padding horizontal', 'px-4 sm:px-6 lg:px-10 xl:px-16', 'px-4 sm:px-6'],
        ['Padding vertical', 'pt-4 pb-5', 'pt-4 pb-5'],
        ['Z-index', 'z-20  (sticky)', 'z-20  (sticky)'],
        ['Label módulo', '10–11px · Bold · emerald-300/80 · UPPERCASE · tracking-widest', '11px · Semibold · green-300/70'],
        ['H1 título / saludo', '20px sm:24px · Black · white · tracking-tight', '19–22px · Black · white'],
        ['Avatar usuario en banner', 'w-12 h-12 · rounded-full · bg-white/20 · ring-2 ring-white/20', 'w-11 h-11 · rounded-2xl · bg-white/20'],
        ['Chip de rol', 'bg-white/15 · border-white/10 · rounded-full · px-2.5 py-1', 'bg-white/15 · rounded-full · px-3 py-1'],
        ['Chip reloj MX', 'bg-emerald-500/20 · border-emerald-400/30 · rounded-full', 'bg-[#22c55e]/20 · border-[#22c55e]/30 · rounded-full'],
        ['Punto de pulso reloj', 'w-1.5 h-1.5 · bg-emerald-400 · animate-pulse · glow verde', 'w-1.5 h-1.5 · bg-[#22c55e] · animate-pulse'],
    ], [3.8*cm, (UW - 3.8*cm)/2, (UW - 3.8*cm)/2])
    story.append(banner)
    story.append(Spacer(1, 4*mm))

    # 4.3 Nav inferior
    story.append(Paragraph('4.3  Barra de Navegación Inferior (Bottom Nav)', sub))
    nav = tbl([
        ['Propiedad', 'Módulo Bodega', 'Módulo Productor'],
        ['Fondo', 'bg-white/95  backdrop-blur-xl', 'bg-white/95  backdrop-blur-xl'],
        ['Borde superior', 'border-t  border-black/[0.06]', 'border-t  border-slate-200/60'],
        ['Sombra', 'shadow-[0_-1px_0_rgba(0,0,0,0.04)]', 'shadow-[0_-4px_20px_rgb(0,0,0,0.02)]'],
        ['Color activo', 'text-[#1A5C38]', 'text-[#1A5C38]'],
        ['Color inactivo', 'text-gray-400', 'text-slate-400'],
        ['Tamaño ícono', '23px', '24px'],
        ['Stroke activo', '2.4', '2.5'],
        ['Stroke inactivo', '1.7', '2.0'],
        ['Label activo', '10px  font-semibold', '10px  font-bold'],
        ['Label inactivo', '10px  font-medium', '10px  font-medium'],
        ['Indicador de pestaña activa', 'div  w-5  h-[2px]  bg-[#1A5C38]  rounded-full', '(ninguno extra — solo color)'],
        ['Padding inferior (safe area)', 'pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]', 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'],
    ], [3.8*cm, (UW - 3.8*cm)/2, (UW - 3.8*cm)/2])
    story.append(nav)
    story.append(Spacer(1, 4*mm))

    # 4.4 KPI Cards (Bodega)
    story.append(Paragraph('4.4  KPI Cards  (Módulo Bodega — Tablero)', sub))
    story.append(Paragraph(
        'Grid 2 columnas en móvil → 4 columnas en desktop. '
        'Color del ícono varía según estado (verde, amarillo, rojo, azul).',
        body
    ))
    story.append(prop_tbl([
        ['Fondo', 'bg-white/95  backdrop-blur-2xl'],
        ['Bordes', 'rounded-[1.5rem] (24px)  border-black/[0.04]'],
        ['Sombra reposo', 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]'],
        ['Sombra hover', 'shadow-[0_12px_30px_rgba(0,0,0,0.06)]  +  -translate-y-1'],
        ['Alto mínimo', 'min-h-[140px]'],
        ['Padding', 'p-5 sm:p-6  (20–24px)'],
        ['Ícono verde',    'bg-emerald-500/10  text-emerald-600  ring-emerald-500/20  w-10 h-10 (40px) rounded-2xl'],
        ['Ícono amarillo', 'bg-amber-500/10    text-amber-600    ring-amber-500/20'],
        ['Ícono rojo',     'bg-red-500/10      text-red-600      ring-red-500/20'],
        ['Ícono azul',     'bg-blue-500/10     text-blue-600     ring-blue-500/20'],
        ['Gradiente decorativo (esquina)', 'from-emerald-50/50 (u otro color)  opacity 50%→100% hover'],
        ['Animación hover ícono', 'scale-110  rotate(-3deg)  shadow-md  (500ms spring)'],
        ['Barra ocupación — fondo', 'bg-[#eef8f2]  h-2  rounded-full'],
        ['Barra fill <70%', 'bg-[#1A5C38]'],
        ['Barra fill 70–90%', 'bg-amber-400  #f59e0b'],
        ['Barra fill >90%', 'bg-red-500  #ef4444'],
    ]))
    story.append(Spacer(1, 4*mm))

    # 4.5 Tarjeta de Bodega (Mis Bodegas)
    story.append(Paragraph('4.5  Tarjeta de Bodega  (Módulo Bodega — Mis Bodegas)', sub))
    story.append(prop_tbl([
        ['Fondo', 'bg-white'],
        ['Bordes', 'rounded-2xl (16px)  border-black/[0.04]'],
        ['Sombra reposo', 'shadow-[0_2px_8px_rgba(0,0,0,0.02)]'],
        ['Sombra hover', 'shadow-[0_8px_24px_rgba(0,0,0,0.08)]  +  border-black/[0.08]  +  -translate-y-1'],
        ['Padding interno', 'p-5  (20px)'],
        ['Grid lista', '1 col → sm:2 → xl:3'],
        ['Badge semáforo', '10px · Semibold · px-2.5 py-1 · rounded-full · border · colores según semáforo'],
        ['Barra ocupación — fondo', 'bg-[#eef8f2]  h-1.5  rounded-full'],
        ['Barra fill', '#1A5C38 (<70%) · amber-400 (70–90%) · red-500 (>90%)'],
        ['Botón "Detalle"', 'bg-[#1A5C38]/[0.08]  text-[#1A5C38]  rounded-xl  py-2.5  13px font-semibold'],
        ['Botón "Semáforo"', 'bg-[#eef8f2]  text-gray-700  rounded-xl  py-2.5  13px font-semibold'],
        ['FAB (+ agregar)', 'w-14 h-14 · bg-[#1A5C38] · rounded-full · fixed bottom-24 right-5 · shadow-xl'],
    ]))
    story.append(Spacer(1, 4*mm))

    # 4.6 Bodegas cercanas (Productor)
    story.append(Paragraph('4.6  Lista de Bodegas Cercanas  (Módulo Productor — Dashboard)', sub))
    story.append(prop_tbl([
        ['Fondo tarjeta', 'bg-white  rounded-2xl  p-4  shadow-sm  ring-1 ring-zinc-100'],
        ['Hover tarjeta', 'hover:ring-zinc-200  scale-[0.98] en active'],
        ['Dot semáforo', 'w-3 h-3 · rounded-full · shrink-0 · color según semáforo'],
        ['Nombre bodega', '14px · Semibold · zinc-800'],
        ['Municipio + km', '12px · zinc-500'],
        ['Etiqueta Ventanilla', 'bg-emerald-50  text-[#1A5C38]  12px · Medium · px-2 py-0.5 · rounded-full'],
        ['Precio /ton', '14px · Bold · zinc-900'],
        ['Unidad "/ton"', '12px · zinc-400'],
        ['Espacio entre tarjetas', 'space-y-2  (8px)'],
        ['Botón "Ver mapa completo"', 'ring-2 ring-[#1A5C38] · text-[#1A5C38] · 14px Semibold · rounded-2xl · hover:bg-emerald-50'],
    ]))
    story.append(Spacer(1, 4*mm))

    # 4.7 Drawer de perfil
    story.append(Paragraph('4.7  Drawer de Perfil  (compartido)', sub))
    story.append(prop_tbl([
        ['Ancho', 'w-[300px]'],
        ['Fondo', 'bg-white  shadow-2xl'],
        ['Transición apertura', 'transition-transform duration-300 ease-out  (translate-x-0 / translate-x-full)'],
        ['Backdrop', 'bg-black/30  backdrop-blur-[2px]  z-40'],
        ['Z-index drawer', 'z-50'],
        ['Header gradiente', 'bg-gradient-to-br from-[#1A5C38] to-[#2d7a52]  px-5 pt-12 pb-6'],
        ['Avatar iniciales', 'w-14 h-14 (56px) · rounded-2xl · bg-white/20 · text-white 22px font-bold'],
        ['Nombre usuario', '17px · Bold · white'],
        ['Badge rol', '11px · Semibold · bg-white/20 · white · px-2.5 py-0.5 · rounded-full'],
        ['Fondo ícono ítem', 'w-9 h-9 (36px) · rounded-xl · bg-[#eef8f2] · text-[#1A5C38]'],
        ['Texto ítem', '15px · Medium · gray-700'],
        ['Hover ítem', 'hover:bg-[#f4fbf7]  active:bg-[#eef8f2]'],
        ['Chevron', 'ChevronRight 15px · text-gray-300'],
        ['Botón logout', 'bg-red-50 · text-red-600 · rounded-2xl · py-3.5 · 15px font-semibold'],
        ['Texto footer', '11px gray-400 center · 10px gray-300 center'],
    ]))
    story.append(Spacer(1, 4*mm))

    # 4.8 Animaciones
    story.append(Paragraph('4.8  Animaciones y Micro-Interacciones', sub))
    anims = tbl([
        ['Clase / Keyframe', 'Descripción', 'Duración / Curva'],
        ['simac-header-sheen', 'Brillo líquido que barre el header (loop)', '7s  cubic-bezier(0.45,0,0.55,1)  ∞'],
        ['simac-header-in', 'Header entra deslizando de -8px → 0', '0.55s  (0.16,1,0.3,1)'],
        ['animate-toast-in', 'Toast cae -12px + scale 0.96→1', '0.22s  (0.34,1.56,0.64,1)'],
        ['animate-modal-in', 'Modal escala 0.92→1 + sube 8px', '0.25s  (0.34,1.36,0.64,1)'],
        ['animate-backdrop-in', 'Backdrop fade in', '0.18s  ease'],
        ['animate-auth-in', 'Pantallas de auth suben 28px + scale 0.98→1', '0.45s  (0.16,1,0.3,1)'],
        ['animate-sheet-up', 'Bottom sheet sube desde translateY(100%)→0', '0.32s  (0.16,1,0.3,1)'],
        ['animate-shake', 'Error PIN: sacudida horizontal ±8px', '0.4s  (0.36,0.07,0.19,0.97)'],
        ['animate-crosshair-ring', 'Anillo de pulso en crosshair del mapa', '1.8s  ease-out  ∞'],
        ['.press:active', 'Botón: opacity 0.7 + scale 0.98', '0.1s'],
        ['hover:-translate-y-1', 'Cards suben 1px al hacer hover', '500ms  spring ease'],
        ['simac-pulse', 'Indicador toolbar mapa: pulsa opacity+scale', '1.8s  ease-in-out  ∞'],
    ], [3.8*cm, 6.5*cm, UW - 10.3*cm])
    story.append(anims)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. RADIOS Y ESPACIADO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('5. Radios de Esquinas y Espaciado', sec))

    radios = tbl([
        ['Elemento', 'Clase Tailwind', 'Valor px'],
        ['Ícono app en header', 'rounded-[12px]', '12px'],
        ['Banner Bodega (borde inferior)', 'rounded-b-[2rem]', '32px'],
        ['Banner Productor (borde inferior)', 'rounded-b-3xl', '24px'],
        ['KPI Cards', 'rounded-[1.5rem]', '24px'],
        ['Tarjetas de bodega (Mis Bodegas)', 'rounded-2xl', '16px'],
        ['Acción rápida (Tablero Bodega)', 'rounded-[1.25rem]', '20px'],
        ['Botones primarios (Bodega)', 'rounded-[1.25rem]', '20px'],
        ['Botones primarios (Productor)', 'rounded-full', '50% píldora'],
        ['Botones secundarios', 'rounded-xl', '12px'],
        ['Chips / badges de rol / semáforo', 'rounded-full', '50% píldora'],
        ['Buscador / toggles de vista', 'rounded-2xl', '16px'],
        ['Avatar usuario en header', 'rounded-full', '50%'],
        ['Avatar drawer (iniciales)', 'rounded-2xl', '16px'],
        ['Ícono de ítem en drawer', 'rounded-xl', '12px'],
        ['Popup mapa Mapbox', 'border-radius: 20px (CSS global)', '20px'],
        ['Popup mapa Leaflet (dark)', 'border-radius: 20px', '20px'],
        ['Marker de bodega en mapa', 'border-radius: 50%', '50%'],
    ], [5.5*cm, 4*cm, UW - 9.5*cm])
    story.append(radios)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('5.1  Sistema de Espaciado Principal', sub))
    espaciado = tbl([
        ['Contexto', 'Clase / Valor'],
        ['Padding horizontal general', 'px-4  sm:px-6  lg:px-10  xl:px-16'],
        ['Padding vertical banner', 'pt-4  pb-5'],
        ['Max-width contenido — Bodega', 'max-w-5xl  (1024px)'],
        ['Max-width contenido — Productor', 'max-w-2xl  (672px)'],
        ['Gap entre KPI cards', 'gap-3  (12px)'],
        ['Gap entre acciones rápidas', 'gap-4  (16px)'],
        ['Padding interno KPI card', 'p-5  sm:p-6  (20–24px)'],
        ['Padding interno tarjeta bodega', 'p-5  (20px)'],
        ['Espacio entre secciones dashboard', 'space-y-6  (24px)'],
        ['Espacio entre bodegas cercanas', 'space-y-2  (8px)'],
        ['Espacio entre disponibilidades', 'space-y-3  (12px)'],
        ['Alto mínimo KPI card', 'min-h-[140px]  (140px)'],
        ['Alto header', 'h-16  (64px)'],
        ['FAB posición', 'fixed bottom-24 right-5  (96px, 20px)'],
    ], [5*cm, UW - 5*cm])
    story.append(espaciado)
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. PALETA VISUAL
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(BarDivider())
    story.append(Paragraph('6. Resumen Visual de la Paleta', sec))

    colores = [
        ('#1A5C38', 'Verde Principal',   'Marca · barras · botones'),
        ('#1e6b42', 'Verde Medio',       'Gradiente via'),
        ('#22733f', 'Verde Claro',       'Gradiente to'),
        ('#2d7a52', 'Verde Drawer',      'Header drawer'),
        ('#eef8f2', 'Verde BG',          'Fondo global app'),
        ('#f4fbf7', 'Verde Menta',       'Hover · chips inactivo'),
        ('#30d158', 'Verde iOS',         'Confirmar / OK'),
        ('#22c55e', 'Green-500',         'Pulso reloj MX'),
        ('#10b981', 'Emerald-500',       'Semáforo Comprando'),
        ('#f59e0b', 'Amber-500',         'Semáforo Cap. Limitada'),
        ('#ef4444', 'Red-500',           'Semáforo No Compra'),
        ('#f97316', 'Orange-500',        'Alerta climática'),
        ('#dc2626', 'Red-600',           'Alerta sanitaria'),
        ('#f43f5e', 'Rose-500',          'Badge notificaciones'),
        ('#3b82f6', 'Blue-500',          'KPI ventanillas'),
        ('#1C1C1E', 'Gris 900',          'Texto principal'),
    ]

    rows = []
    row = []
    sw = S('swn', fontSize=7.5, fontName='Helvetica-Bold', textColor=GRIS_900, leading=10)
    sh = S('swh', fontSize=7, fontName='Courier', textColor=VERDE, leading=9)
    su = S('swu', fontSize=6.5, fontName='Helvetica', textColor=GRIS_500, leading=9)

    for i, (hx, nm, us) in enumerate(colores):
        cell = Table([
            [ColorSwatch(colors.HexColor(hx), 58, 34)],
            [Paragraph(f'<b>{nm}</b>', sw)],
            [Paragraph(hx, sh)],
            [Paragraph(us, su)],
        ], colWidths=[UW/4 - 4*mm], rowHeights=[40, 13, 11, 11])
        cell.setStyle(TableStyle([
            ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING',    (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('LEFTPADDING',   (0,0), (-1,-1), 0),
            ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ]))
        row.append(cell)
        if (i + 1) % 4 == 0:
            rows.append(row)
            row = []
    if row:
        while len(row) < 4:
            row.append('')
        rows.append(row)

    palette_table = Table(rows, colWidths=[UW/4]*4)
    palette_table.setStyle(TableStyle([
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING',   (0,0), (-1,-1), 4),
        ('RIGHTPADDING',  (0,0), (-1,-1), 4),
        ('LINEBELOW',     (0,0), (-1,-1), 0.3, GRIS_300),
        ('LINEAFTER',     (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX',           (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(palette_table)

    # ── Pie de página ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 5*mm))
    story.append(HRFlowable(width=UW, thickness=0.5, color=GRIS_300))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        'SIMAC · app-bodegas · Módulo Productor &amp; Módulo Bodega · '
        'Especificaciones de Diseño UI/UX · Plan Nacional Maíz 2026 · v1.0',
        foot
    ))

    doc.build(story)
    print(f'PDF generado: {path}')


if __name__ == '__main__':
    build_pdf('/home/user/Simulador/SIMAC_Especificaciones_Diseno_UI.pdf')
