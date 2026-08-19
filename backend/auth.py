import hashlib
import json
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

import psycopg2
from fastapi import APIRouter, Depends, Header, HTTPException

from database import get_db
from schemas import LoginRequest, PreferencesUpdateRequest, SignupRequest, UserUpdateRequest

router = APIRouter(prefix="/api")

DEFAULT_WEEKLY_AVAILABILITY = {
    "monday": 2,
    "tuesday": 2,
    "wednesday": 2,
    "thursday": 2,
    "friday": 2,
    "saturday": 0,
    "sunday": 0,
}


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(password_salt), 310000
    ).hex()
    return password_salt, digest


def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user["id"]), "name": user["name"], "email": user["email"],
        "targetSemester": user["target_semester"], "weeklyGoalHours": user["weekly_goal_hours"],
        "avatarUrl": user["avatar_url"],
    }


def serialize_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
    availability = preferences["weekly_availability"]
    if isinstance(availability, str):
        availability = json.loads(availability)
    return {
        "defaultDailyHours": preferences["default_daily_hours"],
        "weeklyAvailability": availability, "maxContinuousMinutes": preferences["max_continuous_minutes"],
        "breakMinutes": preferences["break_minutes"], "preferredTime": preferences["preferred_time"],
        "notifyReminders": preferences["notify_reminders"], "notifyDeadlines": preferences["notify_deadlines"],
        "googleCalendarSync": preferences["google_calendar_sync"],
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """SELECT u.* FROM auth_sessions session JOIN users u ON u.id = session.user_id
               WHERE session.token = %s AND session.expires_at > NOW()""",
            (authorization.removeprefix("Bearer "),),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Session is invalid or expired")
        return user
    finally:
        cur.close()
        conn.close()


@router.post("/auth/signup", status_code=201)
async def signup(request: SignupRequest):
    if len(request.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    conn = get_db()
    cur = conn.cursor()
    try:
        salt, password_hash = hash_password(request.password)
        cur.execute(
            """INSERT INTO users (name, email, password_salt, password_hash, target_semester, weekly_goal_hours, avatar_url)
               VALUES (%s, LOWER(%s), %s, %s, %s, %s, %s) RETURNING *""",
            (request.name, request.email, salt, password_hash, request.targetSemester, request.weeklyGoalHours, request.avatarUrl),
        )
        user = cur.fetchone()
        cur.execute("INSERT INTO user_preferences (user_id, weekly_availability) VALUES (%s, %s::jsonb)", (user["id"], json.dumps(DEFAULT_WEEKLY_AVAILABILITY)))
        token = create_session(cur, user["id"])
        conn.commit()
        return {"token": token, "user": serialize_user(user)}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    finally:
        cur.close()
        conn.close()


@router.post("/auth/login")
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


@router.post("/auth/logout", status_code=204)
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


@router.get("/auth/me")
@router.get("/user")
async def get_user(user: Dict[str, Any] = Depends(get_current_user)):
    return serialize_user(user)


@router.patch("/user")
async def update_user(request: UserUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {"name": "name", "targetSemester": "target_semester", "weeklyGoalHours": "weekly_goal_hours", "avatarUrl": "avatar_url"}
    if not updates:
        return serialize_user(user)
    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(f"UPDATE users SET {assignments} WHERE id = %s RETURNING *", [*updates.values(), user["id"]])
        updated_user = cur.fetchone()
        conn.commit()
        return serialize_user(updated_user)
    finally:
        cur.close()
        conn.close()


@router.get("/preferences")
async def get_preferences(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM user_preferences WHERE user_id = %s", (user["id"],))
        return serialize_preferences(cur.fetchone())
    finally:
        cur.close()
        conn.close()


@router.patch("/preferences")
async def update_preferences(request: PreferencesUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {"defaultDailyHours": "default_daily_hours", "weeklyAvailability": "weekly_availability", "maxContinuousMinutes": "max_continuous_minutes", "breakMinutes": "break_minutes", "preferredTime": "preferred_time", "notifyReminders": "notify_reminders", "notifyDeadlines": "notify_deadlines", "googleCalendarSync": "google_calendar_sync"}
    if not updates:
        return await get_preferences(user)
    values = [json.dumps(value) if key == "weeklyAvailability" else value for key, value in updates.items()]
    assignments = ", ".join(f"{columns[key]} = %s::jsonb" if key == "weeklyAvailability" else f"{columns[key]} = %s" for key in updates)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE user_preferences SET {assignments} WHERE user_id = %s RETURNING *", [*values, user["id"]])
        preferences = cur.fetchone()
        conn.commit()
        return serialize_preferences(preferences)
    finally:
        cur.close()
        conn.close()