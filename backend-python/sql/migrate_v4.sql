-- Migration v4: Add tipo_maiz column to inventarios
ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS tipo_maiz VARCHAR(50) DEFAULT 'Maiz blanco';
