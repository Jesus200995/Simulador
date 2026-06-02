# SIMAC — Corrección Urgente
## Flujo "Tengo Maíz" — Variedades no aparecen
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar de inmediato

> 🔴 CRÍTICO — El flujo más importante del productor está completamente roto.
> La pantalla de selección de variedad siempre muestra lista vacía
> aunque el catálogo tenga 14 variedades de maíz blanco en BD.
> Aplicar antes que cualquier otro cambio.

---

## DIAGNÓSTICO

El endpoint `/catalogos-productor` devuelve:
```json
{
  "varieties": {
    "maiz": [
      { "code": "MB_H40", "label": "H-40" },
      { "code": "MB_H48", "label": "H-48" }
    ]
  }
}
```

`DisponibilidadVariedadPage.tsx` lee `d.variedades` — campo que **no existe**.
Resultado: array vacío → pantalla sin variedades → productor no puede continuar.

`CicloProductivoPage.tsx` lee `d.varieties?.maiz` — correcto ✅
El mismo endpoint, dos componentes, dos formas distintas de leerlo.

---

## CORRECCIÓN ÚNICA
**ARCHIVO:** `app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx`
**ACCIÓN:** REEMPLAZAR — 3 cambios coordinados en el mismo archivo

---

### Cambio 1 — Interfaz de Variedad

**BUSCAR:**
```typescript
interface Variedad { 
  id: number; 
  nombre_variedad: string; 
  code: string; 
  tipo_maiz: string; 
}
```

**REEMPLAZAR CON:**
```typescript
interface Variedad { 
  code: string; 
  label: string; 
}
```

---

### Cambio 2 — Fetch con filtro correcto y campo correcto

**BUSCAR:**
```typescript
fetch(`${BASE}/catalogos-productor`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then(r => r.json())
  .then(d => {
    const all: Variedad[] = d.variedades || [];
    const filtered = all.filter(v => !v.tipo_maiz || v.tipo_maiz === tipoMaiz);
    setVariedades(filtered);
  })
```

**REEMPLAZAR CON:**
```typescript
fetch(`${BASE}/catalogos-productor?tipo_maiz=${tipoMaiz}`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then(r => r.json())
  .then(d => {
    const all: Variedad[] = d.varieties?.maiz ?? [];
    setVariedades(all);
  })
```

---

### Cambio 3 — JSX donde se muestra el nombre de la variedad

**BUSCAR todas las ocurrencias de:**
```typescript
v.nombre_variedad
```

**REEMPLAZAR CADA UNA CON:**
```typescript
v.label
```

**TAMBIÉN buscar y reemplazar si existe:**
```typescript
variedad.nombre_variedad
```
**POR:**
```typescript
variedad.label
```

---

### Cambio 4 — sessionStorage al seleccionar variedad

**BUSCAR el bloque donde se guarda la variedad seleccionada en sessionStorage:**
```typescript
sessionStorage.setItem('disp_variedad_id', String(v.id));
sessionStorage.setItem('disp_variedad_code', v.code);
sessionStorage.setItem('disp_variedad_nombre', v.nombre_variedad);
```

**REEMPLAZAR CON:**
```typescript
sessionStorage.setItem('disp_variedad_code', v.code);
sessionStorage.setItem('disp_variedad_nombre', v.label);
```

> Nota: `disp_variedad_id` ya no es necesario — el backend usa `variedad_code` directamente.
> Si existe código que lee `disp_variedad_id` en pasos posteriores, 
> verificar que también use `disp_variedad_code` como fuente principal.

---

## VERIFICAR

```bash
# 1. Confirmar que no quedan referencias al campo incorrecto
grep -n "variedades" app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx
# Resultado esperado: sin ocurrencias de d.variedades

grep -n "nombre_variedad" app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx  
# Resultado esperado: sin ocurrencias

# 2. Confirmar que usa el campo correcto
grep -n "varieties" app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx
# Resultado esperado: al menos 1 ocurrencia — d.varieties?.maiz

# 3. Confirmar que el fetch incluye el filtro
grep -n "tipo_maiz" app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx
# Resultado esperado: ?tipo_maiz=${tipoMaiz} en la URL del fetch
```

**Prueba funcional:**
1. Login como productor
2. Dashboard → "Tengo maíz disponible"
3. Seleccionar tipo de maíz (ej. Blanco)
4. Pantalla de variedad → debe mostrar las 14 variedades de maíz blanco
5. Seleccionar variedad → debe avanzar al paso de volumen
6. Completar flujo → en BD verificar:

```sql
SELECT variedad_code, volumen_estimado_ton 
FROM disponibilidad_productor 
ORDER BY created_at DESC LIMIT 1;
-- variedad_code debe ser "MB_H40" o similar — NO un número como "12"
-- volumen_estimado_ton debe tener el valor ingresado
```

---

## REFERENCIA — Por qué CicloProductivo funciona y este no

| | `CicloProductivoPage.tsx` | `DisponibilidadVariedadPage.tsx` |
|---|---|---|
| Campo leído | `d.varieties?.maiz` ✅ | `d.variedades` ❌ |
| Filtro al endpoint | `?tipo_maiz=${tipoMaiz}` ✅ | ninguno ❌ |
| Interfaz | `{code, label}` ✅ | `{id, nombre_variedad, code, tipo_maiz}` ❌ |
| Resultado | Lista correcta | Lista vacía siempre |

Esta corrección hace que `DisponibilidadVariedadPage` use exactamente
el mismo patrón que ya funciona en `CicloProductivoPage`.

---

*SIMAC Plan Nacional Maíz 2026 · Corrección Urgente — Flujo Tengo Maíz*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
