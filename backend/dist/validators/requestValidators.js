"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = exports.validateStatusUpdate = exports.validateCreateRequest = void 0;
const express_validator_1 = require("express-validator");
exports.validateCreateRequest = [
    (0, express_validator_1.body)('type')
        .notEmpty().withMessage('Type requis')
        .isString().trim()
        .isLength({ min: 2, max: 100 }),
    (0, express_validator_1.body)('amount')
        .notEmpty().withMessage('Montant requis')
        .isFloat({ min: 0.01, max: 100000 }),
    (0, express_validator_1.body)('description')
        .optional()
        .isString().trim()
        .isLength({ max: 1000 })
];
exports.validateStatusUpdate = [
    (0, express_validator_1.body)('status')
        .notEmpty()
        .isIn(['APPROVED', 'REJECTED', 'PAID'])
];
exports.validateIdParam = [
    (0, express_validator_1.param)('id').isInt({ min: 1 })
];
