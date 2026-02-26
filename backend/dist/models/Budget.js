"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetModel = void 0;
// backend/src/models/Budget.ts
const database_1 = __importDefault(require("../config/database"));
class BudgetModel {
    /**
     * Trouver le budget d'une année spécifique
     */
    static async findByYear(year) {
        try {
            const result = await database_1.default.query('SELECT * FROM budgets WHERE year = $1', [year]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Erreur Budget.findByYear:', error);
            throw error;
        }
    }
    /**
     * Trouver le budget de l'année en cours
     */
    static async findCurrent() {
        try {
            const currentYear = new Date().getFullYear();
            const result = await database_1.default.query('SELECT * FROM budgets WHERE year = $1', [currentYear]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Erreur Budget.findCurrent:', error);
            throw error;
        }
    }
    /**
     * Créer un nouveau budget
     */
    static async create(data) {
        try {
            const remaining = data.remaining_amount !== undefined ? data.remaining_amount : data.total_amount;
            const result = await database_1.default.query(`INSERT INTO budgets (year, total_amount, remaining_amount) 
         VALUES ($1, $2, $3) RETURNING *`, [data.year, data.total_amount, remaining]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Erreur Budget.create:', error);
            throw error;
        }
    }
    /**
     * Mettre à jour un budget
     */
    static async update(year, data) {
        try {
            const fields = [];
            const values = [];
            let paramCounter = 1;
            if (data.total_amount !== undefined) {
                fields.push(`total_amount = $${paramCounter}`);
                values.push(data.total_amount);
                paramCounter++;
            }
            if (data.remaining_amount !== undefined) {
                fields.push(`remaining_amount = $${paramCounter}`);
                values.push(data.remaining_amount);
                paramCounter++;
            }
            if (fields.length === 0)
                return null;
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(year);
            const query = `UPDATE budgets SET ${fields.join(', ')} WHERE year = $${paramCounter} RETURNING *`;
            const result = await database_1.default.query(query, values);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Erreur Budget.update:', error);
            throw error;
        }
    }
    /**
     * Vérifier si le budget est suffisant pour un montant
     */
    static async hasEnoughBudget(year, amount) {
        try {
            const result = await database_1.default.query('SELECT remaining_amount FROM budgets WHERE year = $1', [year]);
            if (result.rows.length === 0)
                return false;
            return result.rows[0].remaining_amount >= amount;
        }
        catch (error) {
            console.error('Erreur Budget.hasEnoughBudget:', error);
            throw error;
        }
    }
    /**
     * Décrémenter le budget (quand une demande est payée)
     */
    static async deductAmount(year, amount) {
        const client = await database_1.default.connect();
        try {
            await client.query('BEGIN');
            // Vérifier le budget
            const checkResult = await client.query('SELECT remaining_amount FROM budgets WHERE year = $1 FOR UPDATE', [year]);
            if (checkResult.rows.length === 0) {
                throw new Error('Budget non trouvé');
            }
            const remaining = checkResult.rows[0].remaining_amount;
            if (remaining < amount) {
                throw new Error('Budget insuffisant');
            }
            // Décrémenter
            const result = await client.query(`UPDATE budgets 
         SET remaining_amount = remaining_amount - $1, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE year = $2 
         RETURNING *`, [amount, year]);
            await client.query('COMMIT');
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Erreur Budget.deductAmount:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Obtenir tous les budgets (historique)
     */
    static async findAll() {
        try {
            const result = await database_1.default.query('SELECT * FROM budgets ORDER BY year DESC');
            return result.rows;
        }
        catch (error) {
            console.error('Erreur Budget.findAll:', error);
            throw error;
        }
    }
    /**
     * Initialiser le budget pour une année si inexistant
     */
    static async initializeYear(year, defaultAmount = 50000) {
        try {
            const existing = await this.findByYear(year);
            if (existing)
                return existing;
            return await this.create({
                year,
                total_amount: defaultAmount,
                remaining_amount: defaultAmount
            });
        }
        catch (error) {
            console.error('Erreur Budget.initializeYear:', error);
            throw error;
        }
    }
}
exports.BudgetModel = BudgetModel;
