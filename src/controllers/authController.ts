import type { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';

const bcrypt = require('bcrypt');
const prisma = (require('../config/database')?.default ?? require('../config/database'));
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Validation
    if (!email || !password) {
      errorResponse(res, 'Email and password are required', null, 400);
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      errorResponse(res, 'Email already registered', null, 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: username || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    successResponse(res, 'User registered successfully', user, 201);
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, 'Failed to register user', null, 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      errorResponse(res, 'Email and password are required', null, 400);
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      errorResponse(res, 'Invalid email or password', null, 401);
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      errorResponse(res, 'Invalid email or password', null, 401);
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    successResponse(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Failed to login', null, 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'User not authenticated', null, 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      errorResponse(res, 'User not found', null, 404);
      return;
    }

    successResponse(res, 'User profile retrieved successfully', user);
  } catch (error) {
    console.error('Get me error:', error);
    errorResponse(res, 'Failed to get user profile', null, 500);
  }
};