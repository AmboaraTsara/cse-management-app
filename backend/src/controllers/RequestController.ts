import { Request, Response } from 'express';
import { RequestModel } from '../models/Request';
import { AuthRequest } from '../middleware/auth';
import { ValidationService } from '../services/ValidationService';
import { ResponseHandler } from '../utils/responseHandler';
import { logAction } from '../services/auditService';
import pool from '../config/database';


export const getAllRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = req.user.role === 'ADMIN' || req.user.role === 'MANAGER'
      ? await RequestModel.findAll()
      : await RequestModel.findByUserId(req.user.id);
    
    return ResponseHandler.success(res, requests);
  } catch (error) {
    console.error(' getAllRequests:', error);
    return ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
  }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const result = await ValidationService.validateRequestAccess(req, res);
    if (!result) return;

    const { id, request } = result;

    if (!['ADMIN', 'MANAGER'].includes(req.user.role) && request.user_id !== req.user.id) {
      await logAction({ user_id: req.user.id, action: 'UNAUTHORIZED_ACCESS', resource: 'request', resource_id: id });
      return ResponseHandler.forbidden(res, 'Non autorisé à voir cette demande');
    }

    return ResponseHandler.success(res, request);
  } catch (error) {
    console.error(' getRequestById:', error);
    return ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
  }
};

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!ValidationService.validateRequest(req, res)) return;

    if (!ValidationService.checkRole(req.user.role, ['BENEFICIARY'], res)) return;

    const request = await RequestModel.create({
      user_id: req.user.id,
      type: req.body.type.trim(),
      amount: parseFloat(req.body.amount),
      description: req.body.description?.trim() || '',
      status: 'DRAFT'
    });

    await logAction({
      user_id: req.user.id,
      action: 'CREATE_REQUEST',
      resource: 'request',
      resource_id: request.id,
      details: { type: request.type, amount: request.amount }
    });

    return ResponseHandler.success(res, request, 'Demande créée', 201);
  } catch (error) {
    console.error(' createRequest:', error);
    return ResponseHandler.error(res, 'Erreur de création', 'CREATE_ERROR', 500);
  }
};

export const updateRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!ValidationService.validateRequest(req, res)) return;

    const result = await ValidationService.validateRequestAccess(req, res, {
      checkOwner: true,
      checkStatus: 'DRAFT'
    });
    if (!result) return;

    const { id } = result;

    const updates: any = {};
    if (req.body.type) updates.type = req.body.type.trim();
    if (req.body.amount) updates.amount = parseFloat(req.body.amount);
    if (req.body.description !== undefined) updates.description = req.body.description?.trim();

    const updatedRequest = await RequestModel.update(id, updates);

    await logAction({ user_id: req.user.id, action: 'UPDATE_REQUEST', resource: 'request', resource_id: id });

    return ResponseHandler.success(res, updatedRequest, 'Demande modifiée');
  } catch (error) {
    console.error(' updateRequest:', error);
    return ResponseHandler.error(res, 'Erreur de modification', 'UPDATE_ERROR', 500);
  }
};

export const submitRequest = async (req: AuthRequest, res: Response) => {
  try {
    const result = await ValidationService.validateRequestAccess(req, res, {
      checkOwner: true,
      checkStatus: 'DRAFT'
    });
    if (!result) return;

    const { id } = result;

    const submittedRequest = await RequestModel.updateStatus(id, 'SUBMITTED', req.user.id);

    return ResponseHandler.success(res, submittedRequest, 'Demande soumise');
  } catch (error: any) {
    console.error(' submitRequest:', error);
    return ResponseHandler.error(res, error.message, 'SUBMIT_ERROR', 400);
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;

    console.log('Mise à jour demande:', { id, status, userRole });

    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT r.*, u.first_name as beneficiary_name, u.email as beneficiary_email 
       FROM requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Demande non trouvée'
      });
    }

    const request = requestResult.rows[0];
    console.log(' Demande trouvée:', request);

    if (status === 'APPROVED' && !['MANAGER', 'ADMIN'].includes(userRole)) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Seuls les managers et admins peuvent approuver'
      });
    }

    if (status === 'PAID' && userRole !== 'ADMIN') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Seuls les admins peuvent payer'
      });
    }

    const updateFields = ['status = $1'];
    const values = [status];
    let paramIndex = 2;

    if (status === 'APPROVED') {
      updateFields.push(`approved_by = $${paramIndex}, approved_at = CURRENT_TIMESTAMP`);
      values.push(req.user?.email);
      paramIndex++;
    }

    if (status === 'PAID') {
      updateFields.push(`paid_by = $${paramIndex}, paid_at = CURRENT_TIMESTAMP`);
      values.push(req.user?.email);
      paramIndex++;
    }

    values.push(id);

    const updatedRequest = await client.query(
      `UPDATE requests 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (status === 'PAID') {
      const year = new Date().getFullYear();

      const budgetResult = await client.query(
        'SELECT * FROM budgets WHERE year = $1',
        [year]
      );

      let budget = budgetResult.rows[0];

      if (!budget) {
        const newBudget = await client.query(
          `INSERT INTO budgets (year, total_amount, remaining_amount)
           VALUES ($1, $2, $2)
           RETURNING *`,
          [year, 50000]
        );
        budget = newBudget.rows[0];
      }
      if (budget.remaining_amount < request.amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Budget insuffisant pour ce paiement'
        });
      }

      await client.query(
        `UPDATE budgets 
         SET remaining_amount = remaining_amount - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE year = $2`,
        [request.amount, year]
      );

      const approvalInfo = await client.query(
        `SELECT approved_by, approved_at FROM requests WHERE id = $1`,
        [id]
      );

      const approvedBy = approvalInfo.rows[0]?.approved_by || req.user?.email || 'Unknown';
      const approvedAt = approvalInfo.rows[0]?.approved_at || new Date();

      await client.query(
        `INSERT INTO transactions (
          request_id, amount, type, beneficiary_name, 
          beneficiary_email, approved_by, paid_by, 
          approved_at, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          request.id,
          request.amount,
          request.type,
          request.beneficiary_name,
          request.beneficiary_email,
          approvedBy,
          req.user?.email || 'Unknown',
          approvedAt
        ]
      );
    }

    if (request.status === 'PAID' && status !== 'PAID') {
      const year = new Date(request.updated_at).getFullYear();
      
      await client.query(
        `UPDATE budgets 
         SET remaining_amount = remaining_amount + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE year = $2`,
        [request.amount, year]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updatedRequest.rows[0],
      message: `Statut mis à jour: ${status}`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(' Erreur updateRequestStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  } finally {
    client.release();
  }
};
export const deleteRequest = async (req: AuthRequest, res: Response) => {
  try {
    const result = await ValidationService.validateRequestAccess(req, res, {
      checkStatus: 'DRAFT'
    });
    if (!result) return;

    const { id, request } = result;
    if (request.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return ResponseHandler.forbidden(res);
    }

    const deleted = await RequestModel.delete(id);
    
    return deleted 
      ? ResponseHandler.success(res, null, 'Demande supprimée')
      : ResponseHandler.notFound(res, 'Demande');
  } catch (error) {
    console.error(' deleteRequest:', error);
    return ResponseHandler.error(res, 'Erreur de suppression', 'DELETE_ERROR', 500);
  }
};

export const getUserRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!ValidationService.checkRole(req.user.role, ['ADMIN', 'MANAGER'], res)) return;

    const userId = ValidationService.parseId(req.params.userId);
    if (!userId) {
      return ResponseHandler.error(res, 'ID utilisateur invalide', 'INVALID_ID', 400);
    }

    const requests = await RequestModel.findByUserId(userId);
    return ResponseHandler.success(res, requests);
  } catch (error) {
    console.error(' getUserRequests:', error);
    return ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
  }
};
