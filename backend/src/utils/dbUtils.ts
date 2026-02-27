import pool from '../config/database';

export const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Connexion à la base de données réussie');
    
    const result = await client.query('SELECT NOW()');
    console.log(' Heure serveur:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (error) {
    console.error(' Erreur de connexion à la base de données:', error);
    return false;
  }
};

export const closeDatabaseConnection = async () => {
  try {
    await pool.end();
    console.log('🔌 Connexion à la base de données fermée');
  } catch (error) {
    console.error('Erreur lors de la fermeture de la connexion:', error);
  }
};

export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
