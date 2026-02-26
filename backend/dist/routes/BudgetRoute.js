"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/budget.ts
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const BudgetControllers_1 = require("../controllers/BudgetControllers");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
/**
 * @route   GET /api/budget/current
 * @desc    Obtenir le budget de l'année en cours
 * @access  ADMIN, MANAGER
 */
router.get('/current', (0, auth_1.authorize)('ADMIN', 'MANAGER'), BudgetControllers_1.getCurrentBudget);
/**
 * @route   GET /api/budget/history
 * @desc    Historique complet des budgets
 * @access  ADMIN seulement
 */
router.get('/history', (0, auth_1.authorize)('ADMIN'), BudgetControllers_1.getBudgetHistory);
/**
 * @route   GET /api/budget/:year
 * @desc    Obtenir le budget d'une année spécifique
 * @access  ADMIN, MANAGER
 */
router.get('/:year', (0, auth_1.authorize)('ADMIN', 'MANAGER'), (0, express_validator_1.param)('year').isInt({ min: 2000, max: 2100 }), BudgetControllers_1.getBudgetByYear);
/**
 * @route   GET /api/budget/:year/check/:amount
 * @desc    Vérifier si le budget est suffisant
 * @access  ADMIN, MANAGER
 */
router.get('/:year/check/:amount', (0, auth_1.authorize)('ADMIN', 'MANAGER'), (0, express_validator_1.param)('year').isInt({ min: 2000, max: 2100 }), (0, express_validator_1.param)('amount').isFloat({ min: 0 }), BudgetControllers_1.checkBudget);
/**
 * @route   PUT /api/budget/:year
 * @desc    Mettre à jour le budget d'une année
 * @access  ADMIN seulement
 */
router.put('/:year', (0, auth_1.authorize)('ADMIN'), (0, express_validator_1.param)('year').isInt({ min: 2000, max: 2100 }), [
    (0, express_validator_1.body)('total_amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('remaining_amount').optional().isFloat({ min: 0 })
], BudgetControllers_1.updateBudget);
/**
 * @route   POST /api/budget/:year/initialize
 * @desc    Initialiser le budget pour une année
 * @access  ADMIN seulement
 */
router.post('/:year/initialize', (0, auth_1.authorize)('ADMIN'), (0, express_validator_1.param)('year').isInt({ min: 2000, max: 2100 }), (0, express_validator_1.body)('amount').optional().isFloat({ min: 0 }), BudgetControllers_1.initializeBudget);
exports.default = router;
