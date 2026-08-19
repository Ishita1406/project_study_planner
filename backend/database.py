import os

import psycopg2
from psycopg2.extras import RealDictCursor


def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "study_planner"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        cursor_factory=RealDictCursor,
    )


def initialize_database():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_salt VARCHAR(64) NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                target_semester VARCHAR(255) NOT NULL DEFAULT '',
                weekly_goal_hours INTEGER NOT NULL DEFAULT 10,
                avatar_url TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS auth_sessions (
                token VARCHAR(255) PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMPTZ NOT NULL
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                default_daily_hours REAL NOT NULL DEFAULT 2,
                weekly_availability JSONB NOT NULL DEFAULT '{"monday": 2, "tuesday": 2, "wednesday": 2, "thursday": 2, "friday": 2, "saturday": 0, "sunday": 0}',
                max_continuous_minutes INTEGER NOT NULL DEFAULT 60,
                break_minutes INTEGER NOT NULL DEFAULT 10,
                preferred_time VARCHAR(32) NOT NULL DEFAULT 'flexible',
                notify_reminders BOOLEAN NOT NULL DEFAULT TRUE,
                notify_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
                google_calendar_sync BOOLEAN NOT NULL DEFAULT FALSE
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                topics TEXT[] NOT NULL,
                deadline DATE
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_tasks (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                scheduled_date DATE NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                missed BOOLEAN DEFAULT FALSE,
                google_event_id VARCHAR(255)
            )
        """)

        cur.execute("ALTER TABLE subjects ALTER COLUMN deadline DROP NOT NULL")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code VARCHAR(64)")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255)")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS difficulty VARCHAR(16) NOT NULL DEFAULT 'medium'")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 0")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'medium'")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color VARCHAR(32) NOT NULL DEFAULT '#3b82f6'")
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
        cur.execute("ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE")
        cur.execute("ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255)")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                difficulty VARCHAR(16) NOT NULL DEFAULT 'medium',
                confidence INTEGER NOT NULL DEFAULT 0,
                estimated_minutes INTEGER NOT NULL DEFAULT 60,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                topic_order INTEGER NOT NULL DEFAULT 0
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS deadlines (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                due_date DATE NOT NULL,
                deadline_type VARCHAR(32) NOT NULL,
                priority VARCHAR(16) NOT NULL DEFAULT 'medium'
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                scheduled_date DATE NOT NULL,
                start_time VARCHAR(8) NOT NULL,
                duration INTEGER NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'pending',
                priority VARCHAR(16) NOT NULL DEFAULT 'medium',
                notes TEXT,
                completed_at TIMESTAMPTZ
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS study_sessions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                duration INTEGER NOT NULL,
                difficulty_feedback VARCHAR(16) NOT NULL,
                confidence INTEGER NOT NULL,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS study_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                status VARCHAR(16) NOT NULL DEFAULT 'draft',
                params JSONB NOT NULL,
                items JSONB NOT NULL
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS subjects_user_id_idx ON subjects(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS topics_subject_id_idx ON topics(subject_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS deadlines_subject_id_idx ON deadlines(subject_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS tasks_subject_id_idx ON tasks(subject_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS tasks_topic_id_idx ON tasks(topic_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS study_sessions_subject_id_idx ON study_sessions(subject_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS study_plans_user_id_idx ON study_plans(user_id)")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()