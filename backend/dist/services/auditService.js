"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
// backend/src/services/auditService.ts
const database_1 = __importDefault(require("../config/database"));
const logAction = async (logData) => {
    try {
        await database_1.default.query(`INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            logData.user_id,
            logData.action,
            logData.resource,
            logData.resource_id || null,
            logData.details ? JSON.stringify(logData.details) : null,
            logData.ip_address || null
        ]);
    }
    catch (error) {
        console.error(' Erreur audit log:', error);
        // Ne pas bloquer l'application pour un échec d'audit
    }
};
exports.logAction = logAction;
