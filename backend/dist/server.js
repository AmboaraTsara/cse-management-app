"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const dbUtils_1 = require("./utils/dbUtils");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Tester la connexion à la DB avant de démarrer
(0, dbUtils_1.testDatabaseConnection)().then((connected) => {
    if (connected) {
        app_1.default.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
            console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'MANQUANT'}`);
        });
    }
    else {
        console.error('Impossible de démarrer le serveur: erreur DB');
        process.exit(1);
    }
});
