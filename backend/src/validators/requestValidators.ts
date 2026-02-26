
import { body, param } from 'express-validator';

export const validateCreateRequest = [
  body('type')
    .notEmpty().withMessage('Type requis')
    .isString().trim()
    .isLength({ min: 2, max: 100 }),
  
  body('amount')
    .notEmpty().withMessage('Montant requis')
    .isFloat({ min: 0.01, max: 100000 }),
  
  body('description')
    .optional()
    .isString().trim()
    .isLength({ max: 1000 })
];

export const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .isIn(['APPROVED', 'REJECTED', 'PAID'])
];

export const validateIdParam = [
  param('id').isInt({ min: 1 })
];