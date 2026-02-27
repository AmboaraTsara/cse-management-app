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

router.get('/current',
  authorize('ADMIN', 'MANAGER'),
  getCurrentBudget
);

router.get('/history',
  authorize('ADMIN'),
  getBudgetHistory
);


router.get('/:year',
  authorize('ADMIN', 'MANAGER'),
  param('year').isInt({ min: 2000, max: 2100 }),
  getBudgetByYear
);

router.get('/:year/check/:amount',
  authorize('ADMIN', 'MANAGER'),
  param('year').isInt({ min: 2000, max: 2100 }),
  param('amount').isFloat({ min: 0 }),
  checkBudget
);

router.put('/:year',
  authorize('ADMIN'),
  param('year').isInt({ min: 2000, max: 2100 }),
  [
    body('total_amount').optional().isFloat({ min: 0 }),
    body('remaining_amount').optional().isFloat({ min: 0 })
  ],
  updateBudget
);

router.post('/:year/initialize',
  authorize('ADMIN'),
  param('year').isInt({ min: 2000, max: 2100 }),
  body('amount').optional().isFloat({ min: 0 }),
  initializeBudget
);

export default router;
