import type { Request, Response, NextFunction } from 'express';
const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      errorResponse(res, 'No token provided', null, 401);
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      errorResponse(res, 'Invalid token format', null, 401);
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    errorResponse(res, 'Invalid or expired token', null, 401);
  }
};

module.exports = { authMiddleware };