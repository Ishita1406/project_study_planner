import json
import os
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from calendar_service import delete_event, move_event, sync_tasks, update_event_title
from database import get_db
from schemas import DailyTask, Subject, SubjectResponse, TaskUpdate

router = APIRouter()


@router.post("/subjects")
async def create_subject(subject: Subject):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO subjects (name, topics, deadline) VALUES (%s, %s, %s) RETURNING id", (subject.name, subject.topics, subject.deadline))
        subject_id = cur.fetchone()["id"]
        conn.commit()
        return {"id": subject_id, **subject.model_dump()}
    finally:
        cur.close()
        conn.close()


@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM subjects ORDER BY deadline")
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


@router.post("/generate-plan")
async def generate_plan():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM daily_tasks")
        cur.execute("SELECT * FROM subjects ORDER BY deadline")
        subjects = cur.fetchall()
        if not subjects:
            raise HTTPException(status_code=400, detail="No subjects found")
        today = date.today()
        for subject in subjects:
            if not subject["deadline"] or subject["deadline"] < today:
                continue
            topics = subject["topics"]
            days_remaining = (subject["deadline"] - today).days + 1
            if days_remaining <= 0 or not topics:
                continue
            topics_per_day = max(1, -(-len(topics) // days_remaining))
            current_date = today
            topic_index = 0
            while topic_index < len(topics) and current_date <= subject["deadline"]:
                for _ in range(min(topics_per_day, len(topics) - topic_index)):
                    cur.execute("INSERT INTO daily_tasks (subject_id, topic, scheduled_date) VALUES (%s, %s, %s)", (subject["id"], topics[topic_index], current_date))
                    topic_index += 1
                current_date += timedelta(days=1)
        conn.commit()
        if os.path.exists("token.json"):
            try:
                with open("token.json", "r") as token_file:
                    credentials = json.load(token_file)
                cur.execute("SELECT dt.*, s.name AS subject_name FROM daily_tasks dt JOIN subjects s ON dt.subject_id = s.id WHERE dt.scheduled_date >= CURRENT_DATE AND dt.missed = FALSE")
                for task_id, event_id in sync_tasks([dict(task) for task in cur.fetchall()], credentials).items():
                    cur.execute("UPDATE daily_tasks SET google_event_id = %s WHERE id = %s", (event_id, task_id))
                conn.commit()
            except Exception as error:
                print(f"Auto-sync failed: {error}")
        return {"message": "Plan generated successfully"}
    finally:
        cur.close()
        conn.close()


@router.get("/tasks", response_model=List[DailyTask])
async def get_tasks(date_filter: Optional[str] = None):
    conn = get_db()
    cur = conn.cursor()
    try:
        query = "SELECT dt.*, s.name AS subject_name FROM daily_tasks dt JOIN subjects s ON dt.subject_id = s.id"
        values = []
        if date_filter:
            query += " WHERE scheduled_date = %s"
            values.append(date_filter)
        cur.execute(query + " ORDER BY scheduled_date, subject_name", values)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


@router.patch("/tasks/{task_id}")
async def update_task(task_id: int, update: TaskUpdate):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT dt.*, s.name AS subject_name FROM daily_tasks dt JOIN subjects s ON dt.subject_id = s.id WHERE dt.id = %s", (task_id,))
        task = cur.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if update.completed is not None:
            cur.execute("UPDATE daily_tasks SET completed = %s WHERE id = %s", (update.completed, task_id))
            if task["google_event_id"] and os.path.exists("token.json"):
                try:
                    with open("token.json", "r") as token_file:
                        update_event_title(task["google_event_id"], f"{'✓ ' if update.completed else ''}Study: {task['subject_name']} - {task['topic']}", json.load(token_file))
                except Exception as error:
                    print(f"Failed to auto-sync completion: {error}")
        if update.missed:
            cur.execute("UPDATE daily_tasks SET missed = TRUE WHERE id = %s", (task_id,))
            cur.execute("SELECT MAX(scheduled_date) AS last_date FROM daily_tasks WHERE subject_id = %s", (task["subject_id"],))
            next_date = (cur.fetchone()["last_date"] or date.today()) + timedelta(days=1)
            cur.execute("INSERT INTO daily_tasks (subject_id, topic, scheduled_date, completed, missed, google_event_id) VALUES (%s, %s, %s, FALSE, FALSE, %s)", (task["subject_id"], task["topic"], next_date, task["google_event_id"]))
            if task["google_event_id"] and os.path.exists("token.json"):
                try:
                    with open("token.json", "r") as token_file:
                        move_event(task["google_event_id"], next_date, json.load(token_file))
                    cur.execute("UPDATE daily_tasks SET google_event_id = NULL WHERE id = %s", (task_id,))
                except Exception as error:
                    print(f"Failed to move calendar event: {error}")
        conn.commit()
        return {"message": "Task updated successfully"}
    finally:
        cur.close()
        conn.close()


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int):
    conn = get_db()
    cur = conn.cursor()
    try:
        if os.path.exists("token.json"):
            try:
                with open("token.json", "r") as token_file:
                    credentials = json.load(token_file)
                cur.execute("SELECT google_event_id FROM daily_tasks WHERE subject_id = %s AND google_event_id IS NOT NULL", (subject_id,))
                for task in cur.fetchall():
                    delete_event(task["google_event_id"], credentials)
            except Exception as error:
                print(f"Failed to auto-sync deletion: {error}")
        cur.execute("DELETE FROM subjects WHERE id = %s", (subject_id,))
        conn.commit()
        return {"message": "Subject deleted"}
    finally:
        cur.close()
        conn.close()