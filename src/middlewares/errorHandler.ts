import type { Request, Response } from 'express';
const { Prisma } = require('@prisma/client');

const errorHandler = (
  error: any,
  _req: Request,
  res: Response
): void => {
  console.error('Error:', error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Data already exists',
        errors: error.meta,
      });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Data not found',
        errors: error.meta,
      });
      return;
    }
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors,
    });
    return;
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors || null,
  });
};

export default errorHandler;