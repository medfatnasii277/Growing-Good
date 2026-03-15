use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};

pub async fn auth_middleware(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|s| s.to_string());

    if let Some(token) = token {
        // Store the token in extensions for later use
        req.extensions_mut().insert(token);
        return Ok(next.run(req).await);
    }

    Err(StatusCode::UNAUTHORIZED)
}
