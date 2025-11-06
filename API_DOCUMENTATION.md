# Dokumentasi API Toko Buku

## Cara Menjalankan Server

1. Install dependencies:
```sh
npm install
```

2. Setup database PostgreSQL dan konfigurasi `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
```

3. Jalankan migrasi database:
```sh
npx prisma migrate dev
```

4. Jalankan server dalam mode development:
```sh
npm run dev
```

Server akan berjalan di port 3000 (default)

## Endpoints API

### Authentication
- **POST /auth/register** - Registrasi user baru
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```

- **POST /auth/login** - Login user
  ```json
  {
    "email": "user@example.com", 
    "password": "password123"
  }
  ```

- **GET /auth/me** - Get profil user yang sedang login (perlu token)

### Books
- **POST /books** - Tambah buku baru
  ```json
  {
    "title": "Book Title",
    "author": "Author Name",
    "description": "Book description",
    "price": 100000,
    "stock": 10,
    "genreId": "genre_id"
  }
  ```

- **GET /books** - List semua buku (support query params: title, author, genre, page, limit)
- **GET /books/:book_id** - Detail buku
- **GET /books/genre/:genre_id** - List buku per genre
- **PATCH /books/:book_id** - Update data buku
- **DELETE /books/:book_id** - Hapus buku

### Genres
- **POST /genres** - Tambah genre baru
  ```json
  {
    "name": "Genre Name",
    "description": "Genre description"
  }
  ```

- **GET /genres** - List semua genre
- **GET /genres/:genre_id** - Detail genre & buku-bukunya
- **PATCH /genres/:genre_id** - Update genre
- **DELETE /genres/:genre_id** - Hapus genre

### Transactions
- **POST /transactions** - Buat transaksi baru (perlu token)
  ```json
  {
    "items": [
      {
        "bookId": "book_id",
        "quantity": 1
      }
    ]
  }
  ```

- **GET /transactions** - List semua transaksi
- **GET /transactions/:transaction_id** - Detail transaksi
- **GET /transactions/statistics** - Statistik transaksi

## Authentication

API menggunakan JWT token untuk autentikasi. Setelah login, gunakan token yang didapat di header Authorization:

```
Authorization: Bearer <token>
```

Beberapa endpoint memerlukan autentikasi (ditandai dengan middleware `authMiddleware`).

## Response Format

Semua endpoint menggunakan format response yang konsisten:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // optional
  "errors": {} // optional, for error responses
}
```

Status code HTTP juga digunakan sesuai standar (200, 201, 400, 401, 404, 500, dll).