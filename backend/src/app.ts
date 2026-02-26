import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth'; 
import requestsRoutes from './routes/requests';
import budgetRoutes from './routes/BudgetRoute';
import transactionRoutes from './routes/transactions';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/requests', requestsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur backend fonctionne!',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register',
      health: '/api/health'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Auth: http://localhost:${PORT}/api/auth/login`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

export default app;