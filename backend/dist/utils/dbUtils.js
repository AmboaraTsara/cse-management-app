"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = exports.closeDatabaseConnection = exports.testDatabaseConnection = void 0;
const database_1 = __importDefault(require("../config/database"));
const testDatabaseConnection = async () => {
    try {
        const client = await database_1.default.connect();
        console.log('Connexion à la base de données réussie');
        const result = await client.query('SELECT NOW()');
        console.log(' Heure serveur:', result.rows[0].now);
        client.release();
        return true;
    }
    catch (error) {
        console.error(' Erreur de connexion à la base de données:', error);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
const closeDatabaseConnection = async () => {
    try {
        await database_1.default.end();
        console.log('🔌 Connexion à la base de données fermée');
    }
    catch (error) {
        console.error('Erreur lors de la fermeture de la connexion:', error);
    }
};
exports.closeDatabaseConnection = closeDatabaseConnection;
// Pour les transactions
const withTransaction = async (callback) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.withTransaction = withTransaction;
