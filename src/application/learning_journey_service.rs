use crate::domain::{
    ContentItem, ContentItemResponse, ContentType, LearningJourneyResponse, RecommendedContent,
    WeakArea,
};
use crate::infrastructure::{
    AttemptInsightRow, ContentError, ContentRepository, Database, ProgressError, ProgressRepository,
};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LearningJourneyError {
    #[error("Content error: {0}")]
    ContentError(#[from] ContentError),
    #[error("Progress error: {0}")]
    ProgressError(#[from] ProgressError),
}

pub struct LearningJourneyService {
    db: Arc<Database>,
}

impl LearningJourneyService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn get_recommendations(
        &self,
        user_id: i64,
        limit: usize,
    ) -> Result<LearningJourneyResponse, LearningJourneyError> {
        let content_repo = ContentRepository::new(&self.db);
        let progress_repo = ProgressRepository::new(&self.db);

        let active_content = content_repo.find_all(true)?;
        let progress = progress_repo.get_user_progress(user_id)?;
        let attempts = progress_repo.get_attempt_insights(user_id)?;

        let completed_ids: HashSet<i64> = progress
            .into_iter()
            .filter(|entry| entry.completed)
            .map(|entry| entry.content_id)
            .collect();

        let weak_areas = build_weak_areas(&attempts);
        let weak_area_by_category: HashMap<Option<i64>, &WeakArea> = weak_areas
            .iter()
            .map(|area| (area.category_id, area))
            .collect();
        let type_counts = build_type_counts(&attempts);
        let attempted_content_ids: HashSet<i64> =
            attempts.iter().map(|attempt| attempt.content_id).collect();
        let starter_mode = attempts.is_empty();

        let mut recommendations = rank_candidates(
            active_content
                .iter()
                .filter(|item| !completed_ids.contains(&item.id))
                .cloned()
                .collect(),
            &weak_area_by_category,
            &type_counts,
            &attempted_content_ids,
            starter_mode,
        );

        if recommendations.is_empty() {
            recommendations = rank_candidates(
                active_content,
                &weak_area_by_category,
                &type_counts,
                &attempted_content_ids,
                starter_mode,
            );
        }

        recommendations.truncate(limit);

        let focus_message = if starter_mode {
            "Start with a gentle mix of reading, quiz, and play so the journey can adapt to your pace."
                .to_string()
        } else if let Some(area) = weak_areas.first() {
            format!(
                "Let’s build confidence in {} with a few just-right activities.",
                area.category_name
            )
        } else {
            "You’re doing great. Here are the smartest next activities based on your recent progress."
                .to_string()
        };

        Ok(LearningJourneyResponse {
            focus_message,
            recommendations,
            weak_areas,
        })
    }
}

fn build_weak_areas(attempts: &[AttemptInsightRow]) -> Vec<WeakArea> {
    #[derive(Default)]
    struct AreaAccumulator {
        category_name: String,
        score_total: i32,
        duration_total: i32,
        duration_count: i32,
        attempt_count: usize,
    }

    let mut area_map: HashMap<Option<i64>, AreaAccumulator> = HashMap::new();
    for attempt in attempts {
        let entry = area_map.entry(attempt.category_id).or_default();
        entry.category_name = attempt
            .category_name
            .clone()
            .unwrap_or_else(|| "General skills".to_string());
        entry.score_total += attempt.score;
        entry.attempt_count += 1;
        if let Some(duration) = attempt.duration_seconds {
            entry.duration_total += duration;
            entry.duration_count += 1;
        }
    }

    let mut areas: Vec<(f64, WeakArea)> = area_map
        .into_iter()
        .map(|(category_id, acc)| {
            let average_score = acc.score_total as f64 / acc.attempt_count as f64;
            let average_duration_seconds = if acc.duration_count > 0 {
                Some(acc.duration_total as f64 / acc.duration_count as f64)
            } else {
                None
            };
            let duration_penalty = average_duration_seconds.unwrap_or(0.0) / 30.0;
            let weakness_score =
                (100.0 - average_score) + duration_penalty + acc.attempt_count as f64;

            (
                weakness_score,
                WeakArea {
                    category_id,
                    category_name: acc.category_name,
                    average_score,
                    average_duration_seconds,
                    attempt_count: acc.attempt_count,
                },
            )
        })
        .collect();

    areas.sort_by(|left, right| right.0.total_cmp(&left.0));
    areas.into_iter().map(|(_, area)| area).take(3).collect()
}

fn build_type_counts(attempts: &[AttemptInsightRow]) -> HashMap<ContentType, usize> {
    let mut counts = HashMap::from([
        (ContentType::Reading, 0_usize),
        (ContentType::Quiz, 0_usize),
        (ContentType::ClickGame, 0_usize),
    ]);

    for attempt in attempts {
        *counts.entry(attempt.content_type.clone()).or_insert(0) += 1;
    }

    counts
}

fn rank_candidates(
    candidates: Vec<ContentItem>,
    weak_area_by_category: &HashMap<Option<i64>, &WeakArea>,
    type_counts: &HashMap<ContentType, usize>,
    attempted_content_ids: &HashSet<i64>,
    starter_mode: bool,
) -> Vec<RecommendedContent> {
    let minimum_type_count = type_counts.values().min().copied().unwrap_or(0);
    let mut scored: Vec<RecommendedContent> = candidates
        .into_iter()
        .map(|item| {
            let mut match_score = 20;
            let mut reasons = Vec::new();

            if starter_mode {
                let starter_bonus = match item.content_type {
                    ContentType::Reading => 18,
                    ContentType::Quiz => 14,
                    ContentType::ClickGame => 10,
                };
                match_score += starter_bonus;
                reasons.push("A friendly starting point to learn your pace".to_string());
            } else {
                if let Some(area) = weak_area_by_category.get(&item.category_id) {
                    let weakness_bonus = (100.0 - area.average_score).round() as i32 / 2;
                    match_score += weakness_bonus.max(8);
                    reasons.push(format!("Build skills in {}", area.category_name));

                    if let Some(avg_duration) = area.average_duration_seconds {
                        if estimated_duration_seconds(&item) as f64 <= avg_duration {
                            match_score += 8;
                            reasons.push("A quicker win matched to your recent pace".to_string());
                        }
                    }
                }

                let type_count = type_counts
                    .get(&item.content_type)
                    .copied()
                    .unwrap_or_default();
                if type_count == minimum_type_count {
                    match_score += 10;
                    reasons.push(format!(
                        "You could use a bit more {} practice",
                        content_type_label(&item.content_type)
                    ));
                }
            }

            if !attempted_content_ids.contains(&item.id) {
                match_score += 6;
                reasons.push("Fresh activity with no previous struggles".to_string());
            }

            let estimated_duration_seconds = estimated_duration_seconds(&item);
            let reason = reasons.into_iter().take(2).collect::<Vec<_>>().join(" • ");

            RecommendedContent {
                content: ContentItemResponse::from(item),
                reason,
                estimated_duration_seconds,
                match_score,
            }
        })
        .collect();

    scored.sort_by(|left, right| {
        right.match_score.cmp(&left.match_score).then_with(|| {
            left.estimated_duration_seconds
                .cmp(&right.estimated_duration_seconds)
        })
    });
    scored
}

fn estimated_duration_seconds(item: &ContentItem) -> i64 {
    match item.content_type {
        ContentType::Reading => {
            item.data
                .get("reading_time_minutes")
                .and_then(|value| value.as_i64())
                .unwrap_or(5)
                * 60
        }
        ContentType::Quiz => item
            .data
            .get("questions")
            .and_then(|value| value.as_array())
            .map(|questions| questions.len() as i64 * 35)
            .unwrap_or(120),
        ContentType::ClickGame => item
            .data
            .get("time_limit_seconds")
            .and_then(|value| value.as_i64())
            .unwrap_or(45),
    }
}

fn content_type_label(content_type: &ContentType) -> &'static str {
    match content_type {
        ContentType::Reading => "reading",
        ContentType::Quiz => "quiz",
        ContentType::ClickGame => "game",
    }
}
