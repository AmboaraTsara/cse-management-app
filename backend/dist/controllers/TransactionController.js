"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionById = exports.getTransactions = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * GET /api/transactions
 * Récupérer toutes les transactions (Admin seulement)
 */
const getTransactions = async (req, res) => {
    try {
        const { year } = req.query;
        let query = `
      SELECT t.*, 
             u.first_name as beneficiary_name,
             u.email as beneficiary_email
      FROM transactions t
      JOIN users u ON t.beneficiary_email = u.email
    `;
        const params = [];
        if (year) {
            query += ` WHERE EXTRACT(YEAR FROM t.paid_at) = $1`;
            params.push(year);
        }
        query += ` ORDER BY t.paid_at DESC`;
        const result = await database_1.default.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    }
    catch (error) {
        console.error('Erreur getTransactions:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des transactions'
        });
    }
};
exports.getTransactions = getTransactions;
/**
 * GET /api/transactions/:id
 * Récupérer une transaction spécifique
 */
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query(`SELECT t.*, 
              u.first_name as beneficiary_name,
              u.email as beneficiary_email
       FROM transactions t
       JOIN users u ON t.beneficiary_email = u.email
       WHERE t.id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Transaction non trouvée'
            });
        }
        res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Erreur getTransactionById:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la transaction'
        });
    }
};
exports.getTransactionById = getTransactionById;
