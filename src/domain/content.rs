use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentType {
    #[serde(rename = "quiz")]
    Quiz,
    #[serde(rename = "reading")]
    Reading,
    #[serde(rename = "click_game")]
    ClickGame,
}

impl std::fmt::Display for ContentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ContentType::Quiz => write!(f, "quiz"),
            ContentType::Reading => write!(f, "reading"),
            ContentType::ClickGame => write!(f, "click_game"),
        }
    }
}

impl std::str::FromStr for ContentType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "quiz" => Ok(ContentType::Quiz),
            "reading" => Ok(ContentType::Reading),
            "click_game" => Ok(ContentType::ClickGame),
            _ => Err(format!("Unknown content type: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentItem {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub content_type: ContentType,
    pub category_id: Option<i64>,
    pub data: serde_json::Value,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateContentRequest {
    pub title: String,
    pub description: Option<String>,
    pub content_type: ContentType,
    pub category_id: Option<i64>,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateContentRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub content_type: Option<ContentType>,
    pub category_id: Option<i64>,
    pub data: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentItemResponse {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub content_type: ContentType,
    pub category_id: Option<i64>,
    pub data: serde_json::Value,
    pub is_active: bool,
}
