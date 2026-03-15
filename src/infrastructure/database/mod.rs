use bcrypt::hash;
use rusqlite::{Connection, Result as SqliteResult};
use serde_json::json;
use std::path::Path;
use std::sync::Mutex;
use tracing::info;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> SqliteResult<Self> {
        let conn = Connection::open(path)?;
        conn.execute("PRAGMA foreign_keys = ON", [])?;
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
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                data TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            -- User progress tracking
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
                completed INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                completed_at TEXT,
                UNIQUE(user_id, content_id)
            );

            CREATE TABLE IF NOT EXISTS content_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                duration_seconds INTEGER,
                completed_at TEXT DEFAULT (datetime('now'))
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

        self.seed_demo_content(&conn)?;
        self.seed_demo_users_and_progress(&conn)?;

        info!("Database migrations completed successfully!");
        Ok(())
    }

    fn seed_demo_content(&self, conn: &Connection) -> SqliteResult<()> {
        info!("Seeding starter categories and learning content...");

        let categories = [
            (
                "Safety Basics",
                "Learn safe everyday choices at home, outdoors, and online.",
            ),
            (
                "Kindness & Manners",
                "Practice empathy, sharing, and speaking politely.",
            ),
            (
                "Feelings & Focus",
                "Build emotional awareness and self-control.",
            ),
        ];

        for (name, description) in categories {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM categories WHERE name = ?1",
                [name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO categories (name, description) VALUES (?1, ?2)",
                    (name, description),
                )?;
            }
        }

        let safety_id = get_category_id(conn, "Safety Basics")?;
        let kindness_id = get_category_id(conn, "Kindness & Manners")?;
        let feelings_id = get_category_id(conn, "Feelings & Focus")?;

        let content_items = vec![
            (
                "Spot the Safe Choice",
                "Pick the safest choice in common after-school situations.",
                "quiz",
                Some(safety_id),
                json!({
                    "questions": [
                        {"question": "A stranger offers you candy near the school gate. What do you do?", "options": ["Go with them", "Say no and find a trusted adult", "Keep it secret", "Take the candy and run"], "correct_index": 1},
                        {"question": "You find a lighter in the park. What is the best choice?", "options": ["Play with it carefully", "Hide it in your bag", "Tell an adult right away", "Throw it at a tree"], "correct_index": 2},
                        {"question": "Someone online asks for your home address. What should you do?", "options": ["Send it quickly", "Ask them for theirs too", "Tell a trusted adult and do not reply", "Send your street but not the number"], "correct_index": 2}
                    ],
                    "passing_score": 70
                }),
            ),
            (
                "Home Safety Story Time",
                "A short reading adventure about staying calm and finding help at home.",
                "reading",
                Some(safety_id),
                json!({
                    "title": "Mina and the Beeping Alarm",
                    "content": "Mina heard a loud beep from the kitchen. She did not hide or investigate alone. She walked to her grandma, explained what she heard, and stayed back while grandma checked the stove. Mina learned that getting help fast is the brave choice.",
                    "reading_time_minutes": 3,
                    "moral": "When something feels unsafe, get a trusted adult right away."
                }),
            ),
            (
                "Pack the Safety Kit",
                "Tap the items that belong in a simple safety kit.",
                "click_game",
                Some(safety_id),
                json!({
                    "scenario": "Pack a safety kit for a family outing.",
                    "correct_items": ["water bottle", "flashlight", "first aid kit"],
                    "wrong_items": ["fireworks", "broken glass", "loose matches"],
                    "time_limit_seconds": 30,
                    "safety_tip": "Bring useful tools, not risky objects."
                }),
            ),
            (
                "Magic Words Challenge",
                "Choose the kindest words for everyday moments.",
                "quiz",
                Some(kindness_id),
                json!({
                    "questions": [
                        {"question": "Your friend shares crayons with you. What should you say?", "options": ["Finally", "Thanks for sharing", "I knew you would", "You should share more"], "correct_index": 1},
                        {"question": "You bump into someone by accident. What is the best response?", "options": ["Ignore it", "Laugh", "Say sorry", "Blame them"], "correct_index": 2},
                        {"question": "A classmate is talking. How do you show respect?", "options": ["Interrupt them", "Listen and wait your turn", "Talk louder", "Walk away"], "correct_index": 1}
                    ],
                    "passing_score": 75
                }),
            ),
            (
                "The Lunch Table Lesson",
                "Read about one child's choice to include others.",
                "reading",
                Some(kindness_id),
                json!({
                    "title": "An Empty Seat",
                    "content": "At lunch, Omar saw a new student sitting alone. He smiled, asked if she wanted to join his table, and made space for her tray. Soon, the table was full of happy conversation.",
                    "reading_time_minutes": 4,
                    "moral": "Kindness grows when we notice who needs a friend."
                }),
            ),
            (
                "Kind or Unkind?",
                "Tap the actions that show good manners on the playground.",
                "click_game",
                Some(kindness_id),
                json!({
                    "scenario": "Choose the kind playground actions.",
                    "correct_items": ["take turns", "invite someone to play", "say good game"],
                    "wrong_items": ["cut in line", "tease a friend", "grab the ball"],
                    "time_limit_seconds": 35,
                    "safety_tip": "Kind choices help everyone feel welcome."
                }),
            ),
            (
                "Feelings Detective",
                "Match clues with calm, thoughtful reactions.",
                "quiz",
                Some(feelings_id),
                json!({
                    "questions": [
                        {"question": "You feel frustrated by a hard puzzle. What helps most?", "options": ["Rip it up", "Take a deep breath and try again", "Yell", "Quit forever"], "correct_index": 1},
                        {"question": "Your body feels wiggly before class. What can you do?", "options": ["Kick your chair", "Count to five slowly", "Run in the room", "Distract a friend"], "correct_index": 1},
                        {"question": "You lose a game. What is a strong choice?", "options": ["Say the game is dumb", "Ask for a rematch while angry", "Congratulate the winner and reset", "Throw the pieces"], "correct_index": 2}
                    ],
                    "passing_score": 70
                }),
            ),
            (
                "Breathe Like a Bear",
                "A calming reading activity for busy minds.",
                "reading",
                Some(feelings_id),
                json!({
                    "title": "Slow Breath, Strong Heart",
                    "content": "Lina felt her hands squeeze tight when the room became noisy. She put one hand on her belly, breathed in slowly, and breathed out like a sleepy bear. Her shoulders softened, and she could think again.",
                    "reading_time_minutes": 2,
                    "moral": "Slow breathing helps your brain and body work together."
                }),
            ),
            (
                "Calm-Down Toolkit",
                "Pick tools that help you reset when feelings get big.",
                "click_game",
                Some(feelings_id),
                json!({
                    "scenario": "Build a calm-down toolkit.",
                    "correct_items": ["deep breaths", "count to ten", "ask for help"],
                    "wrong_items": ["slam the door", "shout mean words", "throw toys"],
                    "time_limit_seconds": 28,
                    "safety_tip": "Calm tools help you make safe choices."
                }),
            ),
        ];

        for (title, description, content_type, category_id, data) in content_items {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM content_items WHERE title = ?1",
                [title],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO content_items (title, description, content_type, category_id, data, is_active) VALUES (?1, ?2, ?3, ?4, ?5, 1)",
                    (
                        title,
                        description,
                        content_type,
                        category_id,
                        serde_json::to_string(&data).expect("seed content should serialize"),
                    ),
                )?;
            }
        }

        Ok(())
    }

    fn seed_demo_users_and_progress(&self, conn: &Connection) -> SqliteResult<()> {
        info!("Ensuring demo learner accounts exist...");
        let password_hash =
            hash("learn123", 10).expect("demo learner password hashing should succeed");
        for username in ["mia", "leo", "sara"] {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM users WHERE username = ?1",
                [username],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO users (username, password_hash, role, avatar) VALUES (?1, ?2, 'user', NULL)",
                    (username, password_hash.as_str()),
                )?;
            }
        }

        let attempt_count: i64 =
            conn.query_row("SELECT COUNT(*) FROM content_attempts", [], |row| {
                row.get(0)
            })?;
        if attempt_count > 0 {
            return Ok(());
        }

        info!("Seeding demo learning history for adaptive journeys...");

        let mia_id = get_user_id(conn, "mia")?;
        let leo_id = get_user_id(conn, "leo")?;
        let sara_id = get_user_id(conn, "sara")?;

        let spot_safe = get_content_id(conn, "Spot the Safe Choice")?;
        let home_story = get_content_id(conn, "Home Safety Story Time")?;
        let magic_words = get_content_id(conn, "Magic Words Challenge")?;
        let lunch_story = get_content_id(conn, "The Lunch Table Lesson")?;
        let feelings_detective = get_content_id(conn, "Feelings Detective")?;
        let calm_toolkit = get_content_id(conn, "Calm-Down Toolkit")?;

        let seeded_attempts = [
            (mia_id, spot_safe, 52, Some(220)),
            (mia_id, magic_words, 86, Some(150)),
            (mia_id, feelings_detective, 61, Some(205)),
            (leo_id, home_story, 100, Some(180)),
            (leo_id, lunch_story, 100, Some(210)),
            (leo_id, calm_toolkit, 94, Some(32)),
            (sara_id, magic_words, 92, Some(135)),
            (sara_id, spot_safe, 89, Some(155)),
        ];

        for (user_id, content_id, score, duration_seconds) in seeded_attempts {
            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO content_attempts (user_id, content_id, score, duration_seconds, completed_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                (user_id, content_id, score, duration_seconds, now.as_str()),
            )?;
            conn.execute(
                "INSERT INTO user_progress (user_id, content_id, completed, score, completed_at)
                 VALUES (?1, ?2, 1, ?3, ?4)
                 ON CONFLICT(user_id, content_id) DO UPDATE SET
                    completed = excluded.completed,
                    score = excluded.score,
                    completed_at = excluded.completed_at",
                (user_id, content_id, score, now.as_str()),
            )?;
        }

        Ok(())
    }
}

fn get_category_id(conn: &Connection, name: &str) -> SqliteResult<i64> {
    conn.query_row("SELECT id FROM categories WHERE name = ?1", [name], |row| {
        row.get(0)
    })
}

fn get_content_id(conn: &Connection, title: &str) -> SqliteResult<i64> {
    conn.query_row(
        "SELECT id FROM content_items WHERE title = ?1",
        [title],
        |row| row.get(0),
    )
}

fn get_user_id(conn: &Connection, username: &str) -> SqliteResult<i64> {
    conn.query_row(
        "SELECT id FROM users WHERE username = ?1",
        [username],
        |row| row.get(0),
    )
}
