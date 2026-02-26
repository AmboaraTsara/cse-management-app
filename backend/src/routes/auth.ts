import express from 'express';
import { login } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.post('/login', login);


export default router;