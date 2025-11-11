import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import genreRoutes from './routes/genreRoutes';
import transactionRoutes from './routes/transactionRoutes';
import errorHandler from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/genres', genreRoutes);
app.use('/transactions', transactionRoutes);

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;