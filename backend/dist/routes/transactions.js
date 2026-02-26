"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/transactions.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const TransactionController_1 = require("../controllers/TransactionController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
/**
 * @route   GET /api/transactions
 * @desc    Récupérer toutes les transactions
 * @access  ADMIN seulement
 */
router.get('/', (0, auth_1.authorize)('ADMIN'), TransactionController_1.getTransactions);
/**
 * @route   GET /api/transactions/:id
 * @desc    Récupérer une transaction spécifique
 * @access  ADMIN seulement
 */
router.get('/:id', (0, auth_1.authorize)('ADMIN'), TransactionController_1.getTransactionById);
exports.default = router;
