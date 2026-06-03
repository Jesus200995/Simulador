# SIMAC — Corrección Urgente
## Fallbacks ficticios restantes — 3 archivos
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar de inmediato

> Los valores `6.28` (Chicago CME) y `17.42` (Tipo de cambio) quedaron
> sin corregir en 3 lugares. Mientras existan, el sistema puede mostrar
> precios ficticios al productor y al bodeguero sin ningún aviso.

---

## CORRECCIÓN A
**ARCHIVO:** `backend/src/routes/precios-sistema.ts`
**LÍNEAS:** 174-175 — endpoint `/tendencia`
**ACCIÓN:** REEMPLAZAR

**BUSCAR:**
```typescript
extRef.tc_banxico || '17.42'
extRef.chicago_usd_bushel || '6.28'
```

**REEMPLAZAR — agregar validación antes de usar los valores:**
```typescript
if (!extRef?.chicago_usd_bushel || !extRef?.tc_banxico) {
  return res.status(503).json({
    error: 'Datos de tendencia no disponibles',
    detalle: 'Sin cotización de Chicago CME o tipo de cambio para calcular tendencia.'
  });
}
const chicago_usd_bushel = parseFloat(extRef.chicago_usd_bushel);
const tc_banxico = parseFloat(extRef.tc_banxico);
```

---

## CORRECCIÓN B
**ARCHIVO:** `backend/src/routes/precios-sistema.ts`
**LÍNEAS:** 294-295 — endpoint `/componentes/detalle`
**ACCIÓN:** REEMPLAZAR

**BUSCAR:**
```typescript
refsC.chicago_usd_bushel || '6.28'
refsC.tc_banxico || '17.42'
```

**REEMPLAZAR — agregar validación antes de usar los valores:**
```typescript
if (!refsC?.chicago_usd_bushel || !refsC?.tc_banxico) {
  return res.status(503).json({
    error: 'Datos de componentes no disponibles',
    detalle: 'Sin cotización de Chicago CME o tipo de cambio para calcular componentes.'
  });
}
const chicago_usd_bushel = parseFloat(refsC.chicago_usd_bushel);
const tc_banxico = parseFloat(refsC.tc_banxico);
```

---

## CORRECCIÓN C
**ARCHIVO:** `app-bodega/src/pages/B22PreciosMercado.tsx`
**LÍNEA:** 168
**ACCIÓN:** REEMPLAZAR

**BUSCAR:**
```typescript
data?.tipo_cambio_mxn ?? 17.42
```

**REEMPLAZAR CON:**
```typescript
data?.tipo_cambio_mxn ?? null
```

**BUSCAR en el JSX donde se renderiza ese valor y agregar guard:**
```typescript
// ANTES — muestra el número directamente:
{tipoCambio}
// o variante similar

// DESPUÉS — muestra "Sin datos" si es null:
{tipoCambio !== null
  ? `$${tipoCambio.toFixed(2)}`
  : <span className="text-amber-500 text-sm">Sin datos</span>
}
```

---

## VERIFICAR

Después de aplicar las 3 correcciones ejecutar:

```bash
# No debe quedar ningún fallback ficticio en el backend
grep -rn "6\.28\|17\.42" backend/src/
# Resultado esperado: sin coincidencias funcionales
# Solo pueden aparecer dentro de comentarios

# No debe quedar el fallback en el frontend
grep -rn "17\.42" app-bodega/src/pages/B22PreciosMercado.tsx
# Resultado esperado: sin coincidencias
```

**Prueba funcional:**
1. Vaciar temporalmente `precio_referencias_externas` en BD de prueba
2. Llamar a los 3 endpoints:
   - `GET /api/precios/sistema/hoy`
   - `GET /api/precios/tendencia`
   - `GET /api/precios/componentes/detalle`
3. Los 3 deben responder `503` con mensaje claro
4. Ninguno debe responder `200` con valores ficticios

---

*SIMAC Plan Nacional Maíz 2026 · Corrección Urgente — Fallbacks Ficticios*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
