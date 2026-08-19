import json
import secrets
from datetime import date, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from schemas import PlanGenerationRequest

router = APIRouter(prefix="/api")


def serialize_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    params = json.loads(plan["params"]) if isinstance(plan["params"], str) else plan["params"]
    items = json.loads(plan["items"]) if isinstance(plan["items"], str) else plan["items"]
    return {"id": str(plan["id"]), "userId": str(plan["user_id"]), "generatedAt": plan["generated_at"].isoformat(), "status": plan["status"], "params": params, "items": items}


@router.get("/plans")
async def get_plans(user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM study_plans WHERE user_id = %s ORDER BY generated_at DESC", (user["id"],))
        return [serialize_plan(plan) for plan in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


@router.post("/plans/generate", status_code=201)
async def generate_plan(request: PlanGenerationRequest, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        query = """
            SELECT subject.id AS subject_id, subject.name AS subject_name, subject.priority,
                   topic.id AS topic_id, topic.name AS topic_name, topic.difficulty,
                   topic.confidence, topic.estimated_minutes, MIN(deadline.due_date) AS deadline
            FROM subjects subject JOIN topics topic ON topic.subject_id = subject.id
            LEFT JOIN deadlines deadline ON deadline.subject_id = subject.id
            WHERE subject.user_id = %s AND topic.completed = FALSE
        """
        values: List[Any] = [user["id"]]
        if request.prioritizedSubjectIds:
            query += " AND subject.id = ANY(%s)"
            values.append(request.prioritizedSubjectIds)
        cur.execute(query + " GROUP BY subject.id, topic.id ORDER BY subject.id, topic.id", values)
        candidates = cur.fetchall()
        if not candidates:
            raise HTTPException(status_code=400, detail="No incomplete topics are available for planning")

        today = date.today()

        def weight(candidate: Dict[str, Any]) -> int:
            score = 40 + max(0, 60 - candidate["confidence"])
            if candidate["difficulty"] == "hard":
                score += 30
            elif candidate["difficulty"] == "medium":
                score += 15
            if candidate["deadline"] and "deadlines" in request.priorities:
                score += max(0, 40 - (candidate["deadline"] - today).days * 2)
            return score

        candidates.sort(key=weight, reverse=True)
        start_times = {
            "morning": ["09:00", "10:30", "12:00"], "afternoon": ["13:30", "15:00", "16:30"],
            "evening": ["17:00", "18:30", "20:00"], "flexible": ["13:30", "15:00", "16:30"],
        }[request.preferredTime]
        items = []
        topic_cursor = 0
        for offset in range(7):
            scheduled_date = today + timedelta(days=offset)
            hours = request.weeklyAvailability.get(scheduled_date.strftime("%A").lower(), 0) if request.availabilityMode == "custom" else request.dailyHours
            remaining = int(hours * 60)
            for start_time in start_times:
                if remaining < 30:
                    break
                candidate = candidates[topic_cursor % len(candidates)]
                topic_cursor += 1
                duration = min(request.maxContinuousMinutes, candidate["estimated_minutes"], remaining)
                items.append({
                    "id": f"gpi_{secrets.token_hex(8)}", "day": scheduled_date.strftime("%A"), "date": scheduled_date.isoformat(),
                    "startTime": start_time, "subjectId": str(candidate["subject_id"]), "topicId": str(candidate["topic_id"]),
                    "subjectName": candidate["subject_name"], "topicName": candidate["topic_name"], "durationMinutes": duration,
                    "difficulty": candidate["difficulty"], "priority": candidate["priority"],
                    "reason": "Scheduled from incomplete topics and your availability.",
                })
                remaining -= duration + request.breakMinutes
        cur.execute("INSERT INTO study_plans (user_id, params, items) VALUES (%s, %s::jsonb, %s::jsonb) RETURNING *", (user["id"], json.dumps(request.model_dump()), json.dumps(items)))
        plan = cur.fetchone()
        conn.commit()
        return serialize_plan(plan)
    finally:
        cur.close()
        conn.close()


@router.post("/plans/{plan_id}/accept", status_code=204)
async def accept_plan(plan_id: int, user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM study_plans WHERE id = %s AND user_id = %s", (plan_id, user["id"]))
        plan = cur.fetchone()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        if plan["status"] != "draft":
            raise HTTPException(status_code=409, detail="Only draft plans can be accepted")
        items = json.loads(plan["items"]) if isinstance(plan["items"], str) else plan["items"]
        cur.execute("DELETE FROM tasks task USING subjects subject WHERE task.subject_id = subject.id AND subject.user_id = %s AND task.status != 'completed'", (user["id"],))
        for item in items:
            cur.execute("""INSERT INTO tasks (subject_id, topic_id, scheduled_date, start_time, duration, status, priority, notes)
                           VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s)""", (int(item["subjectId"]), int(item["topicId"]), item["date"], item["startTime"], item["durationMinutes"], item["priority"], f"Generated by Study Planner: {item['reason']}"))
        cur.execute("UPDATE study_plans SET status = 'accepted' WHERE id = %s", (plan_id,))
        conn.commit()
    finally:
        cur.close()
        conn.close()