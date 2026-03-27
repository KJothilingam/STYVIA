# Style Discovery Hub 🛍️

A **production-ready, full-stack** fashion e-commerce platform with React frontend, Spring Boot backend, MySQL database, and complete admin panel.

## 🎯 **Project Overview**

This is a comprehensive e-commerce platform featuring:
- ✅ Modern React frontend with TypeScript
- ✅ Spring Boot REST API backend
- ✅ MySQL database with normalized schema
- ✅ JWT authentication & authorization
- ✅ Admin panel for order & user management
- ✅ Docker support for easy deployment
- ✅ Production-ready architecture

## 🚀 Quick Start

### **Option 1: Run with Docker (Recommended)**

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd style-discovery-hub

# Start all services (MySQL + Backend + Frontend)
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8080/api/v1
# Admin Panel: http://localhost/admin
```

**Default Admin Credentials:**
- Email: `admin@stylediscovery.com`
- Password: `admin123`

### **Option 2: Run Locally**

#### Prerequisites
- Node.js 20+
- Java 21
- Maven 3.8+
- MySQL 8.0+

#### Backend Setup

```bash
# 1. Create MySQL database
mysql -u root -p
CREATE DATABASE fashion_ecommerce;
exit;

# 2. Navigate to backend
cd backend

# 3. Update database credentials in src/main/resources/application.yml

# 4. Run the backend
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

#### Frontend Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy .env.example → .env.development if API is not on localhost:8080

# 3. Start development server
npm run dev
```

Frontend dev server: **`http://localhost:5173`** (Vite). Backend API stays on **`http://localhost:8080`**.

**Teammates / new clones:** see **[SETUP.md](./SETUP.md)** for images, database, and common errors.

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3 | UI Library |
| TypeScript | 5.8 | Type Safety |
| Vite | 5.4 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | Latest | UI Components |
| React Router | 6.30 | Routing |
| Axios | Latest | HTTP Client |
| TanStack Query | 5.83 | Data Fetching |

### **Backend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 3.2.1 | Framework |
| Java | 21 | Language |
| Spring Security | 3.2.1 | Security |
| JWT | 0.12.3 | Authentication |
| Spring Data JPA | 3.2.1 | ORM |
| MySQL | 8.0+ | Database |
| Maven | 3.8+ | Build Tool |

### **DevOps**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend web server

## 📁 Project Structure

```
style-discovery-hub/
├── backend/                    # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/stylediscovery/
│   │       ├── controller/     # REST API Controllers (9)
│   │       ├── service/        # Business Logic (8)
│   │       ├── repository/     # Data Access (14)
│   │       ├── entity/         # JPA Entities (14)
│   │       ├── dto/            # Data Transfer Objects (13+)
│   │       ├── security/       # JWT & Security (5)
│   │       ├── exception/      # Exception Handling
│   │       ├── enums/          # Enumerations (6)
│   │       └── config/         # Configuration
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── database/schema.sql
│   ├── pom.xml
│   └── Dockerfile
│
├── src/                        # React Frontend
│   ├── components/            # UI Components
│   │   ├── ui/               # shadcn/ui components
│   │   └── layout/           # Layouts (Customer + Admin)
│   ├── pages/                # Route Pages
│   │   ├── admin/            # Admin Panel Pages
│   │   ├── Index.tsx         # Homepage
│   │   ├── Products.tsx      # Product Listing
│   │   ├── Cart.tsx          # Shopping Cart
│   │   └── ...
│   ├── services/             # API Service Layer
│   │   ├── api.ts            # Axios instance
│   │   ├── authService.ts    # Authentication
│   │   ├── productService.ts # Products
│   │   ├── cartService.ts    # Cart
│   │   └── ...
│   ├── context/              # React Context
│   ├── hooks/                # Custom Hooks
│   └── types/                # TypeScript Types
│
├── docker-compose.yml         # Docker Orchestration
├── Dockerfile                 # Frontend Dockerfile
├── nginx.conf                 # Nginx Configuration
└── README.md                  # This file
```

## 🌟 Features

- 🛍️ **Product Catalog** - Browse products across multiple categories
- 🔍 **Advanced Filtering** - Filter by price, brand, size, color
- 🛒 **Shopping Cart** - Add/remove items, update quantities
- ❤️ **Wishlist** - Save favorite products
- 👤 **User Profiles** - Manage account and orders
- 📦 **Order Management** - Track order history
- 💳 **Checkout Flow** - Multi-step checkout process
- 📱 **Responsive Design** - Mobile-first approach
- 🎨 **Modern UI** - Clean, intuitive interface

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🎨 Design System

The project uses a custom design system with brand colors inspired by modern e-commerce platforms:

- Custom color palette (pink, orange, green, gold)
- Consistent spacing and typography
- Responsive breakpoints
- Dark mode support
- Smooth animations and transitions

## 📦 Build & Deploy

To build for production:

```bash
npm run build
```

The optimized files will be in the `dist/` directory, ready for deployment to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).
