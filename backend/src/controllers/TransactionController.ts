import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;
    
    let query = `
      SELECT t.*, 
             u.first_name as beneficiary_name,
             u.email as beneficiary_email
      FROM transactions t
      JOIN users u ON t.beneficiary_email = u.email
    `;
    
    const params: any[] = [];
    
    if (year) {
      query += ` WHERE EXTRACT(YEAR FROM t.paid_at) = $1`;
      params.push(year);
    }
    
    query += ` ORDER BY t.paid_at DESC`;
    
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Erreur getTransactions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des transactions'
    });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, 
              u.first_name as beneficiary_name,
              u.email as beneficiary_email
       FROM transactions t
       JOIN users u ON t.beneficiary_email = u.email
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction non trouvée'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur getTransactionById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la transaction'
    });
  }
};
