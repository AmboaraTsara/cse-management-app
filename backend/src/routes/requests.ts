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

// Demandes utilisateur spécifique
router.get('/user/:userId', authorize('ADMIN', 'MANAGER'), getUserRequests);

// Détail 
router.get('/:id', getRequestById);

// Créer 
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

// Changer le statut (Manager seulement)
router.put('/:id/status',
  authorize('MANAGER', 'ADMIN'),
  updateRequestStatus
);

// Supprimer  (DRAFT seulement)
router.delete('/:id',
  authorize('BENEFICIARY', 'ADMIN'),
  deleteRequest
);

export default router;