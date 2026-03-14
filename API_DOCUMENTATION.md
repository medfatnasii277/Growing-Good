# Growing Good API Documentation

**Base URL:** `http://localhost:3000`  
**API Docs (Swagger):** `http://localhost:3000/swagger-ui`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Content](#content)
3. [Progress](#progress)
4. [Admin](#admin)
5. [Content Types](#content-types)

---

## Authentication

### Register New User
```
bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "role": "user"  # Optional: "user" or "admin", default: "user"
}
```

**Response (201):**
```
json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user"
  }
}
```

### Login
```
bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```
json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Get Current User
```
bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```
json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Content

### List All Content
```
bash
GET /api/content
Authorization: Bearer <token>
```

**Response (200):**
```
json
{
  "content": [
    {
      "id": 1,
      "title": "Manners Quiz",
      "description": "Learn about polite words",
      "content_type": "quiz",
      "category_id": 1,
      "is_active": true
    }
  ]
}
```

### Get Content Details
```
bash
GET /api/content/:id
Authorization: Bearer <token>
```

**Response (200):**
```
json
{
  "id": 1,
  "title": "Manners Quiz",
  "description": "Learn about polite words",
  "content_type": "quiz",
  "category_id": 1,
  "data": {
    "questions": [...],
    "passing_score": 70
  },
  "is_active": true
}
```

### Validate Answer
```
bash
POST /api/content/:id/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "answer": { ... }
}
```

**Response (200):**
```
json
{
  "correct": true,
  "points": 10,
  "feedback": "Correct! The magic words are Please and Thank you!"
}
```

### Complete Content
```
bash
POST /api/content/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 80
}
```

**Response (200):**
```
json
{
  "id": 1,
  "user_id": 1,
  "content_id": 1,
  "completed": true,
  "score": 80,
  "completed_at": "2024-01-01T00:00:00Z"
}
```

### Get User Progress
```
bash
GET /api/progress
Authorization: Bearer <token>
```

**Response (200):**
```
json
{
  "progress": [
    {
      "id": 1,
      "user_id": 1,
      "content_id": 1,
      "completed": true,
      "score": 80,
      "completed_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin

### List All Users (Admin Only)
```
bash
GET /api/admin/users
Authorization: Bearer <admin_token>
```

**Response (200):**
```
json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Content (Admin Only)
```
bash
POST /api/admin/content
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Manners Quiz",
  "description": "Learn about polite words",
  "content_type": "quiz",
  "category_id": 1,
  "data": {
    "questions": [
      {
        "question": "What should you say when entering home?",
        "options": ["Nothing", "Hello", "I'm home!"],
        "correct_index": 2
      }
    ],
    "passing_score": 70
  }
}
```

**Response (201):**
```
json
{
  "id": 1,
  "title": "Manners Quiz",
  "content_type": "quiz",
  ...
}
```

### Update Content (Admin Only)
```
bash
PUT /api/admin/content/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "is_active": false
}
```

### Delete Content (Admin Only)
```
bash
DELETE /api/admin/content/:id
Authorization: Bearer <admin_token>
```

**Response (204):** No content

### List Categories
```
bash
GET /api/admin/categories
Authorization: Bearer <admin_token>
```

**Response (200):**
```
json
{
  "categories": [
    {
      "id": 1,
      "name": "Manners",
      "description": "Learn polite behavior"
    }
  ]
}
```

### Create Category
```
bash
POST /api/admin/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Safety",
  "description": "Learn about personal safety"
}
```

---

## Content Types

### Quiz
```
json
{
  "content_type": "quiz",
  "data": {
    "questions": [
      {
        "question": "What should you say when entering home?",
        "options": ["Nothing", "Hello", "I'm home!"],
        "correct_index": 2
      },
      {
        "question": "What are magic words?",
        "options": ["Abracadabra", "Please and Thank you", "Superhero names"],
        "correct_index": 1
      }
    ],
    "passing_score": 70
  }
}
```

**Answer Format:**
```
json
{
  "answer": {
    "question_index": 0,
    "selected_index": 2
  }
}
```

### Reading
```
json
{
  "content_type": "reading",
  "data": {
    "title": "The Magic Words",
    "content": "Once upon a time, there was a polite child named Lily...",
    "reading_time_minutes": 5,
    "moral": "Always use polite words like Please and Thank you"
  }
}
```

**Answer Format (for reading - auto-complete):**
```
json
{
  "answer": {
    "finished": true
  }
}
```

### Click Game
```
json
{
  "content_type": "click_game",
  "data": {
    "scenario": "You see a stranger approaching you at the park...",
    "correct_items": ["run_to_parent", "call_for_help"],
    "wrong_items": ["talk_to_stranger", "accept_gift"],
    "time_limit_seconds": 30
  }
}
```

**Answer Format:**
```
json
{
  "answer": {
    "selected_items": ["run_to_parent", "call_for_help"]
  }
}
```

---

## Error Responses

### 401 Unauthorized
```
json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```
json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```
json
{
  "error": "Resource not found"
}
```

### 422 Validation Error
```
json
{
  "error": "Validation failed",
  "details": "..."
}
```

---

## Example: Complete User Flow

1. **Register as admin:**
```
bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

2. **Login to get token:**
```
bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

3. **Create content (as admin):**
```
bash
curl -X POST http://localhost:3000/api/admin/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Manners Quiz","content_type":"quiz","data":{"questions":[{"question":"What should you say when entering home?","options":["Nothing","Hello","I am home!"],"correct_index":2}],"passing_score":70}}'
```

4. **Register as user:**
```
bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"child1","password":"password123"}'
```

5. **List content (as user):**
```
bash
curl -X GET http://localhost:3000/api/content \
  -H "Authorization: Bearer USER_TOKEN"
```

6. **Complete content (as user):**
```
bash
curl -X POST http://localhost:3000/api/content/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"score":100}'
```

---

## Default Admin Credentials
- **Username:** admin
- **Password:** admin123

---

*Generated for Growing Good - Children's Education Platform*
