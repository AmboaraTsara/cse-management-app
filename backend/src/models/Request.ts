// backend/src/models/Request.ts
import pool from '../config/database';

export interface Request {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  created_at: Date;
  updated_at: Date;
}

export class RequestModel {
  
  static async findByUserId(userId: number): Promise<Request[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM requests WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Erreur findByUserId:', error);
      throw new Error('Erreur lors de la récupération des demandes');
    }
  }

  static async findAll(): Promise<Request[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM requests ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erreur findAll:', error);
      throw new Error('Erreur lors de la récupération des demandes');
    }
  }

  static async findById(id: number): Promise<Request | null> {
    try {
      const result = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur findById:', error);
      throw new Error('Erreur lors de la récupération de la demande');
    }
  }

  static async create(request: Omit<Request, 'id' | 'created_at' | 'updated_at'>): Promise<Request> {
    try {
      const result = await pool.query(
        `INSERT INTO requests (user_id, type, amount, description, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [request.user_id, request.type, request.amount, request.description, request.status]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur create:', error);
      throw new Error('Erreur lors de la création de la demande');
    }
  }

  static async update(id: number, data: Partial<Request>): Promise<Request | null> {
    try {
      const fields = [];
      const values = [];
      let paramCounter = 1;

      if (data.type !== undefined) {
        fields.push(`type = $${paramCounter}`);
        values.push(data.type);
        paramCounter++;
      }
      if (data.amount !== undefined) {
        fields.push(`amount = $${paramCounter}`);
        values.push(data.amount);
        paramCounter++;
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCounter}`);
        values.push(data.description);
        paramCounter++;
      }
      if (data.status !== undefined) {
        fields.push(`status = $${paramCounter}`);
        values.push(data.status);
        paramCounter++;
      }

      if (fields.length === 0) return null;

      values.push(id);
      const query = `UPDATE requests SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCounter} RETURNING *`;
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur update:', error);
      throw new Error('Erreur lors de la mise à jour');
    }
  }

  static async updateStatus(id: number, status: string, userId: number): Promise<Request> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const requestResult = await client.query('SELECT * FROM requests WHERE id = $1', [id]);
      const currentRequest = requestResult.rows[0];
      
      if (!currentRequest) {
        throw new Error('Demande non trouvée');
      }

      if (!this.isValidTransition(currentRequest.status, status)) {
        throw new Error(`Transition de ${currentRequest.status} à ${status} non autorisée`);
      }
      
      if (status === 'PAID') {
        await this.checkAndDeductBudget(currentRequest.amount, client);
      }
      
      const result = await client.query(
        'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
      

      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, details) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'UPDATE_STATUS', 'request', id, { old_status: currentRequest.status, new_status: status }]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM requests WHERE id = $1 RETURNING id', [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Erreur delete:', error);
      throw new Error('Erreur lors de la suppression');
    }
  }

  private static isValidTransition(current: string, next: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'DRAFT': ['SUBMITTED'],
      'SUBMITTED': ['APPROVED', 'REJECTED'],
      'APPROVED': ['PAID'],
      'REJECTED': [],
      'PAID': []
    };
    return validTransitions[current]?.includes(next) || false;
  }

  private static async checkAndDeductBudget(amount: number, client: any): Promise<void> {
    const currentYear = new Date().getFullYear();
    

    const budgetResult = await client.query(
      'SELECT * FROM budgets WHERE year = $1',
      [currentYear]
    );
    
    if (budgetResult.rows.length === 0) {
      throw new Error('Budget non configuré pour cette année');
    }
    
    const budget = budgetResult.rows[0];
    
    if (budget.remaining_amount < amount) {
      throw new Error(`Budget insuffisant. Restant: ${budget.remaining_amount}€, Demandé: ${amount}€`);
    }
    

    await client.query(
      'UPDATE budgets SET remaining_amount = remaining_amount - $1 WHERE year = $2',
      [amount, currentYear]
    );
  }
}