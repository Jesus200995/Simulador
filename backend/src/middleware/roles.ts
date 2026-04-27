import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Role-guard: returns a middleware that allows only the listed roles.
 * Use AFTER authMiddleware. 403 if role not in allowed list.
 */
export function requireRole(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.rol;
    if (!role || !allowed.includes(role)) {
      res.status(403).json({ error: `Acción no permitida para el rol '${role || 'desconocido'}'.` });
      return;
    }
    next();
  };
}

// Convenience constants per the Reajustes.pdf model
export const ROLES = {
  PRODUCTOR: ['productor', 'tecnico'],
  SUPERVISOR: ['supervisor'],
  BODEGUERO: ['bodeguero', 'responsable'],
  ADMIN: ['admin'],
};
