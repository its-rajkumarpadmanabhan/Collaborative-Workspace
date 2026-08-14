from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import WorkspaceSerializer, DocumentSerializer, UserSerializer
from .services import WorkspaceService, DocumentService
from .tasks import export_document_task

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class WorkspaceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        workspaces = WorkspaceService.get_user_workspaces(request.user)
        serializer = WorkspaceSerializer(workspaces, many=True)
        return Response(serializer.data)

    def create(self, request):
        name = request.data.get('name')
        if not name:
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)
        workspace = WorkspaceService.create_workspace(request.user, name)
        serializer = WorkspaceSerializer(workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class DocumentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            return Response({"error": "workspace_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            documents = DocumentService.get_workspace_documents(workspace_id, request.user)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    def create(self, request):
        workspace_id = request.data.get('workspace_id')
        title = request.data.get('title')
        if not workspace_id or not title:
            return Response({"error": "workspace_id and title are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = DocumentService.create_document(workspace_id, request.user, title)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        format_type = request.data.get('format', 'pdf')
        task = export_document_task.delay(pk, format_type)
        return Response({"task_id": task.id, "message": "Export started"}, status=status.HTTP_202_ACCEPTED)
