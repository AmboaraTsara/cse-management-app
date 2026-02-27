import express from 'express';
import { login } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);


export default router;
