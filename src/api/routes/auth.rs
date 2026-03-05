use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use crate::application::{AuthService, AuthError};
use crate::domain::{CreateUserRequest, UserResponse};
use crate::infrastructure::Database;
use std::sync::Arc;

#[derive(Clone)]
struct AuthState {
    db: Arc<Database>,
    jwt_secret: String,
    jwt_expiration: i64,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}

impl From<AuthError> for ApiError {
    fn from(err: AuthError) -> Self {
        ApiError {
            error: err.to_string(),
        }
    }
}

pub fn create_router(db: Arc<Database>, jwt_secret: String, jwt_expiration: i64) -> Router {
    let state = AuthState {
        db,
        jwt_secret,
        jwt_expiration,
    };
    
    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/me", get(me))
        .with_state(state)
}

async fn register(
    State(state): State<AuthState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(state.db.clone(), state.jwt_secret.clone(), state.jwt_expiration);
    let user_response = auth_service.register(payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    
    // Generate token for the newly registered user
    let user = auth_service.get_user_by_username(&user_response.username)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    
    let token = auth_service.generate_token(&user)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    
    Ok(Json(LoginResponse {
        token,
        user: UserResponse {
            id: user_response.id,
            username: user_response.username,
            role: user_response.role,
            created_at: user_response.created_at,
        },
    }))
}

async fn login(
    State(state): State<AuthState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(state.db.clone(), state.jwt_secret.clone(), state.jwt_expiration);
    
    let token = auth_service.login(&payload.username, &payload.password)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;
    
    let user = auth_service.get_user_from_token(&token)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;
    
    Ok(Json(LoginResponse {
        token,
        user: UserResponse {
            id: user.id,
            username: user.username,
            role: user.role,
            created_at: user.created_at,
        },
    }))
}

async fn me(
    State(_state): State<AuthState>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ApiError>)> {
    // This is a placeholder - in a real app, we'd get the token from the request
    Err((StatusCode::UNAUTHORIZED, Json(ApiError { error: "Not implemented".to_string() })))
}
