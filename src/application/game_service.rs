use crate::domain::{ContentItem, ContentType, UserProgress, CompleteContentRequest, ValidateAnswerRequest, ValidateAnswerResponse};
use crate::infrastructure::{Database, ContentRepository, ProgressRepository, ContentError, ProgressError};
use serde_json::Value;
use thiserror::Error;
use std::sync::Arc;

#[derive(Error, Debug)]
pub enum GameError {
    #[error("Content error: {0}")]
    ContentError(#[from] ContentError),
    #[error("Progress error: {0}")]
    ProgressError(#[from] ProgressError),
    #[error("Invalid content type")]
    InvalidContentType,
}

pub struct GameService {
    db: Arc<Database>,
}

impl GameService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn validate_answer(&self, content_id: i64, request: ValidateAnswerRequest) -> Result<ValidateAnswerResponse, GameError> {
        let content_repo = ContentRepository::new(&self.db);
        let content = content_repo.find_by_id(content_id)?;
        
        let answer = request.answer;
        
        match content.content_type {
            ContentType::Quiz => self.validate_quiz(&content.data, answer),
            ContentType::Reading => self.validate_reading(&content.data, answer),
            ContentType::ClickGame => self.validate_click_game(&content.data, answer),
        }
    }

    fn validate_quiz(&self, data: &Value, answer: Value) -> Result<ValidateAnswerResponse, GameError> {
        // Quiz validation: check if selected index matches correct answer
        let questions = data.get("questions").and_then(|q| q.as_array());
        
        if let Some(questions) = questions {
            let total_questions = questions.len();
            let mut correct_count = 0;
            let mut feedback_parts = Vec::new();
            
            // Handle single answer or array of answers
            let answers = if answer.is_array() {
                answer.as_array().unwrap().clone()
            } else {
                vec![answer]
            };
            
            for (idx, ans) in answers.iter().enumerate() {
                if let (Some(question_obj), Some(selected_idx)) = (
                    questions.get(idx),
                    ans.get("selected_index").and_then(|v| v.as_i64())
                ) {
                    let correct_idx = question_obj.get("correct_index")
                        .and_then(|v| v.as_i64())
                        .unwrap_or(-1);
                    
                    if selected_idx == correct_idx {
                        correct_count += 1;
                        feedback_parts.push(format!("Question {}: Correct! 🎉", idx + 1));
                    } else {
                        let question_text = question_obj.get("question")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Question");
                        feedback_parts.push(format!("Question {}: Not quite. The correct answer was: {}", idx + 1, question_text));
                    }
                }
            }
            
            let total_points = (correct_count as f64 / total_questions as f64 * 100.0) as i32;
            let correct = total_points >= 70; // 70% to pass
            
            Ok(ValidateAnswerResponse {
                correct,
                points: total_points,
                feedback: feedback_parts.join("\n"),
            })
        } else {
            Ok(ValidateAnswerResponse {
                correct: false,
                points: 0,
                feedback: "Invalid quiz format".to_string(),
            })
        }
    }

    fn validate_reading(&self, data: &Value, answer: Value) -> Result<ValidateAnswerResponse, GameError> {
        // Reading validation: Check if user marked as read or answered comprehension question
        let reading_time = data.get("reading_time_minutes")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        
        // If answer indicates they read it (e.g., {"completed": true}), give full points
        let completed = answer.get("completed")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        
        if completed {
            Ok(ValidateAnswerResponse {
                correct: true,
                points: 100,
                feedback: format!("Great job! You read the story ({} min). Remember: {}", 
                    reading_time,
                    data.get("moral").and_then(|v| v.as_str()).unwrap_or("Always be kind!")
                ),
            })
        } else {
            Ok(ValidateAnswerResponse {
                correct: false,
                points: 0,
                feedback: "Please read the story to complete it!".to_string(),
            })
        }
    }

    fn validate_click_game(&self, data: &Value, answer: Value) -> Result<ValidateAnswerResponse, GameError> {
        // Click game validation: check if user clicked correct items
        let correct_items = data.get("correct_items")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>())
            .unwrap_or_default();
        
        let wrong_items = data.get("wrong_items")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>())
            .unwrap_or_default();
        
        let clicked_items = answer.get("clicked_items")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>())
            .unwrap_or_default();
        
        let mut correct_clicks = 0;
        let mut wrong_clicks = 0;
        
        for item in &clicked_items {
            if correct_items.contains(item) {
                correct_clicks += 1;
            } else if wrong_items.contains(item) {
                wrong_clicks += 1;
            }
        }
        
        // Calculate score: reward correct, penalize wrong
        let total_points = if !clicked_items.is_empty() {
            ((correct_clicks as f64 / correct_items.len() as f64) * 100.0) as i32
        } else {
            0
        };
        
        let all_correct = correct_clicks == correct_items.len() && wrong_clicks == 0;
        
        let scenario = data.get("scenario")
            .and_then(|v| v.as_str())
            .unwrap_or("the scenario");
        
        let feedback = if all_correct {
            format!("Excellent! You made the right choices in: {}. Always remember to stay safe! 🛡️", scenario)
        } else if wrong_clicks > 0 {
            format!("Be careful! Some of your choices were unsafe. Remember: {}", 
                data.get("safety_tip").and_then(|v| v.as_str()).unwrap_or("Stay away from danger!")
            )
        } else {
            format!("You missed some safe choices! Look for: {}", 
                correct_items.join(", ")
            )
        };
        
        Ok(ValidateAnswerResponse {
            correct: all_correct,
            points: total_points,
            feedback,
        })
    }

    pub fn complete_content(&self, user_id: i64, content_id: i64, score: i32) -> Result<UserProgress, GameError> {
        let repo = ProgressRepository::new(&self.db);
        let request = CompleteContentRequest { score };
        Ok(repo.complete_content(user_id, content_id, request)?)
    }

    pub fn get_progress(&self, user_id: i64, content_id: i64) -> Result<Option<UserProgress>, GameError> {
        let repo = ProgressRepository::new(&self.db);
        Ok(repo.get_progress(user_id, content_id)?)
    }

    pub fn get_user_progress(&self, user_id: i64) -> Result<Vec<UserProgress>, GameError> {
        let repo = ProgressRepository::new(&self.db);
        Ok(repo.get_user_progress(user_id)?)
    }

    pub fn get_user_stats(&self, user_id: i64) -> Result<UserStats, GameError> {
        let repo = ProgressRepository::new(&self.db);
        Ok(UserStats {
            completed_count: repo.get_completed_count(user_id)?,
            total_score: repo.get_total_score(user_id)?,
        })
    }
}

pub struct UserStats {
    pub completed_count: i64,
    pub total_score: i64,
}
