#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de especificaciones de diseño SIMAC app-bodegas
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable

# ─── Paleta de colores SIMAC ───────────────────────────────────────────────────
VERDE_PRINCIPAL = colors.HexColor('#1A5C38')
VERDE_MEDIO     = colors.HexColor('#1e6b42')
VERDE_CLARO     = colors.HexColor('#22733f')
VERDE_BG        = colors.HexColor('#eef8f2')
VERDE_MENTA     = colors.HexColor('#f4fbf7')
VERDE_EMERALD   = colors.HexColor('#30d158')
VERDE_SHIMMER1  = colors.HexColor('#5db87a')
VERDE_SHIMMER2  = colors.HexColor('#7dd49a')
VERDE_LABEL     = colors.HexColor('#2d7a52')

AMARILLO        = colors.HexColor('#f59e0b')
ROJO            = colors.HexColor('#ef4444')
AZUL            = colors.HexColor('#3b82f6')
ROSA            = colors.HexColor('#f43f5e')

GRIS_900        = colors.HexColor('#1C1C1E')
GRIS_700        = colors.HexColor('#374151')
GRIS_500        = colors.HexColor('#6b7280')
GRIS_400        = colors.HexColor('#9ca3af')
GRIS_300        = colors.HexColor('#d1d5db')
GRIS_100        = colors.HexColor('#f3f4f6')
BLANCO          = colors.white

# ─── Clase para bloque de color (swatch) ──────────────────────────────────────
class ColorSwatch(Flowable):
    def __init__(self, color, width=40, height=22, label="", hex_val=""):
        Flowable.__init__(self)
        self.color = color
        self.width = width
        self.height = height
        self.label = label
        self.hex_val = hex_val

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        self.canv.setStrokeColor(colors.HexColor('#e5e7eb'))
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=0, stroke=1)


class SectionDivider(Flowable):
    def __init__(self, color=VERDE_PRINCIPAL, width=None):
        Flowable.__init__(self)
        self.color = color
        self.divider_width = width or 480
        self.height = 3

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, 40, self.height, 1.5, fill=1, stroke=0)


def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.2*cm,
        bottomMargin=2*cm,
        title="Especificaciones de Diseño — SIMAC app-bodegas",
        author="SIMAC",
    )

    W, H = A4
    usable_w = W - 4*cm   # 17.0 cm

    styles = getSampleStyleSheet()

    # ── Estilos personalizados ──────────────────────────────────────────────────
    cover_title = ParagraphStyle(
        'CoverTitle', parent=styles['Title'],
        fontSize=28, leading=34, textColor=BLANCO,
        fontName='Helvetica-Bold', alignment=TA_LEFT,
    )
    cover_sub = ParagraphStyle(
        'CoverSub', parent=styles['Normal'],
        fontSize=11, leading=16, textColor=colors.HexColor('#a7f3d0'),
        fontName='Helvetica', alignment=TA_LEFT,
    )
    section_title = ParagraphStyle(
        'SectionTitle', parent=styles['Heading1'],
        fontSize=14, leading=18, textColor=VERDE_PRINCIPAL,
        fontName='Helvetica-Bold', spaceAfter=4, spaceBefore=18,
    )
    subsection_title = ParagraphStyle(
        'SubsectionTitle', parent=styles['Heading2'],
        fontSize=11, leading=14, textColor=GRIS_900,
        fontName='Helvetica-Bold', spaceAfter=3, spaceBefore=10,
    )
    body = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=9.5, leading=14, textColor=GRIS_700,
        fontName='Helvetica', spaceAfter=5,
    )
    body_bold = ParagraphStyle(
        'BodyBold', parent=body,
        fontName='Helvetica-Bold', textColor=GRIS_900,
    )
    code_style = ParagraphStyle(
        'Code', parent=styles['Normal'],
        fontSize=8.5, leading=13, textColor=VERDE_PRINCIPAL,
        fontName='Courier', backColor=colors.HexColor('#f0fdf4'),
        leftIndent=6, rightIndent=6, spaceAfter=2, spaceBefore=2,
        borderPad=4,
    )
    caption = ParagraphStyle(
        'Caption', parent=styles['Normal'],
        fontSize=8, leading=11, textColor=GRIS_500,
        fontName='Helvetica-Oblique',
    )
    label_uppercase = ParagraphStyle(
        'LabelUpper', parent=styles['Normal'],
        fontSize=8, leading=11, textColor=GRIS_500,
        fontName='Helvetica-Bold', spaceAfter=2,
    )
    chip_label = ParagraphStyle(
        'Chip', parent=styles['Normal'],
        fontSize=8.5, leading=12, textColor=VERDE_PRINCIPAL,
        fontName='Helvetica-Bold',
    )
    note_style = ParagraphStyle(
        'Note', parent=styles['Normal'],
        fontSize=8.5, leading=13, textColor=colors.HexColor('#92400e'),
        fontName='Helvetica', backColor=colors.HexColor('#fffbeb'),
        leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4,
        borderPad=6,
    )

    story = []

    # ═══════════════════════════════════════════════════════════════════════════
    # PORTADA
    # ═══════════════════════════════════════════════════════════════════════════
    def cover_page():
        cover_data = [[
            Paragraph(
                '<b>SIMAC</b>',
                ParagraphStyle('CT2', fontSize=11, textColor=colors.HexColor('#6ee7b7'),
                               fontName='Helvetica-Bold')
            ),
        ]]
        cover_table = Table(cover_data, colWidths=[usable_w])
        cover_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), VERDE_PRINCIPAL),
            ('TOPPADDING',    (0,0), (-1,-1), 30),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING',   (0,0), (-1,-1), 20),
            ('RIGHTPADDING',  (0,0), (-1,-1), 20),
            ('ROUNDEDCORNERS', [8, 8, 0, 0]),
        ]))

        main_block_data = [[
            Paragraph('<b>Especificaciones de<br/>Diseño UI/UX</b>',
                      ParagraphStyle('CT3', fontSize=24, leading=30,
                                     textColor=BLANCO, fontName='Helvetica-Bold')),
        ]]
        main_block = Table(main_block_data, colWidths=[usable_w])
        main_block.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), VERDE_PRINCIPAL),
            ('TOPPADDING',    (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING',   (0,0), (-1,-1), 20),
            ('RIGHTPADDING',  (0,0), (-1,-1), 20),
        ]))

        sub_block_data = [[
            Paragraph('app-bodegas · Módulo Productor y Módulo Bodega<br/>'
                      'Plan Nacional Maíz 2026 · v1.0',
                      ParagraphStyle('CT4', fontSize=10.5, leading=16,
                                     textColor=colors.HexColor('#a7f3d0'),
                                     fontName='Helvetica')),
        ]]
        sub_block = Table(sub_block_data, colWidths=[usable_w])
        sub_block.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), VERDE_PRINCIPAL),
            ('TOPPADDING',    (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 30),
            ('LEFTPADDING',   (0,0), (-1,-1), 20),
            ('RIGHTPADDING',  (0,0), (-1,-1), 20),
            ('ROUNDEDCORNERS', [0, 0, 8, 8]),
        ]))

        return [cover_table, main_block, sub_block]

    story += cover_page()
    story.append(Spacer(1, 0.5*cm))

    meta_data = [
        ['Proyecto', 'SIMAC — Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México'],
        ['Versión', 'v1.0'],
        ['Módulos', 'Módulo Productor · Módulo Bodega (Bodeguero/Industria)'],
        ['Roles', 'productor · bodega · industria · admin · responsable'],
        ['Fecha', '2026'],
        ['Tech Stack', 'React 18 + TypeScript + TailwindCSS + Vite'],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*cm, usable_w - 3.5*cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (0,-1), VERDE_BG),
        ('BACKGROUND',   (1,0), (1,-1), BLANCO),
        ('FONTNAME',     (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME',     (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('TEXTCOLOR',    (0,0), (0,-1), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (1,0), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (0,-1), 8),
        ('LEFTPADDING',  (1,0), (1,-1), 10),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [VERDE_BG, BLANCO]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.8*cm))

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 1 — ROLES Y ARQUITECTURA
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('1. Roles y Arquitectura de Acceso', section_title))

    story.append(Paragraph(
        'La aplicación define <b>cinco roles</b> con rutas y layouts distintos. '
        'El router central (<i>router.tsx</i>) gestiona guardianes de autenticación '
        'que redirigen a cada sección según el rol del usuario.',
        body
    ))

    roles_data = [
        ['Rol', 'Descripción', 'Ruta Base', 'Layout'],
        ['productor', 'Agricultor que vende maíz', '/productor', 'LayoutProductor'],
        ['bodega', 'Operador de bodega compradora', '/dashboard', 'Layout (bodeguero)'],
        ['industria', 'Empresa industrial compradora', '/dashboard', 'Layout (bodeguero)'],
        ['admin', 'Administrador del sistema', '/admin', 'AdminShell'],
        ['responsable', 'Responsable institucional', '/admin', 'AdminShell'],
    ]
    roles_table = Table(roles_data, colWidths=[2.8*cm, 5*cm, 3.8*cm, 5.4*cm])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        '<b>Guardián de rutas:</b> Cada sección usa un componente de guardia diferente: '
        '<i>RequireProductor</i> (solo rol productor), <i>RequireBodeguero</i> (bodega o industria), '
        '<i>RequireAdmin</i> (admin o responsable). Si el usuario no tiene el rol correcto, '
        'se redirige automáticamente a su pantalla de inicio.',
        body
    ))

    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('Navegación por rol', subsection_title))

    nav_data = [
        ['Módulo Bodega (bodeguero/industria)', 'Módulo Productor'],
        ['Tablero  /dashboard', 'Inicio  /productor'],
        ['Bodegas  /mis-bodegas', 'Mapa  /productor/mapa'],
        ['Oferta   /oferta', 'Precios  /productor/precios'],
        ['Transacciones  /transacciones', 'Apoyos  /productor/incentivos'],
        ['Más  /mas', 'Perfil  /productor/perfil'],
    ]
    nav_table = Table(nav_data, colWidths=[usable_w/2, usable_w/2])
    nav_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 10),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('LINEAFTER', (0,0), (0,-1), 0.8, VERDE_PRINCIPAL),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(nav_table)
    story.append(Spacer(1, 0.5*cm))

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 2 — PALETA DE COLORES
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('2. Paleta de Colores', section_title))

    story.append(Paragraph(
        'El sistema usa una paleta verde primaria (SIMAC verde) con acentos semáforo. '
        'Las barras de cabecera y elementos de marca son siempre degradados en escala de verdes.',
        body
    ))

    # ── 2.1 Verdes principales (barras/banners) ──
    story.append(Paragraph('2.1  Verdes Primarios — Barras y Banners', subsection_title))

    green_swatches = [
        ('#1A5C38', 'Verde Principal', 'Color base de marca. Barras sticky, botones primarios, íconos activos, markers del mapa, barra nav activa.'),
        ('#1e6b42', 'Verde Medio', 'Punto medio del gradiente de las barras sticky (via).'),
        ('#22733f', 'Verde Oscuro Claro', 'Extremo final del gradiente de barras (to).'),
        ('#2d7a52', 'Verde Label', 'Parte inferior del gradiente del drawer de perfil.'),
        ('#eef8f2', 'Verde Background', 'Fondo global de la app. Body y contenedores principales.'),
        ('#f4fbf7', 'Verde Menta', 'Hover de ítems de menú, fondos de chips de estado.'),
    ]

    for hex_val, name, desc in green_swatches:
        row_data = [[
            Table([[ColorSwatch(colors.HexColor(hex_val), 48, 28)]],
                  colWidths=[56], rowHeights=[38]),
            Paragraph(f'<b>{name}</b><br/><font color="#1A5C38" size="8"><i>{hex_val}</i></font>', body_bold),
            Paragraph(desc, body),
        ]]
        row_table = Table(row_data, colWidths=[60, 4*cm, usable_w - 60 - 4*cm])
        row_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ]))
        story.append(row_table)

    story.append(Spacer(1, 4*mm))

    # ── 2.2 Gradiente de barras ──
    story.append(Paragraph('2.2  Gradiente Oficial de Barras (Sticky Headers / Banners)', subsection_title))
    story.append(Paragraph(
        'Todos los banners sticky del módulo Bodega y Productor comparten este gradiente:',
        body
    ))
    grad_code = 'bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f]'
    story.append(Paragraph(grad_code, code_style))

    grad_data = [['#1A5C38', '→', '#1e6b42', '→', '#22733f']]
    grad_colors = [colors.HexColor('#1A5C38'), colors.HexColor('#1e6b42'), colors.HexColor('#22733f')]
    grad_vis = Table(
        [[Table([[ColorSwatch(c, 80, 32)]], colWidths=[88], rowHeights=[40]) for c in grad_colors]],
        colWidths=[6*cm, 6*cm, 5*cm]
    )
    grad_vis.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(grad_vis)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'El banner también incluye una superposición de profundidad: '
        '<b>bg-gradient-to-l from-emerald-500/10 to-transparent</b> '
        '(esquina derecha, opacity 50% → 100% en hover), y una sombra '
        '<b>shadow-[0_8px_30px_rgba(26,92,56,0.25)]</b>. '
        'El borde inferior es redondeado: <b>rounded-b-3xl</b> (24px) en bodegas o '
        '<b>rounded-b-3xl</b> (24px) en productor.',
        body
    ))

    story.append(Spacer(1, 4*mm))

    # ── 2.3 Semáforo ──
    story.append(Paragraph('2.3  Colores de Semáforo de Compra', subsection_title))
    story.append(Paragraph(
        'El estado de compra de cada bodega se representa con un sistema de semáforo de 4 estados:',
        body
    ))

    sem_data = [
        ['Estado', 'Color Dot', 'Hex', 'Badge (fondo/texto/borde)', 'Significado'],
        ['verde / comprando', '●', '#10b981  (emerald-500)', 'bg-emerald-50 / text-emerald-700 / border-emerald-200', 'La bodega está comprando activamente'],
        ['amarillo / limitado', '●', '#f59e0b  (amber-500)', 'bg-amber-50 / text-amber-700 / border-amber-200', 'Capacidad limitada'],
        ['rojo / no compra', '●', '#ef4444  (red-500)', 'bg-red-50 / text-red-700 / border-red-200', 'La bodega no compra'],
        ['sin_actividad', '●', '#9ca3af  (gray-400)', 'bg-[#f4fbf7] / text-gray-600 / border-gray-200', 'Sin actividad registrada'],
    ]
    sem_table = Table(sem_data, colWidths=[2.6*cm, 0.8*cm, 3.2*cm, 5.5*cm, 4.9*cm])
    sem_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 7.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TEXTCOLOR',    (1,1), (1,1), colors.HexColor('#10b981')),
        ('TEXTCOLOR',    (1,2), (1,2), colors.HexColor('#f59e0b')),
        ('TEXTCOLOR',    (1,3), (1,3), colors.HexColor('#ef4444')),
        ('TEXTCOLOR',    (1,4), (1,4), colors.HexColor('#9ca3af')),
        ('FONTSIZE',     (1,1), (1,-1), 14),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
    ]))
    story.append(sem_table)

    story.append(Spacer(1, 4*mm))

    # ── 2.4 Colores de alerta / estado ──
    story.append(Paragraph('2.4  Colores de Alerta y Estado', subsection_title))
    alert_data = [
        ['Propósito', 'Hex', 'Uso'],
        ['Alerta ámbar / advertencia', '#f59e0b  (amber-400/500)', 'Banners de advertencia, borde-l-4 en alertas, badge cuenta en revisión'],
        ['Error / sin compra', '#ef4444  (red-500)', 'Semáforo rojo, botón logout (bg-red-50, text-red-600), dot crítico'],
        ['Alerta climática', '#f97316  (orange-500)', 'Banner superior naranja de alerta climática activa'],
        ['Alerta sanitaria', '#dc2626  (red-600)', 'Banner superior rojo de alerta sanitaria activa'],
        ['Badge notif.', '#f43f5e  (rose-500)', 'Badge rojo de notificaciones no leídas en el header'],
        ['Reloj MX activo', '#22c55e  (green-500)', 'Indicador de pulso en chip de reloj; bordea el chip del clock'],
        ['Éxito / confirmar', '#30d158  (iOS green)', 'Botones de confirmación en la toolbar del mapa'],
        ['Info / azul', '#3b82f6  (blue-500)', 'KPI cards de ventanillas/solicitudes'],
    ]
    alert_table = Table(alert_data, colWidths=[4*cm, 3.8*cm, usable_w - 7.8*cm])
    alert_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
    ]))
    story.append(alert_table)
    story.append(Spacer(1, 0.5*cm))

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 3 — TIPOGRAFÍA
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('3. Tipografía', section_title))

    story.append(Paragraph('3.1  Familia de Fuentes', subsection_title))
    story.append(Paragraph(
        'La app utiliza el stack tipográfico nativo de Apple/iOS con fallbacks para otros sistemas. '
        'No hay una fuente web externa general (se importa solo <b>Outfit 900</b> para el shimmer del título SIMAC).',
        body
    ))

    font_data = [
        ['Contexto', 'Familia Tipográfica'],
        ['Interfaz principal (HTML/body)', "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"],
        ['Barra de herramientas mapa', "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"],
        ['Título SIMAC (shimmer)', "Outfit 900 (Google Fonts)  —  solo el logotipo"],
        ['Monospace / código', "Courier (reportlab), Courier New (sistema)"],
    ]
    font_table = Table(font_data, colWidths=[4.5*cm, usable_w - 4.5*cm])
    font_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
    ]))
    story.append(font_table)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph('3.2  Escala Tipográfica — Tamaños y Pesos', subsection_title))

    typo_data = [
        ['Elemento', 'Tamaño', 'Peso', 'Color', 'Clase Tailwind'],
        # Header
        ['Logo SIMAC (header)', '15.5px', 'Bold (700)', 'slate-900 #0f172a', 'text-[15.5px] font-bold tracking-[-0.02em]'],
        ['Subtitle header', '10.5px', 'Medium (500)', 'slate-400 #94a3b8', 'text-[10.5px] font-medium tracking-tight'],
        # Banner sticky
        ['Label módulo (UPPERCASE banner)', '10–11px', 'Bold (700)', 'emerald-300/80', 'text-[10px] sm:text-[11px] font-bold uppercase tracking-widest'],
        ['Título banner H1', '20–24px', 'Black (900)', 'white', 'text-[20px] sm:text-[24px] font-black leading-tight tracking-tight'],
        ['Subtítulo banner', '13–14px', 'Medium (500)', 'white/80', 'text-[13px] sm:text-[14px] font-medium text-white/80'],
        ['Nombre usuario en banner', '13px', 'Medium (500)', 'white/40', 'text-[13px] font-medium text-white/40'],
        # Rol chip
        ['Chip de rol (badge)', '11–12px', 'Bold (700)', 'white', 'text-[11px] sm:text-[12px] font-bold capitalize tracking-wide'],
        ['Chip reloj MX', '11–12px', 'Bold (700)', 'white', 'text-[11px] sm:text-[12px] font-bold tracking-widest'],
        # KPI cards
        ['KPI título (uppercase)', '13px', 'Bold (700)', 'gray-500', 'text-[13px] font-bold uppercase tracking-wide'],
        ['KPI valor principal', '28–32px', 'Black (900)', 'gray-900', 'text-[28px] sm:text-[32px] font-black leading-none tracking-tight'],
        ['KPI subtítulo', '12px', 'Medium (500)', 'gray-500', 'text-[12px] font-medium'],
        # Acciones rápidas
        ['Acción — título', '14–15px', 'Bold (700)', 'gray-900', 'text-[14px] sm:text-[15px] font-bold tracking-tight'],
        ['Acción — descripción', '11–12px', 'Normal (400)', 'gray-400/90', 'text-[11px] sm:text-[12px] text-gray-400/90'],
        # Tarjetas de bodega
        ['Card bodega — nombre', '16px', 'Bold (700)', 'gray-900', 'font-bold text-[16px] text-gray-900'],
        ['Card bodega — municipio', '13px', 'Normal (400)', 'gray-400', 'text-[13px] text-gray-400'],
        ['Card bodega — % ocupación', '11px', 'Medium (500)', 'gray-400', 'text-[11px] text-gray-400 font-medium'],
        # Nav bottom
        ['Nav label activo', '10px', 'Semibold (600) / Bold (700)', '#1A5C38', 'text-[10px] font-semibold / font-bold'],
        ['Nav label inactivo', '10px', 'Medium (500)', 'gray-400', 'text-[10px] font-medium'],
        # PageHeader
        ['PageHeader H1', '20px', 'Bold (700)', 'gray-900 / slate-900', 'text-[20px] font-bold leading-tight'],
        ['PageHeader subtitle', '12–13px', 'Medium (500)', 'gray-400 / slate-500', 'text-[12px] sm:text-[13px]'],
        ['PageHeader "Volver"', '13–14px', 'Bold (700)', '#1A5C38', 'text-[14px] font-bold text-[#1A5C38]'],
        # Drawer
        ['Drawer nombre', '17px', 'Bold (700)', 'white', 'text-white font-bold text-[17px]'],
        ['Drawer email', '13px', 'Normal (400)', 'green-200', 'text-green-200 text-[13px]'],
        ['Drawer badge rol', '11px', 'Semibold (600)', 'white', 'text-[11px] font-semibold'],
        ['Drawer ítem menú', '15px', 'Medium (500)', 'gray-700', 'text-[15px] font-medium'],
        # Miscelánea
        ['Label uppercase secciones', '11px', 'Bold (700)', 'gray-400/90', 'text-[11px] font-bold uppercase tracking-widest'],
        ['Precio grande ($/ton)', '40–48px', 'Black (900)', 'gray-900', 'text-[40px] sm:text-[48px] font-black leading-none tracking-tight'],
        ['Unidad /ton', '16–18px', 'Bold (700)', 'gray-400', 'text-[16px] sm:text-[18px] font-bold text-gray-400'],
    ]
    typo_table = Table(typo_data, colWidths=[4.5*cm, 1.5*cm, 2*cm, 3*cm, usable_w - 11*cm])
    typo_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 7.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0), (-1,-1), 4),
        ('LEFTPADDING',  (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(typo_table)
    story.append(Spacer(1, 0.5*cm))

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 4 — COMPONENTES DE DISEÑO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('4. Componentes y Especificaciones de Diseño', section_title))

    # ── 4.1 Header ──
    story.append(Paragraph('4.1  AppHeader — Barra Superior Premium "Liquid Glass"', subsection_title))
    story.append(Paragraph(
        'El header es <b>compartido por todos los roles</b> (Layout, LayoutProductor, AdminShell). '
        'Implementa el estilo "liquid glass" de Apple 2026 con vidrio esmerilado translúcido.',
        body
    ))

    header_specs = [
        ['Propiedad', 'Valor'],
        ['Altura', '64px  (h-16)'],
        ['Fondo base', 'bg-white/60  +  backdrop-blur-2xl  +  backdrop-saturate-150'],
        ['Gradiente interno', 'bg-gradient-to-b from-white/40 to-transparent'],
        ['Borde superior (brillo)', 'h-px  bg-gradient-to-r from-transparent via-white/90 to-transparent'],
        ['Hairline inferior', 'h-px  bg-slate-900/[0.07]'],
        ['Brillo líquido animado', 'simac-header-sheen  (7s loop, blur-md, opacity 0→0.9→0)'],
        ['Z-index', 'z-30  (sobre el contenido, bajo el drawer z-50)'],
        ['Logo SIMAC (ícono)', 'w-9 h-9 (36px) · rounded-[12px] · ring-1 · shadow verde'],
        ['Avatar usuario', 'w-9 h-9 (36px) · rounded-full · gradiente from-[#1f7a49] to-[#123f27]'],
        ['Badge notificaciones', 'bg-rose-500 · min-w-[16px] h-[16px] · text-[9px] font-black · ring-2 ring-white'],
    ]
    ht = Table(header_specs, colWidths=[4*cm, usable_w - 4*cm])
    ht.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(ht)
    story.append(Spacer(1, 5*mm))

    # ── 4.2 Banner Sticky ──
    story.append(Paragraph('4.2  Banners Sticky (PageBanner / Header de cada módulo)', subsection_title))
    story.append(Paragraph(
        'Cada módulo principal tiene su propio banner sticky verde en la parte superior del contenido '
        '(debajo del AppHeader). Se implementa como un div sticky con z-20.',
        body
    ))
    banner_specs = [
        ['Propiedad', 'Módulo Bodega', 'Módulo Productor'],
        ['Gradiente', 'from-[#1A5C38] via-[#1e6b42] to-[#22733f]', 'Idéntico'],
        ['Dirección', 'bg-gradient-to-br', 'bg-gradient-to-br'],
        ['Borde inferior', 'rounded-b-[2rem]  (32px)', 'rounded-b-3xl  (24px)'],
        ['Sombra', '0_8px_30px_rgba(26,92,56,0.25)', '0_4px_20px_rgba(26,92,56,0.25)'],
        ['Superpos. derecha', 'from-emerald-500/10  opacity 50%→100%', 'Idéntico'],
        ['Padding', 'pt-4 pb-5  /  px-4 sm:px-6 lg:px-10 xl:px-16', 'pt-4 pb-5  /  px-4 sm:px-6'],
        ['z-index', 'z-20', 'z-20'],
        ['Label módulo', '10–11px · Bold · emerald-300/80 · UPPERCASE · tracking-widest', 'Idéntico'],
        ['H1 título', '20px sm:24px · Black · white · tracking-tight · drop-shadow-sm', 'Idéntico'],
        ['Volver (botón)', '13px · green-200/80 · hover:green-100', '13px · green-200/80'],
    ]
    bt = Table(banner_specs, colWidths=[3.5*cm, (usable_w-3.5*cm)/2, (usable_w-3.5*cm)/2])
    bt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 7.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0), (-1,-1), 4),
        ('LEFTPADDING',  (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('LINEAFTER', (0,0), (0,-1), 0.5, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(bt)
    story.append(Spacer(1, 5*mm))

    # ── 4.3 Bottom Nav ──
    story.append(Paragraph('4.3  Barra de Navegación Inferior (Bottom Nav)', subsection_title))
    nav_specs = [
        ['Propiedad', 'Módulo Bodega', 'Módulo Productor'],
        ['Fondo', 'bg-white/95  backdrop-blur-xl', 'bg-white/95  backdrop-blur-xl'],
        ['Borde superior', 'border-t border-black/[0.06]', 'border-t border-slate-200/60'],
        ['Sombra', 'shadow-[0_-1px_0_rgba(0,0,0,0.04)]', 'shadow-[0_-4px_20px_rgb(0,0,0,0.02)]'],
        ['Color activo', 'text-[#1A5C38]', 'text-[#1A5C38]'],
        ['Color inactivo', 'text-gray-400', 'text-slate-400  hover:text-slate-500'],
        ['Ícono activo (stroke)', '2.4', '2.5'],
        ['Ícono inactivo (stroke)', '1.7', '2.0'],
        ['Tamaño íconos', '23px (Bodega)', '24px (Productor)'],
        ['Indicador activo (Bodega)', 'div w-5 h-[2px] bg-[#1A5C38] rounded-full', '—'],
        ['Padding inferior', 'pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]', 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'],
    ]
    nt = Table(nav_specs, colWidths=[4*cm, (usable_w-4*cm)/2, (usable_w-4*cm)/2])
    nt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 7.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0), (-1,-1), 4),
        ('LEFTPADDING',  (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('LINEAFTER', (0,0), (0,-1), 0.5, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(nt)
    story.append(Spacer(1, 5*mm))

    # ── 4.4 KPI Cards ──
    story.append(Paragraph('4.4  KPI Cards', subsection_title))
    story.append(Paragraph(
        'Tarjetas de métricas usadas en el dashboard del módulo Bodega. '
        'Grid de 2 columnas en móvil → 4 columnas en desktop.',
        body
    ))
    kpi_specs = [
        ['Propiedad', 'Valor'],
        ['Fondo', 'bg-white/95  backdrop-blur-2xl'],
        ['Bordes', 'rounded-[1.5rem]  (24px)  border-black/[0.04]'],
        ['Sombra reposo', 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]'],
        ['Sombra hover', 'shadow-[0_12px_30px_rgba(0,0,0,0.06)]'],
        ['Alto mínimo', '140px  (min-h-[140px])'],
        ['Ícono', 'w-10 h-10 (40px) · rounded-2xl · ring-1 · shadow-sm'],
        ['Ícono verde', 'bg-emerald-500/10  text-emerald-600  ring-emerald-500/20'],
        ['Ícono amarillo', 'bg-amber-500/10   text-amber-600   ring-amber-500/20'],
        ['Ícono rojo', 'bg-red-500/10      text-red-600     ring-red-500/20'],
        ['Ícono azul', 'bg-blue-500/10     text-blue-600    ring-blue-500/20'],
        ['Gradiente fondo hover', 'de from-emerald-50/50 (u otro color) en esquina superior derecha'],
        ['Animación hover', '-translate-y-1  +  border-black/[0.08]  (500ms spring)'],
        ['Barra de ocupación', 'bg-[#eef8f2] h-2  rounded-full  overflow-hidden'],
        ['Barra fill verde', 'bg-[#1A5C38]  (<70%)'],
        ['Barra fill amarillo', 'bg-amber-400  (70–90%)'],
        ['Barra fill rojo', 'bg-red-500     (>90%)'],
    ]
    kt = Table(kpi_specs, colWidths=[4.5*cm, usable_w - 4.5*cm])
    kt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(kt)
    story.append(Spacer(1, 5*mm))

    # ── 4.5 Tarjetas de Bodega ──
    story.append(Paragraph('4.5  Tarjeta de Bodega (Card en Mis Bodegas)', subsection_title))
    card_specs = [
        ['Propiedad', 'Valor'],
        ['Fondo', 'bg-white'],
        ['Bordes', 'rounded-2xl  (16px)  border-black/[0.04]'],
        ['Sombra reposo', 'shadow-[0_2px_8px_rgba(0,0,0,0.02)]'],
        ['Sombra hover', 'shadow-[0_8px_24px_rgba(0,0,0,0.08)]'],
        ['Padding interno', 'p-5  (20px)'],
        ['Gap vertical interno', '16px  (gap-4)'],
        ['Grid (lista)', '1 col → sm:2 → xl:3'],
        ['Badge semáforo', '10px · font-semibold · px-2.5 py-1 · rounded-full · border'],
        ['Barra ocupación fondo', 'bg-[#eef8f2]  h-1.5  rounded-full  overflow-hidden'],
        ['Barra fill', '#1A5C38 (<70%) · amber-400 (70-90%) · red-500 (>90%)'],
        ['Botón "Detalle"', 'bg-[#1A5C38]/[0.08]  text-[#1A5C38]  rounded-xl  py-2.5  text-[13px] font-semibold'],
        ['Botón "Semáforo"', 'bg-[#eef8f2]  text-gray-700  rounded-xl  py-2.5  text-[13px] font-semibold'],
        ['FAB (+)', 'w-14 h-14 · bg-[#1A5C38] · rounded-full · fixed bottom-24 right-5 · z-10'],
    ]
    ct = Table(card_specs, colWidths=[4.5*cm, usable_w - 4.5*cm])
    ct.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(ct)
    story.append(Spacer(1, 5*mm))

    # ── 4.6 Drawer de perfil ──
    story.append(Paragraph('4.6  Drawer de Perfil (Panel Lateral)', subsection_title))
    drawer_specs = [
        ['Propiedad', 'Valor'],
        ['Ancho', '300px  (w-[300px])'],
        ['Fondo', 'bg-white  shadow-2xl'],
        ['Transición', 'transition-transform duration-300 ease-out'],
        ['Header drawer', 'bg-gradient-to-br from-[#1A5C38] to-[#2d7a52]  px-5 pt-12 pb-6'],
        ['Avatar (iniciales)', 'w-14 h-14 (56px) · rounded-2xl · bg-white/20 · text-white 22px font-bold'],
        ['Ítems de menú', 'w-9 h-9 (36px) icon bg-[#eef8f2] · text-[#1A5C38] · rounded-xl'],
        ['Texto ítem', 'text-[15px] font-medium text-gray-700'],
        ['Hover ítem', 'hover:bg-[#f4fbf7]  active:bg-[#eef8f2]'],
        ['Botón logout', 'bg-red-50  text-red-600  rounded-2xl  py-3.5  font-semibold'],
        ['Footer texto', '11px text-gray-400 center · 10px text-gray-300 center'],
        ['Backdrop', 'bg-black/30  backdrop-blur-[2px]  z-40'],
        ['Z-index drawer', 'z-50'],
    ]
    dt = Table(drawer_specs, colWidths=[4.5*cm, usable_w - 4.5*cm])
    dt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(dt)
    story.append(Spacer(1, 5*mm))

    # ── 4.7 Animaciones ──
    story.append(Paragraph('4.7  Animaciones y Micro-Interacciones', subsection_title))
    anim_data = [
        ['Nombre CSS / Clase', 'Descripción', 'Duración'],
        ['simac-header-in', 'Header aparece deslizando -8px arriba → 0', '0.55s  spring(0.16,1,0.3,1)'],
        ['simac-header-sheen', 'Brillo líquido que recorre el header (loop)', '7s  cubic-bezier(0.45,0,0.55,1)  ∞'],
        ['animate-toast-in', 'Toast aparece cayendo -12px + scale 0.96→1', '0.22s  spring(0.34,1.56,0.64,1)'],
        ['animate-modal-in', 'Modal escala 0.92→1 + sube 8px', '0.25s  spring(0.34,1.36,0.64,1)'],
        ['animate-backdrop-in', 'Backdrop aparece con fade', '0.18s  ease'],
        ['animate-auth-in', 'Pantallas auth suben 28px + scale 0.98→1', '0.45s  (0.16,1,0.3,1)'],
        ['animate-sheet-up', 'Bottom sheet sube desde 100% → 0', '0.32s  (0.16,1,0.3,1)'],
        ['animate-shake', 'Error PIN: sacudida horizontal ±8px', '0.4s  (0.36,0.07,0.19,0.97)'],
        ['animate-crosshair-ring', 'Anillo de pulso en mapa (crosshair)', '1.8s  ease-out  ∞'],
        ['hover:-translate-y-1', 'Cards suben 1px en hover', '500ms  spring ease'],
        ['.press:active', 'Cualquier botón: opacity 0.7 + scale 0.98', '0.1s'],
        ['simac-pulse (toolbar)', 'Indicador verde pulsa opacity+scale', '1.8s  ease-in-out  ∞'],
    ]
    at = Table(anim_data, colWidths=[4*cm, 7.5*cm, usable_w - 11.5*cm])
    at.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 7.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0), (-1,-1), 4),
        ('LEFTPADDING',  (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(at)
    story.append(Spacer(1, 5*mm))

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 5 — RADIOS Y ESPACIADO
    # ─────────────────────────────────────────────────────────────────────────
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('5. Radios de Esquinas y Sistema de Espaciado', section_title))

    rad_data = [
        ['Elemento', 'Clase Tailwind', 'px'],
        ['Ícono de aplicación (header)', 'rounded-[12px]', '12px'],
        ['Banner / PageBanner inferior', 'rounded-b-3xl', '24px'],
        ['Banner alternativo (Bodega)', 'rounded-b-[2rem]', '32px'],
        ['KPI Cards', 'rounded-[1.5rem]', '24px'],
        ['Tarjetas bodega / acciones', 'rounded-2xl', '16px'],
        ['Botones primarios (Bodega)', 'rounded-[1.25rem]', '20px'],
        ['Botones primarios (Productor)', 'rounded-full', '50% (píldora)'],
        ['Botones secundarios', 'rounded-xl', '12px'],
        ['Chips / badges', 'rounded-full', '50% (píldora)'],
        ['Barra búsqueda / toggles', 'rounded-2xl', '16px'],
        ['Drawer', 'cuadrado  (sin radio)', '0px'],
        ['Avatar usuario', 'rounded-full', '50%'],
        ['Avatar drawer (iniciales)', 'rounded-2xl', '16px'],
        ['Ícono de rol en drawer', 'rounded-xl', '12px'],
        ['Popup mapa (Mapbox)', 'border-radius: 20px', '20px'],
        ['Ícono de mapa (marker verde)', '50%  (redondo)', '50%'],
    ]
    rt = Table(rad_data, colWidths=[6*cm, 4.5*cm, usable_w - 10.5*cm])
    rt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (-1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (0,1), (-1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
        ('GRID', (0,0), (-1,-1), 0.3, GRIS_300),
    ]))
    story.append(rt)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph('Sistema de Espaciado', subsection_title))
    story.append(Paragraph(
        'Se usa Tailwind CSS por defecto (base 4px). Los valores más comunes:',
        body
    ))
    sp_data = [
        ['Contexto', 'Clase / Valor'],
        ['Padding horizontal general', 'px-4 sm:px-6 lg:px-10 xl:px-16'],
        ['Padding vertical banner', 'pt-4 pb-5'],
        ['Gap entre KPI cards', 'gap-3  (12px)'],
        ['Gap entre acciones rápidas', 'gap-4  (16px)'],
        ['Gap interno tarjeta bodega', 'gap-4  (16px)'],
        ['Margen entre secciones', 'space-y-6  (24px) en dashboard'],
        ['Margen entre tarjetas de bodega lista', 'space-y-2  (8px)'],
        ['Max width contenido bodega', 'max-w-5xl  (1024px)'],
        ['Max width contenido productor', 'max-w-2xl  (672px)'],
        ['Padding interno cards KPI', 'p-5 sm:p-6  (20–24px)'],
    ]
    spt = Table(sp_data, colWidths=[5*cm, usable_w - 5*cm])
    spt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), VERDE_PRINCIPAL),
        ('TEXTCOLOR',    (0,0), (-1,0), BLANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 8.5),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',    (0,1), (0,-1), VERDE_PRINCIPAL),
        ('FONTNAME',     (1,1), (1,-1), 'Helvetica'),
        ('TEXTCOLOR',    (1,1), (1,-1), GRIS_700),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANCO, VERDE_BG]),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(spt)
    story.append(Spacer(1, 0.6*cm))

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 6 — RESUMEN VISUAL DE COLORES
    # ─────────────────────────────────────────────────────────────────────────
    story.append(SectionDivider())
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('6. Resumen Visual — Paleta Completa', section_title))

    palette = [
        # (hex, nombre, uso_corto)
        ('#1A5C38', 'Verde Principal', 'Marca / Barras'),
        ('#1e6b42', 'Verde Medio', 'Gradiente via'),
        ('#22733f', 'Verde Claro', 'Gradiente to'),
        ('#2d7a52', 'Verde Label', 'Drawer header'),
        ('#eef8f2', 'Verde BG', 'Fondo app'),
        ('#f4fbf7', 'Verde Menta', 'Hover items'),
        ('#30d158', 'Verde iOS', 'Confirmar / OK'),
        ('#22c55e', 'Green-500', 'Reloj / Pulso'),
        ('#10b981', 'Emerald-500', 'Semáforo verde'),
        ('#f59e0b', 'Amber-500', 'Semáforo ámbar'),
        ('#ef4444', 'Red-500', 'Semáforo rojo'),
        ('#f97316', 'Orange-500', 'Alerta climática'),
        ('#dc2626', 'Red-600', 'Alerta sanitaria'),
        ('#f43f5e', 'Rose-500', 'Badge notifs'),
        ('#3b82f6', 'Blue-500', 'KPI ventanillas'),
        ('#1C1C1E', 'Gris 900', 'Texto principal'),
    ]

    # 4 por fila
    rows = []
    row = []
    for i, (hex_val, name, uso) in enumerate(palette):
        cell = Table([
            [ColorSwatch(colors.HexColor(hex_val), 56, 34)],
            [Paragraph(f'<b>{name}</b>', ParagraphStyle('swl', fontSize=7.5, fontName='Helvetica-Bold', textColor=GRIS_900, leading=10))],
            [Paragraph(hex_val, ParagraphStyle('swh', fontSize=7, fontName='Courier', textColor=VERDE_PRINCIPAL, leading=9))],
            [Paragraph(uso, ParagraphStyle('swu', fontSize=6.5, fontName='Helvetica', textColor=GRIS_500, leading=9))],
        ], colWidths=[66], rowHeights=[40, 13, 11, 11])
        cell.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        row.append(cell)
        if (i + 1) % 4 == 0:
            rows.append(row)
            row = []
    if row:
        while len(row) < 4:
            row.append('')
        rows.append(row)

    palette_table = Table(rows, colWidths=[usable_w/4]*4)
    palette_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, GRIS_300),
        ('LINEAFTER', (0,0), (-1,-1), 0.3, GRIS_300),
        ('BOX', (0,0), (-1,-1), 0.5, GRIS_300),
    ]))
    story.append(palette_table)

    story.append(Spacer(1, 0.7*cm))
    story.append(HRFlowable(width=usable_w, thickness=0.5, color=GRIS_300))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'SIMAC — Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México · '
        'Plan Nacional Maíz 2026 · v1.0 · Especificaciones de Diseño UI/UX · app-bodegas',
        ParagraphStyle('Footer', fontSize=7, textColor=GRIS_400, fontName='Helvetica', alignment=TA_CENTER)
    ))

    doc.build(story)
    print(f"PDF generado: {output_path}")


if __name__ == '__main__':
    output = '/home/user/Simulador/SIMAC_Especificaciones_Diseno_UI.pdf'
    build_pdf(output)
