// backend/src/routes/budget.ts
import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCurrentBudget,
  getBudgetByYear,
  updateBudget,
  getBudgetHistory,
  initializeBudget,
  checkBudget
} from '../controllers/BudgetControllers';

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/budget/current
 * @desc    Obtenir le budget de l'année en cours
 * @access  ADMIN, MANAGER
 */
router.get('/current',
  authorize('ADMIN', 'MANAGER'),
  getCurrentBudget
);

/**
 * @route   GET /api/budget/history
 * @desc    Historique complet des budgets
 * @access  ADMIN seulement
 */
router.get('/history',
  authorize('ADMIN'),
  getBudgetHistory
);

/**
 * @route   GET /api/budget/:year
 * @desc    Obtenir le budget d'une année spécifique
 * @access  ADMIN, MANAGER
 */
router.get('/:year',
  authorize('ADMIN', 'MANAGER'),
  param('year').isInt({ min: 2000, max: 2100 }),
  getBudgetByYear
);

/**
 * @route   GET /api/budget/:year/check/:amount
 * @desc    Vérifier si le budget est suffisant
 * @access  ADMIN, MANAGER
 */
router.get('/:year/check/:amount',
  authorize('ADMIN', 'MANAGER'),
  param('year').isInt({ min: 2000, max: 2100 }),
  param('amount').isFloat({ min: 0 }),
  checkBudget
);

/**
 * @route   PUT /api/budget/:year
 * @desc    Mettre à jour le budget d'une année
 * @access  ADMIN seulement
 */
router.put('/:year',
  authorize('ADMIN'),
  param('year').isInt({ min: 2000, max: 2100 }),
  [
    body('total_amount').optional().isFloat({ min: 0 }),
    body('remaining_amount').optional().isFloat({ min: 0 })
  ],
  updateBudget
);

/**
 * @route   POST /api/budget/:year/initialize
 * @desc    Initialiser le budget pour une année
 * @access  ADMIN seulement
 */
router.post('/:year/initialize',
  authorize('ADMIN'),
  param('year').isInt({ min: 2000, max: 2100 }),
  body('amount').optional().isFloat({ min: 0 }),
  initializeBudget
);

export default router;