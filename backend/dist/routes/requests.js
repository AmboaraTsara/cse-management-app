"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const RequestController_1 = require("../controllers/RequestController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/', RequestController_1.getAllRequests);
// Demandes utilisateur spécifique
router.get('/user/:userId', (0, auth_1.authorize)('ADMIN', 'MANAGER'), RequestController_1.getUserRequests);
// Détail 
router.get('/:id', RequestController_1.getRequestById);
// Créer 
router.post('/', (0, auth_1.authorize)('BENEFICIARY'), [
    (0, express_validator_1.body)('type').notEmpty().withMessage('Le type est requis'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    (0, express_validator_1.body)('description').optional().isString()
], RequestController_1.createRequest);
// Modifier  (DRAFT seulement)
router.put('/:id', (0, auth_1.authorize)('BENEFICIARY'), RequestController_1.updateRequest);
// Soumettre 
router.put('/:id/submit', (0, auth_1.authorize)('BENEFICIARY'), RequestController_1.submitRequest);
// Changer le statut (Manager seulement)
router.put('/:id/status', (0, auth_1.authorize)('MANAGER', 'ADMIN'), RequestController_1.updateRequestStatus);
// Supprimer  (DRAFT seulement)
router.delete('/:id', (0, auth_1.authorize)('BENEFICIARY', 'ADMIN'), RequestController_1.deleteRequest);
exports.default = router;
