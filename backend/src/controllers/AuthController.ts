import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });

    // 1. Vérifier connexion DB
    const dbTest = await pool.query('SELECT NOW()');
    console.log('DB connected:', dbTest.rows[0]);

    // 2. Chercher utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // 3. Vérifier mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }

    // 4. Créer token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_dev',
      { expiresIn: '7d' }
    );

    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('ERROR DETAIL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
};
