# Real-Time Collaborative Workspace

This plan details the implementation of a full-stack Real-Time Collaborative Workspace application based on Django (Channels, REST Framework, Celery) and React (Vite, TypeScript, TanStack Query, Zustand).

## User Review Required

> [!WARNING]
> This is a large-scale generation task. Generating all files in one go might take a while, and the total size might exceed context limits if generated all at once. I plan to generate the boilerplate and core logic in stages. Are you okay with me scaffolding the projects via commands first, or do you want me to just spit out the exact files requested as standalone files without full project scaffolding?

## Proposed Changes

### Phase 1: Project Setup & Models
- Scaffold the Django project and Vite React project.
- Configure `docker-compose.yml` for DB, Redis, Celery, Daphne, and Frontend.
- Implement Django models in `core/models.py` (`User`, `Workspace`, `WorkspaceMembership`, `Document`, `DocumentComment`).
- Setup `settings.py` for Celery, Channels, REST framework, SimpleJWT, and Postgres.

### Phase 2: Authentication & ASGI Setup
- Create custom JWT auth middleware for Channels (`core/middleware.py`).
- Configure ASGI application (`asgi.py`).
- Define WebSocket routing (`core/routing.py`).

### Phase 3: Real-Time Consumer & Celery Tasks
- Implement `DocumentConsumer` in `core/consumers.py` (broadcasting edits, cursor tracking, presence).
- Implement background tasks in `core/tasks.py` (e.g. PDF/Markdown export).
- Implement DRF views and a dedicated `services.py` layer.

### Phase 4: Frontend Implementation
- Implement the `useCollabSocket` hook.
- Implement the rich-text Tiptap `Editor` component.
- Implement `PresenceBar` and `CursorOverlay`.

## Verification Plan

### Automated Tests
- N/A for this initial generation phase, but we can verify successful container orchestration.

### Manual Verification
- Run `docker-compose up -d --build`.
- Verify the backend exposes the API and WebSocket endpoints correctly.
- Verify the frontend loads, can authenticate, and connects to the WebSockets.
