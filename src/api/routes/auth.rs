use crate::api::middleware::auth::auth_middleware;
use crate::application::{AuthError, AuthService};
use crate::domain::{CreateUserRequest, UpdateProfileRequest, UserResponse};
use crate::infrastructure::Database;
use axum::{
    extract,
    extract::State,
    http::StatusCode,
    middleware,
    response::Json,
    routing::{get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
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
        db: db.clone(),
        jwt_secret: jwt_secret.clone(),
        jwt_expiration,
    };

    // Public auth routes (no middleware)
    let public_routes = Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login));

    // Protected auth routes (with auth middleware)
    let protected_routes = Router::new()
        .route("/api/auth/me", get(me))
        .route("/api/auth/profile", put(update_profile))
        .layer(middleware::from_fn(auth_middleware));

    public_routes.merge(protected_routes).with_state(state)
}

async fn register(
    State(state): State<AuthState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        state.db.clone(),
        state.jwt_secret.clone(),
        state.jwt_expiration,
    );
    let user_response = auth_service
        .register(payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;

    // Generate token for the newly registered user
    let user = auth_service
        .get_user_by_username(&user_response.username)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    let token = auth_service
        .generate_token(&user)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    Ok(Json(LoginResponse {
        token,
        user: UserResponse {
            id: user_response.id,
            username: user_response.username,
            role: user_response.role,
            avatar: user.avatar,
            created_at: user_response.created_at,
        },
    }))
}

async fn login(
    State(state): State<AuthState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        state.db.clone(),
        state.jwt_secret.clone(),
        state.jwt_expiration,
    );

    let token = auth_service
        .login(&payload.username, &payload.password)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;

    let user = auth_service
        .get_user_from_token(&token)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;

    Ok(Json(LoginResponse {
        token,
        user: UserResponse {
            id: user.id,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            created_at: user.created_at,
        },
    }))
}

async fn me(
    State(_state): State<AuthState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        _state.db.clone(),
        _state.jwt_secret.clone(),
        _state.jwt_expiration,
    );
    let user = auth_service
        .get_user_from_token(&token)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;

    Ok(Json(UserResponse {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
    }))
}

async fn update_profile(
    State(_state): State<AuthState>,
    extract::Extension(token): extract::Extension<String>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        _state.db.clone(),
        _state.jwt_secret.clone(),
        _state.jwt_expiration,
    );
    let claims = auth_service
        .verify_token(&token)
        .map_err(|e| (StatusCode::UNAUTHORIZED, Json(ApiError::from(e))))?;

    let user = auth_service
        .update_profile(claims.user_id, payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;

    Ok(Json(UserResponse {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
    }))
}
