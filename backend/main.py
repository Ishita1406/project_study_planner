from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import traceback
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import json
from calendar_service import get_google_auth_url, exchange_code_for_token, sync_tasks, move_event, get_user_email, delete_event, update_event_title

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

# Initialize database
@app.on_event("startup")
async def startup():
    conn = get_db()
    cur = conn.cursor()
    
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
        
        conn.commit()
        print("Database migrations completed successfully.")
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()

    
    conn.commit()
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
    
    # Get current task
    cur.execute("SELECT * FROM daily_tasks WHERE id = %s", (task_id,))
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
        return RedirectResponse("http://localhost:5174?auth=success")
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


@app.post("/sync-calendar")
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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)