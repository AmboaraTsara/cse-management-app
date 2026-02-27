import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { RequestModel } from '../models/Request';

interface ValidationOptions {
  checkOwner?: boolean;
  checkStatus?: string | string[];
  allowedRoles?: string[];
  resource?: 'request' | 'user' | 'budget';
}

export class ValidationService {
  
  // Validation erreurs 
  static validateRequest(req: AuthRequest, res: Response): boolean {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false,
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
      return false;
    }
    return true;
  }

  // Validation ID
  static parseId(id: any): number | null {
    if (typeof id !== 'string') return null;
    const parsed = parseInt(id, 10);
    return (!isNaN(parsed) && parsed > 0) ? parsed : null;
  }

  // Validation rôles
  static checkRole(userRole: string, allowedRoles: string[], res: Response): boolean {
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Accès non autorisé',
        code: 'FORBIDDEN'
      });
      return false;
    }
    return true;
  }

  static async validateRequestAccess(
    req: AuthRequest,
    res: Response,
    options: ValidationOptions = {}
  ): Promise<any | null> {
    
    const id = this.parseId(req.params.id);
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
        code: 'INVALID_ID'
      });
      return null;
    }

    const request = await RequestModel.findById(id);
    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Demande non trouvée',
        code: 'NOT_FOUND'
      });
      return null;
    }

    if (options.allowedRoles && !options.allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Rôle non autorisé',
        code: 'ROLE_ERROR'
      });
      return null;
    }

    if (options.checkOwner && request.user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Non autorisé',
        code: 'FORBIDDEN'
      });
      return null;
    }

    // 5. Vérifier statut
    if (options.checkStatus) {
      const allowedStatuses = Array.isArray(options.checkStatus) 
        ? options.checkStatus 
        : [options.checkStatus];
      
      if (!allowedStatuses.includes(request.status)) {
        res.status(400).json({
          success: false,
          error: `Statut invalide. Requis: ${allowedStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
          currentStatus: request.status
        });
        return null;
      }
    }

    return { id, request };
  }
}
