"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBudget = exports.initializeBudget = exports.getBudgetHistory = exports.updateBudget = exports.getBudgetByYear = exports.getCurrentBudget = void 0;
const Budget_1 = require("../models/Budget");
const getCurrentBudget = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        let budget = await Budget_1.BudgetModel.findByYear(currentYear);
        if (!budget) {
            budget = await Budget_1.BudgetModel.initializeYear(currentYear, 50000);
        }
        res.json({
            success: true,
            data: budget
        });
    }
    catch (error) {
        console.error('Erreur getCurrentBudget:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du budget'
        });
    }
};
exports.getCurrentBudget = getCurrentBudget;
const getBudgetByYear = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        if (isNaN(year)) {
            return res.status(400).json({
                success: false,
                error: 'Année invalide'
            });
        }
        const budget = await Budget_1.BudgetModel.findByYear(year);
        if (!budget) {
            return res.status(404).json({
                success: false,
                error: `Budget non trouvé pour l'année ${year}`
            });
        }
        res.json({
            success: true,
            data: budget
        });
    }
    catch (error) {
        console.error('Erreur getBudgetByYear:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du budget'
        });
    }
};
exports.getBudgetByYear = getBudgetByYear;
/**
Mettre à jour  budget (Admin seulement)
 */
const updateBudget = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const { total_amount, remaining_amount } = req.body;
        if (isNaN(year)) {
            return res.status(400).json({
                success: false,
                error: 'Année invalide'
            });
        }
        // Vérifier que le budget existe
        let budget = await Budget_1.BudgetModel.findByYear(year);
        if (!budget) {
            // Créer un nouveau budget
            budget = await Budget_1.BudgetModel.create({
                year,
                total_amount,
                remaining_amount: remaining_amount || total_amount
            });
        }
        else {
            // Mettre à jour le budget existant
            budget = await Budget_1.BudgetModel.update(year, {
                total_amount,
                remaining_amount: remaining_amount !== undefined ? remaining_amount : budget.remaining_amount
            });
        }
        res.json({
            success: true,
            data: budget,
            message: 'Budget mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Erreur updateBudget:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du budget'
        });
    }
};
exports.updateBudget = updateBudget;
/**
 Historique budgets (Admin seulement)
 */
const getBudgetHistory = async (req, res) => {
    try {
        const budgets = await Budget_1.BudgetModel.findAll();
        res.json({
            success: true,
            data: budgets
        });
    }
    catch (error) {
        console.error('Erreur getBudgetHistory:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de l\'historique'
        });
    }
};
exports.getBudgetHistory = getBudgetHistory;
/**
 * Initialiser budget pour une année
 */
const initializeBudget = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const { amount } = req.body;
        if (isNaN(year)) {
            return res.status(400).json({
                success: false,
                error: 'Année invalide'
            });
        }
        const defaultAmount = amount || 50000;
        const budget = await Budget_1.BudgetModel.initializeYear(year, defaultAmount);
        res.json({
            success: true,
            data: budget,
            message: `Budget initialisé pour ${year}`
        });
    }
    catch (error) {
        console.error('Erreur initializeBudget:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'initialisation du budget'
        });
    }
};
exports.initializeBudget = initializeBudget;
/**
 Vérifier si budget suffisant
 */
const checkBudget = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const amount = parseFloat(req.params.amount);
        if (isNaN(year) || isNaN(amount)) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres invalides'
            });
        }
        const hasEnough = await Budget_1.BudgetModel.hasEnoughBudget(year, amount);
        const budget = await Budget_1.BudgetModel.findByYear(year);
        res.json({
            success: true,
            data: {
                year,
                amount,
                hasEnough,
                remaining: budget?.remaining_amount || 0,
                needed: amount - (budget?.remaining_amount || 0)
            }
        });
    }
    catch (error) {
        console.error('Erreur checkBudget:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la vérification du budget'
        });
    }
};
exports.checkBudget = checkBudget;
