// backend/src/routes/transactions.ts
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTransactions, getTransactionById } from '../controllers/TransactionController';

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/transactions
 * @desc    Récupérer toutes les transactions
 * @access  ADMIN seulement
 */
router.get('/',
  authorize('ADMIN'),
  getTransactions
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Récupérer une transaction spécifique
 * @access  ADMIN seulement
 */
router.get('/:id',
  authorize('ADMIN'),
  getTransactionById
);

export default router;