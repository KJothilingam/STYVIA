# Style Discovery Hub - Backend API

A production-ready REST API for a full-fledged fashion e-commerce platform built with Spring Boot, MySQL, and JWT authentication.

## 🚀 Quick Start

### Prerequisites

- Java 21
- MySQL 8+
- Maven 3.8+

### Setup

1. **Create MySQL Database**

```sql
CREATE DATABASE fashion_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configure Database**

Update `src/main/resources/application.yml` with your MySQL credentials:

```yaml
spring:
  datasource:
    username: your_mysql_username
    password: your_mysql_password
```

3. **Run the Application**

```bash
cd backend
mvn spring-boot:run
```

The API will start on `http://localhost:8080`

4. **Initialize Database** (First Run)

The database schema will be created automatically. Run the SQL seed data:

```bash
mysql -u root -p fashion_ecommerce < src/main/resources/database/schema.sql
```

## 📋 Default Credentials

**Admin Account:**
- Email: `admin@stylediscovery.com`
- Password: `admin123`

## 🔑 Authentication

This API uses JWT (JSON Web Token) for authentication.

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@stylediscovery.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "name": "Admin User",
  "email": "admin@stylediscovery.com",
  "roles": ["ROLE_ADMIN"]
}
```

### Using the Token

Include the token in the Authorization header for protected endpoints:

```bash
Authorization: Bearer {your_access_token}
```

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No |

### Products (`/api/v1/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all products (paginated) | No |
| GET | `/{id}` | Get product by ID | No |
| GET | `/slug/{slug}` | Get product by slug | No |
| GET | `/search` | Search products | No |
| GET | `/filter` | Filter products | No |

### Categories (`/api/v1/categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all categories | No |
| GET | `/{id}` | Get category by ID | No |
| GET | `/gender/{gender}` | Get categories by gender | No |

### Cart (`/api/v1/cart`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user cart | Yes |
| POST | `/add` | Add item to cart | Yes |
| PUT | `/update/{itemId}` | Update cart item quantity | Yes |
| DELETE | `/remove/{itemId}` | Remove item from cart | Yes |
| DELETE | `/clear` | Clear cart | Yes |

### Wishlist (`/api/v1/wishlist`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user wishlist | Yes |
| POST | `/add/{productId}` | Add product to wishlist | Yes |
| DELETE | `/remove/{productId}` | Remove from wishlist | Yes |

### Orders (`/api/v1/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user orders | Yes |
| GET | `/{id}` | Get order by ID | Yes |
| POST | `/place` | Place new order | Yes |
| PUT | `/{id}/cancel` | Cancel order | Yes |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | Admin |
| POST | `/products` | Create product | Admin |
| PUT | `/products/{id}` | Update product | Admin |
| DELETE | `/products/{id}` | Delete product | Admin |
| GET | `/orders` | Get all orders | Admin |
| PUT | `/orders/{id}/status` | Update order status | Admin |
| GET | `/users` | Get all users | Admin |
| GET | `/dashboard/stats` | Get dashboard statistics | Admin |

## 🏗️ Architecture

```
backend/
├── src/main/java/com/stylediscovery/
│   ├── config/              # Configuration classes
│   │   └── SecurityConfig.java
│   ├── controller/          # REST Controllers
│   ├── dto/                 # Data Transfer Objects
│   │   ├── auth/
│   │   └── ...
│   ├── entity/              # JPA Entities
│   │   ├── User.java
│   │   ├── Product.java
│   │   ├── Order.java
│   │   └── ...
│   ├── enums/               # Enumerations
│   ├── exception/           # Custom Exceptions
│   │   └── GlobalExceptionHandler.java
│   ├── repository/          # JPA Repositories
│   ├── security/            # JWT & Security
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── ...
│   ├── service/             # Business Logic
│   └── FashionEcommerceApplication.java
└── src/main/resources/
    ├── application.yml
    └── database/
        └── schema.sql
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ BCrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ CORS configuration
- ✅ Stateless session management
- ✅ Secure endpoints with @PreAuthorize

## 🛠️ Technologies

- **Spring Boot 3.2.1** - Framework
- **Java 21** - Programming Language
- **MySQL 8** - Database
- **Spring Security** - Authentication & Authorization
- **JWT (JJWT 0.12.3)** - Token-based auth
- **Spring Data JPA** - ORM
- **Hibernate** - JPA Implementation
- **Lombok** - Boilerplate reduction
- **Maven** - Build tool

## 📊 Database Schema

The database consists of 14 normalized tables:

1. **users** - User accounts
2. **roles** - User roles (CUSTOMER, ADMIN)
3. **user_roles** - User-Role mapping
4. **addresses** - Delivery addresses
5. **products** - Product catalog
6. **categories** - Product categories
7. **product_categories** - Product-Category mapping
8. **product_images** - Product images
9. **inventory** - Stock management (size/color/quantity)
10. **cart** - Shopping carts
11. **cart_items** - Cart items
12. **wishlist** - User wishlists
13. **wishlist_items** - Wishlist items
14. **orders** - Customer orders
15. **order_items** - Order line items
16. **payments** - Payment records

## 🧪 Testing

```bash
# Run tests
mvn test

# Run with coverage
mvn clean test jacoco:report
```

## 📦 Building for Production

```bash
# Create JAR file
mvn clean package

# Run the JAR
java -jar target/fashion-ecommerce-1.0.0.jar
```

## 🐳 Docker Support

```bash
# Build image
docker build -t fashion-ecommerce-api .

# Run container
docker run -p 8080:8080 -e DB_USERNAME=root -e DB_PASSWORD=password fashion-ecommerce-api
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USERNAME` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | root |
| `JWT_SECRET` | JWT signing key | (see application.yml) |
| `FILE_UPLOAD_DIR` | File upload directory | ./uploads |

## 🔍 Logging

Logs are configured in `application.yml` and written to:
- Console (stdout)
- File: `logs/application.log`

Log levels:
- DEBUG for application code
- INFO for Spring framework
- ERROR for exceptions

## 🤝 Contributing

This is a portfolio/learning project showcasing full-stack development skills.

## 📄 License

This project is for educational purposes.

---

**Status**: Backend implementation in progress. Core foundation complete.

