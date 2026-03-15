use crate::api::middleware::auth::auth_middleware;
use crate::application::{
    AuthService, ContentService, ContentServiceError, GameError, GameService, LearningJourneyError,
    LearningJourneyService,
};
use crate::domain::{
    Category, ContentItemResponse, LearningJourneyResponse, UserProgress, ValidateAnswerRequest,
    ValidateAnswerResponse,
};
use crate::infrastructure::repositories::progress_repository::LeaderboardEntry;
use crate::infrastructure::Database;
use axum::{
    extract,
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use serde::Serialize;
use std::sync::Arc;

#[derive(Clone)]
struct ContentState {
    db: Arc<Database>,
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

impl From<GameError> for ApiError {
    fn from(err: GameError) -> Self {
        ApiError {
            error: err.to_string(),
        }
    }
}

impl From<LearningJourneyError> for ApiError {
    fn from(err: LearningJourneyError) -> Self {
        ApiError {
            error: err.to_string(),
        }
    }
}

pub fn create_router(db: Arc<Database>, jwt_secret: String, jwt_expiration: i64) -> Router {
    let state = ContentState {
        db,
        jwt_secret,
        jwt_expiration,
    };

    let public_routes = Router::new()
        .route("/api/content", get(list_content))
        .route("/api/content/:id", get(get_content))
        .route("/api/content/:id/validate", post(validate_content))
        // Leaderboard routes
        .route("/api/leaderboard", get(get_leaderboard))
        .route(
            "/api/leaderboard/user/:user_id",
            get(get_user_leaderboard_rank),
        )
        // Category routes
        .route("/api/categories", get(list_categories));

    let protected_routes = Router::new()
        .route("/api/content/:id/complete", post(complete_content))
        .route("/api/content/progress", get(get_user_progress))
        .route("/api/content/stats", get(get_user_stats))
        .route("/api/content/recommendations", get(get_recommendations))
        .route(
            "/api/leaderboard/me",
            get(get_current_user_leaderboard_rank),
        )
        .layer(middleware::from_fn(auth_middleware));

    public_routes.merge(protected_routes).with_state(state)
}

async fn list_content(
    State(state): State<ContentState>,
) -> Result<Json<Vec<ContentItemResponse>>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let content = content_service
        .get_all_content()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn get_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
) -> Result<Json<ContentItemResponse>, (StatusCode, Json<ApiError>)> {
    let content_service = ContentService::new(state.db.clone());
    let content = content_service
        .get_content(id)
        .map_err(|e| (StatusCode::NOT_FOUND, Json(ApiError::from(e))))?;
    Ok(Json(content))
}

async fn validate_content(
    State(state): State<ContentState>,
    Path(id): Path<i64>,
    Json(payload): Json<ValidateAnswerRequest>,
) -> Result<Json<ValidateAnswerResponse>, (StatusCode, Json<ApiError>)> {
    let game_service = GameService::new(state.db.clone());
    let result = game_service
        .validate_answer(id, payload)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
struct CompleteContentBody {
    score: i32,
    duration_seconds: Option<i32>,
}

async fn complete_content(
    State(state): State<ContentState>,
    extract::Extension(token): extract::Extension<String>,
    Path(id): Path<i64>,
    Json(payload): Json<CompleteContentBody>,
) -> Result<Json<UserProgress>, (StatusCode, Json<ApiError>)> {
    let user_id = current_user_id(&state, &token)?;
    let game_service = GameService::new(state.db.clone());
    let progress = game_service
        .complete_content(user_id, id, payload.score, payload.duration_seconds)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::from(e))))?;
    Ok(Json(progress))
}

async fn get_user_progress(
    State(state): State<ContentState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<Vec<UserProgress>>, (StatusCode, Json<ApiError>)> {
    let user_id = current_user_id(&state, &token)?;
    let game_service = GameService::new(state.db.clone());
    let progress = game_service
        .get_user_progress(user_id)
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
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<UserStatsResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = current_user_id(&state, &token)?;
    let game_service = GameService::new(state.db.clone());
    let stats = game_service
        .get_user_stats(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(UserStatsResponse {
        completed_count: stats.completed_count,
        total_score: stats.total_score,
    }))
}

async fn get_recommendations(
    State(state): State<ContentState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<LearningJourneyResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = current_user_id(&state, &token)?;
    let journey_service = LearningJourneyService::new(state.db.clone());
    let recommendations = journey_service
        .get_recommendations(user_id, 3)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(recommendations))
}

#[derive(Debug, Deserialize)]
struct LeaderboardQuery {
    limit: Option<i64>,
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

    let entries = game_service
        .get_leaderboard(limit)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    Ok(Json(LeaderboardResponse {
        entries,
        user_rank: None,
        user_score: None,
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

    let rank = game_service
        .get_user_rank(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    let stats = game_service
        .get_user_stats(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    Ok(Json(UserRankResponse {
        rank,
        total_score: stats.total_score,
    }))
}

async fn get_current_user_leaderboard_rank(
    State(state): State<ContentState>,
    extract::Extension(token): extract::Extension<String>,
) -> Result<Json<UserRankResponse>, (StatusCode, Json<ApiError>)> {
    let user_id = current_user_id(&state, &token)?;
    let game_service = GameService::new(state.db.clone());

    let rank = game_service
        .get_user_rank(user_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;

    let stats = game_service
        .get_user_stats(user_id)
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
    let categories = content_service
        .get_categories()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::from(e))))?;
    Ok(Json(categories))
}

fn current_user_id(state: &ContentState, token: &str) -> Result<i64, (StatusCode, Json<ApiError>)> {
    let auth_service = AuthService::new(
        state.db.clone(),
        state.jwt_secret.clone(),
        state.jwt_expiration,
    );
    auth_service
        .verify_token(token)
        .map(|claims| claims.user_id)
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ApiError {
                    error: e.to_string(),
                }),
            )
        })
}
