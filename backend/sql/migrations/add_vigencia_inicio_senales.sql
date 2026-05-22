-- C-11: Add vigencia_inicio to senales_compra if not exists
ALTER TABLE senales_compra ADD COLUMN IF NOT EXISTS vigencia_inicio DATE;

-- C-12: Seed correct maize varieties
INSERT INTO cat_crop_variety (code, label, crop, tipo_maiz, sort_order)
VALUES
  ('MB_H40',  'H-40',            'maiz', 'blanco',   1),
  ('MB_H48',  'H-48',            'maiz', 'blanco',   2),
  ('MB_H50',  'H-50',            'maiz', 'blanco',   3),
  ('MB_H52',  'H-52',            'maiz', 'blanco',   4),
  ('MB_H66',  'H-66',            'maiz', 'blanco',   5),
  ('MB_H70',  'H-70',            'maiz', 'blanco',   6),
  ('MB_VS22', 'VS-22',           'maiz', 'blanco',   7),
  ('MB_VS23', 'VS-23',           'maiz', 'blanco',   8),
  ('MA_H40',  'H-40 Amarillo',   'maiz', 'amarillo', 10),
  ('MA_H59',  'H-59C',           'maiz', 'amarillo', 11),
  ('MA_DK',   'DK 2020',         'maiz', 'amarillo', 12),
  ('CRIOLLO_LOCAL', 'Criollo / Local', 'maiz', 'criollo', 20),
  ('NO_SABE', 'No sabe / Sin especificar', 'maiz', NULL, 99)
ON CONFLICT (code) DO UPDATE
  SET label      = EXCLUDED.label,
      tipo_maiz  = EXCLUDED.tipo_maiz,
      sort_order = EXCLUDED.sort_order;

-- C-04/C-06: Ensure only 3 types of maize in catalog
INSERT INTO cat_catalog (catalog, code, label, sort_order)
VALUES
  ('tipo_maiz', 'blanco',   'Maíz Blanco',    1),
  ('tipo_maiz', 'amarillo', 'Maíz Amarillo',  2),
  ('tipo_maiz', 'criollo',  'Criollo / Local', 3)
ON CONFLICT (catalog, code) DO UPDATE
  SET label      = EXCLUDED.label,
      sort_order = EXCLUDED.sort_order;

-- Remove other types that are no longer used
DELETE FROM cat_catalog WHERE catalog = 'tipo_maiz' AND code NOT IN ('blanco','amarillo','criollo');
