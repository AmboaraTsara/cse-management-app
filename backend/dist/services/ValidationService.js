"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const express_validator_1 = require("express-validator");
const Request_1 = require("../models/Request");
class ValidationService {
    // Validation des erreurs Express-validator
    static validateRequest(req, res) {
        const errors = (0, express_validator_1.validationResult)(req);
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
    // Validation et parsing de l'ID
    static parseId(id) {
        if (typeof id !== 'string')
            return null;
        const parsed = parseInt(id, 10);
        return (!isNaN(parsed) && parsed > 0) ? parsed : null;
    }
    // Validation des rôles
    static checkRole(userRole, allowedRoles, res) {
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
    static async validateRequestAccess(req, res, options = {}) {
        // 1. Valider l'ID
        const id = this.parseId(req.params.id);
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'ID invalide',
                code: 'INVALID_ID'
            });
            return null;
        }
        const request = await Request_1.RequestModel.findById(id);
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
        // 5. Vérifier le statut
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
exports.ValidationService = ValidationService;
