use utoipa::{OpenApi, ToSchema};
use serde::{Deserialize, Serialize};

/// Login request payload
#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginRequest {
    #[schema(example = "admin")]
    pub username: String,
    #[schema(example = "admin123")]
    pub password: String,
}

/// Login response with JWT token
#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    #[schema(example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")]
    pub token: String,
    pub user: UserInfo,
}

/// User information
#[derive(Debug, Serialize, ToSchema)]
pub struct UserInfo {
    pub id: i64,
    #[schema(example = "admin")]
    pub username: String,
    #[schema(example = "admin")]
    pub role: String,
}

/// Register request payload
#[derive(Debug, Deserialize, ToSchema)]
pub struct RegisterRequest {
    #[schema(example = "john_doe")]
    pub username: String,
    #[schema(example = "password123")]
    pub password: String,
    #[schema(example = "user", value_type = Option<String>)]
    pub role: Option<String>,
}

/// Content item response
#[derive(Debug, Serialize, ToSchema)]
pub struct ContentResponse {
    pub id: i64,
    #[schema(example = "Manners Quiz")]
    pub title: String,
    pub description: Option<String>,
    #[schema(example = "quiz")]
    pub content_type: String,
    pub category_id: Option<i64>,
    pub data: serde_json::Value,
    pub is_active: bool,
}

/// Category response
#[derive(Debug, Serialize, ToSchema)]
pub struct CategoryResponse {
    pub id: i64,
    #[schema(example = "Manners")]
    pub name: String,
    pub description: Option<String>,
}

/// Progress response
#[derive(Debug, Serialize, ToSchema)]
pub struct ProgressResponse {
    pub id: i64,
    pub user_id: i64,
    pub content_id: i64,
    pub completed: bool,
    pub score: Option<i32>,
    pub completed_at: Option<String>,
}

/// Error response
#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    pub error: String,
}

/// API Documentation
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Growing Good API",
        description = r#"
# Growing Good - Children's Education Platform API

## Authentication
All endpoints (except /api/auth/login and /api/auth/register) require a JWT token in the Authorization header.

## User Roles
- **admin**: Can manage content, categories, and users
- **user**: Can browse content, take quizzes, and track progress

## Endpoints

### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login and get JWT token

### Content (User)
- GET /api/content - List all active content
- GET /api/content/:id - Get content details
- POST /api/content/:id/validate - Validate answer
- POST /api/content/:id/complete - Mark content as completed

### Admin
- GET /api/admin/users - List all users
- POST /api/admin/content - Create content
- PUT /api/admin/content/:id - Update content
- DELETE /api/admin/content/:id - Delete content
- GET /api/admin/categories - List categories
- POST /api/admin/categories - Create category
        "#,
        version = "0.1.0",
        contact(
            name = "Growing Good Team",
            email = "info@growinggood.com"
        )
    ),
    components(
        schemas(
            LoginRequest,
            LoginResponse,
            UserInfo,
            RegisterRequest,
            ContentResponse,
            CategoryResponse,
            ProgressResponse,
            ErrorResponse,
        )
    ),
    tags(
        (name = "Auth", description = "Authentication endpoints"),
        (name = "Content", description = "User content endpoints"),
        (name = "Admin", description = "Admin management endpoints"),
    )
)]
pub struct ApiDoc;
