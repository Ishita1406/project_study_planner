# 🎓 AI-Powered Study Planner

An intelligent full-stack application designed to help students organize their academic life. It automatically breaks down subjects into manageable daily topics and syncs them with **Google Calendar** for seamless task tracking.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🚀 Features

-   **🧠 Smart Scheduling:** Automatically distributes study topics evenly across available days before your exam deadline.
-   **📅 Google Calendar Integration:** Sync your study plan directly to your Google Calendar.
-   **✅ Progress Tracking:** Mark tasks as completed or missed.
-   **🔄 Auto-Rescheduling:** Missed tasks are automatically moved to the next available day to keep you on track.
-   **📊 Interactive Dashboard:** A clean, modern UI to manage your subjects and view your daily schedule.

---

## 🛠️ Tech Stack

-   **Frontend:** React, Vite, CSS3
-   **Backend:** FastAPI (Python), PostgreSQL
-   **External Services:** Google Calendar API

---

## 📂 Project Structure

```text
.
├── backend/            # FastAPI application & database migrations
│   ├── main.py         # API endpoints & server logic
│   ├── calendar_service.py # Google Calendar integration
│   └── requirements.txt # Python dependencies
├── frontend/           # React application
│   ├── src/            # Components & application logic
│   └── package.json    # Node.js dependencies
└── setup_db.sh         # Convenience script for database setup
```

---

## ⚙️ Getting Started

### Prerequisites

-   **Node.js** (v16+) & **npm**
-   **Python** (3.8+)
-   **PostgreSQL** (Running locally or via Docker)
-   **Google Cloud Account** (For Calendar API)

### 1. Database Setup

Ensure PostgreSQL is running, then create the database:

```bash
# Using the provided script
chmod +x setup_db.sh
./setup_db.sh

# OR manually in psql
CREATE DATABASE study_planner;
```

### 2. Backend Configuration

1.  **Navigate to backend:**
    ```bash
    cd backend
    ```
2.  **Create a Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory:
    ```env
    DB_HOST=localhost
    DB_NAME=study_planner
    DB_USER=your_username
    DB_PASSWORD=your_password
    ```

### 3. Google Calendar API Setup (Required for Sync)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable the **Google Calendar API**.
4.  Configure the **OAuth Consent Screen** (Internal or External).
5.  Create **OAuth 2.0 Client IDs** (Desktop application).
6.  Download the `credentials.json` and place it in the `backend/` directory.

### 4. Running the Application

**Start the Backend:**
```bash
# In the backend directory
python main.py
```
*Server runs at: `http://localhost:8000`*

**Start the Frontend:**
```bash
# In the frontend directory
npm install
npm run dev
```
*App runs at: `http://localhost:5173`*

---

## 📖 API Documentation

The backend provides interactive documentation:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

