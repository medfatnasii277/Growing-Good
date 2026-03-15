use crate::api::middleware::auth::auth_middleware;
use crate::application::{AuthService, ContentService, ContentServiceError};
use crate::domain::{
    Category, ContentItemResponse, CreateCategoryRequest, CreateContentRequest,
    UpdateContentRequest, UserResponse,
};
use crate::infrastructure::{Database, UserRepository};
use axum::{
    extract,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::Serialize;
use std::sync::Arc;

#[derive(Clone)]
struct AdminState {
    db: Arc<Database>,
    content_service: Arc<ContentService>,
    jwt_secret: String,
    jwt_expiration: i64,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}

impl From<ContentServiceError> for ApiError {
    fn from(err: ContentServiceError) -> Self {
        ApiError {
            error: err.to_string(),
        }
    }
}

pub fn create_router(db: Arc<Database>, jwt_secret: String, jwt_expiration: i64) -> Router {
    let content_service = ContentService::new(db.clone());

    let state = AdminState {
        db: db.clone(),
        content_service: Arc::new(content_service),
        jwt_secret,
        jwt_expiration,
    };

    Router::new()
        // Content management
        .route("/api/admin/content", get(admin_list_content))
        .route("/api/admin/content", post(admin_create_content))
        .route("/api/admin/content/:id", get(admin_get_content))
        .route("/api/admin/content/:id", put(admin_update_content))
        .route("/api/admin/content/:id", delete(admin_delete_content))
        // Category management
        .route("/api/admin/categories", get(admin_list_categories))
        .route("/api/admin/categories", post(admin_create_category))
        .route("/api/admin/categories/:id", delete(admin_delete_category))
        // User management
        .route("/api/admin/users", get(admin_list_users))
        .route("/api/admin/users/:id", get(admin_get_user))
        .layer(middleware::from_fn(auth_middleware))
        .with_state(state)
}

// Content Admin Routes
async fn admin_list_content(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<Vec<ContentItemResponse>>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let content = state
        .content_service
        .admin_get_all_content()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn admin_get_content(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
) -> Result<Json<ContentItemResponse>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let content = state
        .content_service
        .admin_get_all_content()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "Content not found".to_string(),
            }),
        ))?;
    Ok(Json(content))
}

async fn admin_create_content(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Json(payload): Json<CreateContentRequest>,
) -> Result<Json<ContentItemResponse>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let content = state
        .content_service
        .admin_create_content(payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn admin_update_content(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateContentRequest>,
) -> Result<Json<ContentItemResponse>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let content = state
        .content_service
        .admin_update_content(id, payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn admin_delete_content(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    state
        .content_service
        .admin_delete_content(id)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(
        serde_json::json!({ "message": "Content deleted successfully" }),
    ))
}

// Category Admin Routes
async fn admin_list_categories(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<Vec<Category>>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let categories = state
        .content_service
        .get_categories()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(categories))
}

async fn admin_create_category(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<Json<Category>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let category = state
        .content_service
        .create_category(payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(category))
}

async fn admin_delete_category(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    state
        .content_service
        .delete_category(id)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(
        serde_json::json!({ "message": "Category deleted successfully" }),
    ))
}

// User Admin Routes
async fn admin_list_users(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let repo = UserRepository::new(&state.db);
    let users = repo
        .find_all()
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError {
                    error: e.to_string(),
                }),
            )
        })?
        .into_iter()
        .map(|u| UserResponse {
            id: u.id,
            username: u.username,
            role: u.role,
            avatar: u.avatar,
            created_at: u.created_at,
        })
        .collect();
    Ok(Json(users))
}

async fn admin_get_user(
    State(state): State<AdminState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ApiError>)> {
    ensure_admin(&state, &token)?;
    let repo = UserRepository::new(&state.db);
    let user = repo.find_by_id(id).map_err(|e| {
        (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: e.to_string(),
            }),
        )
    })?;
    Ok(Json(UserResponse {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
    }))
}

fn ensure_admin(state: &AdminState, token: &str) -> Result<(), (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        state.db.clone(),
        state.jwt_secret.clone(),
        state.jwt_expiration,
    );
    let claims = auth_service.verify_token(token).map_err(|e| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ApiError {
                error: e.to_string(),
            }),
        )
    })?;

    if claims.role == "admin" {
        Ok(())
    } else {
        Err((
            StatusCode::FORBIDDEN,
            Json(ApiError {
                error: "Admin access required".to_string(),
            }),
        ))
    }
}
