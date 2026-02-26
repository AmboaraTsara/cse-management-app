"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
class ResponseHandler {
    static success(res, data, message, status = 200) {
        return res.status(status).json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        });
    }
    static error(res, error, code, status = 400, details) {
        return res.status(status).json({
            success: false,
            error,
            code,
            details,
            timestamp: new Date().toISOString()
        });
    }
    static notFound(res, resource = 'Ressource') {
        return this.error(res, `${resource} non trouvée`, 'NOT_FOUND', 404);
    }
    static forbidden(res, message = 'Accès non autorisé') {
        return this.error(res, message, 'FORBIDDEN', 403);
    }
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            errors,
            code: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
        });
    }
}
exports.ResponseHandler = ResponseHandler;
