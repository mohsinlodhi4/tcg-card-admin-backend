# TCG Ecommerce API Documentation

This document describes the ecommerce APIs for the TCG platform, including cart management, order processing, and inventory tracking.

## Base URL
All ecommerce endpoints are prefixed with `/ecommerce`

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Cart Management

### Add Item to Cart
**POST** `/ecommerce/cart/add`

Add items (cards, packs, or coins) to the user's cart.

**Request Body:**
```json
{
  "itemType": "card|pack|coins",
  "itemId": "ObjectId or coin amount",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "cart": {
    "items": [...],
    "totalAmount": 150.00
  }
}
```

### View Cart
**GET** `/ecommerce/cart`

Get all items in the user's cart with full details.

**Response:**
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "itemType": "card",
        "itemId": "ObjectId",
        "quantity": 2,
        "price": 25.00,
        "itemDetails": {
          "name": "Fire Dragon",
          "rarity": "rare",
          "price": 25.00
        }
      }
    ],
    "totalAmount": 150.00,
    "itemCount": 3
  }
}
```

### Update Cart Item
**PUT** `/ecommerce/cart/update`

Update the quantity of an item in the cart.

**Request Body:**
```json
{
  "itemType": "card|pack|coins",
  "itemId": "ObjectId",
  "quantity": 3
}
```

### Remove Item from Cart
**DELETE** `/ecommerce/cart/remove/:itemType/:itemId`

Remove a specific item from the cart.

### Clear Cart
**DELETE** `/ecommerce/cart/clear`

Remove all items from the cart.

## Order Management

### Place Order
**POST** `/ecommerce/orders/place`

Place an order with items from the cart. This will:
- Create an order record
- Add items to user's inventory
- Add coins to user's wallet
- Clear the cart

**Request Body:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "notes": "Please handle with care"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "orderNumber": "ORD-1640995200000-0001",
    "items": [...],
    "totalAmount": 150.00,
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

### Get User Orders
**GET** `/ecommerce/orders`

Get all orders for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalOrders": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Order by ID
**GET** `/ecommerce/orders/:orderId`

Get details of a specific order.

## Inventory Management

### Get User Inventory
**GET** `/ecommerce/inventory`

Get all items in the user's inventory.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `itemType` (optional): Filter by "card" or "pack"
- `search` (optional): Search by item name

**Response:**
```json
{
  "success": true,
  "inventory": [
    {
      "itemType": "card",
      "itemId": "ObjectId",
      "quantity": 3,
      "acquiredAt": "2023-12-01T10:00:00Z",
      "source": "purchase",
      "itemDetails": {
        "name": "Fire Dragon",
        "rarity": "rare"
      }
    }
  ],
  "summary": [
    {
      "_id": "card",
      "totalItems": 25,
      "uniqueItems": 15
    }
  ]
}
```

### Get Inventory Statistics
**GET** `/ecommerce/inventory/stats`

Get summary statistics of the user's inventory.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalCards": 25,
    "totalPacks": 5,
    "uniqueCards": 15,
    "uniquePacks": 3,
    "walletBalance": 100.50
  }
}
```

### Get Specific Inventory Item
**GET** `/ecommerce/inventory/:itemType/:itemId`

Get details of a specific item in the inventory.

### Update Item Quantity
**PUT** `/ecommerce/inventory/:itemType/:itemId`

Update the quantity of an item in the inventory. Set quantity to 0 to remove the item.

**Request Body:**
```json
{
  "quantity": 5
}
```

## Wallet Management

### Get Wallet Balance
**GET** `/ecommerce/wallet/balance`

Get the current wallet balance.

**Response:**
```json
{
  "success": true,
  "walletBalance": 100.50
}
```

## Admin Functions

### Update Order Status
**PUT** `/ecommerce/admin/orders/:orderId/status`

Update the status of an order (admin only).

**Request Body:**
```json
{
  "status": "confirmed|shipped|delivered|cancelled",
  "paymentStatus": "paid|failed|refunded"
}
```

### Get All Orders
**GET** `/ecommerce/admin/orders`

Get all orders in the system (admin only).

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by order status
- `paymentStatus`: Filter by payment status
- `userId`: Filter by user ID

### Add Coins to Wallet
**POST** `/ecommerce/admin/wallet/add-coins`

Add coins to a user's wallet (admin only).

**Request Body:**
```json
{
  "userId": "ObjectId",
  "amount": 50.00,
  "reason": "Promotional bonus"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "itemType",
      "message": "Invalid item type"
    }
  ]
}
```

## Status Codes

- `200`: Success
- `201`: Created (for new orders)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Data Models

### Order Status
- `pending`: Order placed, awaiting confirmation
- `confirmed`: Order confirmed by admin
- `shipped`: Order shipped
- `delivered`: Order delivered
- `cancelled`: Order cancelled

### Payment Status
- `pending`: Payment pending
- `paid`: Payment completed
- `failed`: Payment failed
- `refunded`: Payment refunded

### Item Types
- `card`: Individual trading cards
- `pack`: Card packs
- `coins`: Virtual currency

### Item Sources
- `purchase`: Bought from store
- `pack_opening`: Obtained from opening packs
- `trade`: Received from trading
- `gift`: Received as gift
