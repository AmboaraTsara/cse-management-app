import { Response } from 'express';

export class ResponseHandler {
  
  static success(res: Response, data: any, message?: string, status = 200) {
    return res.status(status).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static error(res: Response, error: string, code: string, status = 400, details?: any) {
    return res.status(status).json({
      success: false,
      error,
      code,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res: Response, resource = 'Ressource') {
    return this.error(res, `${resource} non trouvée`, 'NOT_FOUND', 404);
  }

  static forbidden(res: Response, message = 'Accès non autorisé') {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  static validationError(res: Response, errors: any) {
    return res.status(400).json({
      success: false,
      errors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}