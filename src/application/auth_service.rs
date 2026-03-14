use crate::domain::{User, UserRole, CreateUserRequest, UserResponse};
use crate::infrastructure::{Database, UserRepository, UserError};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Serialize, Deserialize};
use chrono::{Utc, Duration};
use thiserror::Error;
use bcrypt::{hash, verify};
use std::sync::Arc;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("User error: {0}")]
    UserError(#[from] UserError),
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("Token error: {0}")]
    TokenError(#[from] jsonwebtoken::errors::Error),
    #[error("Password hashing error")]
    HashError,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: i64,
    pub role: String,
    pub exp: i64,
}

pub struct AuthService {
    db: Arc<Database>,
    jwt_secret: String,
    jwt_expiration: i64,
}

impl AuthService {
    pub fn new(db: Arc<Database>, jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            db,
            jwt_secret,
            jwt_expiration,
        }
    }

    pub fn register(&self, request: CreateUserRequest) -> Result<UserResponse, AuthError> {
        let repo = UserRepository::new(&self.db);
        
        // Hash password
        let password_hash = hash(&request.password, 10)
            .map_err(|_| AuthError::HashError)?;
        
        let mut create_request = request;
        create_request.password = password_hash;
        
        let user = repo.create(create_request)?;
        
        Ok(UserResponse {
            id: user.id,
            username: user.username,
            role: user.role,
            created_at: user.created_at,
        })
    }

    pub fn login(&self, username: &str, password: &str) -> Result<String, AuthError> {
        let repo = UserRepository::new(&self.db);
        
        let user = repo.find_by_username(username)
            .map_err(|_| AuthError::InvalidCredentials)?;
        
        let valid = verify(password, &user.password_hash)
            .map_err(|_| AuthError::HashError)?;
        
        if !valid {
            return Err(AuthError::InvalidCredentials);
        }
        
        self.generate_token(&user)
    }

    pub fn generate_token(&self, user: &User) -> Result<String, AuthError> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(self.jwt_expiration))
            .expect("Invalid expiration time")
            .timestamp();
        
        let claims = Claims {
            sub: user.username.clone(),
            user_id: user.id,
            role: user.role.to_string(),
            exp: expiration,
        };
        
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )?;
        
        Ok(token)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, AuthError> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &Validation::default(),
        )?;
        
        Ok(token_data.claims)
    }

    pub fn get_user_from_token(&self, token: &str) -> Result<User, AuthError> {
        let claims = self.verify_token(token)?;
        let repo = UserRepository::new(&self.db);
        let user = repo.find_by_id(claims.user_id)?;
        Ok(user)
    }

    pub fn get_user_by_username(&self, username: &str) -> Result<User, AuthError> {
        let repo = UserRepository::new(&self.db);
        let user = repo.find_by_username(username)?;
        Ok(user)
    }

    pub fn is_admin(&self, token: &str) -> bool {
        if let Ok(claims) = self.verify_token(token) {
            claims.role == UserRole::Admin.to_string()
        } else {
            false
        }
    }
}
