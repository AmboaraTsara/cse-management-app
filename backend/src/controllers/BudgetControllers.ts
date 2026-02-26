// backend/src/controllers/budgetController.ts
import { Request, Response } from 'express';
import { BudgetModel } from '../models/Budget';
import { AuthRequest } from '../middleware/auth';

export const getCurrentBudget = async (req: AuthRequest, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    
    let budget = await BudgetModel.findByYear(currentYear);
    
    if (!budget) {
      budget = await BudgetModel.initializeYear(currentYear, 50000);
    }

    res.json({
      success: true,
      data: budget
    });

  } catch (error) {
    console.error('Erreur getCurrentBudget:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du budget'
    });
  }
};

export const getBudgetByYear = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        error: 'Année invalide'
      });
    }

    const budget = await BudgetModel.findByYear(year);

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

  } catch (error) {
    console.error('Erreur getBudgetByYear:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du budget'
    });
  }
};

/**
Mettre à jour  budget (Admin seulement)
 */
export const updateBudget = async (req: AuthRequest, res: Response) => {
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
    let budget = await BudgetModel.findByYear(year);

    if (!budget) {
      // Créer un nouveau budget
      budget = await BudgetModel.create({
        year,
        total_amount,
        remaining_amount: remaining_amount || total_amount
      });
    } else {
      // Mettre à jour le budget existant
      budget = await BudgetModel.update(year, {
        total_amount,
        remaining_amount: remaining_amount !== undefined ? remaining_amount : budget.remaining_amount
      });
    }

    res.json({
      success: true,
      data: budget,
      message: 'Budget mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur updateBudget:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du budget'
    });
  }
};

/**
 Historique budgets (Admin seulement)
 */
export const getBudgetHistory = async (req: AuthRequest, res: Response) => {
  try {
    const budgets = await BudgetModel.findAll();

    res.json({
      success: true,
      data: budgets
    });

  } catch (error) {
    console.error('Erreur getBudgetHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

/**
 * Initialiser budget pour une année 
 */
export const initializeBudget = async (req: AuthRequest, res: Response) => {
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
    const budget = await BudgetModel.initializeYear(year, defaultAmount);

    res.json({
      success: true,
      data: budget,
      message: `Budget initialisé pour ${year}`
    });

  } catch (error) {
    console.error('Erreur initializeBudget:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation du budget'
    });
  }
};

/**
 Vérifier si budget suffisant
 */
export const checkBudget = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const amount = parseFloat(req.params.amount);

    if (isNaN(year) || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides'
      });
    }

    const hasEnough = await BudgetModel.hasEnoughBudget(year, amount);
    const budget = await BudgetModel.findByYear(year);

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

  } catch (error) {
    console.error('Erreur checkBudget:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du budget'
    });
  }
};