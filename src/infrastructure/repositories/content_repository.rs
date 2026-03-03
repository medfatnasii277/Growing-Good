use crate::domain::{ContentItem, ContentType, Category, CreateContentRequest, UpdateContentRequest, CreateCategoryRequest};
use crate::infrastructure::database::Database;
use rusqlite::params;
use chrono::Utc;
use thiserror::Error;
use std::sync::Arc;

#[derive(Error, Debug)]
pub enum ContentError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Content not found")]
    NotFound,
    #[error("Category not found")]
    CategoryNotFound,
}

pub struct ContentRepository {
    db: Arc<Database>,
}

impl ContentRepository {
    pub fn new(db: &Arc<Database>) -> Self {
        Self { db: db.clone() }
    }

    // Category methods
    pub fn create_category(&self, request: CreateCategoryRequest) -> Result<Category, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO categories (name, description) VALUES (?1, ?2)",
            params![request.name, request.description],
        )?;
        
        let id = conn.last_insert_rowid();
        
        Ok(Category {
            id,
            name: request.name,
            description: request.description,
            created_at: Utc::now(),
        })
    }

    pub fn find_category_by_id(&self, id: i64) -> Result<Category, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let category = conn.query_row(
            "SELECT id, name, description, created_at FROM categories WHERE id = ?1",
            params![id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_at: row.get::<_, String>(3)?.parse().unwrap_or_else(|_| Utc::now()),
                })
            },
        ).map_err(|_| ContentError::NotFound)?;
        
        Ok(category)
    }

    pub fn find_all_categories(&self) -> Result<Vec<Category>, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at FROM categories ORDER BY id"
        )?;
        
        let categories = stmt.query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse().unwrap_or_else(|_| Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(categories)
    }

    pub fn delete_category(&self, id: i64) -> Result<(), ContentError> {
        let conn = self.db.conn.lock().unwrap();
        conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Content methods
    pub fn create(&self, request: CreateContentRequest) -> Result<ContentItem, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let data_json = serde_json::to_string(&request.data)
            .map_err(|e| ContentError::Database(rusqlite::Error::ToSqlConversionFailure(Box::new(e))))?;
        
        conn.execute(
            "INSERT INTO content_items (title, description, content_type, category_id, data) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![request.title, request.description, request.content_type.to_string(), request.category_id, data_json],
        )?;
        
        let id = conn.last_insert_rowid();
        
        Ok(ContentItem {
            id,
            title: request.title,
            description: request.description,
            content_type: request.content_type,
            category_id: request.category_id,
            data: request.data,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }

    pub fn find_by_id(&self, id: i64) -> Result<ContentItem, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let content = conn.query_row(
            "SELECT id, title, description, content_type, category_id, data, is_active, created_at, updated_at FROM content_items WHERE id = ?1",
            params![id],
            |row| {
                let content_type_str: String = row.get(3)?;
                let data_json: String = row.get(5)?;
                Ok(ContentItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    content_type: content_type_str.parse().unwrap_or(ContentType::Quiz),
                    category_id: row.get(4)?,
                    data: serde_json::from_str(&data_json).unwrap_or(serde_json::Value::Null),
                    is_active: row.get::<_, i32>(6)? == 1,
                    created_at: row.get::<_, String>(7)?.parse().unwrap_or_else(|_| Utc::now()),
                    updated_at: row.get::<_, String>(8)?.parse().unwrap_or_else(|_| Utc::now()),
                })
            },
        ).map_err(|_| ContentError::NotFound)?;
        
        Ok(content)
    }

    pub fn find_all(&self, active_only: bool) -> Result<Vec<ContentItem>, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let query = if active_only {
            "SELECT id, title, description, content_type, category_id, data, is_active, created_at, updated_at FROM content_items WHERE is_active = 1 ORDER BY id"
        } else {
            "SELECT id, title, description, content_type, category_id, data, is_active, created_at, updated_at FROM content_items ORDER BY id"
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let contents = stmt.query_map([], |row| {
            let content_type_str: String = row.get(3)?;
            let data_json: String = row.get(5)?;
            Ok(ContentItem {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                content_type: content_type_str.parse().unwrap_or(ContentType::Quiz),
                category_id: row.get(4)?,
                data: serde_json::from_str(&data_json).unwrap_or(serde_json::Value::Null),
                is_active: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(8)?.parse().unwrap_or_else(|_| Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(contents)
    }

    pub fn find_by_category(&self, category_id: i64, active_only: bool) -> Result<Vec<ContentItem>, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let query = if active_only {
            "SELECT id, title, description, content_type, category_id, data, is_active, created_at, updated_at FROM content_items WHERE category_id = ?1 AND is_active = 1 ORDER BY id"
        } else {
            "SELECT id, title, description, content_type, category_id, data, is_active, created_at, updated_at FROM content_items WHERE category_id = ?1 ORDER BY id"
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let contents = stmt.query_map(params![category_id], |row| {
            let content_type_str: String = row.get(3)?;
            let data_json: String = row.get(5)?;
            Ok(ContentItem {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                content_type: content_type_str.parse().unwrap_or(ContentType::Quiz),
                category_id: row.get(4)?,
                data: serde_json::from_str(&data_json).unwrap_or(serde_json::Value::Null),
                is_active: row.get::<_, i32>(6)? == 1,
                created_at: row.get::<_, String>(7)?.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: row.get::<_, String>(8)?.parse().unwrap_or_else(|_| Utc::now()),
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(contents)
    }

    pub fn update(&self, id: i64, request: UpdateContentRequest) -> Result<ContentItem, ContentError> {
        let conn = self.db.conn.lock().unwrap();
        
        let mut updates = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(title) = request.title {
            updates.push("title = ?");
            values.push(Box::new(title));
        }
        
        if let Some(description) = request.description {
            updates.push("description = ?");
            values.push(Box::new(description));
        }
        
        if let Some(content_type) = request.content_type {
            updates.push("content_type = ?");
            values.push(Box::new(content_type.to_string()));
        }
        
        if let Some(category_id) = request.category_id {
            updates.push("category_id = ?");
            values.push(Box::new(category_id));
        }
        
        if let Some(data) = request.data {
            let data_json = serde_json::to_string(&data)
                .map_err(|e| ContentError::Database(rusqlite::Error::ToSqlConversionFailure(Box::new(e))))?;
            updates.push("data = ?");
            values.push(Box::new(data_json));
        }
        
        if let Some(is_active) = request.is_active {
            updates.push("is_active = ?");
            values.push(Box::new(if is_active { 1 } else { 0 }));
        }
        
        if updates.is_empty() {
            drop(conn);
            return self.find_by_id(id);
        }
        
        updates.push("updated_at = datetime('now')");
        
        let query = format!(
            "UPDATE content_items SET {} WHERE id = ?",
            updates.join(", ")
        );
        
        values.push(Box::new(id));
        
        let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();
        conn.execute(&query, params.as_slice())?;
        
        drop(conn);
        self.find_by_id(id)
    }

    pub fn delete(&self, id: i64) -> Result<(), ContentError> {
        let conn = self.db.conn.lock().unwrap();
        conn.execute("DELETE FROM content_items WHERE id = ?1", params![id])?;
        Ok(())
    }
}
