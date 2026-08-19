from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from schemas import RebalanceRequest, StudySessionCreateRequest, TaskCreateRequest, TaskUpdateRequest

router = APIRouter(prefix="/api")


def serialize_task(task: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(task["id"]), "subjectId": str(task["subject_id"]), "topicId": str(task["topic_id"]),
        "scheduledDate": task["scheduled_date"].isoformat(), "startTime": task["start_time"],
        "duration": task["duration"], "status": task["status"], "priority": task["priority"],
        "notes": task["notes"], "completedAt": task["completed_at"].isoformat() if task["completed_at"] else None,
    }


def serialize_study_session(session: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(session["id"]), "taskId": str(session["task_id"]) if session["task_id"] else None,
        "subjectId": str(session["subject_id"]), "topicId": str(session["topic_id"]),
        "startTime": session["start_time"].isoformat(), "endTime": session["end_time"].isoformat(),
        "duration": session["duration"], "difficultyFeedback": session["difficulty_feedback"],
        "confidence": session["confidence"], "notes": session["notes"], "createdAt": session["created_at"].isoformat(),
    }


@router.get("/tasks")
async def get_tasks(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT task.* FROM tasks task JOIN subjects subject ON subject.id = task.subject_id WHERE subject.user_id = %s ORDER BY task.scheduled_date, task.start_time, task.id", (user["id"],))
        return [serialize_task(task) for task in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/tasks", status_code=201)
async def create_task(request: TaskCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT subject.id FROM subjects subject JOIN topics topic ON topic.id = %s AND topic.subject_id = subject.id WHERE subject.id = %s AND subject.user_id = %s", (request.topicId, request.subjectId, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject or topic not found")
        cur.execute("""INSERT INTO tasks (subject_id, topic_id, scheduled_date, start_time, duration, status, priority, notes)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""", (request.subjectId, request.topicId, request.scheduledDate, request.startTime, request.duration, request.status, request.priority, request.notes))
        task = cur.fetchone()
        conn.commit()
        return serialize_task(task)
    finally:
        cur.close()
        conn.close()


@router.patch("/tasks/{task_id}")
async def update_task(task_id: int, request: TaskUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {"scheduledDate": "scheduled_date", "startTime": "start_time", "duration": "duration", "status": "status", "priority": "priority", "notes": "notes", "completedAt": "completed_at"}
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")
    if updates.get("status") == "completed" and "completedAt" not in updates:
        updates["completedAt"] = datetime.utcnow()
    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(f"UPDATE tasks AS task SET {assignments} FROM subjects AS subject WHERE task.id = %s AND task.subject_id = subject.id AND subject.user_id = %s RETURNING task.*", [*updates.values(), task_id, user["id"]])
        task = cur.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        conn.commit()
        return serialize_task(task)
    finally:
        cur.close()
        conn.close()


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM tasks AS task USING subjects AS subject WHERE task.id = %s AND task.subject_id = subject.id AND subject.user_id = %s RETURNING task.id", (task_id, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Task not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()


@router.post("/tasks/{task_id}/rebalance")
async def rebalance_task(task_id: int, request: RebalanceRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT task.* FROM tasks task JOIN subjects subject ON subject.id = task.subject_id WHERE task.id = %s AND subject.user_id = %s", (task_id, user["id"]))
        target = cur.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="Task not found")
        cur.execute("UPDATE tasks SET scheduled_date = %s WHERE id = %s", (request.newDate, task_id))
        cur.execute("SELECT id FROM tasks WHERE subject_id = %s AND id != %s AND status = 'pending' AND scheduled_date >= %s ORDER BY scheduled_date, start_time, id", (target["subject_id"], task_id, request.newDate))
        for index, task in enumerate(cur.fetchall()):
            cur.execute("UPDATE tasks SET scheduled_date = %s WHERE id = %s", (request.newDate + timedelta(days=(index + 1) // 3), task["id"]))
        cur.execute("SELECT task.* FROM tasks task JOIN subjects subject ON subject.id = task.subject_id WHERE subject.user_id = %s ORDER BY task.scheduled_date, task.start_time, task.id", (user["id"],))
        tasks = [serialize_task(task) for task in cur.fetchall()]
        conn.commit()
        return tasks
    finally:
        cur.close()
        conn.close()


@router.get("/study-sessions")
async def get_study_sessions(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT session.* FROM study_sessions session JOIN subjects subject ON subject.id = session.subject_id WHERE subject.user_id = %s ORDER BY session.start_time DESC", (user["id"],))
        return [serialize_study_session(session) for session in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/study-sessions", status_code=201)
async def create_study_session(request: StudySessionCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT subject.id, topic.confidence AS topic_confidence FROM subjects subject JOIN topics topic ON topic.id = %s AND topic.subject_id = subject.id WHERE subject.id = %s AND subject.user_id = %s", (request.topicId, request.subjectId, user["id"]))
        topic = cur.fetchone()
        if not topic:
            raise HTTPException(status_code=404, detail="Subject or topic not found")
        if request.taskId:
            cur.execute("SELECT task.id FROM tasks task JOIN subjects subject ON subject.id = task.subject_id WHERE task.id = %s AND task.subject_id = %s AND subject.user_id = %s", (request.taskId, request.subjectId, user["id"]))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Task not found")
        cur.execute("""INSERT INTO study_sessions (task_id, subject_id, topic_id, start_time, end_time, duration, difficulty_feedback, confidence, notes)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""", (request.taskId, request.subjectId, request.topicId, request.startTime, request.endTime, request.duration, request.difficultyFeedback, request.confidence, request.notes))
        session = cur.fetchone()
        if request.taskId:
            cur.execute("UPDATE tasks SET status = 'completed', completed_at = %s WHERE id = %s", (session["created_at"], request.taskId))
        confidence = max(0, min(100, round((topic["topic_confidence"] + request.confidence) / 2)))
        cur.execute("UPDATE topics SET confidence = %s, completed = completed OR %s WHERE id = %s", (confidence, confidence >= 75, request.topicId))
        conn.commit()
        return serialize_study_session(session)
    finally:
        cur.close()
        conn.close()