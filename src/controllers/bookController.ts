const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

export const createBook = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    // Accept both genreId and genre_id, writer is optional (can use title as writer if not provided)
    const { title, writer, publisher, publication_year, description, price, stock_quantity, genreId, genre_id } = req.body;
    
    const finalGenreId = genreId || genre_id;
    const finalWriter = writer || title || 'Unknown'; // Use title or 'Unknown' if writer not provided

    // Validation
    if (!title || !price || !publisher || !publication_year) {
      errorResponse(res, 'Title, publisher, publication_year, and price are required', null, 400);
      return;
    }

    // Check for duplicate title
    const existingBook = await prisma.book.findUnique({
      where: { title },
    });

    if (existingBook) {
      errorResponse(res, 'Book with this title already exists', null, 409);
      return;
    }

    // Validate genre if provided
    if (finalGenreId) {
      const genre = await prisma.genre.findUnique({
        where: { id: finalGenreId },
      });

      if (!genre) {
        errorResponse(res, 'Genre not found', null, 404);
        return;
      }
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer: finalWriter,
        publisher,
        publication_year: parseInt(publication_year),
        description,
        price: parseFloat(price),
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
        genreId: finalGenreId,
      },
      include: {
        genre: true,
      },
    });

    successResponse(res, 'Book created successfully', book, 201);
  } catch (error) {
    console.error('Create book error:', error);
    errorResponse(res, 'Failed to create book', null, 500);
  }
};

export const getAllBooks = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    const { title, writer, genre, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (title) {
      where.title = {
        contains: title as string,
      };
    }

    if (writer) {
      where.writer = {
        contains: writer as string,
      };
    }

    if (genre) {
      where.genre = {
        name: {
          contains: genre as string,
        },
      };
    }

    // Get books with pagination
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          genre: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    successResponse(res, 'Books retrieved successfully', {
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get all books error:', error);
    errorResponse(res, 'Failed to get books', null, 500);
  }
};

export const getBookDetail = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    const { book_id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id: book_id },
      include: {
        genre: true,
      },
    });

    if (!book) {
      errorResponse(res, 'Book not found', null, 404);
      return;
    }

    successResponse(res, 'Book detail retrieved successfully', book);
  } catch (error) {
    console.error('Get book detail error:', error);
    errorResponse(res, 'Failed to get book detail', null, 500);
  }
};

export const getBooksByGenre = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    const { genre_id } = req.params;
    const { title, writer, page = '1', limit = '10' } = req.query;

    // Check if genre exists
    const genre = await prisma.genre.findUnique({
      where: { id: genre_id },
    });

    if (!genre) {
      errorResponse(res, 'Genre not found', null, 404);
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      genreId: genre_id,
    };

    if (title) {
      where.title = {
        contains: title as string,
      };
    }

    if (writer) {
      where.writer = {
        contains: writer as string,
      };
    }

    // Get books with pagination
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          genre: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    successResponse(res, 'Books retrieved successfully', {
      genre,
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get books by genre error:', error);
    errorResponse(res, 'Failed to get books by genre', null, 500);
  }
};

export const updateBook = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    const { book_id } = req.params;
    const { title, writer, publisher, publication_year, description, price, stock_quantity, genreId } = req.body;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id: book_id },
    });

    if (!existingBook) {
      errorResponse(res, 'Book not found', null, 404);
      return;
    }

    // Check for duplicate title if title is being updated
    if (title && title !== existingBook.title) {
      const duplicateBook = await prisma.book.findUnique({
        where: { title },
      });

      if (duplicateBook) {
        errorResponse(res, 'Book with this title already exists', null, 409);
        return;
      }
    }

    // Validate genre if provided
    if (genreId) {
      const genre = await prisma.genre.findUnique({
        where: { id: genreId },
      });

      if (!genre) {
        errorResponse(res, 'Genre not found', null, 404);
        return;
      }
    }

    const book = await prisma.book.update({
      where: { id: book_id },
      data: {
        ...(title && { title }),
        ...(writer && { writer }),
        ...(publisher && { publisher }),
        ...(publication_year && { publication_year: parseInt(publication_year) }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(stock_quantity !== undefined && { stock_quantity: parseInt(stock_quantity) }),
        ...(genreId !== undefined && { genreId }),
      },
      include: {
        genre: true,
      },
    });

    successResponse(res, 'Book updated successfully', book);
  } catch (error) {
    console.error('Update book error:', error);
    errorResponse(res, 'Failed to update book', null, 500);
  }
};

export const deleteBook = async (req: import('express').Request, res: import('express').Response): Promise<void> => {
  try {
    const { book_id } = req.params;

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: book_id },
    });

    if (!book) {
      errorResponse(res, 'Book not found', null, 404);
      return;
    }

    // Delete book (transactions are protected by Restrict constraint)
    await prisma.book.delete({
      where: { id: book_id },
    });

    successResponse(res, 'Book deleted successfully', null);
  } catch (error) {
    console.error('Delete book error:', error);
    errorResponse(res, 'Failed to delete book', null, 500);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookDetail,
  getBooksByGenre,
  updateBook,
  deleteBook,
};