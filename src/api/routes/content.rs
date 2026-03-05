use axum::{
    extract::{State, Path},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Serialize;
use crate::application::{ContentService, ContentServiceError, GameService, GameError};
use crate::domain::{
    ContentItemResponse, Category,
    ValidateAnswerRequest, ValidateAnswerResponse, UserProgress
};
use crate::infrastructure::Database;
use std::sync::Arc;

#[derive(Clone)]
struct ContentState {
    db: Arc<Database>,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}

impl From<ContentServiceError> for ApiError {
    fn from(err: ContentServiceError) -> Self {
        ApiError { error: err.to_string() }
    }
}

impl From<GameError> for ApiError {
    fn from(err: GameError) -> Self {
        ApiError { error: err.to_string() }
    }
}

pub fn create_router(db: Arc<Database>) -> Router {
    let state = ContentState { db };
    
    Router::new()
        // Public routes (for authenticated users)
        .route("/api/content", get(list_content))
        .route("/api/content/:id", get(get_content))
        .route("/api/content/:id/validate", post(validate_content))
        .route("/api/content/:id/complete", post(complete_content))
        .route("/api/content/progress", get(get_user_progress))
        .route("/api/content/stats", get(get_user_stats))
        // Category routes
        .route("/api/categories", get(list_categories))
        .with_state(state)
}

async fn list_content(
    State(state): State<ContentState>,
) -> Result<Json<Vec<ContentItemResponse>>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let content = content_service.get_all_content()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn get_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
) -> Result<Json<ContentItemResponse>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let content = content_service.get_content(id)
        .map_err(|e| (StatusCode::NOT_FOUND, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn validate_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
    Json(payload): Json<ValidateAnswerRequest>,
) -> Result<Json<ValidateAnswerResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let result = game_service.validate_answer(id, payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(result))
}

async fn complete_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
    Json(payload): Json<CompleteContentRequest>,
    extract::Extension(user_id): extract::Extension<i64>,
) -> Result<Json<UserProgress>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let progress = game_service.complete_content(user_id, id, payload.score)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(progress))
)

async fn get_user_progress(
    State(state): State<ContentState>,
    extract::Extension(user_id): extract::Extension<i64>,
) -> Result<Json<Vec<UserProgress>>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let progress = game_service.get_user_progress(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(progress))
)

#[derive(Debug, Serialize)]
struct UserStatsResponse {
    completed_count: i64,
    total_score: i64,
}

async fn get_user_stats(
    State(state): State<ContentState>,
    extract::Extension(user_id): extract::Extension<i64>,
) -> Result<Json<UserStatsResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let stats = game_service.get_user_stats(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(UserStatsResponse {
        completed_count: stats.completed_count,
        total_score: stats.total_score,
    }))
)

async fn list_categories(
    State(state): State<ContentState>,
) -> Result<Json<Vec<Category>>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let categories = content_service.get_categories()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(categories))
}

// Re-export from domain
use crate::domain::CompleteContentRequest;
