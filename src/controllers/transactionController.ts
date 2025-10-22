import { Request, Response } from 'express';
import { PrismaClient, Book, order_items, orders } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/authMiddleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * @route POST /transactions
 * @desc Membuat transaksi baru (user membeli buku)
 * @access Private
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Unauthorized: user not authenticated', null, 401);
      return;
    }

    const { items }: { items: { bookId: string; quantity: number }[] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      errorResponse(res, 'Items must be a non-empty array', null, 400);
      return;
    }

    const bookIds = items.map((i) => i.bookId);
    const books: Book[] = await prisma.book.findMany({
      where: { id: { in: bookIds } },
    });

    if (books.length !== items.length) {
      errorResponse(res, 'One or more books not found', null, 404);
      return;
    }

    // Hitung total harga transaksi
    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const book = books.find((b: Book) => b.id === item.bookId);
      const subtotal = (Number(book?.price) || 0) * item.quantity;
      totalAmount += subtotal;
      return {
        book_id: item.bookId,
        quantity: item.quantity,
      };
    });

    // Simpan order ke database
    const order = await prisma.orders.create({
      data: {
        id: crypto.randomUUID(),
        user_id: req.user.userId,
        updated_at: new Date(),
        order_items: {
          create: orderItems.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            updated_at: new Date(),
          })),
        },
      },
      include: {
        order_items: {
          include: {
            books: {
              select: {
                title: true,
                price: true,
                genre: { select: { name: true } },
              },
            },
          },
        },
        users: { select: { id: true, username: true, email: true } },
      },
    });

    successResponse(res, 'Order created successfully', { ...order, totalAmount }, 201);
  } catch (error) {
    console.error('Create order error:', error);
    errorResponse(res, 'Failed to create order', null, 500);
  }
};

/**
 * @route GET /transactions
 * @desc Mengambil semua transaksi
 * @access Public
 */
export const getAllTransactions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ordersData: (orders & {
      users: { id: string; username: string | null; email: string };
      order_items: (order_items & {
        books: { title: string; price: any; genre: { name: string } };
      })[];
    })[] = await prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, username: true, email: true } },
        order_items: {
          include: {
            books: {
              select: { title: true, price: true, genre: { select: { name: true } } },
            },
          },
        },
      },
    });

    successResponse(res, 'All orders retrieved successfully', ordersData);
  } catch (error) {
    console.error('Get all orders error:', error);
    errorResponse(res, 'Failed to retrieve orders', null, 500);
  }
};

/**
 * @route GET /transactions/:order_id
 * @desc Mengambil detail transaksi berdasarkan ID
 * @access Public
 */
export const getTransactionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id: order_id },
      include: {
        users: { select: { id: true, username: true, email: true } },
        order_items: {
          include: {
            books: {
              select: { title: true, price: true, genre: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      errorResponse(res, 'Order not found', null, 404);
      return;
    }

    successResponse(res, 'Order detail retrieved successfully', order);
  } catch (error) {
    console.error('Get order detail error:', error);
    errorResponse(res, 'Failed to get order detail', null, 500);
  }
};

/**
 * @route GET /transactions/statistics
 * @desc Menampilkan statistik transaksi
 * @access Public
 */
export const getTransactionStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalOrders = await prisma.orders.count();

    const genreSales = await prisma.order_items.groupBy({
      by: ['book_id'],
      _sum: { quantity: true },
    });

    const books: (Book & { genre: { name: string } })[] = await prisma.book.findMany({
      select: { id: true, genre: { select: { name: true } } },
    });

    const genreCount: Record<string, number> = {};
    for (const g of genreSales) {
      const genre = books.find((b: Book) => b.id === g.book_id)?.genre.name ?? 'Unknown';
      genreCount[genre] = (genreCount[genre] || 0) + (g._sum.quantity ?? 0);
    }

    const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
    const mostSoldGenre = sortedGenres.length > 0 ? sortedGenres[0][0] : null;
    const leastSoldGenre = sortedGenres.length > 0 ? sortedGenres[sortedGenres.length - 1][0] : null;

    const stats = {
      totalOrders,
      mostSoldGenre,
      leastSoldGenre,
    };

    successResponse(res, 'Order statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Get order statistics error:', error);
    errorResponse(res, 'Failed to get order statistics', null, 500);
  }
};
