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


# Workspace Architecture & Invite System

This document outlines the updated plan based on the new requirements for Individual vs. Room workspaces, user invitations, and the post-login Dashboard.

## User Review Required

> [!IMPORTANT]
> You requested an Invite System where users send invites by username, and those invites appear on the other user's profile for them to accept. 
> 
> **Are you okay with having a central "Dashboard" page immediately after login?** This Dashboard will act as the home screen containing the "Individual" and "Create Room" buttons, as well as an "Inbox" to see pending invites from other users.

## Proposed Changes

### Database Models (Backend)

#### [MODIFY] [models.py](file:///c:/Users/user/Desktop/Collaborative-Workspace/backend/core/models.py)
- **Workspace Modes**: Add a `mode` field to `Workspace` (`individual` vs `room`).
- **Invitations**: Create a new `WorkspaceInvite` model to track invites sent from a room owner to another user by username (fields: `workspace`, `sender`, `receiver`, `status='pending'|'accepted'|'declined'`).

### Authentication & API (Backend)

#### [NEW] [views.py](file:///c:/Users/user/Desktop/Collaborative-Workspace/backend/core/views.py) & urls.py
- `POST /api/auth/register/` and `POST /api/auth/login/` (Signup redirects to Login).
- `POST /api/workspaces/` (Create a workspace, specifying if it's 'individual' or 'room').
- `POST /api/workspaces/<id>/invite/` (Send an invite to a specific username).
- `GET /api/users/me/invites/` (Fetch all pending invites for the logged-in user).
- `POST /api/invites/<id>/accept/` (Accept an invite, which automatically creates a `WorkspaceMembership` so they can edit).

#### [MODIFY] [consumers.py](file:///c:/Users/user/Desktop/Collaborative-Workspace/backend/core/consumers.py)
- Enforce strict privacy checks: 
  - If `mode == 'individual'`, only the `owner` can connect. 
  - If `mode == 'room'`, only the `owner` OR users with a valid `WorkspaceMembership` (who accepted an invite) can connect. Everyone else is rejected.

### Frontend Application

#### [NEW] [AuthFlow.tsx](file:///c:/Users/user/Desktop/Collaborative-Workspace/frontend/src/components/AuthFlow.tsx)
- A combined Signup/Login page. Successful signup redirects to the login view.

#### [NEW] [Dashboard.tsx](file:///c:/Users/user/Desktop/Collaborative-Workspace/frontend/src/components/Dashboard.tsx)
- The main landing page after logging in.
- Displays two large boxes: **Individual** (Create personal document) and **Create Room** (Collaborative).
- Displays a list of the user's existing documents.
- Includes an **Inbox** panel showing pending invites to accept or decline.

#### [MODIFY] [Editor.tsx](file:///c:/Users/user/Desktop/Collaborative-Workspace/frontend/src/components/Editor.tsx)
- If the document is a `room`, show an **"Invite User"** button in the header (only visible to the room owner). This opens a small modal to type a username and send an invite.
- Non-members who try to open the URL will be redirected away or shown an "Access Denied" screen.

---

## Verification Plan
1. Sign up as User A, then sign up as User B.
2. User A logs in, clicks "Create Room", and clicks "Invite User" to invite User B.
3. User B logs in, goes to their Dashboard/Profile, sees the invite from User A, and clicks "Accept".
4. User B clicks the room link and can now successfully collaborate with User A.
5. User B clicks "Individual" to create a personal document. User A tries to open User B's individual document URL and is rejected.

