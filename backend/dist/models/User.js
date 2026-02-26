"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    static async create(user) {
        const hashedPassword = await bcrypt_1.default.hash(user.password, 10);
        const result = await database_1.default.query('INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role', [user.email, hashedPassword, user.role, user.first_name, user.last_name]);
        return result.rows[0];
    }
    static async findByUserId(id) {
        const result = await database_1.default.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }
    static async findByEmail(email) {
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }
}
exports.UserModel = UserModel;
