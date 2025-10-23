import express from 'express';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import genreRoutes from './routes/genreRoutes';
import transactionRoutes from './routes/transactionRoutes';
import errorHandler from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.post('/', createBook);
router.get('/', getAllBooks);
router.get('/genre/:genre_id', getBooksByGenre);
router.get('/:book_id', getBookDetail);
router.patch('/:book_id', updateBook);
router.delete('/:book_id', deleteBook);

export default app;