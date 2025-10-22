import type { Request, Response } from 'express';
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

export const createGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      errorResponse(res, 'Genre name is required', null, 400);
      return;
    }

    // Check if genre already exists
    const existingGenre = await prisma.genre.findUnique({
      where: { name },
    });

    if (existingGenre) {
      errorResponse(res, 'Genre already exists', null, 409);
      return;
    }

    const genre = await prisma.genre.create({
      data: { name, description },
    });

    successResponse(res, 'Genre created successfully', genre, 201);
  } catch (error) {
    console.error('Create genre error:', error);
    errorResponse(res, 'Failed to create genre', null, 500);
  }
};

export const getAllGenres = async (_: Request, res: Response): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });

    successResponse(res, 'Genres retrieved successfully', genres);
  } catch (error) {
    console.error('Get all genres error:', error);
    errorResponse(res, 'Failed to get genres', null, 500);
  }
};

export const getGenreDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre_id } = req.params;

    const genre = await prisma.genre.findUnique({
      where: { id: genre_id },
      include: {
        books: {
          select: {
            id: true,
            title: true,
            author: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    if (!genre) {
      errorResponse(res, 'Genre not found', null, 404);
      return;
    }

    successResponse(res, 'Genre detail retrieved successfully', genre);
  } catch (error) {
    console.error('Get genre detail error:', error);
    errorResponse(res, 'Failed to get genre detail', null, 500);
  }
};

export const updateGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre_id } = req.params;
    const { name, description } = req.body;

    // Check if genre exists
    const existingGenre = await prisma.genre.findUnique({
      where: { id: genre_id },
    });

    if (!existingGenre) {
      errorResponse(res, 'Genre not found', null, 404);
      return;
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingGenre.name) {
      const duplicateGenre = await prisma.genre.findUnique({
        where: { name },
      });

      if (duplicateGenre) {
        errorResponse(res, 'Genre name already exists', null, 409);
        return;
      }
    }

    const genre = await prisma.genre.update({
      where: { id: genre_id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    successResponse(res, 'Genre updated successfully', genre);
  } catch (error) {
    console.error('Update genre error:', error);
    errorResponse(res, 'Failed to update genre', null, 500);
  }
};

export const deleteGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre_id } = req.params;

    // Check if genre exists
    const genre = await prisma.genre.findUnique({
      where: { id: genre_id },
    });

    if (!genre) {
      errorResponse(res, 'Genre not found', null, 404);
      return;
    }

    // Delete genre (books will have genreId set to null due to SetNull)
    await prisma.genre.delete({
      where: { id: genre_id },
    });

    successResponse(res, 'Genre deleted successfully', null);
  } catch (error) {
    console.error('Delete genre error:', error);
    errorResponse(res, 'Failed to delete genre', null, 500);
  }
};

module.exports = {
  createGenre,
  getAllGenres,
  getGenreDetail,
  updateGenre,
  deleteGenre,
};