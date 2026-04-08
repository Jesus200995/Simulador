import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// POST /api/ups/:up_id/cycles - Crear ciclo
// =============================================
router.post('/ups/:up_id/cycles', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { up_id } = req.params;
    const { cycle_year, cycle_type } = req.body;

    if (!cycle_year || !cycle_type) {
      res.status(400).json({ error: 'Se requiere cycle_year y cycle_type' });
      return;
    }

    const validTypes = ['PV', 'OI', 'ANUAL'];
    if (!validTypes.includes(cycle_type)) {
      res.status(400).json({ error: 'cycle_type debe ser PV, OI o ANUAL' });
      return;
    }

    // Verify UP exists
    const upCheck = await pool.query('SELECT up_id FROM up WHERE up_id = $1', [up_id]);
    if (upCheck.rows.length === 0) {
      res.status(404).json({ error: 'UP no encontrada' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO cycle (up_id, cycle_year, cycle_type)
       VALUES ($1, $2, $3)
       RETURNING cycle_id, up_id, cycle_year, cycle_type, created_at`,
      [up_id, cycle_year, cycle_type]
    );

    res.status(201).json({ cycle: result.rows[0], message: 'Ciclo creado exitosamente' });
  } catch (error) {
    console.error('Error creando ciclo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/ups/:up_id/cycles - Listar ciclos de UP
// =============================================
router.get('/ups/:up_id/cycles', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { up_id } = req.params;

    const result = await pool.query(
      `SELECT c.cycle_id, c.up_id, c.cycle_year, c.cycle_type, c.created_at,
              COALESCE(json_agg(
                json_build_object(
                  'cycle_crop_id', cc.cycle_crop_id,
                  'crop', cc.crop,
                  'variety_id', cc.variety_id,
                  'variety_other', cc.variety_other,
                  'area_sown_ha', cc.area_sown_ha,
                  'area_harvested_ha', cc.area_harvested_ha,
                  'destination', cc.destination,
                  'production_qty', cc.production_qty,
                  'production_unit', cc.production_unit
                )
              ) FILTER (WHERE cc.cycle_crop_id IS NOT NULL), '[]') as crops
       FROM cycle c
       LEFT JOIN cycle_crop cc ON c.cycle_id = cc.cycle_id
       WHERE c.up_id = $1
       GROUP BY c.cycle_id
       ORDER BY c.cycle_year DESC, c.cycle_type`,
      [up_id]
    );

    res.json({ cycles: result.rows });
  } catch (error) {
    console.error('Error listando ciclos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/cycles/:cycle_id/crops - Agregar cultivo al ciclo
// =============================================
router.post('/cycles/:cycle_id/crops', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cycle_id } = req.params;
    const {
      crop, variety_id, variety_other,
      area_sown_ha, area_harvested_ha,
      destination, production_qty, production_unit
    } = req.body;

    // Validations
    if (!crop || !variety_id || !area_sown_ha || area_harvested_ha === undefined || !destination || production_qty === undefined || !production_unit) {
      res.status(400).json({ error: 'Faltan campos obligatorios' });
      return;
    }

    const validCrops = ['maiz', 'frijol'];
    if (!validCrops.includes(crop)) {
      res.status(400).json({ error: 'crop debe ser maiz o frijol' });
      return;
    }

    if (Number(area_sown_ha) <= 0) {
      res.status(400).json({ error: 'area_sown_ha debe ser > 0' });
      return;
    }

    if (Number(area_harvested_ha) < 0 || Number(area_harvested_ha) > Number(area_sown_ha)) {
      res.status(400).json({ error: 'area_harvested_ha debe ser >= 0 y <= area_sown_ha' });
      return;
    }

    if (Number(production_qty) < 0) {
      res.status(400).json({ error: 'production_qty debe ser >= 0' });
      return;
    }

    // Require variety_other when variety_id is CRIOLLO_LOCAL or OTRA
    if ((variety_id === 'CRIOLLO_LOCAL' || variety_id === 'OTRA') && !variety_other) {
      res.status(400).json({ error: 'Debe especificar la variedad cuando selecciona Criollo/local u Otra' });
      return;
    }

    // Verify cycle exists
    const cycleCheck = await pool.query('SELECT cycle_id FROM cycle WHERE cycle_id = $1', [cycle_id]);
    if (cycleCheck.rows.length === 0) {
      res.status(404).json({ error: 'Ciclo no encontrado' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO cycle_crop (cycle_id, crop, variety_id, variety_other, area_sown_ha, area_harvested_ha, destination, production_qty, production_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [cycle_id, crop, variety_id, variety_other || null, area_sown_ha, area_harvested_ha, destination, production_qty, production_unit]
    );

    res.status(201).json({ crop: result.rows[0], message: 'Cultivo agregado exitosamente' });
  } catch (error) {
    console.error('Error agregando cultivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PATCH /api/cycle-crops/:id - Editar cultivo del ciclo
// =============================================
router.patch('/cycle-crops/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      variety_id, variety_other, area_sown_ha, area_harvested_ha,
      destination, production_qty, production_unit
    } = req.body;

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (variety_id !== undefined) { sets.push(`variety_id = $${idx++}`); params.push(variety_id); }
    if (variety_other !== undefined) { sets.push(`variety_other = $${idx++}`); params.push(variety_other); }
    if (area_sown_ha !== undefined) { sets.push(`area_sown_ha = $${idx++}`); params.push(area_sown_ha); }
    if (area_harvested_ha !== undefined) { sets.push(`area_harvested_ha = $${idx++}`); params.push(area_harvested_ha); }
    if (destination !== undefined) { sets.push(`destination = $${idx++}`); params.push(destination); }
    if (production_qty !== undefined) { sets.push(`production_qty = $${idx++}`); params.push(production_qty); }
    if (production_unit !== undefined) { sets.push(`production_unit = $${idx++}`); params.push(production_unit); }

    if (sets.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE cycle_crop SET ${sets.join(', ')} WHERE cycle_crop_id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cultivo de ciclo no encontrado' });
      return;
    }

    res.json({ crop: result.rows[0], message: 'Cultivo actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando cultivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
