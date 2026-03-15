use bcrypt::hash;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;
use std::sync::Mutex;
use tracing::info;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> SqliteResult<Self> {
        let conn = Connection::open(path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn run_migrations(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

        info!("Running database migrations...");

        conn.execute_batch(
            r#"
            -- Users table (both children and admins)
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
                avatar TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            -- Content categories
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            -- Content items (extensible type system)
            CREATE TABLE IF NOT EXISTS content_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                content_type TEXT NOT NULL,
                category_id INTEGER REFERENCES categories(id),
                data TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            -- User progress tracking
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                content_id INTEGER REFERENCES content_items(id),
                completed INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                completed_at TEXT,
                UNIQUE(user_id, content_id)
            );

            -- Admin audit log
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER REFERENCES users(id),
                action TEXT NOT NULL,
                target_type TEXT,
                target_id INTEGER,
                details TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            "#,
        )?;

        let has_avatar_column = conn
            .prepare("PRAGMA table_info(users)")?
            .query_map([], |row| row.get::<_, String>(1))?
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .any(|column| column == "avatar");

        if !has_avatar_column {
            info!("Adding avatar column to users table...");
            conn.execute("ALTER TABLE users ADD COLUMN avatar TEXT", [])?;
        }

        // Insert default admin user if not exists
        let admin_exists: i32 = conn.query_row(
            "SELECT COUNT(*) FROM users WHERE username = 'admin'",
            [],
            |row| row.get(0),
        )?;

        if admin_exists == 0 {
            info!("Creating default admin user...");
            let password_hash =
                hash("admin123", 10).expect("default admin password hashing should succeed");
            conn.execute(
                "INSERT INTO users (username, password_hash, role, avatar) VALUES (?1, ?2, 'admin', NULL)",
                ("admin", password_hash),
            )?;
        }

        info!("Database migrations completed successfully!");
        Ok(())
    }
}
