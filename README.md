# My E-Commerce Store

A production-ready e-commerce store built with Medusa.js (open-source Shopify alternative) and Next.js 14+.

## Features

- **Modern Next.js 14 Storefront** with App Router
- **Admin Dashboard** for managing products, orders, customers
-- **Cash on Delivery / Manual Payments** (no Stripe)
- **Product Management** with variants and inventory tracking
- **Customer Accounts** with order history
- **Shopping Cart & Checkout** flow
- **SEO Optimized** with meta tags, structured data, sitemap
- **Responsive Mobile-First Design** with Tailwind CSS
- **Multi-Currency Support**

## Project Structure

```
medusa-store/
├── my-ecommerce-store/          # Backend (Medusa.js)
│   ├── src/
│   ├── medusa-config.ts
│   ├── .env
│   └── package.json
│
└── my-ecommerce-store-storefront/  # Frontend (Next.js 14)
    ├── src/
    │   ├── app/                # App Router pages
    │   ├── modules/            # React components
    │   └── lib/               # Utilities
    ├── tailwind.config.js
    ├── .env.local
    └── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for production)

### Setup Steps

1. **Database Setup** (already done)
   - PostgreSQL database: `medusa-store`
   - Connection: `postgres://postgres@localhost/medusa-store`

2. **Start Backend**
   ```bash
   cd my-ecommerce-store
   npm run dev
   ```
   Backend runs on: http://localhost:9000

3. **Start Storefront**
   ```bash
   cd my-ecommerce-store-storefront
   npm run dev
   ```
   Storefront runs on: http://localhost:8000

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Storefront | http://localhost:8000 | Customer-facing store |
| Backend API | http://localhost:9000 | Medusa API |
| Admin Dashboard | http://localhost:9000/app | Store management |

### Admin Credentials

```
Email: admin@medusa-test.com
Password: supersecret
```

**Important:** Change the admin password in production!

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgres://postgres@localhost/medusa-store
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
REDIS_URL=redis://localhost:6379

# CORS
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
```

### Storefront (.env.local)

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test
NEXT_PUBLIC_DEFAULT_REGION=us
REVALIDATE_SECRET=supersecret
```

## Adding Products

### Via Admin Dashboard

1. Navigate to http://localhost:9000/app
2. Login with admin credentials
3. Go to Products → Add Product
4. Fill in product details:
   - Title, Description
   - Pricing
   - Images
   - Variants (size, color, etc.)
   - Inventory quantity

### Via API

```bash
curl -X POST http://localhost:9000/admin/products \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Product",
    "description": "Product description",
    "variants": [{"title": "Default", "prices": [{"amount": 2999, "currency_code": "usd"}]}]
  }'
```

## Deployment

### Production Checklist

1. Change all default secrets:
   - JWT_SECRET
   - COOKIE_SECRET
   - REVALIDATE_SECRET

2. Configure PostgreSQL for production

3. Set up Redis for event bus

4. Configure Stripe for production mode

5. Set up proper CORS domains

6. Enable HTTPS

### Docker Deployment (Optional)

```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9000
CMD ["npm", "run", "start"]
```

## SEO Features

- Dynamic meta tags for all pages
- Open Graph tags for social sharing
- JSON-LD structured data for products
- Automatic sitemap generation (/sitemap.xml)
- Robots.txt configuration
- Optimized images with next/image

## Testing

### Test Checkout Flow

1. Visit http://localhost:8000
2. Browse products
3. Add to cart
4. Proceed to checkout
5. Fill shipping info
6. Complete payment using **Cash on Delivery / Manual payment** at checkout
7. Verify order in admin dashboard

## Tech Stack

- **Backend**: Medusa.js 2.x, Node.js, Express
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Medusa UI
- **Database**: PostgreSQL
- **Payments**: Cash on Delivery / Manual provider
- **Caching**: Redis (optional)

## Documentation

- [Medusa Docs](https://docs.medusajs.com)
- [Next.js Docs](https://nextjs.org/docs)

## License

MIT
