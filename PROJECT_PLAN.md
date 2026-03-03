# Safety Education Platform for Children - Project Plan

## 1. Project Overview

**Project Name:** Safety Kids - Manners & Respect Education Platform  
**Type:** RESTful Backend API (Rust)  
**Core Functionality:** An extensible educational platform teaching children manners, respect for parents, and self-handling skills through interactive content (quizzes, reading, click games)  
**Target Users:** Children (ages 5-12) and Administrators

---

## 2. Architecture Design

### 2.1 Technology Stack
- **Language:** Rust (Edition 2021)
- **Web Framework:** Axum (async, type-safe, ergonomic)
- **Database:** SQLite with rusqlite/sqlx (embedded)
- **Authentication:** JWT-based auth
- **Serialization:** Serde + JSON

### 2.2 Extensible Design Pattern
To support adding new content types without modifying core code:
- **Content Type Trait System:** Each content type implements a common trait
- **Module Registration:** Dynamic content type registration
- **Plugin-like Architecture:** New content types can be added as separate modules

```
src/
├── main.rs                 # Entry point
├── lib.rs                  # Library root
├── config/                 # Configuration
├── domain/                 # Domain models & traits
│   ├── mod.rs
│   ├── content.rs          # Content trait definitions
│   ├── user.rs             # User models
│   └── quiz.rs             # Quiz models
├── application/            # Business logic
│   ├── mod.rs
│   ├── content_service.rs  # Content management
│   ├── auth_service.rs     # Authentication
│   └── game_service.rs     # Game logic
├── infrastructure/         # External integrations
│   ├── mod.rs
│   ├── database.rs         # SQLite connection & migrations
│   ├── repositories/       # Data access
│   └── api/                # HTTP handlers
├── api/                    # HTTP layer
│   ├── mod.rs
│   ├── routes/
│   └── middleware/
└── content_types/          # Extensible content modules
    ├── mod.rs
    ├── quiz/               # Quiz content type
    ├── reading/            # Reading content type
    └── click_game/         # Click game content type
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Users table (both children and admins)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content items (extensible type system)
CREATE TABLE content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,  -- 'quiz', 'reading', 'click_game', etc.
    category_id INTEGER REFERENCES categories(id),
    data JSON NOT NULL,          -- Type-specific data (JSON blob)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES content_items(id),
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(user_id, content_id)
);

-- Admin audit log
CREATE TABLE admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Endpoints

### 4.1 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login & get JWT | Public |
| GET | /api/auth/me | Get current user | Authenticated |

### 4.2 Content (User)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/content | List all content | User |
| GET | /api/content/:id | Get content details | User |
| POST | /api/content/:id/complete | Mark as completed | User |
| GET | /api/content/:id/validate | Validate answer/play | User |

### 4.3 Content (Admin)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/admin/content | Create content | Admin |
| PUT | /api/admin/content/:id | Update content | Admin |
| DELETE | /api/admin/content/:id | Delete content | Admin |
| GET | /api/admin/content | List all (including inactive) | Admin |

### 4.4 Categories (Admin)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/admin/categories | Create category | Admin |
| GET | /api/admin/categories | List categories | Admin |

### 4.5 User Management (Admin)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/admin/users | List all users | Admin |
| GET | /api/admin/users/:id | Get user details | Admin |
| PUT | /api/admin/users/:id | Update user | Admin |

---

## 5. Content Type System (Extensible)

### 5.1 Content Trait
```rust
pub trait ContentType: Send + Sync {
    fn content_type(&self) -> &str;
    fn validate(&self, data: &Value) -> Result<(), ContentError>;
    fn get_points(&self, answer: &Value) -> u32;
}
```

### 5.2 Supported Content Types

#### Quiz
```json
{
  "questions": [
    {
      "question": "What should you say when entering home?",
      "options": ["Nothing", "Hello", "I'm home!"],
      "correct_index": 2
    }
  ],
  "passing_score": 70
}
```

#### Reading
```json
{
  "title": "The Magic Words",
  "content": "Story content here...",
  "reading_time_minutes": 5,
  "moral": "Always use polite words"
}
```

#### Click Game
```json
{
  "scenario": "You see a stranger approaching...",
  "correct_items": ["run_to_parent", "call_for_help"],
  "wrong_items": ["talk_to_stranger", "accept_gift"],
  "time_limit_seconds": 30
}
```

---

## 6. Implementation Steps

### Phase 1: Foundation
1. Update Cargo.toml with dependencies (axum, serde, rusqlite, etc.)
2. Set up project structure
3. Configure logging

### Phase 2: Database & Models
4. Implement database connection and migrations
5. Create domain models (User, Content, Category, Progress)
6. Implement repositories (CRUD operations)

### Phase 3: Authentication
7. Implement JWT authentication
8. Create auth middleware
9. Role-based access control

### Phase 4: Core API
10. Implement content listing and retrieval
11. Implement progress tracking
12. Implement quiz/reading/game validation

### Phase 5: Admin Features
13. Admin content management (CRUD)
14. Category management
15. User management
16. Audit logging

### Phase 6: Content Types
17. Implement Quiz content type
18. Implement Reading content type
19. Implement Click Game content type

---

## 7. Acceptance Criteria

- [ ] Project compiles without errors
- [ ] SQLite database initializes with schema
- [ ] Users can register and login
- [ ] JWT tokens work for authentication
- [ ] Admins can create/update/delete content
- [ ] Users can browse and complete content
- [ ] Progress is tracked per user
- [ ] New content types can be added without modifying core
- [ ] Code is well-organized and documented

---

## 8. Dependencies (to add to Cargo.toml)

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.31", features = ["bundled"] }
jsonwebtoken = "9"
bcrypt = "0.15"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
tracing = "0.1"
tracing-subscriber = "0.3"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }

[dev-dependencies]
```

---

*Plan created for Safety Kids - Children's Education Platform*

