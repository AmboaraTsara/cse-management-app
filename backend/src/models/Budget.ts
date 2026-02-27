import pool from '../config/database';

export interface Budget {
  id: number;
  year: number;
  total_amount: number;
  remaining_amount: number;
  created_at: Date;
  updated_at: Date;
}

export class BudgetModel {
  
  static async findByYear(year: number): Promise<Budget | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM budgets WHERE year = $1',
        [year]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur Budget.findByYear:', error);
      throw error;
    }
  }

  static async findCurrent(): Promise<Budget | null> {
    try {
      const currentYear = new Date().getFullYear();
      const result = await pool.query(
        'SELECT * FROM budgets WHERE year = $1',
        [currentYear]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur Budget.findCurrent:', error);
      throw error;
    }
  }

  static async create(data: { year: number; total_amount: number; remaining_amount?: number }): Promise<Budget> {
    try {
      const remaining = data.remaining_amount !== undefined ? data.remaining_amount : data.total_amount;
      
      const result = await pool.query(
        `INSERT INTO budgets (year, total_amount, remaining_amount) 
         VALUES ($1, $2, $3) RETURNING *`,
        [data.year, data.total_amount, remaining]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur Budget.create:', error);
      throw error;
    }
  }

  static async update(year: number, data: Partial<Budget>): Promise<Budget | null> {
    try {
      const fields = [];
      const values = [];
      let paramCounter = 1;

      if (data.total_amount !== undefined) {
        fields.push(`total_amount = $${paramCounter}`);
        values.push(data.total_amount);
        paramCounter++;
      }
      if (data.remaining_amount !== undefined) {
        fields.push(`remaining_amount = $${paramCounter}`);
        values.push(data.remaining_amount);
        paramCounter++;
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(year);

      const query = `UPDATE budgets SET ${fields.join(', ')} WHERE year = $${paramCounter} RETURNING *`;
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur Budget.update:', error);
      throw error;
    }
  }


  static async hasEnoughBudget(year: number, amount: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT remaining_amount FROM budgets WHERE year = $1',
        [year]
      );
      
      if (result.rows.length === 0) return false;
      return result.rows[0].remaining_amount >= amount;
    } catch (error) {
      console.error('Erreur Budget.hasEnoughBudget:', error);
      throw error;
    }
  }

  
  static async deductAmount(year: number, amount: number): Promise<Budget | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const checkResult = await client.query(
        'SELECT remaining_amount FROM budgets WHERE year = $1 FOR UPDATE',
        [year]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Budget non trouvé');
      }
      
      const remaining = checkResult.rows[0].remaining_amount;
      if (remaining < amount) {
        throw new Error('Budget insuffisant');
      }
      
      const result = await client.query(
        `UPDATE budgets 
         SET remaining_amount = remaining_amount - $1, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE year = $2 
         RETURNING *`,
        [amount, year]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur Budget.deductAmount:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll(): Promise<Budget[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM budgets ORDER BY year DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erreur Budget.findAll:', error);
      throw error;
    }
  }

  static async initializeYear(year: number, defaultAmount: number = 50000): Promise<Budget> {
    try {
      const existing = await this.findByYear(year);
      if (existing) return existing;
      
      return await this.create({
        year,
        total_amount: defaultAmount,
        remaining_amount: defaultAmount
      });
    } catch (error) {
      console.error('Erreur Budget.initializeYear:', error);
      throw error;
    }
  }
}
