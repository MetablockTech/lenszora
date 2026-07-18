# Visionary Emporium - Server

This folder contains a minimal Express + TypeScript + Mongoose API for the storefront and admin panel.

Quick start

1. cd into `server`
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update `MONGO_URI` and `JWT_SECRET`.

4. Run the dev server:

```bash
npm run dev
```

API endpoints (examples)
- `POST /api/auth/register` - register user
- `POST /api/auth/login` - login -> returns JWT
- `GET /api/products` - list products
- `POST /api/products` - create product (admin)

Image uploads are saved to `server/uploads` and served statically at `/uploads`.
