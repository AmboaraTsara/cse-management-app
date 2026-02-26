"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email });
        // 1. Vérifier la connexion DB
        const dbTest = await database_1.default.query('SELECT NOW()');
        console.log('DB connected:', dbTest.rows[0]);
        // 2. Chercher l'utilisateur
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
        const user = result.rows[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });
        // 3. Vérifier le mot de passe
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        console.log('Password valid:', validPassword);
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
        // 4. Créer le token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret_dev', { expiresIn: '7d' });
        // 5. Réponse
        const { password: _, ...userData } = user;
        res.json({
            success: true,
            token,
            user: userData
        });
    }
    catch (error) {
        console.error('ERROR DETAIL:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
};
exports.login = login;
