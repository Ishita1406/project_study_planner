from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from schemas import DeadlineCreateRequest, SubjectCreateRequest, SubjectUpdateRequest, TopicCreateRequest, TopicUpdateRequest

router = APIRouter(prefix="/api")


def serialize_subject(subject: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(subject["id"]), "name": subject["name"], "code": subject["code"],
        "description": subject["description"], "deadline": subject["deadline"].isoformat() if subject["deadline"] else None,
        "examName": subject["exam_name"], "difficulty": subject["difficulty"],
        "confidence": subject["confidence"], "priority": subject["priority"],
        "color": subject["color"], "createdAt": subject["created_at"].isoformat(),
    }


def serialize_topic(topic: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(topic["id"]), "subjectId": str(topic["subject_id"]), "name": topic["name"],
        "difficulty": topic["difficulty"], "confidence": topic["confidence"],
        "estimatedMinutes": topic["estimated_minutes"], "completed": topic["completed"], "order": topic["topic_order"],
    }


def serialize_deadline(deadline: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(deadline["id"]), "subjectId": str(deadline["subject_id"]), "title": deadline["title"],
        "dueDate": deadline["due_date"].isoformat(), "type": deadline["deadline_type"], "priority": deadline["priority"],
    }


@router.get("/subjects")
async def get_subjects(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM subjects WHERE user_id = %s ORDER BY created_at", (user["id"],))
        return [serialize_subject(subject) for subject in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/subjects", status_code=201)
async def create_subject(request: SubjectCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO subjects (user_id, name, topics, deadline, code, description, exam_name, difficulty, confidence, priority, color)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (user["id"], request.name, [], request.deadline, request.code, request.description, request.examName, request.difficulty, request.confidence, request.priority, request.color),
        )
        subject = cur.fetchone()
        if request.deadline:
            cur.execute(
                """INSERT INTO deadlines (subject_id, title, due_date, deadline_type, priority)
                   VALUES (%s, %s, %s, 'exam', %s)""",
                (subject["id"], request.examName or f"{request.name} Assessment", request.deadline, request.priority),
            )
        conn.commit()
        return serialize_subject(subject)
    finally:
        cur.close()
        conn.close()


@router.patch("/subjects/{subject_id}")
async def update_subject(subject_id: int, request: SubjectUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {"name": "name", "code": "code", "description": "description", "deadline": "deadline", "examName": "exam_name", "difficulty": "difficulty", "confidence": "confidence", "priority": "priority", "color": "color"}
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")
    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(f"UPDATE subjects SET {assignments} WHERE id = %s AND user_id = %s RETURNING *", [*updates.values(), subject_id, user["id"]])
        subject = cur.fetchone()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        conn.commit()
        return serialize_subject(subject)
    finally:
        cur.close()
        conn.close()


@router.delete("/subjects/{subject_id}", status_code=204)
async def delete_subject(subject_id: int, user: Dict[str, Any] = Depends(get_current_user)):
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


@router.get("/topics")
async def get_topics(subjectId: Optional[int] = None, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        query = "SELECT topic.* FROM topics topic JOIN subjects subject ON subject.id = topic.subject_id WHERE subject.user_id = %s"
        values: List[Any] = [user["id"]]
        if subjectId is not None:
            query += " AND topic.subject_id = %s"
            values.append(subjectId)
        cur.execute(query + " ORDER BY topic.subject_id, topic.topic_order, topic.id", values)
        return [serialize_topic(topic) for topic in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/topics", status_code=201)
async def create_topic(request: TopicCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM subjects WHERE id = %s AND user_id = %s", (request.subjectId, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")
        cur.execute(
            """INSERT INTO topics (subject_id, name, difficulty, confidence, estimated_minutes, completed, topic_order)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (request.subjectId, request.name, request.difficulty, request.confidence, request.estimatedMinutes, request.completed, request.order),
        )
        topic = cur.fetchone()
        conn.commit()
        return serialize_topic(topic)
    finally:
        cur.close()
        conn.close()


@router.patch("/topics/{topic_id}")
async def update_topic(topic_id: int, request: TopicUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    updates = request.model_dump(exclude_unset=True)
    columns = {"name": "name", "difficulty": "difficulty", "confidence": "confidence", "estimatedMinutes": "estimated_minutes", "completed": "completed", "order": "topic_order"}
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")
    conn = get_db()
    cur = conn.cursor()
    try:
        assignments = ", ".join(f"{columns[key]} = %s" for key in updates)
        cur.execute(f"UPDATE topics AS topic SET {assignments} FROM subjects AS subject WHERE topic.id = %s AND topic.subject_id = subject.id AND subject.user_id = %s RETURNING topic.*", [*updates.values(), topic_id, user["id"]])
        topic = cur.fetchone()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        conn.commit()
        return serialize_topic(topic)
    finally:
        cur.close()
        conn.close()


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(topic_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM topics AS topic USING subjects AS subject WHERE topic.id = %s AND topic.subject_id = subject.id AND subject.user_id = %s RETURNING topic.id", (topic_id, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Topic not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()


@router.get("/deadlines")
async def get_deadlines(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT deadline.* FROM deadlines deadline JOIN subjects subject ON subject.id = deadline.subject_id WHERE subject.user_id = %s ORDER BY deadline.due_date, deadline.id", (user["id"],))
        return [serialize_deadline(deadline) for deadline in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/deadlines", status_code=201)
async def create_deadline(request: DeadlineCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM subjects WHERE id = %s AND user_id = %s", (request.subjectId, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")
        cur.execute("INSERT INTO deadlines (subject_id, title, due_date, deadline_type, priority) VALUES (%s, %s, %s, %s, %s) RETURNING *", (request.subjectId, request.title, request.dueDate, request.type, request.priority))
        deadline = cur.fetchone()
        conn.commit()
        return serialize_deadline(deadline)
    finally:
        cur.close()
        conn.close()


@router.delete("/deadlines/{deadline_id}", status_code=204)
async def delete_deadline(deadline_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM deadlines AS deadline USING subjects AS subject WHERE deadline.id = %s AND deadline.subject_id = subject.id AND subject.user_id = %s RETURNING deadline.id", (deadline_id, user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Deadline not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()