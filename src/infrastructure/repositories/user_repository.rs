use crate::domain::{CreateUserRequest, UpdateUserRequest, User, UserRole};
use crate::infrastructure::database::Database;
use chrono::Utc;
use rusqlite::params;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("User not found")]
    NotFound,
    #[error("Username already exists")]
    AlreadyExists,
    #[error("Invalid password")]
    InvalidPassword,
}

pub struct UserRepository {
    db: Arc<Database>,
}

impl UserRepository {
    pub fn new(db: &Arc<Database>) -> Self {
        Self { db: db.clone() }
    }

    pub fn create(&self, request: CreateUserRequest) -> Result<User, UserError> {
        let conn = self.db.conn.lock().unwrap();

        let role = request.role.unwrap_or(UserRole::User);

        conn.execute(
            "INSERT INTO users (username, password_hash, role, avatar) VALUES (?1, ?2, ?3, ?4)",
            params![
                request.username,
                request.password,
                role.to_string(),
                None::<String>
            ],
        )
        .map_err(map_sqlite_error)?;

        let id = conn.last_insert_rowid();

        Ok(User {
            id,
            username: request.username,
            password_hash: request.password,
            role,
            avatar: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }

    pub fn find_by_id(&self, id: i64) -> Result<User, UserError> {
        let conn = self.db.conn.lock().unwrap();

        let user = conn.query_row(
            "SELECT id, username, password_hash, role, avatar, created_at, updated_at FROM users WHERE id = ?1",
            params![id],
            |row| {
                let role_str: String = row.get(3)?;
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    password_hash: row.get(2)?,
                    role: role_str.parse().unwrap_or(UserRole::User),
                    avatar: row.get(4).ok(),
                    created_at: row.get::<_, String>(5)?.parse().unwrap_or_else(|_| Utc::now()),
                    updated_at: row.get::<_, String>(6)?.parse().unwrap_or_else(|_| Utc::now()),
                })
            },
        ).map_err(|_| UserError::NotFound)?;

        Ok(user)
    }

    pub fn find_by_username(&self, username: &str) -> Result<User, UserError> {
        let conn = self.db.conn.lock().unwrap();

        let user = conn.query_row(
            "SELECT id, username, password_hash, role, avatar, created_at, updated_at FROM users WHERE username = ?1",
            params![username],
            |row| {
                let role_str: String = row.get(3)?;
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    password_hash: row.get(2)?,
                    role: role_str.parse().unwrap_or(UserRole::User),
                    avatar: row.get(4).ok(),
                    created_at: row.get::<_, String>(5)?.parse().unwrap_or_else(|_| Utc::now()),
                    updated_at: row.get::<_, String>(6)?.parse().unwrap_or_else(|_| Utc::now()),
                })
            },
        ).map_err(|_| UserError::NotFound)?;

        Ok(user)
    }

    pub fn find_all(&self) -> Result<Vec<User>, UserError> {
        let conn = self.db.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, username, password_hash, role, avatar, created_at, updated_at FROM users ORDER BY id"
        )?;

        let users = stmt
            .query_map([], |row| {
                let role_str: String = row.get(3)?;
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    password_hash: row.get(2)?,
                    role: role_str.parse().unwrap_or(UserRole::User),
                    avatar: row.get(4).ok(),
                    created_at: row
                        .get::<_, String>(5)?
                        .parse()
                        .unwrap_or_else(|_| Utc::now()),
                    updated_at: row
                        .get::<_, String>(6)?
                        .parse()
                        .unwrap_or_else(|_| Utc::now()),
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(users)
    }

    pub fn update(&self, id: i64, request: UpdateUserRequest) -> Result<User, UserError> {
        let conn = self.db.conn.lock().unwrap();

        let mut updates = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(username) = request.username {
            updates.push("username = ?");
            values.push(Box::new(username));
        }

        if let Some(password) = request.password {
            updates.push("password_hash = ?");
            values.push(Box::new(password));
        }

        if let Some(role) = request.role {
            updates.push("role = ?");
            values.push(Box::new(role.to_string()));
        }

        if let Some(avatar) = request.avatar {
            updates.push("avatar = ?");
            values.push(Box::new(avatar));
        }

        if updates.is_empty() {
            return self.find_by_id(id);
        }

        updates.push("updated_at = datetime('now')");

        let query = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));

        values.push(Box::new(id));

        let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();
        conn.execute(&query, params.as_slice())
            .map_err(map_sqlite_error)?;

        drop(conn);
        self.find_by_id(id)
    }

    pub fn delete(&self, id: i64) -> Result<(), UserError> {
        let conn = self.db.conn.lock().unwrap();

        let rows = conn.execute("DELETE FROM users WHERE id = ?1", params![id])?;

        if rows == 0 {
            return Err(UserError::NotFound);
        }

        Ok(())
    }
}

fn map_sqlite_error(error: rusqlite::Error) -> UserError {
    match error {
        rusqlite::Error::SqliteFailure(sqlite_error, _)
            if sqlite_error.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            UserError::AlreadyExists
        }
        other => UserError::Database(other),
    }
}
