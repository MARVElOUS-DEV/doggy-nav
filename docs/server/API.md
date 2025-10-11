# 🛠 API Documentation

## Overview

The Doggy Nav API provides RESTful endpoints for managing bookmarks, users, and categories. All endpoints use JSON for request and response bodies.

## Base URL

```
Development: http://localhost:3002
Production: https://your-domain.com
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 🔐 Authentication

#### POST /api/login

Login with username/email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "john_doe"
    }
  }
}
```

#### POST /api/register

Register a new user account.

**Request:**

```json
{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/logout

Logout and invalidate token.

**Headers:** `Authorization: Bearer <token>`

### 👤 User Management

#### GET /api/user/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": {
    "id": "user_id",
    "username": "john_doe",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/user/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "username": "new_username",
  "email": "new@example.com"
}
```

### 📚 Navigation Items

#### GET /api/nav

Get navigation items with optional filtering.

**Query Parameters:**

- `category` - Filter by category ID
- `search` - Search in name and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sort` - Sort field (name, createdAt, view, star)
- `order` - Sort order (asc, desc)

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": {
    "items": [
      {
        "id": "nav_id",
        "name": "Google",
        "url": "https://google.com",
        "description": "Search engine",
        "category": "search",
        "view": 100,
        "star": 50,
        "authorId": "user_id",
        "authorName": "john_doe",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/nav

Create a new navigation item.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "name": "Google",
  "url": "https://google.com",
  "description": "Search engine",
  "category": "search"
}
```

#### PUT /api/nav/:id

Update a navigation item.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "name": "Updated Google",
  "url": "https://google.com",
  "description": "Updated description",
  "category": "search"
}
```

#### DELETE /api/nav/:id

Delete a navigation item.

**Headers:** `Authorization: Bearer <token>`

#### POST /api/nav/:id/view

Increment view count for a navigation item.

#### POST /api/nav/:id/star

Toggle star status for a navigation item.

**Headers:** `Authorization: Bearer <token>`

### 📁 Categories

#### GET /api/categories

Get all categories.

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": [
    {
      "id": "category_id",
      "name": "开发工具",
      "description": "编程开发相关工具",
      "icon": "code",
      "order": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/categories

Create a new category (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**

```json
{
  "name": "New Category",
  "description": "Category description",
  "icon": "icon-name",
  "order": 10
}
```

### ⭐ Favorites

#### GET /api/favorites

Get user's favorite navigation items.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": [
    {
      "id": "favorite_id",
      "navItem": {
        "id": "nav_id",
        "name": "Google",
        "url": "https://google.com",
        "description": "Search engine"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/favorites

Add navigation item to favorites.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "navItemId": "nav_id"
}
```

#### DELETE /api/favorites/:id

Remove item from favorites.

**Headers:** `Authorization: Bearer <token>`

### 📊 Statistics

#### GET /api/stats/ranking

Get navigation item rankings.

**Query Parameters:**

- `type` - Ranking type (view, star, news)
- `limit` - Number of items (default: 10)

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": {
    "view": [
      {
        "id": "nav_id",
        "name": "Google",
        "view": 1000,
        "authorName": "john_doe"
      }
    ],
    "star": [...],
    "news": [...]
  }
}
```

#### GET /api/stats/overview

Get general statistics overview.

**Response:**

```json
{
  "code": 1,
  "success": true,
  "data": {
    "totalNavItems": 100,
    "totalUsers": 50,
    "totalViews": 10000,
    "totalStars": 2000
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "code": 0,
  "success": false,
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authenticated**: 200 requests per minute per user
- **Admin**: 500 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Validation

### Navigation Item Validation

```json
{
  "name": {
    "type": "string",
    "required": true,
    "minLength": 1,
    "maxLength": 100
  },
  "url": {
    "type": "string",
    "required": true,
    "format": "url"
  },
  "description": {
    "type": "string",
    "maxLength": 500
  },
  "category": {
    "type": "string",
    "required": true
  }
}
```

### User Validation

```json
{
  "username": {
    "type": "string",
    "required": true,
    "minLength": 3,
    "maxLength": 30,
    "pattern": "^[a-zA-Z0-9_]+$"
  },
  "email": {
    "type": "string",
    "required": true,
    "format": "email"
  },
  "password": {
    "type": "string",
    "required": true,
    "minLength": 6,
    "maxLength": 100
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
class DoggyNavAPI {
  constructor(baseURL, token = null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    return response.json();
  }

  async login(email, password) {
    const result = await this.request('POST', '/api/login', {
      email,
      password,
    });

    if (result.success) {
      this.token = result.data.token;
    }

    return result;
  }

  async getNavItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/api/nav?${query}`);
  }

  async createNavItem(item) {
    return this.request('POST', '/api/nav', item);
  }
}

// Usage
const api = new DoggyNavAPI('http://localhost:3002');
await api.login('user@example.com', 'password123');
const navItems = await api.getNavItems({ category: 'search' });
```

### Python

```python
import requests
import json

class DoggyNavAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()

    def request(self, method, endpoint, data=None):
        headers = {'Content-Type': 'application/json'}

        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        response = self.session.request(
            method,
            f'{self.base_url}{endpoint}',
            headers=headers,
            json=data
        )

        return response.json()

    def login(self, email, password):
        result = self.request('POST', '/api/login', {
            'email': email,
            'password': password
        })

        if result.get('success'):
            self.token = result['data']['token']

        return result

    def get_nav_items(self, **params):
        query = '&'.join([f'{k}={v}' for k, v in params.items()])
        return self.request('GET', f'/api/nav?{query}')

# Usage
api = DoggyNavAPI('http://localhost:3002')
api.login('user@example.com', 'password123')
nav_items = api.get_nav_items(category='search')
```

## Testing

### Using curl

```bash
# Login
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get navigation items
curl -X GET "http://localhost:3002/api/nav?category=search" \
  -H "Authorization: Bearer <your-token>"

# Create navigation item
curl -X POST http://localhost:3002/api/nav \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Google",
    "url": "https://google.com",
    "description": "Search engine",
    "category": "search"
  }'
```

### Using Postman

Import the provided Postman collection: `docs/Doggy-Nav-API.postman_collection.json`

### API Testing

```bash
# Run API tests
cd packages/doggy-nav-server
pnpm test

# Run specific test suite
pnpm test -- --grep "API"
```

## Changelog

### v1.0.0

- Initial API release
- User authentication and management
- Navigation item CRUD operations
- Category management
- Favorites system
- Statistics endpoints
- Rate limiting implementation
