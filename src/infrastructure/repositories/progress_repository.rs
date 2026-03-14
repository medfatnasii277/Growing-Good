use crate::domain::{CompleteContentRequest, UserProgress};
use crate::infrastructure::database::Database;
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub user_id: i64,
    pub username: String,
    pub total_score: i64,
    pub completed_count: i64,
    pub rank: i64,
}

#[derive(Error, Debug)]
pub enum ProgressError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Progress not found")]
    NotFound,
}

pub struct ProgressRepository {
    db: Arc<Database>,
}

impl ProgressRepository {
    pub fn new(db: &Arc<Database>) -> Self {
        Self { db: db.clone() }
    }

    pub fn get_progress(
        &self,
        user_id: i64,
        content_id: i64,
    ) -> Result<Option<UserProgress>, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let result = conn.query_row(
            "SELECT id, user_id, content_id, completed, score, completed_at FROM user_progress WHERE user_id = ?1 AND content_id = ?2",
            params![user_id, content_id],
            |row| {
                Ok(UserProgress {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    content_id: row.get(2)?,
                    completed: row.get::<_, i32>(3)? == 1,
                    score: row.get(4).ok(),
                    completed_at: row.get::<_, String>(5).ok().and_then(|s| s.parse().ok()),
                })
            },
        );

        match result {
            Ok(progress) => Ok(Some(progress)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn get_user_progress(&self, user_id: i64) -> Result<Vec<UserProgress>, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, user_id, content_id, completed, score, completed_at FROM user_progress WHERE user_id = ?1"
        )?;

        let progress = stmt
            .query_map(params![user_id], |row| {
                Ok(UserProgress {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    content_id: row.get(2)?,
                    completed: row.get::<_, i32>(3)? == 1,
                    score: row.get(4).ok(),
                    completed_at: row.get::<_, String>(5).ok().and_then(|s| s.parse().ok()),
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(progress)
    }

    pub fn complete_content(
        &self,
        user_id: i64,
        content_id: i64,
        request: CompleteContentRequest,
    ) -> Result<UserProgress, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let now = Utc::now().to_rfc3339();

        // Try to update existing progress first
        let rows = conn.execute(
            "UPDATE user_progress SET completed = 1, score = ?1, completed_at = ?2 WHERE user_id = ?3 AND content_id = ?4",
            params![request.score, now, user_id, content_id],
        )?;

        if rows == 0 {
            // Insert new progress
            conn.execute(
                "INSERT INTO user_progress (user_id, content_id, completed, score, completed_at) VALUES (?1, ?2, 1, ?3, ?4)",
                params![user_id, content_id, request.score, now],
            )?;
        }

        drop(conn);

        // Return the updated progress
        self.get_progress(user_id, content_id)?
            .ok_or(ProgressError::NotFound)
    }

    pub fn get_completed_count(&self, user_id: i64) -> Result<i64, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM user_progress WHERE user_id = ?1 AND completed = 1",
            params![user_id],
            |row| row.get(0),
        )?;

        Ok(count)
    }

    pub fn get_total_score(&self, user_id: i64) -> Result<i64, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let score: i64 = conn.query_row(
            "SELECT COALESCE(SUM(score), 0) FROM user_progress WHERE user_id = ?1",
            params![user_id],
            |row| row.get(0),
        )?;

        Ok(score)
    }

    pub fn get_leaderboard(&self, limit: i64) -> Result<Vec<LeaderboardEntry>, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT 
                u.id as user_id,
                u.username,
                COALESCE(SUM(p.score), 0) as total_score,
                COUNT(p.id) as completed_count
            FROM users u
            LEFT JOIN user_progress p ON u.id = p.user_id AND p.completed = 1
            WHERE u.role != 'admin'
            GROUP BY u.id
            ORDER BY total_score DESC
            LIMIT ?1",
        )?;

        let entries = stmt
            .query_map(params![limit], |row| {
                Ok(LeaderboardEntry {
                    user_id: row.get(0)?,
                    username: row.get(1)?,
                    total_score: row.get(2)?,
                    completed_count: row.get(3)?,
                    rank: 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let ranked: Vec<LeaderboardEntry> = entries
            .into_iter()
            .enumerate()
            .map(|(i, mut e)| {
                e.rank = (i + 1) as i64;
                e
            })
            .collect();

        Ok(ranked)
    }

    pub fn get_user_rank(&self, user_id: i64) -> Result<i64, ProgressError> {
        let conn = self.db.conn.lock().unwrap();

        let user_score: i64 = conn.query_row(
            "SELECT COALESCE(SUM(score), 0) FROM user_progress WHERE user_id = ?1 AND completed = 1",
            params![user_id],
            |row| row.get(0),
        )?;

        let rank: i64 = conn.query_row(
            "SELECT COUNT(*) + 1 FROM (
                SELECT up.user_id, COALESCE(SUM(up.score), 0) as total_score
                FROM user_progress up
                JOIN users u ON up.user_id = u.id
                WHERE up.completed = 1 AND u.role != 'admin'
                GROUP BY up.user_id
                HAVING total_score > ?1
            )",
            params![user_score],
            |row| row.get(0),
        )?;

        Ok(rank)
    }
}
