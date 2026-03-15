use crate::domain::ContentItemResponse;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeakArea {
    pub category_id: Option<i64>,
    pub category_name: String,
    pub average_score: f64,
    pub average_duration_seconds: Option<f64>,
    pub attempt_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedContent {
    pub content: ContentItemResponse,
    pub reason: String,
    pub estimated_duration_seconds: i64,
    pub match_score: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningJourneyResponse {
    pub focus_message: String,
    pub recommendations: Vec<RecommendedContent>,
    pub weak_areas: Vec<WeakArea>,
}
