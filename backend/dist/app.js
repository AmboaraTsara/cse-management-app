"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const requests_1 = __importDefault(require("./routes/requests"));
const BudgetRoute_1 = __importDefault(require("./routes/BudgetRoute"));
const transactions_1 = __importDefault(require("./routes/transactions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/requests', requests_1.default);
app.use('/api/budget', BudgetRoute_1.default);
app.use('/api/transactions', transactions_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Serveur backend fonctionne!',
        endpoints: {
            auth: '/api/auth/login, /api/auth/register',
            health: '/api/health'
        }
    });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Auth: http://localhost:${PORT}/api/auth/login`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});
exports.default = app;
