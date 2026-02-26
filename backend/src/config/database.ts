import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cse-management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('Connecté à PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erreur de connexion à PostgreSQL:', err);
});

export default pool;