use crate::domain::{
    Category, ContentItem,
    CreateContentRequest, UpdateContentRequest, CreateCategoryRequest,
    ContentItemResponse
};
use crate::infrastructure::{Database, ContentRepository, ContentError};
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContentServiceError {
    #[error("Content error: {0}")]
    ContentError(#[from] ContentError),
    #[error("Permission denied")]
    PermissionDenied,
}

pub struct ContentService {
    db: Arc<Database>,
}

impl ContentService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // Category operations
    pub fn create_category(&self, request: CreateCategoryRequest) -> Result<Category, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        Ok(repo.create_category(request)?)
    }

    pub fn get_categories(&self) -> Result<Vec<Category>, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        Ok(repo.find_all_categories()?)
    }

    pub fn get_category(&self, id: i64) -> Result<Category, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        Ok(repo.find_category_by_id(id)?)
    }

    pub fn delete_category(&self, id: i64) -> Result<(), ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        Ok(repo.delete_category(id)?)
    }

    // Content operations - Public (for users)
    pub fn get_all_content(&self) -> Result<Vec<ContentItemResponse>, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let items = repo.find_all(true)?;
        Ok(items.into_iter().map(ContentItemResponse::from).collect())
    }

    pub fn get_content(&self, id: i64) -> Result<ContentItemResponse, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let item = repo.find_by_id(id)?;
        
        // Only return active content to regular users
        if !item.is_active {
            return Err(ContentServiceError::PermissionDenied);
        }
        
        Ok(ContentItemResponse::from(item))
    }

    pub fn get_content_by_category(&self, category_id: i64) -> Result<Vec<ContentItemResponse>, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let items = repo.find_by_category(category_id, true)?;
        Ok(items.into_iter().map(ContentItemResponse::from).collect())
    }

    // Content operations - Admin
    pub fn admin_get_all_content(&self) -> Result<Vec<ContentItemResponse>, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let items = repo.find_all(false)?;
        Ok(items.into_iter().map(ContentItemResponse::from).collect())
    }

    pub fn admin_create_content(&self, request: CreateContentRequest) -> Result<ContentItemResponse, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let item = repo.create(request)?;
        Ok(ContentItemResponse::from(item))
    }

    pub fn admin_update_content(&self, id: i64, request: UpdateContentRequest) -> Result<ContentItemResponse, ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        let item = repo.update(id, request)?;
        Ok(ContentItemResponse::from(item))
    }

    pub fn admin_delete_content(&self, id: i64) -> Result<(), ContentServiceError> {
        let repo = ContentRepository::new(&self.db);
        Ok(repo.delete(id)?)
    }
}

impl From<ContentItem> for ContentItemResponse {
    fn from(item: ContentItem) -> Self {
        ContentItemResponse {
            id: item.id,
            title: item.title,
            description: item.description,
            content_type: item.content_type,
            category_id: item.category_id,
            data: item.data,
            is_active: item.is_active,
        }
    }
}
