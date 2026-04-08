import { Router, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================
// POST /api/producers - Alta de productor
// =============================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { curp, phone, privacy_consent } = req.body;

    if (!curp || curp.length !== 18) {
      res.status(400).json({ error: 'CURP debe tener exactamente 18 caracteres' });
      return;
    }

    if (privacy_consent !== true) {
      res.status(400).json({ error: 'Debe aceptar el aviso de privacidad' });
      return;
    }

    const curpUpper = curp.toUpperCase().trim();
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(curpUpper)) {
      res.status(400).json({ error: 'Formato de CURP inválido' });
      return;
    }

    // Check if producer already exists
    const existing = await pool.query('SELECT producer_id, curp FROM producer WHERE curp = $1', [curpUpper]);
    if (existing.rows.length > 0) {
      res.json({ producer: existing.rows[0], message: 'Productor ya registrado' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO producer (curp, phone, privacy_consent, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING producer_id, curp, phone, privacy_consent, created_at`,
      [curpUpper, phone || null, true, req.user!.userId]
    );

    res.status(201).json({ producer: result.rows[0], message: 'Productor registrado exitosamente' });
  } catch (error: any) {
    console.error('Error creando productor:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ya existe un productor con ese CURP' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/producers/:curp - Consultar productor por CURP
// =============================================
router.get('/:curp', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const curp = req.params.curp.toUpperCase().trim();
    const result = await pool.query(
      `SELECT producer_id, curp, phone, privacy_consent, created_at
       FROM producer WHERE curp = $1`,
      [curp]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }

    res.json({ producer: result.rows[0] });
  } catch (error) {
    console.error('Error consultando productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
