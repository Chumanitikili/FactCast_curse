import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../utils/db';
const router = Router();

router.post('/register', async (req, res) => {
  // Validate input, hash password, store user
});
router.post('/login', async (req, res) => {
  // Validate input, compare password, return JWT
});
router.get('/me', (req, res) => {
  // Authenticate JWT middleware, then return user data
});

export { router as authRouter };