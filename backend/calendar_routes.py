import json
import os
import traceback
from datetime import date

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from calendar_service import exchange_code_for_token, get_google_auth_url, get_upcoming_events, get_user_email, move_event, sync_tasks
from database import get_db

router = APIRouter()


@router.get("/auth/google/url")
@router.get("/api/auth/google/url")
async def google_auth_url():
    url, _ = get_google_auth_url()
    return {"url": url}


@router.get("/auth/google/callback")
@router.get("/api/auth/google/callback")
async def google_auth_callback(code: str):
    try:
        with open("token.json", "w") as token_file:
            json.dump(exchange_code_for_token(code), token_file)
        return RedirectResponse("http://localhost:5173?auth=success")
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/auth/google/status")
@router.get("/api/auth/google/status")
async def get_auth_status():
    if not os.path.exists("token.json"):
        return {"authenticated": False, "email": None}
    try:
        with open("token.json", "r") as token_file:
            return {"authenticated": True, "email": get_user_email(json.load(token_file))}
    except Exception:
        return {"authenticated": False, "email": None}


@router.post("/auth/google/logout")
@router.post("/api/auth/google/logout")
async def google_logout():
    if os.path.exists("token.json"):
        os.remove("token.json")
    return {"message": "Logged out successfully"}


@router.post("/api/calendar/sync")
async def sync_calendar():
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated. Please connect Google Calendar first.")
    with open("token.json", "r") as token_file:
        credentials = json.load(token_file)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT dt.*, s.name AS subject_name FROM daily_tasks dt JOIN subjects s ON dt.subject_id = s.id WHERE dt.scheduled_date >= CURRENT_DATE AND dt.missed = FALSE")
        result = sync_tasks([dict(task) for task in cur.fetchall()], credentials)
        for task_id, event_id in result.items():
            cur.execute("UPDATE daily_tasks SET google_event_id = %s WHERE id = %s", (event_id, task_id))
        conn.commit()
        return {"message": f"Synced {len(result)} tasks", "details": result}
    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        cur.close()
        conn.close()


@router.get("/calendar/events")
@router.get("/api/calendar/events")
async def get_calendar_events():
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        with open("token.json", "r") as token_file:
            return get_upcoming_events(json.load(token_file))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.patch("/calendar/events/move")
async def move_calendar_event(event_id: str, new_date: date):
    return await _move_calendar_event(event_id, new_date)


@router.patch("/api/calendar/events/move")
async def move_api_calendar_event(eventId: str, newDate: date):
    return await _move_calendar_event(eventId, newDate)


async def _move_calendar_event(event_id: str, new_date: date):
    if not os.path.exists("token.json"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    with open("token.json", "r") as token_file:
        credentials = json.load(token_file)
    try:
        move_event(event_id, new_date, credentials)
    except Exception as error:
        print(f"Failed to move Google Calendar event: {error}")
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE daily_tasks SET scheduled_date = %s WHERE google_event_id = %s", (new_date, event_id))
        conn.commit()
        return {"message": "Event moved successfully"}
    except Exception as error:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        cur.close()
        conn.close()