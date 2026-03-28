-- =============================================
-- Migracion v5: Sistema de roles (general, bodeguero, admin)
-- =============================================

-- Cambiar default de rol a 'general'
ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'general';

-- Actualizar usuarios con rol='usuario' (default anterior) a 'general'
UPDATE usuarios SET rol = 'general' WHERE rol = 'usuario' OR rol IS NULL;

-- Asignar admin a jess@gmail.com para testing
UPDATE usuarios SET rol = 'admin' WHERE email = 'jess@gmail.com';
