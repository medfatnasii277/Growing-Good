// Content Types Module
// This module provides extensibility for adding new content types
// Each content type implements the ContentType trait

pub mod quiz;
pub mod reading;
pub mod click_game;

// Re-export content types for easy access
pub use quiz::QuizContent;
pub use reading::ReadingContent;
pub use click_game::ClickGameContent;

use serde::{Deserialize, Serialize};

/// Trait for extensible content types
pub trait ContentTypeTrait: Send + Sync {
    fn content_type(&self) -> &str;
    fn validate(&self, data: &serde_json::Value) -> Result<ValidationResult, String>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub correct: bool,
    pub points: i32,
    pub feedback: String,
}
