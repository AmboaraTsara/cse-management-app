import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  submitRequest,
  updateRequestStatus,
  deleteRequest,
  getUserRequests
} from '../controllers/RequestController';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllRequests);

router.get('/user/:userId', authorize('ADMIN', 'MANAGER'), getUserRequests);

router.get('/:id', getRequestById);
 
router.post('/',
  authorize('BENEFICIARY'),
  [
    body('type').notEmpty().withMessage('Le type est requis'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    body('description').optional().isString()
  ],
  createRequest
);

// Modifier  (DRAFT seulement)
router.put('/:id',
  authorize('BENEFICIARY'),
  updateRequest
);

// Soumettre 
router.put('/:id/submit',
  authorize('BENEFICIARY'),
  submitRequest
);

router.put('/:id/status',
  authorize('MANAGER', 'ADMIN'),
  updateRequestStatus
);

router.delete('/:id',
  authorize('BENEFICIARY', 'ADMIN'),
  deleteRequest
);

export default router;
