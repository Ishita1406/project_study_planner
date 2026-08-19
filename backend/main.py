from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import RedirectResponse

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import traceback
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import json
import hashlib
import secrets
from calendar_service import (
    get_google_auth_url, 
    exchange_code_for_token, 
    sync_tasks, 
    move_event, 
    get_user_email, 
    delete_event, 
    update_event_title,
    get_upcoming_events
)

# Load environment variables from .env (if present)
load_dotenv()

# Allow HTTP for local development OAuth
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "study_planner"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        cursor_factory=RealDictCursor
    )

# Models
class Subject(BaseModel):
    name: str
    topics: List[str]
    deadline: date

class SubjectResponse(BaseModel):
    id: int
    name: str
    topics: List[str]
    deadline: date

class DailyTask(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    topic: str
    scheduled_date: date
    completed: bool
    missed: bool
    google_event_id: Optional[str] = None

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None
    missed: Optional[bool] = None


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    targetSemester: str = ""
    weeklyGoalHours: int = 10
    avatarUrl: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    targetSemester: Optional[str] = None
    weeklyGoalHours: Optional[int] = None
    avatarUrl: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    defaultDailyHours: Optional[float] = None
    weeklyAvailability: Optional[Dict[str, float]] = None
    maxContinuousMinutes: Optional[int] = None
    breakMinutes: Optional[int] = None
    preferredTime: Optional[str] = None
    notifyReminders: Optional[bool] = None
    notifyDeadlines: Optional[bool] = None
    googleCalendarSync: Optional[bool] = None


class SubjectCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[date] = None
    examName: Optional[str] = None
    difficulty: str = "medium"
    confidence: int = 0
    priority: str = "medium"
    color: str = "#3b82f6"


class SubjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[date] = None
    examName: Optional[str] = None
    difficulty: Optional[str] = None
    confidence: Optional[int] = None
    priority: Optional[str] = None
    color: Optional[str] = None


class TopicCreateRequest(BaseModel):
    subjectId: int
    name: str
    difficulty: str = "medium"
    confidence: int = 0
    estimatedMinutes: int = 60
    completed: bool = False
    order: int = 0


class TopicUpdateRequest(BaseModel):
    name: Optional[str] = None
    difficulty: Optional[str] = None
    confidence: Optional[int] = None
    estimatedMinutes: Optional[int] = None
    completed: Optional[bool] = None
    order: Optional[int] = None


class DeadlineCreateRequest(BaseModel):
    subjectId: int
    title: str
    dueDate: date
    type: str
    priority: str = "medium"


DEFAULT_WEEKLY_AVAILABILITY = {
    "monday": 2,
    "tuesday": 2,
    "wednesday": 2,
    "thursday": 2,
    "friday": 2,
    "saturday": 0,
    "sunday": 0,
}


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(password_salt), 310000
    ).hex()
    return password_salt, digest


def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user["id"]),
        "name": user["name"],
        "email": user["email"],
        "targetSemester": user["target_semester"],
        "weeklyGoalHours": user["weekly_goal_hours"],
        "avatarUrl": user["avatar_url"],
    }


def serialize_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
    availability = preferences["weekly_availability"]
    if isinstance(availability, str):
        availability = json.loads(availability)
    return {
        "defaultDailyHours": preferences["default_daily_hours"],
        "weeklyAvailability": availability,
        "maxContinuousMinutes": preferences["max_continuous_minutes"],
        "breakMinutes": preferences["break_minutes"],
        "preferredTime": preferences["preferred_time"],
        "notifyReminders": preferences["notify_reminders"],
        "notifyDeadlines": preferences["notify_deadlines"],
        "googleCalendarSync": preferences["google_calendar_sync"],
    }


def serialize_subject(subject: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(subject["id"]),
        "name": subject["name"],
        "code": subject["code"],
        "description": subject["description"],
        "deadline": subject["deadline"].isoformat() if subject["deadline"] else None,
        "examName": subject["exam_name"],
        "difficulty": subject["difficulty"],
        "confidence": subject["confidence"],
        "priority": subject["priority"],
        "color": subject["color"],
        "createdAt": subject["created_at"].isoformat(),
    }


def serialize_topic(topic: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(topic["id"]),
        "subjectId": str(topic["subject_id"]),
        "name": topic["name"],
        "difficulty": topic["difficulty"],
        "confidence": topic["confidence"],
        "estimatedMinutes": topic["estimated_minutes"],
        "completed": topic["completed"],
        "order": topic["topic_order"],
    }


def serialize_deadline(deadline: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(deadline["id"]),
        "subjectId": str(deadline["subject_id"]),
        "title": deadline["title"],
        "dueDate": deadline["due_date"].isoformat(),
        "type": deadline["deadline_type"],
        "priority": deadline["priority"],
    }


def create_session(cur, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    cur.execute(
        "INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
        (token, user_id, datetime.utcnow() + timedelta(days=30)),
    )
    return token


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.removeprefix("Bearer ")
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT u.*
            FROM auth_sessions session
            JOIN users u ON u.id = session.user_id
            WHERE session.token = %s AND session.expires_at > NOW()
            """,
            (token,),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Session is invalid or expired")
        return user
    finally:
        cur.close()
        conn.close()

# Initialize database
@app.on_event("startup")
async def startup():
    conn = get_db()
    cur = conn.cursor()

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
            deadline DATE NOT NULL
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
    
    # Migrations for existing database
    try:
        print("Running database migrations...")
        # Check and add deadline to subjects
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS deadline DATE")
        print("Checked 'deadline' column")
        
        # Check and add scheduled_date to daily_tasks
        cur.execute("ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE")
        print("Checked 'scheduled_date' column")
        
        # Check and add google_event_id to daily_tasks
        cur.execute("ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255)")
        print("Checked 'google_event_id' column")

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
        cur.execute("CREATE INDEX IF NOT EXISTS subjects_user_id_idx ON subjects(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS topics_subject_id_idx ON topics(subject_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS deadlines_subject_id_idx ON deadlines(subject_id)")
        
        conn.commit()
        print("Database migrations completed successfully.")
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()

    
    conn.commit()
    cur.close()
    conn.close()


@app.post("/api/auth/signup", status_code=201)
async def signup(request: SignupRequest):
    if len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    conn = get_db()
    cur = conn.cursor()
    try:
        salt, password_hash = hash_password(request.password)
        cur.execute(
            """
            INSERT INTO users (name, email, password_salt, password_hash, target_semester, weekly_goal_hours, avatar_url)
            VALUES (%s, LOWER(%s), %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                request.name,
                request.email,
                salt,
                password_hash,
                request.targetSemester,
                request.weeklyGoalHours,
                request.avatarUrl,
            ),
        )
        user = cur.fetchone()
        cur.execute(
            "INSERT INTO user_preferences (user_id, weekly_availability) VALUES (%s, %s::jsonb)",
            (user["id"], json.dumps(DEFAULT_WEEKLY_AVAILABILITY)),
        )
        token = create_session(cur, user["id"])
        conn.commit()
        return {"token": token, "user": serialize_user(user)}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    finally:
        cur.close()
        conn.close()


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM users WHERE email = LOWER(%s)", (request.email,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        _, candidate_hash = hash_password(request.password, user["password_salt"])
        if not secrets.compare_digest(candidate_hash, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_session(cur, user["id"])
        conn.commit()
        return {"token": token, "user": serialize_user(user)}
    finally:
        cur.close()
        conn.close()


@app.post("/api/auth/logout", status_code=204)
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM auth_sessions WHERE token = %s", (authorization.removeprefix("Bearer "),))
            conn.commit()
        finally:
            cur.close()
            conn.close()


@app.get("/api/auth/me")
async def auth_me(user: Dict[str, Any] = Depends(get_current_user)):
    return serialize_user(user)


@app.get("/api/user")
async def get_user(user: Dict[str, Any] = Depends(get_current_user)):
    return serialize_user(user)


@app.patch("/api/user")
async def update_user(request: UserUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {
        "name": "name",
        "targetSemester": "target_semester",
        "weeklyGoalHours": "weekly_goal_hours",
        "avatarUrl": "avatar_url",
    }
    if not updates:
        return serialize_user(user)

    assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE users SET {assignments} WHERE id = %s RETURNING *",
            [*updates.values(), user["id"]],
        )
        updated_user = cur.fetchone()
        conn.commit()
        return serialize_user(updated_user)
    finally:
        cur.close()
        conn.close()


@app.get("/api/preferences")
async def get_preferences(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM user_preferences WHERE user_id = %s", (user["id"],))
        preferences = cur.fetchone()
        return serialize_preferences(preferences)
    finally:
        cur.close()
        conn.close()


@app.patch("/api/preferences")
async def update_preferences(
    request: PreferencesUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)
):
    updates = request.model_dump(exclude_unset=True)
    columns = {
        "defaultDailyHours": "default_daily_hours",
        "weeklyAvailability": "weekly_availability",
        "maxContinuousMinutes": "max_continuous_minutes",
        "breakMinutes": "break_minutes",
        "preferredTime": "preferred_time",
        "notifyReminders": "notify_reminders",
        "notifyDeadlines": "notify_deadlines",
        "googleCalendarSync": "google_calendar_sync",
    }
    if not updates:
        return await get_preferences(user)

    values = [json.dumps(value) if key == "weeklyAvailability" else value for key, value in updates.items()]
    assignments = ", ".join(
        f"{columns[key]} = %s::jsonb" if key == "weeklyAvailability" else f"{columns[key]} = %s"
        for key in updates
    )
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE user_preferences SET {assignments} WHERE user_id = %s RETURNING *",
            [*values, user["id"]],
        )
        preferences = cur.fetchone()
        conn.commit()
        return serialize_preferences(preferences)
    finally:
        cur.close()
        conn.close()


@app.get("/api/subjects")
async def get_api_subjects(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM subjects WHERE user_id = %s ORDER BY created_at", (user["id"],))
        return [serialize_subject(subject) for subject in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@app.post("/api/subjects", status_code=201)
async def create_api_subject(
    request: SubjectCreateRequest, user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO subjects (user_id, name, topics, deadline, code, description, exam_name, difficulty, confidence, priority, color)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                user["id"],
                request.name,
                [],
                request.deadline,
                request.code,
                request.description,
                request.examName,
                request.difficulty,
                request.confidence,
                request.priority,
                request.color,
            ),
        )
        subject = cur.fetchone()
        if request.deadline:
            cur.execute(
                """
                INSERT INTO deadlines (subject_id, title, due_date, deadline_type, priority)
                VALUES (%s, %s, %s, 'exam', %s)
                """,
                (
                    subject["id"],
                    request.examName or f"{request.name} Assessment",
                    request.deadline,
                    request.priority,
                ),
            )
        conn.commit()
        return serialize_subject(subject)
    finally:
        cur.close()
        conn.close()


@app.patch("/api/subjects/{subject_id}")
async def update_api_subject(
    subject_id: int,
    request: SubjectUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    updates = request.model_dump(exclude_unset=True)
    columns = {
        "name": "name",
        "code": "code",
        "description": "description",
        "deadline": "deadline",
        "examName": "exam_name",
        "difficulty": "difficulty",
        "confidence": "confidence",
        "priority": "priority",
        "color": "color",
    }
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")

    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(
            f"UPDATE subjects SET {assignments} WHERE id = %s AND user_id = %s RETURNING *",
            [*updates.values(), subject_id, user["id"]],
        )
        subject = cur.fetchone()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        conn.commit()
        return serialize_subject(subject)
    finally:
        cur.close()
        conn.close()


@app.delete("/api/subjects/{subject_id}", status_code=204)
async def delete_api_subject(subject_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM subjects WHERE id = %s AND user_id = %s RETURNING id", (subject_id, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()


@app.get("/api/topics")
async def get_api_topics(
    subjectId: Optional[int] = None, user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cur = conn.cursor()
    try:
        query = """
            SELECT topic.*
            FROM topics topic
            JOIN subjects subject ON subject.id = topic.subject_id
            WHERE subject.user_id = %s
        """
        values: List[Any] = [user["id"]]
        if subjectId is not None:
            query += " AND topic.subject_id = %s"
            values.append(subjectId)
        query += " ORDER BY topic.subject_id, topic.topic_order, topic.id"
        cur.execute(query, values)
        return [serialize_topic(topic) for topic in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@app.post("/api/topics", status_code=201)
async def create_api_topic(request: TopicCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM subjects WHERE id = %s AND user_id = %s", (request.subjectId, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")
        cur.execute(
            """
            INSERT INTO topics (subject_id, name, difficulty, confidence, estimated_minutes, completed, topic_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                request.subjectId,
                request.name,
                request.difficulty,
                request.confidence,
                request.estimatedMinutes,
                request.completed,
                request.order,
            ),
        )
        topic = cur.fetchone()
        conn.commit()
        return serialize_topic(topic)
    finally:
        cur.close()
        conn.close()


@app.patch("/api/topics/{topic_id}")
async def update_api_topic(
    topic_id: int,
    request: TopicUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    updates = request.model_dump(exclude_unset=True)
    columns = {
        "name": "name",
        "difficulty": "difficulty",
        "confidence": "confidence",
        "estimatedMinutes": "estimated_minutes",
        "completed": "completed",
        "order": "topic_order",
    }
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")

    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(
            f"""
            UPDATE topics AS topic SET {assignments}
            FROM subjects AS subject
            WHERE topic.id = %s AND topic.subject_id = subject.id AND subject.user_id = %s
            RETURNING topic.*
            """,
            [*updates.values(), topic_id, user["id"]],
        )
        topic = cur.fetchone()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        conn.commit()
        return serialize_topic(topic)
    finally:
        cur.close()
        conn.close()


@app.delete("/api/topics/{topic_id}", status_code=204)
async def delete_api_topic(topic_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            DELETE FROM topics AS topic
            USING subjects AS subject
            WHERE topic.id = %s AND topic.subject_id = subject.id AND subject.user_id = %s
            RETURNING topic.id
            """,
            (topic_id, user["id"]),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Topic not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()


@app.get("/api/deadlines")
async def get_api_deadlines(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT deadline.*
            FROM deadlines deadline
            JOIN subjects subject ON subject.id = deadline.subject_id
            WHERE subject.user_id = %s
            ORDER BY deadline.due_date, deadline.id
            """,
            (user["id"],),
        )
        return [serialize_deadline(deadline) for deadline in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@app.post("/api/deadlines", status_code=201)
async def create_api_deadline(
    request: DeadlineCreateRequest, user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM subjects WHERE id = %s AND user_id = %s", (request.subjectId, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")
        cur.execute(
            """
            INSERT INTO deadlines (subject_id, title, due_date, deadline_type, priority)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (request.subjectId, request.title, request.dueDate, request.type, request.priority),
        )
        deadline = cur.fetchone()
        conn.commit()
        return serialize_deadline(deadline)
    finally:
        cur.close()
        conn.close()


@app.delete("/api/deadlines/{deadline_id}", status_code=204)
async def delete_api_deadline(deadline_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            DELETE FROM deadlines AS deadline
            USING subjects AS subject
            WHERE deadline.id = %s AND deadline.subject_id = subject.id AND subject.user_id = %s
            RETURNING deadline.id
            """,
            (deadline_id, user["id"]),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Deadline not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()

# Endpoints
@app.post("/subjects")
async def create_subject(subject: Subject):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO subjects (name, topics, deadline) VALUES (%s, %s, %s) RETURNING id",
        (subject.name, subject.topics, subject.deadline)
    )
    subject_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"id": subject_id, **subject.dict()}

@app.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects():
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM subjects ORDER BY deadline")
    subjects = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return subjects

@app.post("/generate-plan")
async def generate_plan():
    conn = get_db()
    cur = conn.cursor()
    
    # Clear existing tasks
    cur.execute("DELETE FROM daily_tasks")
    
    # Get all subjects
    cur.execute("SELECT * FROM subjects ORDER BY deadline")
    subjects = cur.fetchall()
    
    if not subjects:
        conn.commit()
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No subjects found")
    
    today = date.today()
    
    for subject in subjects:
        deadline = subject['deadline']
        topics = subject['topics']
        
        if deadline < today:
            continue
        
        days_remaining = (deadline - today).days + 1
        
        if days_remaining <= 0 or len(topics) == 0:
            continue
        
        # Distribute topics evenly across available days
        topics_per_day = max(1, len(topics) // days_remaining)
        if len(topics) % days_remaining != 0:
            topics_per_day += 1
        
        current_date = today
        topic_index = 0
        
        while topic_index < len(topics) and current_date <= deadline:
            topics_for_day = min(topics_per_day, len(topics) - topic_index)
            
            for i in range(topics_for_day):
                if topic_index < len(topics):
                    cur.execute(
                        "INSERT INTO daily_tasks (subject_id, topic, scheduled_date) VALUES (%s, %s, %s)",
                        (subject['id'], topics[topic_index], current_date)
                    )
                    topic_index += 1
            
            current_date += timedelta(days=1)
    
    conn.commit()
    
    # Auto-sync to Google Calendar if authenticated
    if os.path.exists("token.json"):
        try:
            with open("token.json", "r") as token_file:
                creds_dict = json.load(token_file)
            
            # Re-fetch tasks to get subject names
            cur.execute("""
                SELECT dt.*, s.name as subject_name 
                FROM daily_tasks dt 
                JOIN subjects s ON dt.subject_id = s.id 
                WHERE dt.scheduled_date >= CURRENT_DATE AND dt.missed = FALSE
            """)
            tasks = cur.fetchall()
            
            tasks_list = [dict(t) for t in tasks]
            
            # Sync
            result = sync_tasks(tasks_list, creds_dict)
            
            # Update google_event_ids
            for task_id, event_id in result.items():
                cur.execute(
                    "UPDATE daily_tasks SET google_event_id = %s WHERE id = %s",
                    (event_id, task_id)
                )
            conn.commit()
            print(f"Auto-synced {len(result)} tasks")
            
        except Exception as e:
            print(f"Auto-sync failed: {e}")
            # We don't raise here to avoid failing the plan generation
            
    cur.close()
    conn.close()
    
    return {"message": "Plan generated successfully"}

@app.get("/tasks", response_model=List[DailyTask])
async def get_tasks(date_filter: Optional[str] = None):
    conn = get_db()
    cur = conn.cursor()
    
    if date_filter:
        cur.execute("""
            SELECT dt.*, s.name as subject_name 
            FROM daily_tasks dt 
            JOIN subjects s ON dt.subject_id = s.id 
            WHERE scheduled_date = %s
            ORDER BY scheduled_date, subject_name
        """, (date_filter,))
    else:
        cur.execute("""
            SELECT dt.*, s.name as subject_name 
            FROM daily_tasks dt 
            JOIN subjects s ON dt.subject_id = s.id 
            ORDER BY scheduled_date, subject_name
        """)
    
    tasks = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return tasks

@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, update: TaskUpdate):
    conn = get_db()
    cur = conn.cursor()
    
    # Get current task with subject name
    cur.execute("""
        SELECT dt.*, s.name as subject_name 
        FROM daily_tasks dt 
        JOIN subjects s ON dt.subject_id = s.id 
        WHERE dt.id = %s
    """, (task_id,))
    task = cur.fetchone()
    
    if not task:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    if update.completed is not None:
        cur.execute("UPDATE daily_tasks SET completed = %s WHERE id = %s", (update.completed, task_id))
        
        # Auto-sync completion status
        if task['google_event_id'] and os.path.exists("token.json"):
            try:
                with open("token.json", "r") as token_file:
                    creds_dict = json.load(token_file)
                
                # Determine new title
                new_title = f"{'✓ ' if update.completed else ''}Study: {task['subject_name']} - {task['topic']}"
                update_event_title(task['google_event_id'], new_title, creds_dict)
            except Exception as e:
                print(f"Failed to auto-sync completion: {e}")
    
    if update.missed is not None and update.missed:
        # Mark as missed and reschedule
        cur.execute("UPDATE daily_tasks SET missed = %s WHERE id = %s", (True, task_id))
        
        # Find next available day
        cur.execute("""
            SELECT MAX(scheduled_date) as last_date 
            FROM daily_tasks 
            WHERE subject_id = %s
        """, (task['subject_id'],))
        
        result = cur.fetchone()
        last_date = result['last_date'] if result['last_date'] else date.today()
        next_date = last_date + timedelta(days=1)
        
        # Create new task for next day
        cur.execute("""
            INSERT INTO daily_tasks (subject_id, topic, scheduled_date, completed, missed, google_event_id)
            VALUES (%s, %s, %s, FALSE, FALSE, %s)
        """, (task['subject_id'], task['topic'], next_date, task['google_event_id']))
        
        # If there's a Google Event, move it
        if task['google_event_id'] and os.path.exists("token.json"):
            try:
                with open("token.json", "r") as token_file:
                    creds_dict = json.load(token_file)
                
                # Move event
                move_event(task['google_event_id'], next_date, creds_dict)
                
                # Clear event ID from old task so we don't duplicate/sync it again as a new event
                cur.execute("UPDATE daily_tasks SET google_event_id = NULL WHERE id = %s", (task_id,))
                
            except Exception as e:
                print(f"Failed to move calendar event: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Task updated successfully"}

@app.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int):
    conn = get_db()
    cur = conn.cursor()
    
    # Auto-sync deletion
    if os.path.exists("token.json"):
        try:
            with open("token.json", "r") as token_file:
                creds_dict = json.load(token_file)
            
            # Get all tasks for this subject to find event IDs
            cur.execute("SELECT google_event_id FROM daily_tasks WHERE subject_id = %s AND google_event_id IS NOT NULL", (subject_id,))
            tasks_to_delete = cur.fetchall()
            
            for task in tasks_to_delete:
                delete_event(task['google_event_id'], creds_dict)
                
        except Exception as e:
            print(f"Failed to auto-sync deletion: {e}")

    cur.execute("DELETE FROM subjects WHERE id = %s", (subject_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Subject deleted"}

# Google Calendar Routes

@app.get("/auth/google/url")
async def google_auth_url():
    url, state = get_google_auth_url()
    return {"url": url}

@app.get("/auth/google/callback")
async def google_auth_callback(code: str):
    try:
        creds_dict = exchange_code_for_token(code)
        
        # Save credentials to a local file
        with open("token.json", "w") as token_file:
            json.dump(creds_dict, token_file)
            
        # Redirect back to frontend
        return RedirectResponse("http://localhost:5173?auth=success")
    except Exception as e:
        print(f"OAuth Callback Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/google/status")
async def get_auth_status():
    if os.path.exists("token.json"):
        try:
            with open("token.json", "r") as token_file:
                creds_dict = json.load(token_file)
            email = get_user_email(creds_dict)
            return {"authenticated": True, "email": email}
        except:
            return {"authenticated": False, "email": None}
    return {"authenticated": False, "email": None}


@app.post("/auth/google/logout")
async def google_logout():
    if os.path.exists("token.json"):
        os.remove("token.json")
    return {"message": "Logged out successfully"}
async def trigger_sync():
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated. Please connect Google Calendar first.")
    
    with open("token.json", "r") as token_file:
        creds_dict = json.load(token_file)
    
    conn = get_db()
    cur = conn.cursor()
    
    # Get all tasks (future)
    cur.execute("""
        SELECT dt.*, s.name as subject_name 
        FROM daily_tasks dt 
        JOIN subjects s ON dt.subject_id = s.id 
        WHERE dt.scheduled_date >= CURRENT_DATE AND dt.missed = FALSE
    """)
    tasks = cur.fetchall()
    
    # Convert tasks to dictionary
    tasks_list = []
    for t in tasks:
        tasks_list.append(dict(t))
        
    try:
        result = sync_tasks(tasks_list, creds_dict)
        
        # Update tasks with google_event_id
        for task_id, event_id in result.items():
            cur.execute(
                "UPDATE daily_tasks SET google_event_id = %s WHERE id = %s",
                (event_id, task_id)
            )
        conn.commit()
        return {"message": f"Synced {len(result)} tasks", "details": result}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()



@app.get("/calendar/events")
async def fetch_calendar_events():
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    with open("token.json", "r") as token_file:
        creds_dict = json.load(token_file)
        
    try:
        events = get_upcoming_events(creds_dict)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/calendar/events/move")
async def move_calendar_event(event_id: str, new_date: date):
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    with open("token.json", "r") as token_file:
        creds_dict = json.load(token_file)
    
    # Update Google Calendar
    try:
        move_event(event_id, new_date, creds_dict)
    except Exception as e:
        print(f"Failed to move Google Calendar event: {e}")
        # Even if Google sync fails, we might want to update local DB? 
        # Usually better to stay in sync.
    
    # Update local database
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE daily_tasks SET scheduled_date = %s WHERE google_event_id = %s",
            (new_date, event_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
    
    return {"message": "Event moved successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)