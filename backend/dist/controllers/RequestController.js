"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRequests = exports.deleteRequest = exports.updateRequestStatus = exports.submitRequest = exports.updateRequest = exports.createRequest = exports.getRequestById = exports.getAllRequests = void 0;
const Request_1 = require("../models/Request");
const ValidationService_1 = require("../services/ValidationService");
const responseHandler_1 = require("../utils/responseHandler");
const auditService_1 = require("../services/auditService");
const database_1 = __importDefault(require("../config/database"));
const getAllRequests = async (req, res) => {
    try {
        const requests = req.user.role === 'ADMIN' || req.user.role === 'MANAGER'
            ? await Request_1.RequestModel.findAll()
            : await Request_1.RequestModel.findByUserId(req.user.id);
        return responseHandler_1.ResponseHandler.success(res, requests);
    }
    catch (error) {
        console.error(' getAllRequests:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
    }
};
exports.getAllRequests = getAllRequests;
const getRequestById = async (req, res) => {
    try {
        // Validation centralisée
        const result = await ValidationService_1.ValidationService.validateRequestAccess(req, res);
        if (!result)
            return;
        const { id, request } = result;
        // Vérification RBAC
        if (!['ADMIN', 'MANAGER'].includes(req.user.role) && request.user_id !== req.user.id) {
            await (0, auditService_1.logAction)({ user_id: req.user.id, action: 'UNAUTHORIZED_ACCESS', resource: 'request', resource_id: id });
            return responseHandler_1.ResponseHandler.forbidden(res, 'Non autorisé à voir cette demande');
        }
        return responseHandler_1.ResponseHandler.success(res, request);
    }
    catch (error) {
        console.error(' getRequestById:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
    }
};
exports.getRequestById = getRequestById;
const createRequest = async (req, res) => {
    try {
        // Validation des inputs
        if (!ValidationService_1.ValidationService.validateRequest(req, res))
            return;
        // Vérification du rôle
        if (!ValidationService_1.ValidationService.checkRole(req.user.role, ['BENEFICIARY'], res))
            return;
        // Création
        const request = await Request_1.RequestModel.create({
            user_id: req.user.id,
            type: req.body.type.trim(),
            amount: parseFloat(req.body.amount),
            description: req.body.description?.trim() || '',
            status: 'DRAFT'
        });
        // Audit
        await (0, auditService_1.logAction)({
            user_id: req.user.id,
            action: 'CREATE_REQUEST',
            resource: 'request',
            resource_id: request.id,
            details: { type: request.type, amount: request.amount }
        });
        return responseHandler_1.ResponseHandler.success(res, request, 'Demande créée', 201);
    }
    catch (error) {
        console.error(' createRequest:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de création', 'CREATE_ERROR', 500);
    }
};
exports.createRequest = createRequest;
const updateRequest = async (req, res) => {
    try {
        // Validation des inputs
        if (!ValidationService_1.ValidationService.validateRequest(req, res))
            return;
        // Validation complète
        const result = await ValidationService_1.ValidationService.validateRequestAccess(req, res, {
            checkOwner: true,
            checkStatus: 'DRAFT'
        });
        if (!result)
            return;
        const { id } = result;
        // Mise à jour
        const updates = {};
        if (req.body.type)
            updates.type = req.body.type.trim();
        if (req.body.amount)
            updates.amount = parseFloat(req.body.amount);
        if (req.body.description !== undefined)
            updates.description = req.body.description?.trim();
        const updatedRequest = await Request_1.RequestModel.update(id, updates);
        await (0, auditService_1.logAction)({ user_id: req.user.id, action: 'UPDATE_REQUEST', resource: 'request', resource_id: id });
        return responseHandler_1.ResponseHandler.success(res, updatedRequest, 'Demande modifiée');
    }
    catch (error) {
        console.error(' updateRequest:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de modification', 'UPDATE_ERROR', 500);
    }
};
exports.updateRequest = updateRequest;
const submitRequest = async (req, res) => {
    try {
        const result = await ValidationService_1.ValidationService.validateRequestAccess(req, res, {
            checkOwner: true,
            checkStatus: 'DRAFT'
        });
        if (!result)
            return;
        const { id } = result;
        const submittedRequest = await Request_1.RequestModel.updateStatus(id, 'SUBMITTED', req.user.id);
        return responseHandler_1.ResponseHandler.success(res, submittedRequest, 'Demande soumise');
    }
    catch (error) {
        console.error(' submitRequest:', error);
        return responseHandler_1.ResponseHandler.error(res, error.message, 'SUBMIT_ERROR', 400);
    }
};
exports.submitRequest = submitRequest;
const updateRequestStatus = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userRole = req.user?.role;
        console.log('Mise à jour demande:', { id, status, userRole });
        await client.query('BEGIN');
        // Vérifier que la demande existe
        const requestResult = await client.query(`SELECT r.*, u.first_name as beneficiary_name, u.email as beneficiary_email 
       FROM requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`, [id]);
        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Demande non trouvée'
            });
        }
        const request = requestResult.rows[0];
        console.log(' Demande trouvée:', request);
        // Vérifier les permissions selon le statut
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
        // Mettre à jour le statut de la demande d'abord
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
        const updatedRequest = await client.query(`UPDATE requests 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`, values);
        // Si le nouveau statut est PAYÉ, mettre à jour le budget
        if (status === 'PAID') {
            const year = new Date().getFullYear();
            // Vérifier le budget disponible
            const budgetResult = await client.query('SELECT * FROM budgets WHERE year = $1', [year]);
            let budget = budgetResult.rows[0];
            if (!budget) {
                // Créer un budget par défaut si inexistant
                const newBudget = await client.query(`INSERT INTO budgets (year, total_amount, remaining_amount)
           VALUES ($1, $2, $2)
           RETURNING *`, [year, 50000]);
                budget = newBudget.rows[0];
            }
            // Vérifier si le budget est suffisant
            if (budget.remaining_amount < request.amount) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Budget insuffisant pour ce paiement'
                });
            }
            // Mettre à jour le budget (diminuer le montant restant)
            await client.query(`UPDATE budgets 
         SET remaining_amount = remaining_amount - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE year = $2`, [request.amount, year]);
            // Récupérer les infos d'approbation (qui peuvent être NULL si approuvé juste avant)
            const approvalInfo = await client.query(`SELECT approved_by, approved_at FROM requests WHERE id = $1`, [id]);
            const approvedBy = approvalInfo.rows[0]?.approved_by || req.user?.email || 'Unknown';
            const approvedAt = approvalInfo.rows[0]?.approved_at || new Date();
            // Enregistrer la transaction
            await client.query(`INSERT INTO transactions (
          request_id, amount, type, beneficiary_name, 
          beneficiary_email, approved_by, paid_by, 
          approved_at, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`, [
                request.id,
                request.amount,
                request.type,
                request.beneficiary_name,
                request.beneficiary_email,
                approvedBy,
                req.user?.email || 'Unknown',
                approvedAt
            ]);
        }
        // Si le statut passe de PAYÉ à autre chose (cas de remboursement ou annulation)
        if (request.status === 'PAID' && status !== 'PAID') {
            const year = new Date(request.updated_at).getFullYear();
            // Remettre l'argent dans le budget
            await client.query(`UPDATE budgets 
         SET remaining_amount = remaining_amount + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE year = $2`, [request.amount, year]);
        }
        await client.query('COMMIT');
        res.json({
            success: true,
            data: updatedRequest.rows[0],
            message: `Statut mis à jour: ${status}`
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(' Erreur updateRequestStatus:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du statut'
        });
    }
    finally {
        client.release();
    }
};
exports.updateRequestStatus = updateRequestStatus;
const deleteRequest = async (req, res) => {
    try {
        const result = await ValidationService_1.ValidationService.validateRequestAccess(req, res, {
            checkStatus: 'DRAFT'
        });
        if (!result)
            return;
        const { id, request } = result;
        // Vérification supplémentaire (propriétaire OU admin)
        if (request.user_id !== req.user.id && req.user.role !== 'ADMIN') {
            return responseHandler_1.ResponseHandler.forbidden(res);
        }
        const deleted = await Request_1.RequestModel.delete(id);
        return deleted
            ? responseHandler_1.ResponseHandler.success(res, null, 'Demande supprimée')
            : responseHandler_1.ResponseHandler.notFound(res, 'Demande');
    }
    catch (error) {
        console.error(' deleteRequest:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de suppression', 'DELETE_ERROR', 500);
    }
};
exports.deleteRequest = deleteRequest;
const getUserRequests = async (req, res) => {
    try {
        // Validation du rôle
        if (!ValidationService_1.ValidationService.checkRole(req.user.role, ['ADMIN', 'MANAGER'], res))
            return;
        // Validation de l'ID
        const userId = ValidationService_1.ValidationService.parseId(req.params.userId);
        if (!userId) {
            return responseHandler_1.ResponseHandler.error(res, 'ID utilisateur invalide', 'INVALID_ID', 400);
        }
        const requests = await Request_1.RequestModel.findByUserId(userId);
        return responseHandler_1.ResponseHandler.success(res, requests);
    }
    catch (error) {
        console.error(' getUserRequests:', error);
        return responseHandler_1.ResponseHandler.error(res, 'Erreur de récupération', 'FETCH_ERROR', 500);
    }
};
exports.getUserRequests = getUserRequests;
