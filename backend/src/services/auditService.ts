// backend/src/services/auditService.ts
import pool from '../config/database';

export interface AuditLogData {
  user_id: number;
  action: string;
  resource: string;
  resource_id?: number;
  details?: any;
  ip_address?: string;
}

export const logAction = async (logData: AuditLogData): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        logData.user_id, 
        logData.action, 
        logData.resource, 
        logData.resource_id || null,
        logData.details ? JSON.stringify(logData.details) : null,
        logData.ip_address || null
      ]
    );
  } catch (error) {
    console.error(' Erreur audit log:', error);
    // Ne pas bloquer l'application pour un échec d'audit
  }
};