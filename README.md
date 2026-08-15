# Real-Time Collaborative Workspace

This plan details the implementation of a full-stack Real-Time Collaborative Workspace application based on Django (Channels, REST Framework, Celery) and React (Vite, TypeScript, TanStack Query, Zustand).

## Local Setup without Docker (Windows)

To run this application natively on your machine without Docker, follow these steps. You will need **Python 3.12+**, **Node.js 20+**, and a local **Redis** instance running.

*(Note: If you don't have Redis installed on Windows natively, the easiest way is to install it via WSL using `sudo apt install redis-server` and running `sudo service redis-server start`)*.

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```powershell
cd backend
```

Create a virtual environment and activate it:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:
```powershell
pip install -r requirements.txt
```

Run database migrations (This will create a local `db.sqlite3` file since we aren't providing PostgreSQL environment variables):
```powershell
python manage.py migrate
```

Start the Daphne ASGI server:
```powershell
daphne -b 127.0.0.1 -p 8000 collab_workspace.asgi:application
```

### 2. Celery Worker

Open a **new terminal tab**, activate the virtual environment, and navigate to the `backend` directory.

Since Celery has known issues on Windows, you must run it with the `solo` pool:
```powershell
cd backend
.\venv\Scripts\activate
celery -A collab_workspace worker -P solo -l info
```

### 3. Frontend Setup

Open a **third terminal tab** and navigate to the `frontend` directory:
```powershell
cd frontend
```

Install NPM packages:
```powershell
npm install
```

Start the Vite development server:
```powershell
npm run dev
```

### 4. Access the App
The frontend will now be accessible at `http://localhost:5173`.
