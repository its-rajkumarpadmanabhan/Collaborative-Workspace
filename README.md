# Real-Time Collaborative Workspace

This project is a full-stack Real-Time Collaborative Workspace application that enables multiple users to edit documents simultaneously with live presence awareness (similar to Google Docs). 

## 🛠️ Technologies Used

### Frontend
- **React (Vite, TypeScript):** Fast, modern UI framework with strict typing.
- **Tailwind CSS:** Utility-first styling with built-in Dark Mode support.
- **Tiptap & ProseMirror:** Headless rich-text editor framework providing the core editing capabilities.
- **Yjs:** High-performance CRDT (Conflict-free Replicated Data Type) library that merges collaborative edits seamlessly without conflicts.
- **Zustand:** Lightweight state management for tracking user presence.

### Backend
- **Django & Django REST Framework:** Robust Python backend for JWT authentication, database models, and RESTful APIs.
- **Django Channels (ASGI):** Handles long-lived WebSocket connections for real-time synchronization.
- **Celery & Redis:** Asynchronous background task queue used for heavy operations like exporting documents to various formats.
- **SQLite:** Lightweight relational database (can be swapped for PostgreSQL in production).

## 🚀 How It Works

1. **Authentication & Workspaces:** Users register and log in via JWT. Once authenticated, they can create private "Individual" documents or collaborative "Rooms".
2. **Invite System:** In Room mode, the creator can invite other registered users by their username. These users receive the invite in their Dashboard Inbox and must explicitly accept it to gain access.
3. **Strict Security:** When a user opens a document, a WebSocket connection is established. The Django Channels backend strictly verifies the user's JWT and their database permissions before allowing them to join the room.
4. **Real-Time CRDT Sync:** As a user types, `Yjs` captures the keystrokes as a mathematical delta. This delta is sent over the WebSocket to Django Channels, which broadcasts it to all other connected clients in the room. Their local `Yjs` instances then merge the changes perfectly, even if they typed at the exact same millisecond.
5. **Presence Awareness:** When joining a room, clients exchange a rapid "presence handshake". Users' cursor movements are throttled and broadcasted so everyone can see where others are working in real-time.

---

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
