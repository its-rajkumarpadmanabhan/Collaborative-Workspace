# Collab Workspace 2.0 🚀

A modern, real-time collaborative text editor built for seamless teamwork. Create private documents, invite peers to collaborative rooms, and watch them type in real-time! 

## 🌟 Key Features

* **Real-Time Collaboration (Yjs + WebSockets):** Experience Google Docs style typing sync with real-time multi-cursor presence awareness.
* **Authentication & Dashboard:** Secure JWT-based authentication system with a personalized dashboard managing your active workspaces.
* **Invite-Only Rooms:** Strict backend security! Create a collaborative Room and invite other registered users by username. They must explicitly accept the invite in their Inbox to join the WebSocket channel.
* **Dark / Light Mode:** Beautiful, sleek Tailwind CSS UI with a fully functional theme toggle and syntax-highlighted code blocks (VS Code Atom-Dark theme).
* **Multiple Export Options:** Instantly download your collaborative workspace as `.txt`, `.html`, `.md`, `.json`, or scripts like `.py`, `.ts`, `.java`, etc.

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Tailwind CSS, Zustand, Yjs, Tiptap Editor, React-Hot-Toast
* **Backend:** Django, Django Channels (ASGI / WebSockets), Django REST Framework
* **Real-time Sync:** Custom Yjs WebSocket Protocol Implementation

---

## 📱 LinkedIn Post Template
*Want to share this project on LinkedIn? Here is a ready-to-use template!*

**[Copy Below]**

I'm excited to share version 2.0 of my **Real-Time Collaborative Workspace**! 🚀 

I've been building a modern, Google Docs-style collaboration app to deeply understand WebSockets and real-time state synchronization. 

In this major V2 update, I completely overhauled the architecture to introduce:
🔐 **JWT Authentication & Security:** Strict WebSocket interception that boots unauthorized users.
🚪 **Invite-Only Rooms:** An internal invite system where you can invite peers by username to securely join your room.
⚡ **Real-Time Presence:** Multi-cursor awareness so you can see exactly who is typing and where (powered by Yjs & Django Channels).
🌙 **Sleek UI:** A beautiful Tailwind CSS interface with Dark Mode and syntax-highlighted code blocks.
💾 **File Exports:** Instantly export the document into 10+ formats (Python, Markdown, HTML, JSON, etc).

**Tech Stack used:** React, TypeScript, Tailwind, Yjs, Django, Django Channels (WebSockets).

Check out the code here: [Link to GitHub Repository] 

#ReactJS #Django #WebSockets #TypeScript #WebDevelopment #RealTime #SoftwareEngineering #OpenSource

---

## Local Setup without Docker (Windows)

To run this application natively on your machine without Docker, follow these steps. You will need **Python 3.12+**, **Node.js 20+**, and a local **Redis** instance running.

*(Note: If you don't have Redis installed on Windows natively, the easiest way is to install it via WSL using `sudo apt install redis-server` and running `sudo service redis-server start`)*.

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

Start the Django/Channels server:
```powershell
python manage.py runserver
```

### 2. Frontend Setup

Open a **new terminal tab** and navigate to the `frontend` directory:
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 3. Access the App
The frontend will now be accessible at `http://localhost:5174`.
