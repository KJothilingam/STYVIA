# API Documentation 📚

Complete REST API documentation for Style Discovery Hub backend.

## 🌐 Base URL

```
http://localhost:8080/api/v1
```

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

---

## 📑 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Products](#product-endpoints)
3. [Categories](#category-endpoints)
4. [Cart](#cart-endpoints)
5. [Wishlist](#wishlist-endpoints)
6. [Orders](#order-endpoints)
7. [Addresses](#address-endpoints)
8. [Admin](#admin-endpoints)
9. [Files](#file-endpoints)

---

## 🔑 Authentication Endpoints

### POST `/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["ROLE_CUSTOMER"]
  }
}
```

### POST `/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "admin@stylediscovery.com",
  "password": "admin123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "name": "Admin User",
    "email": "admin@stylediscovery.com",
    "roles": ["ROLE_ADMIN"]
  }
}
```

### POST `/auth/refresh`
Refresh access token using refresh token.

**Query Parameters:**
- `refreshToken` (required): The refresh token

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    ...
  }
}
```

---

## 🛍️ Product Endpoints

### GET `/products`
Get all active products with pagination and sorting.

**Query Parameters:**
- `page` (default: 0): Page number
- `size` (default: 20): Items per page
- `sortBy` (default: createdAt): Sort field
- `sortDir` (default: DESC): Sort direction (ASC/DESC)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Slim Fit Casual Shirt",
        "slug": "slim-fit-casual-shirt",
        "brand": "Roadster",
        "gender": "MEN",
        "price": 899,
        "originalPrice": 1799,
        "discountPercentage": 50,
        "rating": 4.2,
        "reviewCount": 1234,
        "images": ["url1", "url2"],
        "sizes": ["S", "M", "L", "XL"],
        "colors": [
          { "name": "Navy Blue", "hex": "#1e3a5f" }
        ],
        "categories": [...]
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "size": 20,
    "number": 0
  }
}
```

### GET `/products/{id}`
Get product by ID.

**Path Parameters:**
- `id`: Product ID

**Response:** `200 OK`

### GET `/products/slug/{slug}`
Get product by slug.

**Path Parameters:**
- `slug`: Product slug

### GET `/products/search`
Search products by keyword.

**Query Parameters:**
- `keyword` (required): Search term
- `page`, `size`: Pagination

**Example:**
```
GET /products/search?keyword=shirt&page=0&size=20
```

### GET `/products/filter`
Filter products with advanced options.

**Query Parameters:**
- `gender`: MEN | WOMEN | KIDS | UNISEX
- `brand`: Brand name
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `page`, `size`, `sortBy`, `sortDir`: Pagination & sorting

**Example:**
```
GET /products/filter?gender=MEN&brand=Roadster&minPrice=500&maxPrice=2000
```

### GET `/products/brands`
Get list of all active brands.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": ["Roadster", "H&M", "Zara", "Nike", ...]
}
```

---

## 📂 Category Endpoints

### GET `/categories`
Get all active categories.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Shirts",
      "slug": "shirts",
      "gender": "MEN",
      "imageUrl": "...",
      "parentId": null
    }
  ]
}
```

### GET `/categories/{id}`
Get category by ID.

### GET `/categories/slug/{slug}`
Get category by slug.

### GET `/categories/gender/{gender}`
Get categories by gender.

**Path Parameters:**
- `gender`: MEN | WOMEN | KIDS | UNISEX

### GET `/categories/root`
Get only root categories (no parent).

### GET `/categories/{parentId}/subcategories`
Get subcategories of a parent category.

---

## 🛒 Cart Endpoints

**All cart endpoints require authentication.**

### GET `/cart`
Get user's shopping cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product": { /* product details */ },
      "size": "M",
      "color": "Blue",
      "quantity": 2,
      "subtotal": 1798
    }
  ]
}
```

### POST `/cart/add`
Add item to cart.

**Request Body:**
```json
{
  "productId": 1,
  "size": "M",
  "color": "Blue",
  "quantity": 1
}
```

**Response:** `201 Created`

### PUT `/cart/item/{itemId}/quantity`
Update cart item quantity.

**Path Parameters:**
- `itemId`: Cart item ID

**Query Parameters:**
- `quantity` (required): New quantity

**Response:** `200 OK`

### DELETE `/cart/item/{itemId}`
Remove item from cart.

**Response:** `200 OK`

### DELETE `/cart/clear`
Clear entire cart.

**Response:** `200 OK`

### GET `/cart/total`
Get cart total amount.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": 3596.00
}
```

---

## ❤️ Wishlist Endpoints

**All wishlist endpoints require authentication.**

### GET `/wishlist`
Get user's wishlist.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    { /* product details */ },
    { /* product details */ }
  ]
}
```

### POST `/wishlist/add/{productId}`
Add product to wishlist.

**Path Parameters:**
- `productId`: Product ID

**Response:** `201 Created`

### DELETE `/wishlist/remove/{productId}`
Remove product from wishlist.

**Response:** `200 OK`

### GET `/wishlist/check/{productId}`
Check if product is in wishlist.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": true
}
```

### DELETE `/wishlist/clear`
Clear entire wishlist.

---

## 📦 Order Endpoints

**All order endpoints require authentication.**

### POST `/orders/place`
Place a new order from cart items.

**Request Body:**
```json
{
  "addressId": 1,
  "paymentMethod": "COD",
  "couponCode": "DISCOUNT10"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD1234567890",
    "items": [...],
    "address": {...},
    "subtotal": 1798,
    "discount": 0,
    "deliveryFee": 50,
    "totalAmount": 1848,
    "orderStatus": "PLACED",
    "paymentStatus": "PENDING",
    "paymentMethod": "COD",
    "createdAt": "2024-01-15T10:30:00"
  }
}
```

### GET `/orders`
Get user's order history.

**Query Parameters:**
- `page`, `size`: Pagination

**Response:** `200 OK`

### GET `/orders/{orderId}`
Get order details by ID.

**Response:** `200 OK`

### GET `/orders/number/{orderNumber}`
Get order by order number.

**Response:** `200 OK`

### PUT `/orders/{orderId}/cancel`
Cancel an order.

**Response:** `200 OK`

---

## 📍 Address Endpoints

**All address endpoints require authentication.**

### GET `/addresses`
Get user's saved addresses.

**Response:** `200 OK`

### POST `/addresses`
Add a new address.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123, ABC Street",
  "addressLine2": "Near XYZ Mall",
  "locality": "Downtown",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "country": "India",
  "addressType": "HOME",
  "isDefault": true
}
```

**Response:** `201 Created`

### PUT `/addresses/{addressId}`
Update an existing address.

**Response:** `200 OK`

### DELETE `/addresses/{addressId}`
Delete an address.

**Response:** `200 OK`

### PUT `/addresses/{addressId}/default`
Set address as default.

**Response:** `200 OK`

---

## 👑 Admin Endpoints

**All admin endpoints require ADMIN role.**

### GET `/admin/dashboard/stats`
Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "pendingOrders": 10,
    "confirmedOrders": 20,
    "shippedOrders": 30,
    "deliveredOrders": 85,
    "cancelledOrders": 5,
    "totalRevenue": 450000.00,
    "totalProducts": 500,
    "totalUsers": 1234
  }
}
```

### GET `/admin/orders`
Get all orders (admin view).

**Query Parameters:**
- `status`: Filter by order status
- `page`, `size`: Pagination

**Response:** `200 OK`

### PUT `/admin/orders/{orderId}/status`
Update order status.

**Query Parameters:**
- `status` (required): New status (PLACED | CONFIRMED | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED)

**Response:** `200 OK`

### GET `/admin/users`
Get all users.

**Query Parameters:**
- `page`, `size`: Pagination

**Response:** `200 OK`

### PUT `/admin/users/{userId}/status`
Enable/disable user account.

**Query Parameters:**
- `isActive` (required): true | false

**Response:** `200 OK`

---

## 📁 File Endpoints

### POST `/files/upload`
Upload an image file.

**Request:** multipart/form-data
```
file: <binary data>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": "http://localhost:8080/api/v1/files/abc123.jpg"
}
```

### GET `/files/{fileName}`
Download a file.

**Response:** Binary file data

### DELETE `/files/{fileName}`
Delete a file (admin only).

**Response:** `200 OK`

---

## 📊 Error Responses

All errors follow this format:

```json
{
  "status": 404,
  "message": "Product not found with id: 999",
  "timestamp": "2024-01-15T10:30:00"
}
```

**Common Status Codes:**
- `200`: OK
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., insufficient stock)
- `500`: Internal Server Error

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stylediscovery.com","password":"admin123"}'
```

### Get Products
```bash
curl http://localhost:8080/api/v1/products?page=0&size=10
```

### Add to Cart
```bash
curl -X POST http://localhost:8080/api/v1/cart/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"size":"M","color":"Blue","quantity":1}'
```

---

## 📚 Additional Resources

- [Postman Collection](./postman_collection.json) (if available)
- [Swagger UI](http://localhost:8080/swagger-ui.html) (if enabled)
- [Backend README](./backend/README.md)

---

**Questions?** Open an issue on GitHub or contact the development team.

