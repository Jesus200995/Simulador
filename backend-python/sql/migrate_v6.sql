-- Migración v6: Agregar campo "origen" a inventarios
ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'Local';
