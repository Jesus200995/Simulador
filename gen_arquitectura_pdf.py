# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, KeepTogether)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

GREEN = colors.HexColor("#1A5C38")
GREEN_L = colors.HexColor("#E8F1EC")
GREY = colors.HexColor("#5b6770")
DARK = colors.HexColor("#1f2937")
LIGHT = colors.HexColor("#F2F2F7")

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Title'], textColor=GREEN, fontSize=22, leading=26, spaceAfter=2, alignment=TA_LEFT)
SUB = ParagraphStyle('SUB', parent=styles['Normal'], textColor=GREY, fontSize=10.5, leading=14, spaceAfter=2)
H2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=GREEN, fontSize=13.5, leading=16, spaceBefore=12, spaceAfter=5)
BODY = ParagraphStyle('BODY', parent=styles['Normal'], fontSize=9.7, leading=14, textColor=DARK, spaceAfter=4)
SMALL = ParagraphStyle('SMALL', parent=styles['Normal'], fontSize=8.4, leading=11, textColor=GREY)
CELLH = ParagraphStyle('CELLH', parent=styles['Normal'], fontSize=9, leading=12, textColor=colors.white, fontName='Helvetica-Bold')
CELL = ParagraphStyle('CELL', parent=styles['Normal'], fontSize=8.8, leading=12, textColor=DARK)
CELLB = ParagraphStyle('CELLB', parent=styles['Normal'], fontSize=8.8, leading=12, textColor=DARK, fontName='Helvetica-Bold')

def tabla(headers, rows, widths):
    data = [[Paragraph(h, CELLH) for h in headers]]
    for r in rows:
        data.append([Paragraph(r[0], CELLB)] + [Paragraph(c, CELL) for c in r[1:]])
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [
        ('BACKGROUND', (0,0), (-1,0), GREEN),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D9DEE3")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]
    t.setStyle(TableStyle(st))
    return t

def chip_row(title, items):
    """Cajita verde con título y lista de bullets."""
    inner = [Paragraph("<b>%s</b>" % title, ParagraphStyle('ct', parent=BODY, textColor=GREEN, fontSize=10, spaceAfter=3))]
    for it in items:
        inner.append(Paragraph("•&nbsp; %s" % it, ParagraphStyle('ci', parent=BODY, fontSize=9.2, leading=13, leftIndent=4, spaceAfter=1)))
    t = Table([[inner]], colWidths=[176*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_L),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#C4DBCD")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

story = []

# ---------- Encabezado ----------
story.append(Paragraph("SIMAC &mdash; Arquitectura Técnica", H1))
story.append(Paragraph("Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco · Plan Nacional Maíz 2026", SUB))
story.append(Paragraph("Documento técnico para equipo de desarrollo · App Bodegas + Productor + Panel Administrativo", SUB))
story.append(Spacer(1, 4))
story.append(HRFlowable(width="100%", thickness=1.2, color=GREEN))
story.append(Spacer(1, 8))

# ---------- Visión general ----------
story.append(Paragraph("1. Visión general", H2))
story.append(Paragraph(
    "Aplicación web <b>PWA mobile-first</b> de una sola base de código (monorepo) que sirve a tres roles: "
    "<b>Productor</b>, <b>Bodeguero / Industria</b> y <b>Administrador</b>. Arquitectura cliente-servidor clásica: "
    "un <b>SPA en React</b> consume una <b>API REST en Node/Express</b>, que persiste en <b>PostgreSQL + PostGIS</b>. "
    "Todo corre en un <b>VPS Linux</b> detrás de <b>Nginx</b> con HTTPS, gestionado por <b>PM2</b>.", BODY))
story.append(Paragraph(
    "<b>Flujo:</b> Navegador (PWA) &rarr; Nginx (TLS / reverse proxy) &rarr; API Express (puerto interno 3005) &rarr; "
    "PostgreSQL/PostGIS. Los mapas cargan teselas satelitales de ArcGIS y geocodificación de OpenStreetMap (Nominatim).", BODY))

# ---------- Stack Frontend ----------
story.append(Paragraph("2. Frontend &mdash; <i>app-bodega</i>", H2))
story.append(tabla(
    ["Componente", "Tecnología", "Para qué"],
    [
        ["Lenguaje", "TypeScript", "Tipado estático en toda la app"],
        ["Framework UI", "React 19", "Componentes y estado de la interfaz"],
        ["Build / Dev", "Vite 8", "Bundler ultrarrápido y servidor de desarrollo"],
        ["Ruteo", "React Router 7", "Navegación SPA por rol (productor / bodega / admin)"],
        ["Estado global", "Zustand", "Sesión y autenticación (store persistente)"],
        ["Estilos", "Tailwind CSS 4", "Diseño utility-first, responsive mobile-first"],
        ["Iconos", "Lucide React", "Set de iconos SVG"],
        ["Gráficas", "Recharts", "Tendencias de precios y estadísticas"],
        ["PWA", "vite-plugin-pwa (Workbox)", "Instalable, offline básico, service worker"],
    ],
    [33*mm, 52*mm, 91*mm]))

# ---------- Mapas / polígonos ----------
story.append(Paragraph("3. Mapas y polígonos de parcelas", H2))
story.append(Paragraph(
    "El corazón geográfico de la app: el productor <b>dibuja su parcela (polígono)</b> sobre un mapa satelital y el "
    "sistema calcula área, centroide y deriva automáticamente su estado y municipio.", BODY))
story.append(tabla(
    ["Pieza", "Tecnología", "Función"],
    [
        ["Motor de mapas", "Leaflet 1.9", "Render del mapa interactivo en el navegador"],
        ["Integración React", "react-leaflet 5", "Componentes de mapa declarativos en React"],
        ["Dibujo de polígono", "leaflet-draw", "Trazado vértice por vértice de la parcela"],
        ["Geometría / área", "Turf.js", "Cálculo de hectáreas y centroide (cliente)"],
        ["Teselas base", "ArcGIS World Imagery", "Imagen satelital + capa de referencia"],
        ["Búsqueda de lugares", "Nominatim (OSM)", "Buscador de ejido/localidad y reverse-geocoding"],
    ],
    [33*mm, 52*mm, 91*mm]))
story.append(Spacer(1, 3))
story.append(chip_row("Detección automática de Estado y Municipio", [
    "Al cerrar el polígono se toma su <b>centroide</b> (lat/lng).",
    "El backend hace <b>reverse-geocoding</b> con Nominatim (prioridad México: county/borough/municipality/town).",
    "El nombre se <b>canonicaliza</b> contra el catálogo oficial <i>geo_state</i> / <i>geo_municipality</i> (filtra por estado para homónimos como “Cuauhtémoc”).",
    "Se guarda el polígono como <b>GeoJSON</b> en PostGIS (columnas <i>geom</i> MultiPolygon y <i>centroid</i> Point).",
]))

# ---------- Backend ----------
story.append(Paragraph("4. Backend &mdash; API REST", H2))
story.append(tabla(
    ["Componente", "Tecnología", "Para qué"],
    [
        ["Lenguaje", "TypeScript", "Tipado en el servidor"],
        ["Runtime", "Node.js 20", "Entorno de ejecución del servidor"],
        ["Framework", "Express 4", "Definición de rutas y middlewares de la API REST"],
        ["Driver de BD", "pg (node-postgres)", "Conexión y queries SQL a PostgreSQL"],
        ["Autenticación", "JWT (jsonwebtoken)", "Tokens de sesión por rol (Bearer)"],
        ["Contraseñas / PIN", "bcrypt", "Hash seguro de contraseñas y PIN de productor"],
        ["Tareas programadas", "node-cron", "Jobs (precios, mantenimiento)"],
        ["Integraciones", "axios · yahoo-finance2", "Precios de mercado / servicios externos"],
        ["Archivos", "multer", "Subida de archivos (documentos, evidencias)"],
    ],
    [33*mm, 52*mm, 91*mm]))

# ---------- Base de datos ----------
story.append(Paragraph("5. Base de datos", H2))
story.append(tabla(
    ["Componente", "Tecnología", "Para qué"],
    [
        ["Motor", "PostgreSQL", "Base de datos relacional principal"],
        ["Extensión geo", "PostGIS 3.2", "Geometrías, polígonos y consultas espaciales"],
        ["Cálculo espacial", "Haversine en SQL + PostGIS", "Distancia bodega&harr;productor, filtros por radio"],
        ["Versionado", "Migraciones SQL (v1…v22)", "Scripts incrementales versionados en el repo"],
    ],
    [33*mm, 52*mm, 91*mm]))
story.append(Paragraph(
    "<b>Datos geográficos clave:</b> tabla <i>up</i> (Unidad de Producción) guarda la parcela como <i>geom</i> "
    "(MultiPolygon) y <i>centroid</i> (Point). El emparejamiento productor&harr;bodega usa <b>ST_DWithin</b> / "
    "<b>ST_Distance</b> sobre coordenadas geográficas, con respaldo a fórmula <b>Haversine</b> en SQL puro.", BODY))

# ---------- Infraestructura / despliegue ----------
story.append(Paragraph("6. Infraestructura y despliegue", H2))
story.append(tabla(
    ["Componente", "Tecnología", "Para qué"],
    [
        ["Servidor", "VPS Linux (Hostinger)", "Hospedaje de API, BD y archivos estáticos"],
        ["Reverse proxy", "Nginx", "TLS/HTTPS, sirve el build y enruta /api al backend"],
        ["Gestor de procesos", "PM2", "Mantiene la API viva, reinicios y logs"],
        ["Certificados", "SSL/TLS (HTTPS)", "Cifrado en dominio oficial agricultura.gob.mx"],
        ["Control de versiones", "Git + GitHub", "Repositorio único (monorepo) y despliegue"],
    ],
    [33*mm, 52*mm, 91*mm]))
story.append(Spacer(1, 3))
story.append(chip_row("Flujo de despliegue (deploy)", [
    "<b>git push</b> a la rama <i>main</i> en GitHub.",
    "En el VPS: <b>git pull</b> &rarr; backend <b>tsc</b> (compila TS) &rarr; <b>pm2 restart</b> de la API.",
    "Frontend: <b>vite build</b> &rarr; Nginx sirve el nuevo <i>dist/</i>.",
    "Migraciones de BD aplicadas con <b>psql -f</b> cuando hay cambios de esquema.",
]))

# ---------- Pie ----------
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#C4DBCD")))
story.append(Spacer(1, 3))
story.append(Paragraph(
    "Resumen del stack: <b>React 19 + TypeScript + Vite + Tailwind</b> (PWA) &nbsp;|&nbsp; "
    "<b>Node + Express + TypeScript</b> (API REST con JWT) &nbsp;|&nbsp; "
    "<b>PostgreSQL + PostGIS</b> &nbsp;|&nbsp; <b>Leaflet + Turf.js + Nominatim</b> (mapas y polígonos) &nbsp;|&nbsp; "
    "<b>Nginx + PM2 + Git</b> sobre VPS Linux.", SMALL))

doc = SimpleDocTemplate("SIMAC_Arquitectura_Tecnica.pdf", pagesize=letter,
                        leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=14*mm,
                        title="SIMAC - Arquitectura Tecnica", author="Equipo SIMAC")
doc.build(story)
print("OK -> SIMAC_Arquitectura_Tecnica.pdf")
