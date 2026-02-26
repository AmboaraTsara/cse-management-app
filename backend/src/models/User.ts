import pool from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'BENEFICIARY';
  first_name?: string;
  last_name?: string;
}

export class UserModel {
  static async create(user: Omit<User, 'id'>) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      [user.email, hashedPassword, user.role, user.first_name, user.last_name]
    );
    return result.rows[0];
  }
  static async findByUserId(id: number) {
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
  static async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }
}