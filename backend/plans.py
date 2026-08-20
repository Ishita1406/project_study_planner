import json
import os
import secrets
from datetime import date, timedelta
from typing import Any, Dict, List

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from database import get_db
from schemas import PlanGenerationRequest

router = APIRouter(prefix="/api")

GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-latest"]


def call_gemini(prompt: str) -> str:
    """Call Gemini API via REST, trying multiple models."""
    api_key = os.getenv("GEMINI_API_KEY")
    last_error = None
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        resp = http_requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=60)
        if resp.status_code == 200:
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        last_error = f"{model}: {resp.status_code} {resp.json().get('error', {}).get('message', '')[:100]}"
        print(f"[AI] {last_error}")
    raise RuntimeError(f"All Gemini models failed. Last: {last_error}")


def serialize_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    params = json.loads(plan["params"]) if isinstance(plan["params"], str) else plan["params"]
    items = json.loads(plan["items"]) if isinstance(plan["items"], str) else plan["items"]
    return {"id": str(plan["id"]), "userId": str(plan["user_id"]), "generatedAt": plan["generated_at"].isoformat(), "status": plan["status"], "params": params, "items": items}


def build_prompt(request: PlanGenerationRequest, candidates: List[Dict[str, Any]], today: date) -> str:
    topics_info = []
    for c in candidates:
        deadline_str = c["deadline"].isoformat() if c["deadline"] else "no deadline"
        days_left = (c["deadline"] - today).days if c["deadline"] else "N/A"
        topics_info.append(
            f"- Subject: {c['subject_name']} (ID: {c['subject_id']}, priority: {c['priority']})\n"
            f"  Topic: {c['topic_name']} (ID: {c['topic_id']})\n"
            f"  Difficulty: {c['difficulty']}, Confidence: {c['confidence']}%, "
            f"Estimated: {c['estimated_minutes']} min\n"
            f"  Deadline: {deadline_str} ({days_left} days left)"
        )

    days_schedule = []
    for offset in range(7):
        d = today + timedelta(days=offset)
        day_name = d.strftime("%A")
        if request.availabilityMode == "custom":
            hours = request.weeklyAvailability.get(day_name.lower(), 0)
        else:
            hours = request.dailyHours
        days_schedule.append(f"- {day_name} ({d.isoformat()}): {hours} hours available")

    return f"""You are an AI study planner. Create an optimized 7-day study schedule.

TODAY: {today.isoformat()} ({today.strftime("%A")})

STUDENT'S INCOMPLETE TOPICS:
{chr(10).join(topics_info)}

AVAILABILITY FOR NEXT 7 DAYS:
{chr(10).join(days_schedule)}

STUDENT PREFERENCES:
- Preferred study time: {request.preferredTime}
- Max continuous session: {request.maxContinuousMinutes} minutes
- Break between sessions: {request.breakMinutes} minutes
- Priority strategies: {', '.join(request.priorities)}

STUDENT'S ADDITIONAL NOTES:
{request.additionalNotes or 'None'}

RULES:
1. Schedule harder/low-confidence topics earlier in the week and during peak focus times.
2. If a deadline is within 3 days, heavily prioritize that subject's topics.
3. Respect the student's available hours per day — do NOT exceed them.
4. Each session duration must be between 30 and {request.maxContinuousMinutes} minutes.
5. Use appropriate start times based on preferred time: morning (09:00-12:00), afternoon (13:30-17:00), evening (17:00-21:00), flexible (spread across day).
6. Give a short, specific "reason" for WHY each session is scheduled (e.g., "Low confidence (35%) — needs extra review before Friday exam").
7. Pay close attention to the student's additional notes and adjust the plan accordingly.
8. Do NOT schedule topics with 0 available hours on that day.

Respond with ONLY a valid JSON array of objects. No markdown, no explanation, no code blocks. Each object must have exactly these fields:
- "subjectId": number (from the IDs above)
- "topicId": number (from the IDs above)
- "subjectName": string
- "topicName": string
- "day": string (e.g., "Monday")
- "date": string (YYYY-MM-DD)
- "startTime": string (HH:MM, 24-hour format)
- "durationMinutes": number
- "difficulty": string ("easy", "medium", or "hard")
- "priority": string ("low", "medium", or "high")
- "reason": string (short, specific explanation)
"""


def fallback_generate(request: PlanGenerationRequest, candidates: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    """Basic algorithmic fallback if Gemini API fails."""
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
                "reason": "Scheduled based on difficulty and deadline priority.",
            })
            remaining -= duration + request.breakMinutes
    return items


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
            values.append([int(sid) for sid in request.prioritizedSubjectIds])
        cur.execute(query + " GROUP BY subject.id, topic.id ORDER BY subject.id, topic.id", values)
        candidates = cur.fetchall()
        if not candidates:
            raise HTTPException(status_code=400, detail="No incomplete topics are available for planning")

        today = date.today()

        # Try Gemini AI generation, fall back to basic algorithm on failure
        try:
            prompt = build_prompt(request, candidates, today)
            print("[AI] Calling Gemini API...")
            raw_text = call_gemini(prompt).strip()
            print(f"[AI] Gemini responded with {len(raw_text)} chars")
            # Clean markdown code fences if present
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[1]
                raw_text = raw_text.rsplit("```", 1)[0].strip()
            ai_items = json.loads(raw_text)

            # Build lookup for validation
            valid_topics = {(c["subject_id"], c["topic_id"]) for c in candidates}

            items = []
            for item in ai_items:
                sid = int(item["subjectId"])
                tid = int(item["topicId"])
                if (sid, tid) not in valid_topics:
                    continue
                items.append({
                    "id": f"gpi_{secrets.token_hex(8)}",
                    "day": item["day"],
                    "date": item["date"],
                    "startTime": item["startTime"],
                    "subjectId": str(sid),
                    "topicId": str(tid),
                    "subjectName": item["subjectName"],
                    "topicName": item["topicName"],
                    "durationMinutes": int(item["durationMinutes"]),
                    "difficulty": item["difficulty"],
                    "priority": item["priority"],
                    "reason": item["reason"],
                })

            if not items:
                items = fallback_generate(request, candidates, today)
        except Exception as e:
            print(f"[AI] Gemini failed, using fallback: {e}")
            items = fallback_generate(request, candidates, today)

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