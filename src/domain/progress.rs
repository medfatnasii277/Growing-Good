use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProgress {
    pub id: i64,
    pub user_id: i64,
    pub content_id: i64,
    pub completed: bool,
    pub score: Option<i32>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteContentRequest {
    pub score: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressResponse {
    pub id: i64,
    pub user_id: i64,
    pub content_id: i64,
    pub completed: bool,
    pub score: Option<i32>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateAnswerRequest {
    pub answer: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateAnswerResponse {
    pub correct: bool,
    pub points: i32,
    pub feedback: String,
}
