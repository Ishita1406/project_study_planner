from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


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


class TaskCreateRequest(BaseModel):
    subjectId: int
    topicId: int
    scheduledDate: date
    startTime: str
    duration: int
    status: str = "pending"
    priority: str = "medium"
    notes: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    scheduledDate: Optional[date] = None
    startTime: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    completedAt: Optional[datetime] = None


class RebalanceRequest(BaseModel):
    newDate: date


class StudySessionCreateRequest(BaseModel):
    taskId: Optional[int] = None
    subjectId: int
    topicId: int
    startTime: datetime
    endTime: datetime
    duration: int
    difficultyFeedback: str
    confidence: int
    notes: Optional[str] = None


class PlanGenerationRequest(BaseModel):
    availabilityMode: str
    dailyHours: float
    weeklyAvailability: Dict[str, float]
    prioritizedSubjectIds: List[int] = []
    priorities: List[str] = []
    preferredTime: str = "flexible"
    maxContinuousMinutes: int = 60
    breakMinutes: int = 10
    additionalNotes: Optional[str] = None


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