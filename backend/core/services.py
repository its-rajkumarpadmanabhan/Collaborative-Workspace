from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Workspace, WorkspaceMembership, Document

class WorkspaceService:
    @staticmethod
    def create_workspace(user, name):
        with transaction.atomic():
            workspace = Workspace.objects.create(name=name)
            WorkspaceMembership.objects.create(workspace=workspace, user=user, role='admin')
            return workspace

    @staticmethod
    def get_user_workspaces(user):
        return Workspace.objects.filter(memberships__user=user)

class DocumentService:
    @staticmethod
    def get_workspace_documents(workspace_id, user):
        # Verify access
        membership = WorkspaceMembership.objects.filter(workspace_id=workspace_id, user=user).first()
        if not membership:
            raise PermissionError("User does not have access to this workspace.")
        return Document.objects.filter(workspace_id=workspace_id).select_related('workspace')

    @staticmethod
    def create_document(workspace_id, user, title, content=None):
        membership = WorkspaceMembership.objects.filter(workspace_id=workspace_id, user=user).first()
        if not membership or membership.role == 'viewer':
            raise PermissionError("User cannot create documents in this workspace.")
        
        if content is None:
            content = {"type": "doc", "content": []}
            
        workspace = get_object_or_404(Workspace, id=workspace_id)
        return Document.objects.create(workspace=workspace, title=title, content=content)
