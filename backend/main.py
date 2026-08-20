import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from calendar_routes import router as calendar_router
from database import initialize_database
from legacy import router as legacy_router
from plans import router as plans_router
from subjects import router as subjects_router
from tasks import router as tasks_router

load_dotenv()
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    initialize_database()


app.include_router(auth_router)
app.include_router(subjects_router)
app.include_router(tasks_router)
app.include_router(plans_router)
app.include_router(legacy_router)
app.include_router(calendar_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
