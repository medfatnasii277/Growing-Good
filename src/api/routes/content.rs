use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Serialize;
use serde::Deserialize;
use crate::application::{ContentService, ContentServiceError, GameService, GameError};
use crate::domain::{
    ContentItemResponse, Category,
    ValidateAnswerRequest, ValidateAnswerResponse, UserProgress
};
use crate::infrastructure::Database;
use crate::infrastructure::repositories::progress_repository::LeaderboardEntry;
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
        .route("/api/content", get(list_content))
        .route("/api/content/:id", get(get_content))
        .route("/api/content/:id/validate", post(validate_content))
        .route("/api/content/:id/complete", post(complete_content))
        .route("/api/content/progress", get(get_user_progress))
        .route("/api/content/stats", get(get_user_stats))
        // Leaderboard routes
        .route("/api/leaderboard", get(get_leaderboard))
        .route("/api/leaderboard/user/:user_id", get(get_user_leaderboard_rank))
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

#[derive(Deserialize)]
struct CompleteContentBody {
    user_id: i64,
    score: i32,
}

async fn complete_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
    Json(payload): Json<CompleteContentBody>,
) -> Result<Json<UserProgress>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let progress = game_service.complete_content(payload.user_id, id, payload.score)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(progress))
}

#[derive(Deserialize)]
struct UserQuery {
    user_id: i64,
}

async fn get_user_progress(
    State(state): State<ContentState>,
    Query(query): Query<UserQuery>,
) -> Result<Json<Vec<UserProgress>>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let progress = game_service.get_user_progress(query.user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(progress))
}

#[derive(Debug, Serialize)]
struct UserStatsResponse {
    completed_count: i64,
    total_score: i64,
}

async fn get_user_stats(
    State(state): State<ContentState>,
    Query(query): Query<UserQuery>,
) -> Result<Json<UserStatsResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let stats = game_service.get_user_stats(query.user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(UserStatsResponse {
        completed_count: stats.completed_count,
        total_score: stats.total_score,
    }))
}

#[derive(Debug, Deserialize)]
struct LeaderboardQuery {
    limit: Option<i64>,
    user_id: Option<i64>,
}

#[derive(Debug, Serialize)]
struct LeaderboardResponse {
    entries: Vec<LeaderboardEntry>,
    user_rank: Option<i64>,
    user_score: Option<i64>,
}

async fn get_leaderboard(
    State(state): State<ContentState>,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<LeaderboardResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let limit = query.limit.unwrap_or(10);
    
    let entries = game_service.get_leaderboard(limit)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    
    let (user_rank, user_score) = if let Some(uid) = query.user_id {
        match game_service.get_user_rank(uid) {
            Ok(rank) => {
                let score = game_service.get_user_stats(uid)
                    .map(|s| s.total_score)
                    .unwrap_or(0);
                (Some(rank), Some(score))
            },
            Err(_) => (None, None),
        }
    } else {
        (None, None)
    };
    
    Ok(Json(LeaderboardResponse {
        entries,
        user_rank,
        user_score,
    }))
}

#[derive(Debug, Serialize)]
struct UserRankResponse {
    rank: i64,
    total_score: i64,
}

async fn get_user_leaderboard_rank(
    State(state): State<ContentState>,
    Path(user_id): Path<i64>,
) -> Result<Json<UserRankResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    
    let rank = game_service.get_user_rank(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    
    let stats = game_service.get_user_stats(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    
    Ok(Json(UserRankResponse {
        rank,
        total_score: stats.total_score,
    }))
}

async fn list_categories(
    State(state): State<ContentState>,
) -> Result<Json<Vec<Category>>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let categories = content_service.get_categories()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(categories))
}
