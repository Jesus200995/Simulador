SELECT column_name FROM information_schema.columns WHERE table_name='bodegas' AND column_name IN ('estatus','capacidad_ton','activo','capacidad_toneladas') ORDER BY column_name;
SELECT DISTINCT estatus FROM bodegas LIMIT 5;
