use axum::{routing::get, Router};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use growing_good::api::openapi::ApiDoc;
use growing_good::{config::Config, infrastructure::Database};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "growing_good=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Growing Good - Children's Education Platform");

    // Load configuration
    let config = Config::default();

    // Initialize database
    let db = Database::new(&config.database.path).expect("Failed to initialize database");

    let db = Arc::new(db);

    tracing::info!("Database initialized at {}", config.database.path);

    // CORS configuration with explicit Authorization header
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(vec![
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ])
        .expose_headers(vec![axum::http::header::CONTENT_TYPE]);

    // Build the application
    let app = Router::new()
        // Health check
        .route("/health", get(health_check))
        // Swagger UI - Note: SwaggerUi already registers /api-docs/openapi.json
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        // Auth routes
        .merge(growing_good::api::routes::auth::create_router(
            db.clone(),
            config.jwt.secret.clone(),
            config.jwt.expires_in_hours,
        ))
        // Content routes (user)
        .merge(growing_good::api::routes::content::create_router(
            db.clone(),
            config.jwt.secret.clone(),
            config.jwt.expires_in_hours,
        ))
        // Admin routes
        .merge(growing_good::api::routes::admin::create_router(
            db.clone(),
            config.jwt.secret.clone(),
            config.jwt.expires_in_hours,
        ))
        // CORS
        .layer(cors)
        // Tracing
        .layer(TraceLayer::new_for_http());

    // Start the server
    let addr = config.server.address();
    tracing::info!("Server starting on {}", addr);
    tracing::info!("Swagger UI available at http://{}/swagger-ui", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Growing Good API is running! 🌱"
}
