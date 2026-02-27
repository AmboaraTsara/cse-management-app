import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTransactions, getTransactionById } from '../controllers/TransactionController';

const router = express.Router();

router.use(authenticate);

router.get('/',
  authorize('ADMIN'),
  getTransactions
);

router.get('/:id',
  authorize('ADMIN'),
  getTransactionById
);

export default router;
